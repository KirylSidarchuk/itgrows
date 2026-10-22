import type Stripe from "stripe"
import { GEO_PLAN } from "@/lib/geo-business"

// Personal-plan (main subscription) Stripe price IDs. A user can hold TWO subscriptions on
// one Stripe customer — a personal plan AND a company-pages add-on — so cancel/renew must
// target the MAIN (personal) subscription, not whichever Stripe lists first.
const MAIN_PLAN_PRICE_MAP: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y",
  duo: process.env.STRIPE_PRICE_DUO_MONTHLY ?? "price_1TVW9h2Ve258UiqtSRGFgtOS",
  allin: process.env.STRIPE_PRICE_ALLIN_MONTHLY ?? "price_1TVW9h2Ve258UiqtqaTvpEcz",
  personal_annual: process.env.STRIPE_PRICE_PERSONAL_ANNUAL_NEW ?? "price_1TWByX2Ve258Uiqt7bJsbxcl",
  duo_annual: process.env.STRIPE_PRICE_DUO_ANNUAL ?? "price_1TWByY2Ve258Uiqtc5ewdi5u",
  allin_annual: process.env.STRIPE_PRICE_ALLIN_ANNUAL ?? "price_1TWBya2Ve258UiqtpFIzdgAL",
}

export const MAIN_PRICE_IDS = new Set(Object.values(MAIN_PLAN_PRICE_MAP))

// From a customer's subscriptions, pick the one to cancel/renew: prefer the main personal-plan
// sub (by price id); if the user only has a company-pages sub, fall back to the first cancelable.
// The AI-visibility plan (metadata.plan geo_business) sits on the same customer but is never one of
// these: it is cancelled from /business/dashboard/plan (/api/geo/cancel).
export function pickMainSubscription(subs: Stripe.Subscription[]): Stripe.Subscription | undefined {
  const cancelable = subs.filter(
    (s) => ["active", "trialing", "past_due"].includes(s.status) && s.metadata?.plan !== GEO_PLAN
  )
  return (
    cancelable.find((s) => s.items.data.some((it) => !!it.price?.id && MAIN_PRICE_IDS.has(it.price.id))) ??
    cancelable[0]
  )
}
