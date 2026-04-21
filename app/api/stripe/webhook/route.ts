import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
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
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const endTs = (subscription as unknown as { current_period_end?: number }).current_period_end
            ?? subscription.items?.data?.[0]?.current_period_end
          await db
            .update(users)
            .set({
              subscriptionStatus: "active",
              subscriptionPlan: plan ?? null,
              subscriptionEndDate: endTs ? new Date(endTs * 1000) : null,
            })
            .where(eq(users.id, userId))
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        )

        if (customer.deleted) break

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(
            eq(users.stripeCustomerId, subscription.customer as string)
          )

        if (!user) break

        const isActive = ["active", "trialing"].includes(subscription.status)
        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId === process.env.STRIPE_PRICE_PERSONAL_ANNUAL ? "personal_annual" : "personal"

        const endTs2 = (subscription as unknown as { current_period_end?: number }).current_period_end
          ?? subscription.items?.data?.[0]?.current_period_end
        await db
          .update(users)
          .set({
            subscriptionStatus: isActive ? "active" : subscription.status,
            subscriptionPlan: isActive ? plan : null,
            subscriptionEndDate: endTs2 ? new Date(endTs2 * 1000) : null,
          })
          .where(eq(users.id, user.id))
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(
            eq(users.stripeCustomerId, subscription.customer as string)
          )

        if (!user) break

        await db
          .update(users)
          .set({
            subscriptionStatus: "inactive",
            subscriptionPlan: null,
            subscriptionEndDate: null,
          })
          .where(eq(users.id, user.id))
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))

        if (!user) break

        await db
          .update(users)
          .set({ subscriptionStatus: "past_due" })
          .where(eq(users.id, user.id))
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
