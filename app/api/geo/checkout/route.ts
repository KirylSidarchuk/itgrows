import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { adsClickMeta } from "@/lib/ads-click"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import {
  GEO_PLAN,
  geoCheckoutPlan,
  geoPlanPaidBefore,
  isGeoInterval,
  liveGeoSubscriptions,
  normaliseDomain,
  stripeClient,
  stripeCustomerFor,
} from "@/lib/geo-business"
import { setupFree } from "@/lib/geo-pricing"
import { accountPrices, variantLine } from "@/lib/geo-price-test"
import { REWARD_RU } from "@/lib/geo-promo"
import { checkoutReward } from "@/lib/geo-promo-server"
import { sendOwner } from "@/lib/telegram"

// Start the AI-visibility plan for one of the user's followed sites, at the account's own prices
// (lib/geo-price-test.ts accountPrices: the price test's variant, or the one price): the monthly
// price plus a one-time setup of one month, or 3 months / a year (20% off) with the setup free —
// exactly what the plan page shows. The one price goes by its Stripe prices, a test price inline
// (lib/geo-business.ts geoLineItems); metadata month_cents and variant say which, for the webhook
// (Telegram, geo_plan_paid) and geo_checkout_started. Stripe Checkout, no trial; the webhook
// turns the follow into plan = 'paid'. The setup is charged once per site: a site this user has had
// the plan for before starts the month-to-month plan without it (lib/geo-business.ts geoPlanPaidBefore;
// /api/geo/report shows it as setupPaid). The detailed report is free, so nothing comes off the first
// payment; promotion codes are taken.
//
// A launch reward of the wheel (lib/geo-promo.ts) is applied here when this account won it, has not
// used it, is within its date, and it is for this site and this way to pay (lib/geo-promo-server.ts
// checkoutReward); anything else is ignored, whatever the page sent. With a reward the checkout
// takes no promotion code; metadata.reward names it (else "none") for the webhook, which marks it
// used, and for geo_checkout_started and Telegram. The charge itself: lib/geo-business.ts geoCheckoutPlan.
//
// A site the account does not follow yet comes with `add` from the plan page, which had the VM read it
// first (/api/geo/follow with plan intent: no free-report limit, nothing followed): it is bought
// unfollowed, so its report is not handed out before payment, and the webhook follows it and queues
// its day-0 report once paid (lib/geo-business.ts followPaidSite). Only a site the VM has read, and
// within the VM's sites per account (geo_check/service.py LIMITS sites_per_user), so that follow
// goes through.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const SITES_PER_ACCOUNT = 3

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { domain?: string; interval?: string; add?: unknown }
  const site = normaliseDomain(body.domain)
  if (!site) return NextResponse.json({ error: "domain_required" }, { status: 400 })
  const interval = body.interval ?? "month"
  if (!isGeoInterval(interval)) return NextResponse.json({ error: "invalid_interval" }, { status: 400 })

  const [follow] = rows(
    await db.execute(sql`
      SELECT f.plan
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${site}`)
  )
  if (!follow) {
    if (body.add !== true) return NextResponse.json({ error: "not_followed" }, { status: 404 })
    const [known] = rows(
      await db.execute(sql`
        SELECT EXISTS (SELECT 1 FROM geo_sites WHERE domain = ${site} AND profile IS NOT NULL) AS read,
               (SELECT count(*) FROM geo_follows WHERE user_id = ${userId})::int AS follows`)
    )
    if (known?.read !== true) return NextResponse.json({ error: "not_followed" }, { status: 404 })
    if (Number(known.follows) >= SITES_PER_ACCOUNT) return NextResponse.json({ error: "limit_user" }, { status: 429 })
  } else if (follow.plan === "paid") return NextResponse.json({ error: "already_paid" }, { status: 409 })

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
  const { variant, prices } = await accountPrices(userId)
  // Only for a site the account follows: the reward is for the site of its report.
  const reward = follow ? await checkoutReward(userId, site, interval) : null
  const offer = await geoCheckoutPlan(stripe, prices, interval, setupCharged, reward)
  const cents = offer.cents

  const back = `https://www.itgrows.ai/business/dashboard/plan?site=${encodeURIComponent(site)}`
  const meta = {
    userId,
    plan: GEO_PLAN,
    domain: site,
    interval,
    setup: offer.setup ? "1" : "0",
    month_cents: String(prices.monthCents),
    variant: variant === null ? "none" : String(variant),
    reward: reward ?? "none",
  }
  const checkout = await stripe.checkout.sessions.create({
    customer,
    mode: "subscription",
    line_items: offer.lineItems,
    // cs: the Google Ads conversion on return (components/GeoPurchaseConversion.tsx).
    success_url: `${back}&paid=1&cs={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
    // A reward is not combined with a promotion code (Stripe takes a discount or promotion codes).
    ...(reward ? (offer.discounts ? { discounts: offer.discounts } : {}) : { allow_promotion_codes: true }),
    ...(offer.note ? { custom_text: { submit: { message: offer.note } } } : {}),
    metadata: { ...meta, ...(await adsClickMeta()) },
    subscription_data: {
      metadata: { ...meta, ...(await adsClickMeta()) },
      description: `AI visibility for ${site}`,
      ...(offer.trialEnd ? { trial_end: offer.trialEnd } : {}),
    },
  })

  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_checkout_started', '/business/dashboard/plan',
              ${JSON.stringify({ domain: site, interval, setup: offer.setup, cents, session: checkout.id, variant, month_cents: prices.monthCents, reward })}::jsonb)`)
    .catch(() => {})
  void sendOwner(
    `🛒 Открыл оплату GEO: ${session?.user?.email ?? userId} — ${site}, ${interval}\n🧪 ${variantLine(variant, prices.monthCents)}` +
      (reward ? `\n🎡 награда колеса: ${REWARD_RU[reward]}` : "")
  )
  return NextResponse.json({ url: checkout.url })
}
