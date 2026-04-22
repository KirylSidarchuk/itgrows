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

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
  }

  const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true,
  })

  return NextResponse.json({
    success: true,
    message: "Subscription will be cancelled at period end",
    cancelAt: updated.cancel_at,
  })
}
