import { usd, yearMonthCents, type GeoInterval, type GeoPrices } from "@/lib/geo-pricing"

// The launch-rewards wheel of the AI-visibility cabinet (Kiryl, 29 Oct 2026: "давай колесо, твой набор
// наград"). Everyone wins: after the free report an account spins once and gets one of four rewards,
// each with the same chance, drawn on the server at the moment of the spin (lib/geo-promo-server.ts
// spinWheel, crypto.randomInt) and stored on the account (users.geo_promo). The wheel only shows the
// server's answer: it lands on it, never "almost" on another one.
//
// - setup_free: the monthly plan without its one-time setup.
// - month_half: the monthly plan's first month at 50% off (the setup, where it is charged, stays).
// - quarter_plus_month: 3 months upfront, and the plan runs 4 months before the next payment.
// - year_30: a year upfront at 30% off instead of 20%, for the first year; it renews at the regular
//   yearly price.
//
// A reward is for the site of the report, for the way to pay it names, and for 7 days from the spin
// (a real date, shown with what is left). It changes the first payment only; later payments are at the
// account's regular price. It comes on top of the account's price (lib/geo-pricing.ts; while the price
// test ran, 28–30 Oct 2026, the same rewards for every variant). It is not combined with a
// promotion code. Paying accounts, accounts that had the plan, and clients set up by hand never see
// the wheel. Terms: app/terms/page.tsx #launch-rewards. Counted as geo_wheel_seen, geo_wheel_spin
// (props.reward, props.variant) and, once paid, geo_plan_paid props.reward.
//
// Stripe (lib/geo-business.ts geoCheckoutPlan): setup_free leaves the setup line out; month_half
// applies one coupon, 50% off the plan's product once (HALF_MONTH_COUPON, made on first use);
// quarter_plus_month and year_30 charge the first period as a one-time line and start the
// subscription with a trial until the next payment (Stripe shows the time already paid for as a trial).
//
// Off, with no other edit: `enabled: false` hides the wheel and stops new spins; rewards already won
// still apply until their date (a promise made), unless `honourWon` is false too.
//
// The same wheel on the website, before an account (exit intent; Kiryl, 29 Oct 2026: "может еще когда
// человек собирается закрыть сайт показывать ему колесо?"). On the public GEO pages, a signed-out
// visitor on a computer who moves to leave after 15 s on the site is offered one spin
// (components/geo/ExitWheel.tsx; not again for 30 days once shown, never once spun; never on phones or
// tablets). The reward is drawn on the server as the cabinet's (lib/geo-promo-server.ts drawReward) and
// kept PROMO_WHEEL.validDays in geo_guest_promos (lib/db/migrations/add_geo_guest_promos.sql), one per
// browser (the GUEST_WHEEL_COOKIE, set on the spin) and one per internet address
// (POST /api/geo/promo/guest-spin). It moves to the account the visitor creates (users.geo_promo, by
// "exit-wheel", with the website's dates) when the cabinet loads its wheel with that cookie and the
// account has its free report and may have a reward (none yet, not a hand-set client, never had the
// plan); until the report is ready the cabinet says the reward is waiting. The wheel names no price:
// the rewards by name only. Counted as geo_wheel_exit_seen, geo_wheel_exit_spin (props.reward, .lang,
// .path) and geo_wheel_claimed (props.reward, props.source "exit"); Telegram on the move to an account.
// `exitIntent: false` turns the website's wheel off alone; `enabled: false` turns it off too, and
// rewards already won on the website still move to accounts while `honourWon` holds.

export const PROMO_WHEEL: { enabled: boolean; validDays: number; honourWon: boolean; exitIntent: boolean } = {
  enabled: true,
  validDays: 7,
  honourWon: true,
  /** The wheel on the website when a visitor moves to leave (needs `enabled` too). */
  exitIntent: true,
}

/** The website's exit-intent wheel is on: the dialog and new spins there. */
export const exitWheelOn = () => PROMO_WHEEL.enabled && PROMO_WHEEL.exitIntent

/** The browser's cookie that keeps a reward won on the website (its geo_guest_promos token). */
export const GUEST_WHEEL_COOKIE = "itg_wheel"

/** The rewards in the order of the wheel's segments, clockwise from the top. */
export const WHEEL_REWARDS = ["setup_free", "month_half", "quarter_plus_month", "year_30"] as const
export type WheelReward = (typeof WHEEL_REWARDS)[number]
export const isWheelReward = (v: unknown): v is WheelReward => WHEEL_REWARDS.includes(v as WheelReward)

/** The way to pay each reward is for. */
export const REWARD_INTERVAL: Record<WheelReward, GeoInterval> = {
  setup_free: "month",
  month_half: "month",
  quarter_plus_month: "quarter",
  year_30: "year",
}

/** The yearly reward: twelve months at 30% off instead of YEAR_DISCOUNT. */
export const YEAR_REWARD_DISCOUNT = 0.3
/** The first month's reward: 50% off the month (not the setup). */
export const MONTH_REWARD_OFF = 0.5

export const REWARD_TEXT: Record<WheelReward, { segment: [string, string]; title: string }> = {
  setup_free: { segment: ["Free", "setup"], title: "Free setup on the monthly plan" },
  month_half: { segment: ["1st month", "50% off"], title: "First month 50% off on the monthly plan" },
  quarter_plus_month: { segment: ["3 months", "+1 free"], title: "3 months + 1 month free" },
  year_30: { segment: ["A year", "30% off"], title: "A year at 30% off instead of 20%" },
}

