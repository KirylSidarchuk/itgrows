import Stripe from "stripe"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { GEO_PRICES, type GeoInterval } from "@/lib/geo-pricing"
import { geoCheck, type PublicRun } from "@/lib/geo-check"
import { sendOwner } from "@/lib/telegram"

// ItGrows for Business — AI visibility. Two things are sold, both kept apart from the LinkedIn/X
// plans on purpose: they never touch users.subscriptionPlan or users.subscriptionStatus (those gate
// the LinkedIn/X cabinet). Prices and terms live in lib/geo-pricing.ts.
//
// - The detailed report for one site, paid once (plan "geo_research"): geo_follows.research_paid_at.
//   Its price comes off the first plan payment within CREDIT_DAYS (geo_follows.research_credited_at
//   records that it was used).
// - The plan (plan "geo_business"), by the month (plus the one-time setup), 3 months upfront or a year: a paying
//   customer is a geo_follows row with plan = 'paid' and plan_interval for the site they bought it for.
//
// Stripe prices are found by their lookup keys and created on first use; the $49.90 credit is one
// coupon with a fixed id, also created on first use.

export const GEO_PLAN = "geo_business"
export const GEO_RESEARCH = "geo_research"

export const GEO_INTERVALS: GeoInterval[] = ["month", "quarter", "year"]
export const isGeoInterval = (v: unknown): v is GeoInterval => GEO_INTERVALS.includes(v as GeoInterval)

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

/** The site's domain the way the VM stores it (geo_check/core.py normalise_domain), so what a user
 *  types here matches geo_sites.domain: lower case, no scheme, path, port or leading "www.". */
export function normaliseDomain(raw: unknown): string | null {
  let s = String(raw ?? "").trim().toLowerCase()
  if (!s) return null
  if (!/^https?:\/\//.test(s)) s = "https://" + s
  const netloc = s.replace(/^https?:\/\//, "").split(/[/?#]/)[0]
  let host = netloc.slice(netloc.lastIndexOf("@") + 1)
  host = host.startsWith("[") ? "" : host.split(":")[0]
  if (host.startsWith("www.")) host = host.slice(4)
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) || /\.(local|internal|localhost)$/.test(host)) return null
  return host
}

// ── Stripe prices ───────────────────────────────────────────────────────────────────────────

type PriceKind = "research" | "setup" | GeoInterval

const PRODUCTS = {
  plan: {
    name: "ItGrows for Business — AI visibility",
    description:
      "Articles on your own domain that answer your buyers' questions, crawler and indexing fixes, and a weekly check of ChatGPT, Claude, Gemini and Perplexity.",
    metadata: { product: GEO_PLAN },
  },
  research: {
    name: "AI visibility report",
    description:
      "20 questions your buyers ask, put to ChatGPT, Claude, Gemini and Perplexity three times each: every answer, who is named instead of you, and the sites the assistants cite. One-time.",
    metadata: { product: GEO_RESEARCH },
  },
}

/** The product a new price goes under: the plan's prices share the product of the monthly one. */
async function productFor(stripe: Stripe, kind: PriceKind): Promise<string> {
  if (kind === "research") return (await stripe.products.create(PRODUCTS.research)).id
  if (kind === "month") return (await stripe.products.create(PRODUCTS.plan)).id
  const month = await stripe.prices.retrieve(await geoPriceId(stripe, "month"))
  return typeof month.product === "string" ? month.product : month.product.id
}

/** A GEO price, found by its lookup key in lib/geo-pricing.ts; created once on first use. */
export async function geoPriceId(stripe: Stripe, kind: PriceKind): Promise<string> {
  const p = GEO_PRICES[kind]
  const find = async () => (await stripe.prices.list({ lookup_keys: [p.lookupKey], active: true, limit: 1 })).data[0]?.id
  const found = await find()
  if (found) return found
  try {
    const price = await stripe.prices.create({
      product: await productFor(stripe, kind),
      currency: "usd",
      unit_amount: p.cents,
      lookup_key: p.lookupKey,
      metadata: { product: kind === "research" ? GEO_RESEARCH : GEO_PLAN, kind },
      ...("interval" in p ? { recurring: { interval: p.interval, interval_count: p.intervalCount } } : {}),
    })
    return price.id
  } catch (err) {
    // Two first checkouts at once: the other one created it.
    const again = await find()
    if (again) return again
    throw err
  }
}

/** The report's price off the first plan payment: an amount-off coupon used once per subscription. */
export const RESEARCH_COUPON = `itgrows-geo-research-credit-${GEO_PRICES.research.cents}`

export async function researchCreditCoupon(stripe: Stripe): Promise<string> {
  try {
    return (await stripe.coupons.retrieve(RESEARCH_COUPON)).id
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err
  }
  try {
    await stripe.coupons.create({
      id: RESEARCH_COUPON,
      name: `AI visibility report credit (${GEO_PRICES.research.label})`,
      amount_off: GEO_PRICES.research.cents,
      currency: "usd",
      duration: "once",
      metadata: { product: GEO_PLAN, kind: "research_credit" },
    })
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_already_exists") throw err
  }
  return RESEARCH_COUPON
}

