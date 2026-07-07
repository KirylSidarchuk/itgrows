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

  // Never create a paid subscription we can't attach to an account — otherwise the buyer
  // pays and gets no access (the webhook grants on subscription metadata.userId). The
  // win-back link always carries ?email=, so a real user resolves above; if not, ask
  // them to sign in rather than orphaning a paid subscription.
  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in with the email your offer was sent to, then reopen the discount link.", code: "identify_required" },
      { status: 401 }
    )
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: "https://itgrows.ai/welcome?subscribed=1&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://itgrows.ai/",
    ...(email ? { customer_email: email } : {}),
    client_reference_id: userId,
    allow_promotion_codes: false,
    // Win-back: no second trial — the discounted price charges immediately so the
    // offer converts to a paying subscription right away. userId is guaranteed here,
    // so the subscription is always attributable for the webhook to grant access.
    metadata: { userId },
    subscription_data: {
      metadata: { userId, plan: "personal_annual_discount" },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
