import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import {
  GEO_PLAN,
  geoPlanPaidBefore,
  geoPriceId,
  isGeoInterval,
  liveGeoSubscriptions,
  normaliseDomain,
  researchCreditCoupon,
  stripeClient,
  stripeCustomerFor,
} from "@/lib/geo-business"
import { CREDIT_DAYS, GEO_PRICES, firstPaymentCents, setupFree } from "@/lib/geo-pricing"
import { sendOwner } from "@/lib/telegram"

// Start the AI-visibility plan for one of the user's followed sites: $499 by the month plus the
// one-time $499 setup, or $1,497 for 3 months / $4,788 for a year with the setup free. Stripe
// Checkout, no trial; the webhook
// turns the follow into plan = 'paid'. The setup is charged once per site: a site this user has had
// the plan for before starts the month-to-month plan without it (lib/geo-business.ts geoPlanPaidBefore;
// /api/geo/report shows it as setupPaid). A report bought within CREDIT_DAYS comes off the first payment
// as a once-only coupon — Stripe takes either a coupon or promotion codes, so a credited checkout
// takes no codes.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { domain?: string; interval?: string }
  const site = normaliseDomain(body.domain)
  if (!site) return NextResponse.json({ error: "domain_required" }, { status: 400 })
  const interval = body.interval ?? "month"
  if (!isGeoInterval(interval)) return NextResponse.json({ error: "invalid_interval" }, { status: 400 })

  const [follow] = rows(
    await db.execute(sql`
      SELECT f.plan,
             (f.research_paid_at IS NOT NULL AND f.research_credited_at IS NULL
              AND f.research_paid_at > now() - make_interval(days => ${CREDIT_DAYS}::int)) AS credit
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${site}`)
  )
  if (!follow) return NextResponse.json({ error: "not_followed" }, { status: 404 })
  if (follow.plan === "paid") return NextResponse.json({ error: "already_paid" }, { status: 409 })
  const credit = follow.credit === true

  const stripe = stripeClient()
  const customer = await stripeCustomerFor(stripe, userId)
  if (!customer) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  // Stripe already has a live plan for this site (the webhook not in yet, or the follow out of step):
  // a second checkout would charge twice.
  if ((await liveGeoSubscriptions(stripe, customer, site)).length)
    return NextResponse.json({ error: "already_paid" }, { status: 409 })

  // The month-to-month plan carries the one-time setup on its first invoice; 3 months and a year do
  // not, nor does a site that has had the plan before (its setup was done then).
  const setupCharged = !setupFree(interval) && !(await geoPlanPaidBefore(stripe, userId, customer, site))
  const lineItems = [
    { price: await geoPriceId(stripe, interval), quantity: 1 },
    ...(setupCharged ? [{ price: await geoPriceId(stripe, "setup"), quantity: 1 }] : []),
  ]
  const cents = firstPaymentCents(interval, credit) - (setupFree(interval) || setupCharged ? 0 : GEO_PRICES.setup.cents)

  const back = `https://www.itgrows.ai/business/dashboard/plan?site=${encodeURIComponent(site)}`
  const meta = { userId, plan: GEO_PLAN, domain: site, interval, researchCredit: credit ? "1" : "0", setup: setupCharged ? "1" : "0" }
  const checkout = await stripe.checkout.sessions.create({
    customer,
    mode: "subscription",
    line_items: lineItems,
    success_url: `${back}&paid=1`,
    cancel_url: back,
    ...(credit ? { discounts: [{ coupon: await researchCreditCoupon(stripe) }] } : { allow_promotion_codes: true }),
    metadata: meta,
    subscription_data: { metadata: meta, description: `AI visibility for ${site}` },
  })

  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_checkout_started', '/business/dashboard/plan',
              ${JSON.stringify({ domain: site, interval, credit, setup: setupCharged, cents, session: checkout.id })}::jsonb)`)
    .catch(() => {})
  void sendOwner(`🛒 Открыл оплату GEO: ${session?.user?.email ?? userId} — ${site}, ${interval}`)
  return NextResponse.json({ url: checkout.url })
}
