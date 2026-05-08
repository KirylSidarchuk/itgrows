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

  const priceId = process.env.STRIPE_PRICE_PERSONAL_ANNUAL_DISCOUNT
  if (!priceId) {
    return NextResponse.json(
      { error: "Discount price not configured" },
      { status: 500 }
    )
  }

  let email: string | undefined
  try {
    const body = await req.json()
    email = body.email ?? undefined
  } catch {
    // body is optional
  }

  // Try to get userId — from session if logged in, or look up by email
  let userId: string | undefined
  const session = await auth()
  if (session?.user?.id) {
    userId = session.user.id
  } else if (email) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    if (user) userId = user.id
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: "https://itgrows.ai/welcome?subscribed=1&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://itgrows.ai/",
    ...(email ? { customer_email: email } : {}),
    allow_promotion_codes: false,
    ...(userId
      ? {
          metadata: { userId },
          subscription_data: {
            metadata: { userId, plan: "personal_annual_discount" },
          },
        }
      : {}),
  })

  return NextResponse.json({ url: checkoutSession.url })
}
