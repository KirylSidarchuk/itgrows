import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// TODO: set these env vars in Vercel:
// STRIPE_PRICE_PERSONAL_MONTHLY
// STRIPE_PRICE_DUO_MONTHLY
// STRIPE_PRICE_ALLIN_MONTHLY

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  personal: process.env.STRIPE_PRICE_PERSONAL_MONTHLY,
  duo: process.env.STRIPE_PRICE_DUO_MONTHLY,
  allin: process.env.STRIPE_PRICE_ALLIN_MONTHLY,
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { plan?: string }
  const plan = body.plan ?? "personal"

  const priceId = PLAN_PRICE_MAP[plan]
  if (!priceId) {
    return NextResponse.json({
      error: `Stripe price for plan "${plan}" not configured. Set STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY env var.`
    }, { status: 500 })
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, user.id))
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://itgrows.ai"

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: user.id, plan },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
