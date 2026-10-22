// AI-visibility pricing, in one place: the site, the cabinet and Stripe Checkout all read it.
// Decided by Kiryl on 22 Oct 2026. Nothing is free but the quick check on the site (5 questions x
// ChatGPT + Perplexity, no signup).
//
// - Detailed report (20 questions x 4 assistants x 3 asks): an account has it computed for
//   REPORT_SITES site after sign-up, with the totals and the quick check's 5 questions open; the whole
//   report is $49.90, and for another site the report is $49.90. Its price comes off the first plan
//   payment if the plan starts within CREDIT_DAYS of buying it.
// - The plan: $499 a month plus a one-time $499 setup (the launch: site and index setup, delivered as
//   the launch report on "Your website"); 3 months upfront ($1,497) or a year ($4,788 = $399 a month,
//   20% off) come with the setup free.

export const CREDIT_DAYS = 30
/** Sites an account has the detailed report computed for. Past that /api/geo/follow answers
 *  "report_limit", and the report for another site is bought. UI text: "Your account includes the
 *  report for one site; for another site the report is $49.90". */
export const REPORT_SITES = 1

export type GeoInterval = "month" | "quarter" | "year"

export const GEO_PRICES = {
  research: { cents: 4990, label: "$49.90", lookupKey: "itgrows_geo_research_4990" },
  setup: { cents: 49900, label: "$499", lookupKey: "itgrows_geo_setup_499" },
  month: { cents: 49900, label: "$499", perMonth: "$499", lookupKey: "itgrows_business_499_monthly", interval: "month", intervalCount: 1 },
  quarter: { cents: 149700, label: "$1,497", perMonth: "$499", lookupKey: "itgrows_business_1497_quarterly", interval: "month", intervalCount: 3 },
  year: { cents: 478800, label: "$4,788", perMonth: "$399", lookupKey: "itgrows_business_4788_yearly", interval: "year", intervalCount: 1 },
} as const

/** The setup fee is charged only on the month-to-month plan. */
export const setupFree = (i: GeoInterval) => i !== "month"

/** What the first payment comes to, in cents, with or without the report credit. */
export function firstPaymentCents(i: GeoInterval, researchCredit: boolean) {
  const base = GEO_PRICES[i].cents + (setupFree(i) ? 0 : GEO_PRICES.setup.cents)
  return base - (researchCredit ? GEO_PRICES.research.cents : 0)
}

export const usd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })

/** The real, public sample report shown next to every "buy the report" button. */
export const SAMPLE_DOMAIN = "appslift.com"
export const SAMPLE_PATH = "/business/sample-report"