/** The user's Stripe customer (the same one the LinkedIn/X plans use), created if they have none. */
export async function stripeCustomerFor(stripe: Stripe, userId: string): Promise<string | null> {
  const [user] = await db
    .select({ email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) return null
  if (user.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined, metadata: { userId } })
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId))
  return customer.id
}

// ── webhook ─────────────────────────────────────────────────────────────────────────────────

const PAID = new Set(["active", "trialing", "past_due"])

/** Month, 3 months or a year, read from the subscription's recurring price (it is what the customer
 *  pays even if the plan was switched in Stripe), else from the checkout metadata. */
export function geoSubscriptionInterval(sub: Stripe.Subscription): GeoInterval | null {
  const rec = sub.items?.data?.find((i) => i.price?.recurring)?.price?.recurring
  if (rec?.interval === "year") return "year"
  if (rec?.interval === "month" && rec.interval_count === 3) return "quarter"
  if (rec?.interval === "month" && rec.interval_count === 1) return "month"
  const meta = sub.metadata?.interval
  return isGeoInterval(meta) ? meta : null
}

/** The customer's live plan subscriptions for one site (active, trialing or past due): normally one
 *  at most, as checkout refuses a second. Stripe's list without a status leaves out the cancelled. */
export async function liveGeoSubscriptions(stripe: Stripe, customer: string, domain: string): Promise<Stripe.Subscription[]> {
  const live: Stripe.Subscription[] = []
  for await (const s of stripe.subscriptions.list({ customer, limit: 100 })) {
    if (s.metadata?.plan === GEO_PLAN && s.metadata?.domain === domain && PAID.has(s.status)) live.push(s)
  }
  return live
}

/** Mirror a GEO subscription's state onto the follow it was bought for. What is written is the
 *  subscription as Stripe has it now, not the event's copy: events come out of order and are retried,
 *  and an old "active" must not put a cancelled customer back on the plan. A subscription that has
 *  ended leaves the follow paid while another live one covers the same site. A failed lookup throws,
 *  so Stripe sends the event again. */
export async function syncGeoSubscription(eventSub: Stripe.Subscription, event: string) {
  const stripe = stripeClient()
  let sub: Stripe.Subscription
  try {
    sub = await stripe.subscriptions.retrieve(eventSub.id)
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err
    sub = { ...eventSub, status: "canceled" } // gone from Stripe: nothing is paid
  }
  const userId = sub.metadata?.userId
  const domain = sub.metadata?.domain
  if (!userId || !domain) return
  let current = sub
  if (!PAID.has(sub.status)) {
    const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id
    const other = (await liveGeoSubscriptions(stripe, customer, domain)).find((s) => s.metadata?.userId === userId)
    if (other) current = other
  }
  const paid = PAID.has(current.status)
  const interval = paid ? geoSubscriptionInterval(current) : null
  await db.execute(sql`
    UPDATE geo_follows f SET plan = ${paid ? "paid" : "free"}, plan_interval = ${interval}
    FROM geo_sites s
    WHERE s.id = f.site_id AND f.user_id = ${userId} AND s.domain = ${domain}`)
  const props = { domain, status: sub.status, interval, event, subscription: sub.id, ...(current !== sub ? { live: current.id } : {}) }
  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_subscription', '/stripe/webhook', ${JSON.stringify(props)}::jsonb)`)
    .catch(() => {})
}

