import { NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { pickMainSubscription } from "@/lib/stripe-plans"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

export async function POST() {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [user] = await db
    .select({
      id: users.id,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 })
  }

  // Include trialing / past_due so a user can un-cancel during their free trial too
  // (mirrors cancel-subscription, which allows the same statuses).
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  })

  // Target the MAIN (personal) subscription, not a company-pages add-on sub on the same customer.
  const renewable = pickMainSubscription(subscriptions.data)
  if (!renewable) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
  }

  await stripe.subscriptions.update(renewable.id, {
    cancel_at_period_end: false,
  })

  await db
    .update(users)
    .set({
      cancelAtPeriodEnd: false,
      cancelAt: null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true })
}
