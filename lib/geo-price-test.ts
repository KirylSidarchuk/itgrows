import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { cookies, headers } from "next/headers"
import { GEO_PRICES, ONE_PRICE_MONTH, PRICE_TEST, drawPriceVariant, geoPrices, isLiveArm, type GeoPrices } from "@/lib/geo-pricing"
import { returningVisitor } from "@/lib/geo-price-returning"
import { PRICE_COOKIE, VISITOR_COOKIE, bucketArm, hasOlderCookie, readPin, visitorAddress } from "@/lib/geo-price-visitor"

// The plan's price for one account, on the server (the test and its rules: lib/geo-pricing.ts). An
// account created while the test runs stores the arm its visitor saw (users.geo_price_variant,
// newAccountVariant below); whoever has paid keeps the price he paid, whether the test runs or not
// (geo_plan_paid month_cents), and put in geo_clients later too; a client set up by hand (geo_clients) who
// has not paid is on the one price whatever it says.
// /api/geo/report hands the prices to the plan page and the end of the report, /api/geo/checkout charges
// them, and the analytics events carry the variant: geo_plan_view (/api/geo/plan-view),
// geo_checkout_started (/api/geo/checkout) and geo_plan_paid (the webhook, lib/geo-business.ts
// geoPlanCheckoutCompleted). A payer and everyone outside the test have variant null.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export interface AccountPrices {
  /** The test's monthly price this account sees, in cents, or null when it is outside the test (from
   *  before it, a client set up by hand, a payer, or the test off). */
  variant: number | null
  /** What a new plan costs this account now. */
  prices: GeoPrices
  /** What a plan it already has was bought at, for the billing line. */
  paid: GeoPrices
}

const priceOf = (monthCents: number) => (monthCents === ONE_PRICE_MONTH ? GEO_PRICES : geoPrices(monthCents))

export async function accountPrices(userId: string): Promise<AccountPrices> {
  const [r] = rows(
    await db.execute(sql`
      SELECT u.geo_price_variant AS variant,
             EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = u.id::text) AS client,
             (SELECT (e.props->>'month_cents')::int FROM analytics_events e
              WHERE e.user_id = u.id AND e.event = 'geo_plan_paid' AND e.props->>'month_cents' ~ '^[0-9]{1,7}$'
              ORDER BY e.created_at DESC LIMIT 1) AS paid_month
      FROM users u WHERE u.id::text = ${userId}`)
  )
  const stored = r?.variant === null || r?.variant === undefined ? null : Number(r.variant)
  const client = r?.client === true
  const paidMonth = Number(r?.paid_month) > 0 ? Number(r?.paid_month) : null
  if (paidMonth !== null) return { variant: null, prices: priceOf(paidMonth), paid: priceOf(paidMonth) }
  if (client) return { variant: null, prices: GEO_PRICES, paid: GEO_PRICES }
  if (stored === null || !PRICE_TEST.enabled) return { variant: null, prices: GEO_PRICES, paid: GEO_PRICES }
  // An arm with weight 0 releases an account that has not paid to a live arm, the same one each time.
  const month = isLiveArm(stored) ? stored : await bucketArm(userId)
  return { variant: month, prices: priceOf(month), paid: priceOf(month) }
}

/** The variant to store on an account being created now, from this request's cookies (auth.ts,
 *  app/api/register, app/api/geo/report-request): the arm the visitor saw; null, the one price and
 *  outside the test, for someone who visited before, a sales link, or any doubt. A request without our
 *  cookie or an older one (a server calling, a browser refusing cookies) draws an arm. Never throws. */
export async function newAccountVariant(): Promise<number | null> {
  try {
    if (!PRICE_TEST.enabled) return null
    const store = await cookies()
    const id = store.get(VISITOR_COOKIE)?.value
    const raw = store.get(PRICE_COOKIE)?.value
    if (!id && !raw) return hasOlderCookie(store.getAll().map((c) => c.name)) ? null : drawPriceVariant()
    const pin = await readPin(id, raw)
    if (!id || !pin || pin.epoch !== PRICE_TEST.epoch || pin.flag === "r" || pin.flag === "l") return null
    if (pin.flag === "n") {
      // Not settled by the page yet (a sign-up within moments of the first page): the same check.
      const h = await headers()
      if ((await returningVisitor(visitorAddress(h), h.get("user-agent") ?? "")) !== "new") return null
    }
    return isLiveArm(pin.cents) ? pin.cents : await bucketArm(id)
  } catch {
    return null
  }
}

/** A sales link (?ref=li, lib/geo-price-visitor.ts) holds for an account too: the quoted price is the one
 *  price, so its stored arm goes. Only an account that has not paid is affected in practice: a payer is
 *  priced by what he paid. True if something changed. Never throws. */
export async function salesPriceAccount(userId: string): Promise<boolean> {
  try {
    const changed = rows(
      await db.execute(sql`UPDATE users SET geo_price_variant = NULL WHERE id::text = ${userId} AND geo_price_variant IS NOT NULL RETURNING id`)
    )
    return changed.length > 0
  } catch {
    return false
  }
}

/** On a sign-in, with this browser on a sales link's pin: the account takes the one price. Never throws. */
export async function salesPriceOnSignIn(userId: string): Promise<void> {
  try {
    if (!PRICE_TEST.enabled) return
    const store = await cookies()
    const pin = await readPin(store.get(VISITOR_COOKIE)?.value, store.get(PRICE_COOKIE)?.value)
    if (pin?.flag === "l") await salesPriceAccount(userId)
  } catch {
    // The account keeps what it has.
  }
}

/** A visitor in the test started a quick check: counted once per visitor on the exposure row, for the
 *  weekly report. Never throws. */
export async function noteVisitorCheck(): Promise<void> {
  try {
    if (!PRICE_TEST.enabled) return
    const store = await cookies()
    const id = store.get(VISITOR_COOKIE)?.value
    const pin = await readPin(id, store.get(PRICE_COOKIE)?.value)
    if (!id || pin?.flag !== "t") return
    await db.execute(sql`
      UPDATE geo_price_exposures SET checked_at = now()
      WHERE experiment = ${PRICE_TEST.experiment} AND visitor_id = ${id} AND checked_at IS NULL`)
  } catch {
    // Analytics never gets in the way.
  }
}

/** The variant for a Telegram line: "тест цены, вариант $299/мес" (a checkout opened under the test),
 *  the one price outside a running test, or, with the test off, the one price for everyone. */
export function variantLine(variant: number | null, monthCents: number): string {
  const p = geoPrices(monthCents)
  if (variant !== null) return `тест цены, вариант ${p.month.label}/мес`
  if (monthCents !== ONE_PRICE_MONTH) return `цена покупки ${p.month.label}/мес`
  return PRICE_TEST.enabled ? `старая цена ${p.month.label}/мес (вне теста)` : `единая цена ${p.month.label}/мес`
}
