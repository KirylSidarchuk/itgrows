import { NextResponse } from "next/server"
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

  // Include trialing / past_due so a user can cancel during their free trial (no charge).
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  })

  const cancelable = subscriptions.data.find((s) =>
    ["active", "trialing", "past_due"].includes(s.status)
  )
  if (!cancelable) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
  }

  const updated = await stripe.subscriptions.update(cancelable.id, {
    cancel_at_period_end: true,
  })

  const cancelAtDate = updated.cancel_at ? new Date(updated.cancel_at * 1000) : null

  await db
    .update(users)
    .set({
      cancelAtPeriodEnd: true,
      cancelAt: cancelAtDate,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({
    success: true,
    message: "Subscription will be cancelled at period end",
    cancelAt: updated.cancel_at,
  })
}
