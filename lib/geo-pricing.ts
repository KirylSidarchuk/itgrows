// AI-visibility pricing, in one place: the site, the cabinet and Stripe Checkout all read it.
// Decided by Kiryl on 22 Oct 2026; the detailed report is free since 27 Oct 2026; the plan's monthly
// price is an A/B test since 28 Oct 2026 (Kiryl, 27 Oct: "цена только внутри кабинета").
//
// - The quick check on the site (5 questions x ChatGPT + Perplexity): two answers open without an
//   account, all five once one is created.
// - Detailed report (20 questions x 4 assistants x 3 asks): free, whole, once an account is created,
//   for REPORT_SITES site per account and one per connection (the VM, geo_check/service.py
//   baseline(), refuses a second day-0 report asked from an address that already had one for another
//   site: "report_ip_used"). Past either limit the cabinet says "contact us and we'll run it for
//   you"; it is never sold.
// - The plan, for a monthly price M: M a month plus a one-time setup of M (the launch: site and index
//   setup, delivered as the launch report on "Your website"); 3 months upfront (3 x M) or a year
//   (12 months at 20% off, the monthly figure rounded to whole dollars) come with the setup free.
//   The one price, from before the test, is M = $499 (ONE_PRICE_MONTH): $499 + $499 setup, $1,497 for
//   3 months, $4,788 for a year ($399 a month). Its Stripe prices are found by lookup key (GEO_PRICES);
//   a test price is charged inline (lib/geo-business.ts geoLineItems), so it needs no Stripe price.
//
// The price test (PRICE_TEST): every account created while it runs gets one of the variants at
// random, uniform, in the same insert that creates it (users.geo_price_variant: auth.ts and
// app/api/register/route.ts, drawPriceVariant), and keeps it. Accounts from before the test (NULL)
// and clients set up by hand (geo_clients) stay on the one price; paying clients are never re-priced,
// Stripe keeps charging what they bought. Only the cabinet shows a price (the plan page, the end of
// the report, checkout: lib/geo-price-test.ts accountPrices); the public pages, llms.txt, the JSON-LD
// and the articles name none: "you see your price after your free report". Counted per variant:
// geo_plan_view, geo_checkout_started, geo_plan_paid (analytics_events, props.variant).
//
// Back to one price, with no other edit: `enabled: false` puts everyone on ONE_PRICE_MONTH (and new
// accounts get no variant); `variants: [<cents>]` puts every account of the test on that one price
// (accounts from before the test stay on ONE_PRICE_MONTH). A variant dropped from a longer list sends
// its accounts to ONE_PRICE_MONTH.

/** Sites an account has the free detailed report computed for. Past that /api/geo/follow answers
 *  "report_limit" and the cabinet offers to run another site's report on request ("contact us"). */
export const REPORT_SITES = 1

export type GeoInterval = "month" | "quarter" | "year"
export type GeoPriceKind = "setup" | GeoInterval

/** The one price, a month, in cents: every account outside the test, and everyone with it off. */
export const ONE_PRICE_MONTH = 49900

/** The A/B test of the plan's monthly price, in cents (Kiryl, 27 Oct 2026). See the top of the file. */
export const PRICE_TEST: { enabled: boolean; variants: readonly number[] } = {
  enabled: true,
  variants: [29900, 39900, 49900, 59900],
}

/** A year upfront: twelve months, 20% off. */
export const YEAR_DISCOUNT = 0.2

/** Stripe's billing period for each way to pay. */
export const GEO_RECURRING: Record<GeoInterval, { interval: "month" | "year"; intervalCount: number }> = {
  month: { interval: "month", intervalCount: 1 },
  quarter: { interval: "month", intervalCount: 3 },
  year: { interval: "year", intervalCount: 1 },
}

// The Stripe prices of the one price. Setup v2: its own product, so the checkout line reads as the
// setup rather than a second month of the plan.
const ONE_PRICE_KEYS: Record<GeoPriceKind, string> = {
  setup: "itgrows_geo_setup_499_v2",
  month: "itgrows_business_499_monthly",
  quarter: "itgrows_business_1497_quarterly",
  year: "itgrows_business_4788_yearly",
}

export interface GeoPrice {
  cents: number
  label: string
  /** What it comes to a month. */
  perMonth: string
  /** The Stripe price's lookup key for the one price; null for a test price, charged inline. */
  lookupKey: string | null
}

/** Every price of the plan for one monthly price. */
export type GeoPrices = { monthCents: number } & Record<GeoPriceKind, GeoPrice>

export const usd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })

/** The plan's prices for a monthly price: the setup costs one month; 3 months are three; a year is
 *  twelve at YEAR_DISCOUNT off, the monthly figure rounded to whole dollars ($499 -> $399, $4,788). */
export function geoPrices(monthCents: number): GeoPrices {
  const yearMonth = Math.round((monthCents * (1 - YEAR_DISCOUNT)) / 100) * 100
  const one = monthCents === ONE_PRICE_MONTH
  const price = (kind: GeoPriceKind, cents: number, perMonth: number): GeoPrice => ({
    cents,
    label: usd(cents),
    perMonth: usd(perMonth),
    lookupKey: one ? ONE_PRICE_KEYS[kind] : null,
  })
  return {
    monthCents,
    setup: price("setup", monthCents, monthCents),
    month: price("month", monthCents, monthCents),
    quarter: price("quarter", 3 * monthCents, monthCents),
    year: price("year", 12 * yearMonth, yearMonth),
  }
}

/** The one price: $499 a month, a $499 setup, $1,497 for 3 months, $4,788 for a year. Only for what
 *  is not an account's own price: the Stripe prices by lookup key and a checkout from before the test. */
export const GEO_PRICES = geoPrices(ONE_PRICE_MONTH)

/** The setup fee is charged only on the month-to-month plan. */
export const setupFree = (i: GeoInterval) => i !== "month"

/** What the first payment comes to, in cents: the plan, plus the setup on the month-to-month plan. */
export function firstPaymentCents(p: GeoPrices, i: GeoInterval) {
  return p[i].cents + (setupFree(i) ? 0 : p.setup.cents)
}

/** A new account's monthly price while the test runs: one of PRICE_TEST.variants at random, uniform.
 *  Null with the test off: the account is on the one price, as before the test. */
export function drawPriceVariant(): number | null {
  const v = PRICE_TEST.variants
  if (!PRICE_TEST.enabled || !v.length) return null
  return v[Math.floor(Math.random() * v.length)]
}

/** The monthly price, in cents, an account sees and is charged for a new plan: from its variant
 *  (users.geo_price_variant). No variant (an account from before the test), a client set up by hand,
 *  or the test off: the one price. With one variant left, everyone in the test is on it. */
export function accountMonthCents(variant: number | null, client: boolean): number {
  const v = PRICE_TEST.variants
  if (variant === null || client || !PRICE_TEST.enabled || !v.length) return ONE_PRICE_MONTH
  if (v.length === 1) return v[0]
  return v.includes(variant) ? variant : ONE_PRICE_MONTH
}

/** The real, public sample report: what the free report looks like, linked before sign-up. */
export const SAMPLE_DOMAIN = "appslift.com"
export const SAMPLE_PATH = "/business/sample-report"
