import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

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

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: "https://itgrows.ai/cabinet?subscribed=1",
    cancel_url: "https://itgrows.ai/",
    ...(email ? { customer_email: email } : {}),
    allow_promotion_codes: false,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
