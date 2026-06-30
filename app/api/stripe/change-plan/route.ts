import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

// Main subscription plans (must match create-checkout / webhook price maps).
const PLAN_PRICE_MAP: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y",
  duo: process.env.STRIPE_PRICE_DUO_MONTHLY ?? "price_1TVW9h2Ve258UiqtSRGFgtOS",
  allin: process.env.STRIPE_PRICE_ALLIN_MONTHLY ?? "price_1TVW9h2Ve258UiqtqaTvpEcz",
  personal_annual: process.env.STRIPE_PRICE_PERSONAL_ANNUAL_NEW ?? "price_1TWByX2Ve258Uiqt7bJsbxcl",
  duo_annual: process.env.STRIPE_PRICE_DUO_ANNUAL ?? "price_1TWByY2Ve258Uiqtc5ewdi5u",
  allin_annual: process.env.STRIPE_PRICE_ALLIN_ANNUAL ?? "price_1TWBya2Ve258UiqtpFIzdgAL",
}
const MAIN_PRICE_IDS = new Set(Object.values(PLAN_PRICE_MAP))

// Switch the user's EXISTING main-plan subscription to a different plan (with proration).
// Only touches the main-plan subscription (never the company-page or per-page subscriptions).
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string }
  if (!plan || !PLAN_PRICE_MAP[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }
  const newPriceId = PLAN_PRICE_MAP[plan]

  const [user] = await db
    .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet — start a plan first." }, { status: 400 })
  }

  // Find the active main-plan subscription (by its price being one of the main plan prices).
  const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "all", limit: 20 })
  const mainSub = subs.data.find((s) =>
    ["active", "trialing", "past_due"].includes(s.status) &&
    s.items.data.some((it) => it.price?.id && MAIN_PRICE_IDS.has(it.price.id))
  )

  if (!mainSub) {
    return NextResponse.json({ error: "No active plan to change. Start a plan first." }, { status: 400 })
  }

  const item = mainSub.items.data.find((it) => it.price?.id && MAIN_PRICE_IDS.has(it.price.id))
  if (!item) {
    return NextResponse.json({ error: "Could not locate your plan." }, { status: 400 })
  }

  if (item.price.id === newPriceId) {
    return NextResponse.json({ error: "You're already on this plan." }, { status: 400 })
  }

  await stripe.subscriptions.update(mainSub.id, {
    items: [{ id: item.id, price: newPriceId }],
    proration_behavior: "create_prorations",
    metadata: { ...(mainSub.metadata ?? {}), plan, userId: user.id },
  })

  await db.update(users).set({ subscriptionPlan: plan }).where(eq(users.id, user.id))

  return NextResponse.json({ success: true, plan })
}
