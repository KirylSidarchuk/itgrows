import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { organizationId?: string }
  const { organizationId } = body

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
  }

  const [org] = await db
    .select()
    .from(linkedinAccounts)
    .where(
      and(
        eq(linkedinAccounts.id, organizationId),
        eq(linkedinAccounts.userId, session.user.id),
        eq(linkedinAccounts.pageType, "organization")
      )
    )
    .limit(1)

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  if (!org.isActive || !org.stripeSubscriptionId) {
    return NextResponse.json({ error: "Organization is not active" }, { status: 400 })
  }

  const stripe = getStripe()

  // Cancel the subscription at period end
  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await db
    .update(linkedinAccounts)
    .set({ subscriptionStatus: "canceling" })
    .where(eq(linkedinAccounts.id, organizationId))

  return NextResponse.json({ success: true, message: "Subscription will be cancelled at end of billing period" })
}
