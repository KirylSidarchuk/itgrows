import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { clientIp, geoCheck, type PublicRun } from "@/lib/geo-check"
import { normaliseDomain } from "@/lib/geo-business"
import { countedDomainsSql } from "@/lib/geo-free-report"
import { REPORT_SITES } from "@/lib/geo-pricing"
import { sendOwner } from "@/lib/telegram"
import { visitSource } from "@/lib/visit-source"

// Follow a site from the AI-visibility cabinet. The VM records the follow and queues the day-0
// report (20 questions x 4 assistants, 1 sample for a free sign-up, 3 for a client we set up by hand),
// or returns the one already made this week.
//
// A site the user already follows is answered from the database (the domain and the status of its
// latest run) without asking the VM: /baseline queues a new day-0 report once the last one is a week
// old, so every repeated "Add" would pay for one again. The VM is asked for a followed site only when
// it has no day-0 report done, queued or running (the retry after a failed one).
//
// The detailed report is free (since 27 Oct 2026), one per account and one per connection:
// - An account has the report computed for REPORT_SITES site(s): past that, a new site is refused
//   with "report_limit" (402). Sites on the plan, or with a report bought before it became free (a
//   Stripe session in research_session), do not count; a site already followed always goes through.
//   The slot is held before the VM is asked, in one statement under a per-user lock
//   (geo_follow_claims, lib/db/migrations/add_geo_client_sites.sql), so two sites added at once
//   cannot both get in; the claim is dropped when the VM call fails.
// - The visitor's address goes to the VM with the request; the VM (geo_check/service.py baseline)
//   refuses a day-0 report for a site when that address already had one for another site, any
//   account: "report_ip_used" (429), before it reads the site or spends anything.
// Either way the page says "contact us and we'll run it for you", never a price. Clients we set up
// by hand (geo_clients, lib/geo-role.ts: our own accounts among them) have no limit, take no claim
// and send no address, so they run reports for anyone from anywhere and never use up an address.
// The Stripe webhook's follow for an old bought report sends no address either.
//
// The plan page buys a site the account does not follow yet with `plan: true`, and neither limit
// applies to it, because nothing free is handed out: the VM only reads the site (check_only, so an
// unreachable or unreadable one is refused before anyone pays) and follows nothing, so no report is
// queued and no slot or address is used. /api/geo/checkout then takes the site unfollowed ("add"),
// and the Stripe webhook follows it and queues its day-0 report once the plan is paid
// (lib/geo-business.ts followPaidSite); an abandoned checkout leaves nothing behind. Reading a site
// costs a little, so an account reads at most PLAN_READS_PER_DAY new sites a day this way.

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const PLAN_READS_PER_DAY = 5

/** Whether the account may have the VM read `domain` for the plan page: a site read in the last day
 *  again, or fewer than PLAN_READS_PER_DAY different ones. */
async function planReadAllowed(userId: string, domain: string): Promise<boolean> {
  const [r] = rows(
    await db.execute(sql`
      SELECT count(DISTINCT props->>'domain')::int AS n, coalesce(bool_or(props->>'domain' = ${domain}), false) AS again
      FROM analytics_events
      WHERE user_id = ${userId} AND event = 'geo_plan_site_read' AND created_at > now() - interval '1 day'`)
  )
  return r?.again === true || Number(r?.n ?? 0) < PLAN_READS_PER_DAY
}

/** Holds a report slot for `domain`: true when the account has fewer than REPORT_SITES counted
 *  domains besides it (free follows and claims; a domain with a paid follow or a report bought
 *  before it became free does not count), or already holds a claim for it. */
async function claimSlot(userId: string, domain: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)
    const held = rows(
      await tx.execute(sql`
        WITH counted AS (${countedDomainsSql(userId)})
        INSERT INTO geo_follow_claims (user_id, domain)
        SELECT ${userId}, ${domain}
        WHERE (SELECT count(*) FROM counted WHERE domain <> ${domain}) < ${REPORT_SITES}
        ON CONFLICT (user_id, domain) DO UPDATE SET created_at = geo_follow_claims.created_at
        RETURNING domain`)
    )
    return held.length > 0
  })
}

