import type { Locale } from "@/lib/i18n/config"
import { formatUsd } from "@/lib/i18n/format"

// AI-visibility pricing, in one place: the site, the cabinet and Stripe Checkout all read it.
// Decided by Kiryl on 22 Oct 2026; the detailed report is free since 27 Oct 2026. The plan's monthly
// price was an A/B test from 28 to 30 Oct 2026 (Kiryl, 27 Oct: "цена только внутри кабинета"); Kiryl
// ended it on 30 Oct 2026 ("цены нет вообще, это так не работает, цены должны быть"): one price for
// every account, $499 a month, and the public pages name it again.
//
// - The quick check on the site (5 questions x ChatGPT + Perplexity): two answers open without an
//   account, all five once one is created.
// - Detailed report (20 questions x 4 assistants, one ask each; 3 asks for a site on the plan, as its
//   check every two weeks): free, whole, once an account is created,
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
// The public pages name the one price (GEO_PRICES), each in its language's way (geoPriceLabels):
// the pricing card and the FAQ of "/" (app/business/PricingPlans.tsx, lib/i18n/messages/home.ts), the
// home page's JSON-LD offers, /about, /signup, the sample report, llms.txt, the terms and the blog
// posts' footer; the writer of our own articles has the same figures (VM /root/blog_engine
// own_geo_facts.json).
//
// The price test (PRICE_TEST), off since 30 Oct 2026. While it ran, every account created got one of
// the variants at random, uniform, in the same insert that creates it (users.geo_price_variant:
// auth.ts and app/api/register/route.ts, drawPriceVariant), and keeps it. Accounts from before the
// test (NULL) and clients set up by hand (geo_clients) stayed on the one price; paying clients are
// never re-priced, Stripe keeps charging what they bought. While it ran only the cabinet showed a
// price (the plan page, the end of the report, checkout: lib/geo-price-test.ts accountPrices) and the
// public pages named none. Counted per variant: geo_plan_view, geo_checkout_started, geo_plan_paid
// (analytics_events, props.variant). With it off, every account (those given a variant while it ran
// too) sees and is charged ONE_PRICE_MONTH, new accounts get no variant, and the events carry variant
// null.
//
// The launch-rewards wheel (lib/geo-promo.ts PROMO_WHEEL, since 29 Oct 2026) comes on top of these
// prices: the same four rewards for every account, applied at checkout to the account's prices.
//
// To test again: `enabled: true` gives new accounts one of `variants`; `variants: [<cents>]` puts every
// account of the test on that one price (accounts from before the test stay on ONE_PRICE_MONTH). A
// variant dropped from a longer list sends its accounts to ONE_PRICE_MONTH. The public pages would then
// name ONE_PRICE_MONTH while accounts in the test see their own price: change them with it.

/** Sites an account has the free detailed report computed for. Past that /api/geo/follow answers
 *  "report_limit" and the cabinet offers to run another site's report on request ("contact us"). */
export const REPORT_SITES = 1

export type GeoInterval = "month" | "quarter" | "year"
export type GeoPriceKind = "setup" | GeoInterval

/** The one price, a month, in cents: every account outside the test, and everyone with it off. */
export const ONE_PRICE_MONTH = 49900

/** The A/B test of the plan's monthly price, in cents (Kiryl, 27 Oct 2026; ended by him on 30 Oct 2026:
 *  one price for everyone, named on the public pages). See the top of the file. */
export const PRICE_TEST: { enabled: boolean; variants: readonly number[] } = {
  enabled: false,
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

/** A year's monthly figure at a discount, in cents, rounded to whole dollars ($499 at 20% off -> $399;
 *  the launch reward's 30% off, lib/geo-promo.ts, -> $349). */
export const yearMonthCents = (monthCents: number, discount: number) => Math.round((monthCents * (1 - discount)) / 100) * 100

/** The plan's prices for a monthly price: the setup costs one month; 3 months are three; a year is
 *  twelve at YEAR_DISCOUNT off, the monthly figure rounded to whole dollars ($499 -> $399, $4,788). */
export function geoPrices(monthCents: number): GeoPrices {
  const yearMonth = yearMonthCents(monthCents, YEAR_DISCOUNT)
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

/** The one price: $499 a month, a $499 setup, $1,497 for 3 months, $4,788 for a year ($399 a month).
 *  What the public pages name, the Stripe prices by lookup key, and a checkout from before the test. */
export const GEO_PRICES = geoPrices(ONE_PRICE_MONTH)

/** The plan's prices as a page in one language writes them (lib/i18n/format.ts formatUsd). */
export interface GeoPriceLabels {
  month: string
  setup: string
  quarter: string
  year: string
  /** What a year comes to a month. */
  yearPerMonth: string
}

/** The one price (or another) for a public page in its language: "$499", "$1,497", "$4,788" and "$399"
 *  in English; "499 $", "1.497 $", "4.788 $" and "399 $" in German. */
export function geoPriceLabels(locale: Locale, p: GeoPrices = GEO_PRICES): GeoPriceLabels {
  const f = (cents: number) => formatUsd(locale, cents)
  return {
    month: f(p.month.cents),
    setup: f(p.setup.cents),
    quarter: f(p.quarter.cents),
    year: f(p.year.cents),
    yearPerMonth: f(yearMonthCents(p.monthCents, YEAR_DISCOUNT)),
  }
}

/** The setup fee is charged only on the month-to-month plan. */
export const setupFree = (i: GeoInterval) => i !== "month"

/** What the first payment comes to, in cents: the plan, plus the setup on the month-to-month plan. */
export function firstPaymentCents(p: GeoPrices, i: GeoInterval) {
  return p[i].cents + (setupFree(i) ? 0 : p.setup.cents)
}

/** A new account's monthly price while the test runs: one of PRICE_TEST.variants at random, uniform.
 *  Null with the test off (since 30 Oct 2026): the account is on the one price. */
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