/** Records a webhook event for a checkout once; false if it was already recorded (a replay). */
async function firstTime(userId: string, event: string, props: Record<string, unknown> & { session: string }) {
  try {
    const seen = rows(
      await db.execute(sql`SELECT 1 FROM analytics_events WHERE event = ${event} AND props->>'session' = ${props.session} LIMIT 1`)
    )
    if (seen.length) return false
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, ${event}, '/stripe/webhook', ${JSON.stringify(props)}::jsonb)`)
  } catch {
    // Analytics must never block the webhook; a second message is the lesser harm.
  }
  return true
}

async function buyer(userId: string) {
  const [u] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1)
  return `${u?.name ?? ""} ${u?.email ?? ""}`.trim()
}

/** The plan was bought: the follow becomes paid. The plan includes the detailed report, so the report
 *  is marked bought too (research_session "plan:<checkout>") and stays open after the plan ends; and
 *  its credit is marked used whether or not it was applied, so no credit appears later for a report
 *  that was never paid for on its own. Safe to replay: every column keeps its first value. */
export async function geoPlanCheckoutCompleted(session: Stripe.Checkout.Session, sub: Stripe.Subscription, event: string) {
  await syncGeoSubscription(sub, event)
  const userId = sub.metadata?.userId ?? session.metadata?.userId
  const domain = sub.metadata?.domain ?? session.metadata?.domain
  if (!userId || !domain) return
  const credit = (session.metadata?.researchCredit ?? sub.metadata?.researchCredit) === "1"
  await db.execute(sql`
    UPDATE geo_follows f SET research_paid_at = COALESCE(f.research_paid_at, now()),
                             research_session = COALESCE(f.research_session, ${`plan:${session.id}`}),
                             research_credited_at = COALESCE(f.research_credited_at, now())
    FROM geo_sites s
    WHERE s.id = f.site_id AND f.user_id = ${userId} AND s.domain = ${domain}`)
  const interval = geoSubscriptionInterval(sub) ?? "month"
  if (!(await firstTime(userId, "geo_checkout_completed", { session: session.id, domain, interval, credit }))) return
  const price = GEO_PRICES[interval]
  const terms = interval === "quarter" ? `${price.label} за 3 мес` : interval === "year" ? `${price.label} за год` : `${price.label}/мес + запуск ${GEO_PRICES.setup.label}`
  await notifyOwner(
    `💳 GEO оплачен: ${terms}${credit ? `, зачтён отчёт −${GEO_PRICES.research.label}` : ""}\n👤 ${await buyer(userId)}\n🌐 ${domain}\nДальше: подключить сайт клиента и поставить статьи.`
  )
}

/** The detailed report was paid for: unlock it on the follow. A site the buyer does not follow yet
 *  (a site past the one the account includes) is followed first through the VM, which also queues
 *  its report; /api/geo/research-checkout has the VM read that site before the payment, so this call only writes.
 *  What may pass — the VM down or slow, the assistants' API failing while the questions are worked
 *  out — throws, so Stripe retries the event; what will not pass is left to Kiryl to refund. Each case
 *  reaches him once per payment. Safe to replay; a second payment for a site already unlocked is
 *  flagged for a refund. */
export async function unlockGeoResearch(session: Stripe.Checkout.Session, paidAtUnix: number) {
  const userId = session.metadata?.userId
  let domain = normaliseDomain(session.metadata?.domain)
  if (!userId || !domain) return
  const findFollow = async (d: string) =>
    rows(
      await db.execute(sql`SELECT f.id FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                           WHERE f.user_id = ${userId} AND s.domain = ${d}`)
    )[0]

  let follow = await findFollow(domain)
  if (!follow) {
    const r = await geoCheck<PublicRun>("/baseline", { domain, user_id: userId }, 50_000).catch(() => ({
      status: 504,
      data: { error: "timeout" } as Partial<PublicRun> & { error?: string },
    }))
    const error = r.data.error ?? String(r.status)
    // geo_check/service.py: "questions_failed" is the assistants' API failing while the questions
    // are worked out (a timeout, an overload), so it is tried again like a VM that did not answer.
    if (r.status === 400 || r.status === 429 || (r.status === 422 && error !== "questions_failed")) {
      // The site cannot be followed (a bad address, unreachable, or over the per-user cap): the money
      // is in, the report is not, so Kiryl refunds or sorts it out by hand.
      if (await firstTime(userId, "geo_research_unfollowable", { session: session.id, domain, error }))
        await notifyOwner(
          `⚠️ Отчёт ${GEO_PRICES.research.label} оплачен, но сайт не подключился (${error}) — вернуть деньги или разобраться.\n👤 ${await buyer(userId)}\n🌐 ${domain}\nStripe: ${session.id}`
        )
      return
    }
    if (r.status !== 200 && r.status !== 202) {
      if (await firstTime(userId, "geo_research_retry", { session: session.id, domain, error }))
        await notifyOwner(
          `⚠️ Отчёт ${GEO_PRICES.research.label} оплачен, сайт пока не подключился (${error}) — Stripe повторит сам. Если не пройдёт за день — вернуть деньги.\n👤 ${await buyer(userId)}\n🌐 ${domain}\nStripe: ${session.id}`
        )
      throw new Error(`geo-check /baseline ${r.status} ${error}`)
    }
    domain = r.data.domain ?? domain
    follow = await findFollow(domain)
    if (!follow) throw new Error(`no follow for ${domain} after /baseline`)
  }

  const [unlocked] = rows(
    await db.execute(sql`
      UPDATE geo_follows SET research_paid_at = to_timestamp(${paidAtUnix}::double precision), research_session = ${session.id}
      WHERE id = ${follow.id as string}::uuid AND research_paid_at IS NULL
      RETURNING id`)
  )
  if (!unlocked) {
    // A replay of this payment, or a second payment for a site that was already unlocked (two tabs,
    // or a click while the first payment was on its way here): that one is refunded.
    const [prev] = rows(await db.execute(sql`SELECT research_session FROM geo_follows WHERE id = ${follow.id as string}::uuid`))
    if (prev?.research_session !== session.id && (await firstTime(userId, "geo_research_duplicate", { session: session.id, domain })))
      await notifyOwner(
        `⚠️ Второй платёж за уже открытый отчёт — вернуть ${GEO_PRICES.research.label}.\n👤 ${await buyer(userId)}\n🌐 ${domain}\nStripe: ${session.id}`
      )
    return
  }
  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_research_paid', '/stripe/webhook', ${JSON.stringify({ domain, session: session.id })}::jsonb)`)
    .catch(() => {})
  await notifyOwner(`💳 GEO отчёт ${GEO_PRICES.research.label} оплачен\n👤 ${await buyer(userId)}\n🌐 ${domain}`)
}

export async function notifyOwner(text: string) {
  await sendOwner(text)
}