async function dropClaim(userId: string, domain: string) {
  await db
    .execute(sql`DELETE FROM geo_follow_claims WHERE user_id = ${userId} AND domain = ${domain}`)
    .catch(() => {})
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let site = ""
  // From the plan page, for a site it is about to buy: read only, no limit, nothing followed.
  let forPlan = false
  try {
    const body = (await req.json()) as { site?: unknown; plan?: unknown }
    site = String(body.site ?? "").trim()
    forPlan = body.plan === true
  } catch {}
  if (site.length < 3 || site.length > 300) return NextResponse.json({ error: "invalid_url" }, { status: 400 })
  const domain = normaliseDomain(site)
  if (!domain) return NextResponse.json({ error: "invalid_url" }, { status: 400 })

  const [mine] = rows(
    await db.execute(sql`
      SELECT f.site_id,
             (SELECT r.status FROM geo_runs r
              WHERE r.site_id = f.site_id AND r.kind IN ('baseline', 'weekly')
              ORDER BY r.created_at DESC LIMIT 1) AS status,
             EXISTS (SELECT 1 FROM geo_runs r
                     WHERE r.site_id = f.site_id AND r.kind = 'baseline'
                       AND r.status IN ('done', 'queued', 'running')) AS has_baseline
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain}`)
  )
  if (mine?.has_baseline) return NextResponse.json({ domain, status: mine.status ?? null })

  if (forPlan) {
    // Followed already: checkout takes it as it is.
    if (mine) return NextResponse.json({ domain, status: mine.status ?? null })
    if (!(await planReadAllowed(userId, domain))) return NextResponse.json({ error: "limit_reads", domain }, { status: 429 })
    let read
    try {
      read = await geoCheck<PublicRun>("/baseline", { domain: site, user_id: userId, check_only: true }, 55_000)
    } catch {
      return NextResponse.json({ error: "unavailable" }, { status: 502 })
    }
    if (read.status !== 200 || !read.data.domain)
      return NextResponse.json({ error: read.data.error ?? "unavailable", domain }, { status: read.status >= 400 ? read.status : 502 })
    await db
      .execute(
        sql`INSERT INTO analytics_events (user_id, event, path, props)
            VALUES (${userId}, 'geo_plan_site_read', '/business/dashboard/plan', ${JSON.stringify({ domain: read.data.domain })}::jsonb)`
      )
      .catch(() => {})
    return NextResponse.json({ domain: read.data.domain, status: null, followed: false })
  }

  // A new site takes a slot unless the user is a client we set up by hand; a followed site whose
  // day-0 report failed is retried without one (its follow already counts).
  const [who] = rows(
    await db.execute(sql`SELECT EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId}) AS client`)
  )
  const exempt = who?.client === true
  let claimed = false
  if (!mine && !exempt) {
    if (!(await claimSlot(userId, domain))) {
      void sendOwner(`🔁 Кабинет GEO: ${session?.user?.email ?? userId} хочет ещё один бесплатный отчёт (${domain}), а свой уже есть — показали «напишите нам»`)
      return NextResponse.json({ error: "report_limit", domain }, { status: 402 })
    }
    claimed = true
  }

  // The address the VM holds to one free report (none for a client we set up by hand).
  const ip = exempt ? "" : clientIp(req.headers)
  let r
  try {
    r = await geoCheck<PublicRun>("/baseline", { domain: site, user_id: userId, ...(ip ? { ip } : {}) }, 55_000)
  } catch {
    if (claimed) await dropClaim(userId, domain)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if (r.status !== 200 && r.status !== 202) {
    if (claimed) await dropClaim(userId, domain)
    if (r.data.error === "report_ip_used")
      void sendOwner(`🔁 Кабинет GEO: ${session?.user?.email ?? userId} — бесплатный отчёт с этого адреса уже был (${domain}) — показали «напишите нам»`)
    return NextResponse.json({ error: r.data.error ?? "unavailable", domain }, { status: r.status >= 400 ? r.status : 502 })
  }

  await db
    .execute(
      sql`INSERT INTO analytics_events (user_id, event, path, props)
          VALUES (${userId}, 'geo_follow', '/business/dashboard/visibility',
                  ${JSON.stringify({ domain: r.data.domain, run: r.data.run_id, status: r.data.status })}::jsonb)`
    )
    .catch(() => {})

  void sendOwner(`👁 Кабинет GEO: ${session?.user?.email ?? userId} следит за ${r.data.domain}\n📍 ${await visitSource(req.headers)}`)
  return NextResponse.json({ domain: r.data.domain, status: r.data.status })
}
