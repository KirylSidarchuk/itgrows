import Stripe from "stripe"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// ItGrows for Business — AI visibility, $499 a month, month to month. Kept apart from the LinkedIn/X
// plans on purpose: it never touches users.subscriptionPlan or users.subscriptionStatus (those gate
// the LinkedIn/X cabinet). A paying customer is a geo_follows row with plan = 'paid' for the site
// they bought it for.

export const GEO_PLAN = "geo_business"
const LOOKUP_KEY = "itgrows_business_499_monthly"

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

/** The $499/month price, found by its lookup key; created once on first use. */
export async function geoBusinessPriceId(stripe: Stripe): Promise<string> {
  const found = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], active: true, limit: 1 })
  if (found.data[0]) return found.data[0].id
  const product = await stripe.products.create({
    name: "ItGrows for Business — AI visibility",
    description:
      "Articles on your own domain that answer your buyers' questions, crawler and indexing fixes, and a weekly check of ChatGPT, Claude, Gemini and Perplexity. Month to month.",
    metadata: { product: GEO_PLAN },
  })
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 49900,
    recurring: { interval: "month" },
    lookup_key: LOOKUP_KEY,
    metadata: { product: GEO_PLAN },
  })
  return price.id
}

const PAID = new Set(["active", "trialing", "past_due"])

/** Mirror a GEO subscription's state onto the follow it was bought for. */
export async function syncGeoSubscription(sub: Stripe.Subscription, event: string) {
  const userId = sub.metadata?.userId
  const domain = sub.metadata?.domain
  if (!userId || !domain) return
  const paid = PAID.has(sub.status)
  await db.execute(sql`
    UPDATE geo_follows f SET plan = ${paid ? "paid" : "free"}
    FROM geo_sites s
    WHERE s.id = f.site_id AND f.user_id = ${userId} AND s.domain = ${domain}`)
  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_subscription', '/stripe/webhook', ${JSON.stringify({ domain, status: sub.status, event, subscription: sub.id })}::jsonb)`)
    .catch(() => {})
}

export async function notifyOwner(text: string) {
  await fetch("https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: 372194458, text }),
  }).catch(() => {})
}
