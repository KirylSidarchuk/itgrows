import type { Locale } from "@/lib/i18n/config"
import { formatUsd } from "@/lib/i18n/format"

// AI-visibility pricing, in one place: the site, the cabinet and Stripe Checkout all read it.
// Decided by Kiryl on 22 Oct 2026; the detailed report is free since 27 Oct 2026. The plan's monthly
// price was an A/B test from 28 to 30 Oct 2026, at account level (Kiryl, 27 Oct: "цена только внутри
// кабинета"); Kiryl ended it on 30 Oct 2026 ("цены нет вообще, это так не работает, цены должны быть"):
// one price, $499 a month, on the public pages. Since 2 Nov 2026 it is a test again, of visitors, with the
// mechanism of pickaclass (PRICE_TEST below).
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
//   The one price, the default, is M = $499 (ONE_PRICE_MONTH): $499 + $499 setup, $1,497 for 3 months,
//   $4,788 for a year ($399 a month). Its Stripe prices are found by lookup key (GEO_PRICES); a test
//   price is charged inline (lib/geo-business.ts geoLineItems), so it needs no Stripe price made for it.
//
// THE PRICE TEST (PRICE_TEST; Kiryl, 2 Nov 2026). The rules, carried over from pickaclass:
// - A visitor gets an arm at the proxy (middleware.ts, lib/geo-price-visitor.ts), so that the first page
//   already renders it, with no jump. Two cookies hold it: itg_vid, a random id, and itg_price, the signed
//   pin. The arm a visitor saw is his for good: new weights affect only new visitors. An arm with weight 0
//   releases those who have not paid to the live arms, by sha256(id:experiment).
// - Whoever paid keeps the price he paid and is out of the test (lib/geo-price-test.ts accountPrices).
// - NO CLOAKING, a change from pickaclass, because itgrows runs live Google and Meta ads and Google's rules
//   for site tests say to treat its crawlers like any visitor: Googlebot, AdsBot-Google, Bingbot,
//   facebookexternalhit and every other search, ad-review or link-preview bot get an arm through the
//   same code as a new visitor, from a hash of address and user agent, as they keep no cookie. Only AI
//   training and answer crawlers that are neither (lib/geo-price-visitor.ts AI_CRAWLER) see the one
//   price. The user agent otherwise only keeps bots out of the statistics.
// - IN EVERY COUNTRY, an unknown one included (Kiryl, 5 Nov 2026: a test of one day, to collect data). The price
//   does not depend on where a request comes from. Its cookies are set whatever is chosen in the cookie banner,
//   and /privacy says so.
// - Everyone who was ever here before stays on the one price, outside the test (Kiryl, 2 Nov: "убедись что
//   все кто ранее заходил когда-то на сайт увидят 499"): an older cookie at the proxy, a look at the visit
//   and quick-check logs on the first page (lib/geo-price-returning.ts), what the browser's storage held
//   when the visit began (lib/geo-price-earlier-visit.ts). Any doubt or error is the one price.
// - A sales link (?ref=li) pins a visitor and his account to the one price, outside the test; it can
//   only ever do that.
// - An account made while the test runs stores the visitor's arm (users.geo_price_variant:
//   lib/geo-price-test.ts newAccountVariant, called from auth.ts, /api/register and
//   /api/geo/report-request); a lead with no visitor behind it (the Meta form) draws one
//   (drawPriceVariant, /api/geo/price/vm). Accounts from before the test (NULL) and clients set up by
//   hand (geo_clients) who have not paid stay on the one price.
// - QA: ?price_qa=<arm>.<hmac> forces an arm for that request and records nothing (scripts/price-qa-links.ts).
// - One server function says the price of a request (lib/geo-price-server.ts visitorPrice), and every
//   page a person sees names that: the pricing card and the FAQ of "/" and its JSON-LD offers, /about,
//   /signup, the sample report, the blog posts' footers, and the price sentences in the articles' text
//   (lib/geo-price-article.ts; the stored text stays). The cabinet and checkout read the account
//   (lib/geo-price-test.ts). llms.txt and the markdown alternates stay on the one price, as does what
//   the writer of our articles knows (VM /root/blog_engine own_geo_facts.json).
// - Counted per arm: visitors, price card seen and quick checks (geo_price_exposures,
//   lib/db/migrations/add_geo_price_exposures.sql), accounts (users.geo_price_variant), geo_plan_view,
//   geo_checkout_started, geo_plan_paid (analytics_events, props.variant); weekly to Telegram by the VM's
//   /root/geo_check/price_test_report.py.
// - Off, with no other edit: `enabled: false`. Nobody is assigned, all visitors and unpaid accounts
//   are on the one price, new accounts get no variant, the events carry variant null; a payer keeps what
//   he paid. Any failure anywhere falls back to the one price: the site never breaks on the test.
// - CACHING: a response with a visitor's price must never be served to anyone else. Every priced page
//   says force-dynamic (scripts/i18n-check.ts fails on one that does not, or that says force-static or
//   revalidate). Nothing with a price goes through a data cache: the
//   sample report's unstable_cache holds the report only, and the guides' only titles. /terms and /privacy
//   stay static and name no price of this plan.
//
// The launch-rewards wheel (lib/geo-promo.ts PROMO_WHEEL, since 29 Oct 2026) comes on top of these
// prices: the same four rewards for every account, applied at checkout to the account's prices.

