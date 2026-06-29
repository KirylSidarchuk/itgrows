import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, users } from "@/lib/db/schema"
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

  // Verify the organization belongs to the user
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

  if (org.isActive) {
    return NextResponse.json({ error: "Organization already active" }, { status: 400 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_COMPANY_PAGE_MONTHLY ?? "price_1TmAQN2Ve258Uiqt3Vy29MO8"

  // Get or create Stripe customer
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId, subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // All-in includes 1 LinkedIn Company Page for free. If the user is on All-in and has no
  // currently-active company page, activate this one WITHOUT the $99/mo subscription.
  const planActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing" || user.subscriptionStatus === "past_due"
  const isAllIn = planActive && (user.subscriptionPlan === "allin" || user.subscriptionPlan === "allin_annual")
  if (isAllIn) {
    const activePages = await db
      .select({ id: linkedinAccounts.id })
      .from(linkedinAccounts)
      .where(and(
        eq(linkedinAccounts.userId, session.user.id),
        eq(linkedinAccounts.pageType, "organization"),
        eq(linkedinAccounts.isActive, true),
      ))
    if (activePages.length === 0) {
      await db
        .update(linkedinAccounts)
        .set({ isActive: true, subscriptionStatus: "included" })
        .where(eq(linkedinAccounts.id, organizationId))
      const base = process.env.NEXTAUTH_URL ?? "https://itgrows.ai"
      return NextResponse.json({ url: `${base}/cabinet?tab=companies&org_activated=${organizationId}`, included: true })
    }
  }

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id))
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://itgrows.ai"

  // Create Stripe Checkout session for company page subscription
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${baseUrl}/cabinet?tab=companies&org_activated=${organizationId}`,
    cancel_url: `${baseUrl}/cabinet?tab=companies`,
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: "company_page",
        organizationId,
        orgName: org.pageName ?? "",
      },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
