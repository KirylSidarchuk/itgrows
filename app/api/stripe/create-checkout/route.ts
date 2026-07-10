import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"

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

  const { plan } = await req.json()
  if (!plan || !["personal", "duo", "allin", "personal_annual", "duo_annual", "allin_annual", "company", "company_annual"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const PLAN_PRICE_MAP: Record<string, string> = {
    personal: process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y",
    duo: process.env.STRIPE_PRICE_DUO_MONTHLY ?? "price_1TVW9h2Ve258UiqtSRGFgtOS",
    allin: process.env.STRIPE_PRICE_ALLIN_MONTHLY ?? "price_1TVW9h2Ve258UiqtqaTvpEcz",
    personal_annual: process.env.STRIPE_PRICE_PERSONAL_ANNUAL_NEW ?? "price_1TWByX2Ve258Uiqt7bJsbxcl",
    duo_annual: process.env.STRIPE_PRICE_DUO_ANNUAL ?? "price_1TWByY2Ve258Uiqtc5ewdi5u",
    allin_annual: process.env.STRIPE_PRICE_ALLIN_ANNUAL ?? "price_1TWBya2Ve258UiqtpFIzdgAL",
    company: process.env.STRIPE_PRICE_COMPANY_MONTHLY ?? "price_1TWaK32Ve258UiqtmfxyHfnW",
    company_annual: process.env.STRIPE_PRICE_COMPANY_ANNUAL ?? "price_1TWaK62Ve258Uiqt3sU7ZFeU",
  }
  const priceId = PLAN_PRICE_MAP[plan]

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

  const PLAN_VALUE: Record<string, number> = { personal: 49, personal_annual: 49, duo: 99, duo_annual: 99, allin: 199, allin_annual: 199, company: 99, company_annual: 99 }
  const planValue = PLAN_VALUE[plan] ?? 49
  const gclid = (await cookies()).get("itg_gclid")?.value

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    // Card required up front to start the 14-day free trial (no charge until it ends).
    payment_method_collection: "always",
    subscription_data: {
      metadata: { userId: user.id, plan, ...(gclid ? { gclid } : {}) },
      trial_period_days: 14,
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
    },
    success_url: `${baseUrl}/cabinet?success=1&itg_conv=trial&v=${planValue}`,
    cancel_url: `${baseUrl}/cabinet?cancelled=1`,
    metadata: { userId: user.id, plan, ...(gclid ? { gclid } : {}) },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