/** For Kiryl's Telegram lines. */
export const REWARD_RU: Record<WheelReward, string> = {
  setup_free: "бесплатный запуск (помесячно)",
  month_half: "первый месяц −50% (помесячно)",
  quarter_plus_month: "3 месяца + 1 в подарок",
  year_30: "год −30% вместо −20%",
}

/** What a reward does to the first payment, at an account's prices. `setupCharged`: the setup would be
 *  on the first monthly payment without the reward (not when the site's setup was paid before). */
export interface RewardTerms {
  interval: GeoInterval
  /** The first payment without the reward and with it, in cents. */
  beforeCents: number
  afterCents: number
  /** The plan's part of the first payment with the reward, and the setup charged with it. */
  planCents: number
  setupCents: number
  /** Months the first payment covers before the next one. */
  months: number
  /** The next payment, at the regular price. */
  nextCents: number
}

/** A year at the reward's 30% off: twelve months, the monthly figure rounded to whole dollars as the
 *  regular year is ($499 -> $349, $4,188). */
export const rewardYearCents = (monthCents: number) => 12 * yearMonthCents(monthCents, YEAR_REWARD_DISCOUNT)

export function rewardTerms(p: GeoPrices, reward: WheelReward, setupCharged: boolean): RewardTerms {
  const setup = setupCharged ? p.setup.cents : 0
  switch (reward) {
    case "setup_free":
      return { interval: "month", beforeCents: p.month.cents + setup, afterCents: p.month.cents, planCents: p.month.cents, setupCents: 0, months: 1, nextCents: p.month.cents }
    case "month_half": {
      const half = Math.round(p.month.cents * (1 - MONTH_REWARD_OFF))
      return { interval: "month", beforeCents: p.month.cents + setup, afterCents: half + setup, planCents: half, setupCents: setup, months: 1, nextCents: p.month.cents }
    }
    case "quarter_plus_month":
      return { interval: "quarter", beforeCents: p.quarter.cents, afterCents: p.quarter.cents, planCents: p.quarter.cents, setupCents: 0, months: 4, nextCents: p.quarter.cents }
    case "year_30": {
      const year = rewardYearCents(p.monthCents)
      return { interval: "year", beforeCents: p.year.cents, afterCents: year, planCents: year, setupCents: 0, months: 12, nextCents: p.year.cents }
    }
  }
}

/** One line on what the reward gives, at the account's prices. */
export function rewardDetail(reward: WheelReward, p: GeoPrices): string {
  const t = rewardTerms(p, reward, true)
  switch (reward) {
    case "setup_free":
      return `The one-time ${p.setup.label} setup is free when you start monthly.`
    case "month_half":
      return `Your first month is ${usd(t.planCents)} instead of ${p.month.label}, plus the one-time ${p.setup.label} setup; then ${p.month.label} a month.`
    case "quarter_plus_month":
      return `Pay ${p.quarter.label} for 3 months upfront; your plan runs 4 months before the next payment.`
    case "year_30":
      return `${usd(t.planCents)} for your first year instead of ${p.year.label}.`
  }
}

/** `months` calendar months after `from`, in Unix seconds; a shorter month ends on its last day
 *  (31 Jan + 1 month -> 28 or 29 Feb). The next payment of a reward that moves it. */
export function monthsLater(from: Date, months: number): number {
  const d = new Date(from.getTime())
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return Math.floor(d.getTime() / 1000)
}

/** The account's reward as stored (users.geo_promo). */
export interface PromoState {
  reward: WheelReward
  site: string
  spun_at: string
  expires_at: string
  /** Set by the webhook once the plan is paid with it. */
  used_at?: string
  session?: string
  /** How it came, when not from the cabinet's spin: "exit-wheel" (won on the website before the
   *  account), "owner-letter-2026-10-29" (written by hand, as promised in Kiryl's letters). */
  by?: string
}

/** What the cabinet gets (GET /api/geo/promo/spin): whether this account can spin now, for which site,
 *  and the reward it has. */
export interface PromoView {
  canSpin: boolean
  /** The site of the report: the reward is for it. */
  site: string | null
  reward: {
    id: WheelReward
    site: string
    spunAt: string
    expiresAt: string
    used: boolean
    /** Not used, not past its date, and rewards apply (PROMO_WHEEL). */
    live: boolean
  } | null
  /** A reward won on the website before the account, waiting for its free report: it moves in once the
   *  report is ready (lib/geo-promo-server.ts promoView). */
  pending: { id: WheelReward; expiresAt: string } | null
}

/** The website's wheel (GET and POST /api/geo/promo/guest-spin): this browser's reward, or none.
 *  `fresh` (POST): drawn by this spin, not one this browser or its internet address already had. */
export interface GuestPromoView {
  reward: { id: WheelReward; expiresAt: string; claimed: boolean } | null
  fresh?: boolean
}

/** Rewards won apply at checkout: the wheel is on, or it is off and they are still honoured. */
export const rewardsApply = () => PROMO_WHEEL.enabled || PROMO_WHEEL.honourWon

export function promoLive(s: PromoState | null | undefined, now = Date.now()): boolean {
  return Boolean(s && isWheelReward(s.reward) && !s.used_at && Date.parse(s.expires_at) > now && rewardsApply())
}
