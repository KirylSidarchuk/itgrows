// AI-visibility pricing, in one place: the site, the cabinet and Stripe Checkout all read it.
// Decided by Kiryl on 22 Oct 2026; the detailed report is free since 27 Oct 2026.
//
// - The quick check on the site (5 questions x ChatGPT + Perplexity): two answers open without an
//   account, all five once one is created.
// - Detailed report (20 questions x 4 assistants x 3 asks): free, whole, once an account is created,
//   for REPORT_SITES site per account and one per connection (the VM, geo_check/service.py
//   baseline(), refuses a second day-0 report asked from an address that already had one for another
//   site: "report_ip_used"). Past either limit the cabinet says "contact us and we'll run it for
//   you"; it is never sold.
// - The plan: $499 a month plus a one-time $499 setup (the launch: site and index setup, delivered as
//   the launch report on "Your website"); 3 months upfront ($1,497) or a year ($4,788 = $399 a month,
//   20% off) come with the setup free.

/** Sites an account has the free detailed report computed for. Past that /api/geo/follow answers
 *  "report_limit" and the cabinet offers to run another site's report on request ("contact us"). */
export const REPORT_SITES = 1

export type GeoInterval = "month" | "quarter" | "year"

export const GEO_PRICES = {
  // v2: its own product, so the checkout line reads as the setup rather than a second month of the plan.
  setup: { cents: 49900, label: "$499", lookupKey: "itgrows_geo_setup_499_v2" },
  month: { cents: 49900, label: "$499", perMonth: "$499", lookupKey: "itgrows_business_499_monthly", interval: "month", intervalCount: 1 },
  quarter: { cents: 149700, label: "$1,497", perMonth: "$499", lookupKey: "itgrows_business_1497_quarterly", interval: "month", intervalCount: 3 },
  year: { cents: 478800, label: "$4,788", perMonth: "$399", lookupKey: "itgrows_business_4788_yearly", interval: "year", intervalCount: 1 },
} as const

/** The setup fee is charged only on the month-to-month plan. */
export const setupFree = (i: GeoInterval) => i !== "month"

/** What the first payment comes to, in cents: the plan, plus the setup on the month-to-month plan. */
export function firstPaymentCents(i: GeoInterval) {
  return GEO_PRICES[i].cents + (setupFree(i) ? 0 : GEO_PRICES.setup.cents)
}

export const usd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })

/** The real, public sample report: what the free report looks like, linked before sign-up. */
export const SAMPLE_DOMAIN = "appslift.com"
export const SAMPLE_PATH = "/business/sample-report"
