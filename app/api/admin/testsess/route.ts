import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP: create a representative no-card trial checkout session (NOT completed -> no subscription).
// Token-gated. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    const cust = await s.customers.create({ email: "nocard-test@itgrows.ai", name: "No-Card Test" })
    const priceId = process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y"
    const session = await s.checkout.sessions.create({
      customer: cust.id,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_collection: "if_required", // <-- the change we are testing
      subscription_data: {
        metadata: { userId: "TEST", plan: "personal" },
        trial_period_days: 14,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      success_url: "https://www.itgrows.ai/cabinet?success=1",
      cancel_url: "https://www.itgrows.ai/",
    })
    return NextResponse.json({ url: session.url, payment_method_collection: (session as unknown as { payment_method_collection?: string }).payment_method_collection })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
