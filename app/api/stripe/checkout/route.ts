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

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { planType?: string }
  const isAnnual = body.planType === "annual"
  const priceId = isAnnual
    ? process.env.STRIPE_PRICE_PERSONAL_ANNUAL
    : process.env.STRIPE_PRICE_PERSONAL
  if (!priceId) {
    return NextResponse.json({
      error: isAnnual ? "STRIPE_PRICE_PERSONAL_ANNUAL env var not set" : "STRIPE_PRICE_PERSONAL env var not set"
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
    metadata: { userId: user.id, plan: isAnnual ? "personal_annual" : "personal" },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
