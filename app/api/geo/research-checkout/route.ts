import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { auth } from "@/auth"
import { adsClickMeta } from "@/lib/ads-click"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { GEO_RESEARCH, geoPriceId, normaliseDomain, stripeClient, stripeCustomerFor } from "@/lib/geo-business"
import { geoCheck, type PublicRun } from "@/lib/geo-check"
import { GEO_PRICES } from "@/lib/geo-pricing"
import { geoClientOwns } from "@/lib/geo-role"
import { sendOwner } from "@/lib/telegram"

// Buy the full detailed report for one site ($49.90, once): Stripe Checkout in payment mode. The
// webhook unlocks it (geo_follows.research_paid_at). Also for a site the user does not follow yet —
// a site past the one the account includes: the webhook follows it first, which queues its report.
//
// For such a site the slow part of following it happens here, before any money moves: the VM reads
// the site and works out its buyers' questions (through the instant check, which keeps that for 30
// days). Until it is done the answer is { preparing: true } and the button asks again; the webhook's
// call to the VM then only writes rows. A click while an earlier payment for the same report is still
// on its way to the webhook is refused, so nobody pays twice. A site on the plan, or a client's own
// site (geo_client_sites, lib/geo-role.ts), is shown whole and never sold a report.

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// The VM's own cap on sites per user (geo_check/service.py LIMITS["sites_per_user"]): over it the
// webhook could not follow the site, so the report is not sold.
const VM_SITES_PER_USER = 3
// A profile the VM still counts as fresh (PROFILE_MAX_AGE_DAYS, 30) when Stripe retries the webhook
// days later.
const PROFILE_FRESH_DAYS = 25
// Sites read for a purchase that has not happened, per user per day: each costs a Claude call and an
// instant check.
const READS_PER_DAY = 5

/** Whether the site answers at all, with or without "www." — a typo should not reach the payment. */
async function reachable(domain: string) {
  for (const host of [domain, `www.${domain}`]) {
    try {
      await fetch(`https://${host}/`, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(8_000), cache: "no-store" })
      return true
    } catch {}
  }
  return false
}

/** "ready" when the VM has read the site and worked out its questions; otherwise starts that (once)
 *  and says "preparing", or names why it cannot be read. */
async function siteRead(domain: string, userId: string): Promise<string> {
  const [st] = rows(
    await db.execute(sql`
      SELECT s.profile IS NOT NULL AND s.updated_at > now() - make_interval(days => ${PROFILE_FRESH_DAYS}::int) AS ready,
             (SELECT r.status || ':' || coalesce(r.error, '') FROM geo_runs r
              WHERE r.site_id = s.id AND r.kind = 'teaser' AND r.created_at > now() - interval '10 minutes'
              ORDER BY r.created_at DESC LIMIT 1) AS teaser
      FROM geo_sites s WHERE s.domain = ${domain}`)
  )
  if (st?.ready) return "ready"
  const teaser = String(st?.teaser ?? "")
  if (teaser.startsWith("running") || teaser.startsWith("queued")) return "preparing"
  // A check that finished just now read the site, whatever the age arithmetic says.
  if (teaser.startsWith("done")) return "ready"
  if (teaser.startsWith("failed:unreachable")) return "unreachable"
  if (teaser.startsWith("failed:questions_failed")) return "questions_failed"

  const [{ n }] = rows(
    await db.execute(sql`SELECT count(*)::int AS n FROM analytics_events
                         WHERE event = 'geo_research_site_read' AND user_id = ${userId} AND created_at > now() - interval '1 day'`)
  )
  if (Number(n) >= READS_PER_DAY) return "limit_reads"
  if (!(await reachable(domain))) return "unreachable"
  // No IP: the per-IP cap of the quick check is for strangers, not for a signed-in buyer.
  const r = await geoCheck<PublicRun>("/teaser", { url: domain }, 20_000).catch(() => ({
    status: 504,
    data: { error: "unavailable" } as Partial<PublicRun> & { error?: string },
  }))
  if (r.status === 202)
    await db
      .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${userId}, 'geo_research_site_read', '/business/dashboard/visibility', ${JSON.stringify({ domain, run: r.data.run_id })}::jsonb)`)
      .catch(() => {})
  if (r.status === 202) return "preparing"
  if (r.status === 200) return "ready" // a check under a day old: the site has been read
  return r.data.error === "invalid_url" ? "invalid_domain" : "unavailable"
}

/** A payment for this report that went through but has not been recorded by the webhook yet. */
async function paymentOnItsWay(stripe: Stripe, userId: string, domain: string) {
  const started = rows(
    await db.execute(sql`SELECT props->>'session' AS session FROM analytics_events
                         WHERE event = 'geo_research_checkout_started' AND user_id = ${userId} AND props->>'domain' = ${domain}
                           AND created_at > now() - interval '1 day'
                         ORDER BY created_at DESC LIMIT 3`)
  )
  for (const s of started) {
    if (!s.session) continue
    const cs = await stripe.checkout.sessions.retrieve(String(s.session)).catch(() => null)
    if (cs?.payment_status === "paid") return true
  }
  return false
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { domain } = (await req.json().catch(() => ({}))) as { domain?: string }
  const site = normaliseDomain(domain)
  if (!site) return NextResponse.json({ error: "invalid_domain" }, { status: 400 })

  const [follow] = rows(
    await db.execute(sql`SELECT f.plan, f.research_paid_at FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                         WHERE f.user_id = ${userId} AND s.domain = ${site}`)
  )
  if ((follow && (follow.plan === "paid" || follow.research_paid_at)) || (await geoClientOwns(userId, site))) {
    return NextResponse.json({ error: "already_unlocked" }, { status: 409 })
  }
  if (!follow) {
    const [{ n }] = rows(
      await db.execute(sql`SELECT count(*)::int AS n FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                           WHERE f.user_id = ${userId} AND s.domain <> ${site}`)
    )
    if (Number(n) >= VM_SITES_PER_USER) return NextResponse.json({ error: "limit_user" }, { status: 429 })
    const read = await siteRead(site, userId)
    if (read === "preparing") return NextResponse.json({ preparing: true }, { status: 202 })
    if (read !== "ready") {
      const status = read === "unavailable" ? 503 : read === "limit_reads" ? 429 : 422
      return NextResponse.json({ error: read }, { status })
    }
  }

  const stripe = stripeClient()
  if (await paymentOnItsWay(stripe, userId, site)) {
    return NextResponse.json({ error: "payment_processing" }, { status: 409 })
  }
  const customer = await stripeCustomerFor(stripe, userId)
  if (!customer) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const back = `https://www.itgrows.ai/business/dashboard/visibility?site=${encodeURIComponent(site)}`
  const meta = { userId, plan: GEO_RESEARCH, domain: site, ...(await adsClickMeta()) }
  const checkout = await stripe.checkout.sessions.create({
    customer,
    mode: "payment",
    line_items: [{ price: await geoPriceId(stripe, "research"), quantity: 1 }],
    // cs: the Google Ads conversion on return (components/GeoPurchaseConversion.tsx).
    success_url: `${back}&unlocked=1&cs={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
    metadata: meta,
    payment_intent_data: { metadata: meta, description: `AI visibility report for ${site}` },
  })

  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_research_checkout_started', '/business/dashboard/visibility',
              ${JSON.stringify({ domain: site, followed: !!follow, cents: GEO_PRICES.research.cents, session: checkout.id })}::jsonb)`)
    .catch(() => {})
  void sendOwner(`🛒 Открыл оплату отчёта: ${session?.user?.email ?? userId} — ${site}`)
  return NextResponse.json({ url: checkout.url })
}