/** Sites an account has the free detailed report computed for. Past that /api/geo/follow answers
 *  "report_limit" and the cabinet offers to run another site's report on request ("contact us"). */
export const REPORT_SITES = 1

export type GeoInterval = "month" | "quarter" | "year"
export type GeoPriceKind = "setup" | GeoInterval

/** The one price, a month, in cents: everyone outside the test, and everyone with it off. */
export const ONE_PRICE_MONTH = 49900

/** The A/B test of the plan's monthly price, in cents (Kiryl, 2 Nov 2026). See the top of the file. */
export const PRICE_TEST: {
  enabled: boolean
  /** Names this test in the visitor log, and goes into the bucket hash. */
  experiment: string
  /** A pin from another epoch does not count, and its visitor stays on the one price. */
  epoch: string
  variants: readonly number[]
  /** A variant's share; not listed = 1. 0 = no new visitors, and those who have not paid move to live arms. */
  weights: Readonly<Record<number, number>>
} = {
  enabled: true, // false turns the whole test off.
  experiment: "geo_price_2026_11",
  epoch: "v1",
  variants: [19900, 29900, 39900, 49900, 59900],
  weights: {},
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
 *  The default of every page, llms.txt, the Stripe prices by lookup key, and a checkout from before the test. */
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

const armWeight = (cents: number) => Math.max(0, PRICE_TEST.weights[cents] ?? 1)

/** An arm that takes visitors: in the test, with a weight above 0. */
export const isLiveArm = (cents: number) => PRICE_TEST.variants.includes(cents) && armWeight(cents) > 0

/** The live arm at x in [0, 1), by weight; the one price if none is live. */
export function armAt(x: number): number {
  const live = PRICE_TEST.variants.filter(isLiveArm)
  if (!live.length) return ONE_PRICE_MONTH
  const total = live.reduce((sum, c) => sum + armWeight(c), 0)
  let acc = 0
  for (const c of live) {
    acc += armWeight(c) / total
    if (x < acc) return c
  }
  return live[live.length - 1]
}

/** An arm for an account with no visitor behind it, at random by weight. Null with the test off: the
 *  account is on the one price. */
export function drawPriceVariant(): number | null {
  if (!PRICE_TEST.enabled || !PRICE_TEST.variants.some(isLiveArm)) return null
  return armAt(Math.random())
}

/** The real, public sample report: what the free report looks like, linked before sign-up. */
export const SAMPLE_DOMAIN = "appslift.com"
export const SAMPLE_PATH = "/business/sample-report"
