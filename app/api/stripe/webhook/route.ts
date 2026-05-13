import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { subscriptionActivatedEmail, paymentFailedEmail, subscriptionCancelledEmail } from "@/lib/email-templates"

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

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const userId = subscription.metadata?.userId ?? session.metadata?.userId
          const plan = subscription.metadata?.plan ?? session.metadata?.plan

          if (userId) {
          const isTrialing = subscription.status === "trialing"
          const endTs = (subscription as unknown as { current_period_end?: number }).current_period_end
            ?? subscription.items?.data?.[0]?.current_period_end
          await db
            .update(users)
            .set({
              subscriptionStatus: isTrialing ? "trialing" : "active",
              subscriptionPlan: plan ?? null,
              subscriptionEndDate: endTs ? new Date(endTs * 1000) : null,
            })
            .where(eq(users.id, userId))

          const [updatedUser] = await db.select({ email: users.email, name: users.name })
            .from(users).where(eq(users.id, userId)).limit(1)
          if (updatedUser?.email) {
            await sendEmail({
              to: updatedUser.email,
              subject: "Welcome to ItGrows Personal 🎉 Your LinkedIn is on autopilot",
              html: subscriptionActivatedEmail(updatedUser.name ?? "there", plan ?? "personal"),
            })
          }
          } // end if (userId)
        } // end if (session.subscription)
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

        const isAccessible = ["active", "trialing"].includes(subscription.status)
        const priceId = subscription.items.data[0]?.price.id
        const plan = (() => {
          const allinId = process.env.STRIPE_PRICE_ALLIN_MONTHLY ?? "price_1TVW9h2Ve258UiqtqaTvpEcz"
          const duoId = process.env.STRIPE_PRICE_DUO_MONTHLY ?? "price_1TVW9h2Ve258UiqtSRGFgtOS"
          const personalId = process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y"
          const personalAnnualId = process.env.STRIPE_PRICE_PERSONAL_ANNUAL_NEW ?? "price_1TWByX2Ve258Uiqt7bJsbxcl"
          const duoAnnualId = process.env.STRIPE_PRICE_DUO_ANNUAL ?? "price_1TWByY2Ve258Uiqtc5ewdi5u"
          const allinAnnualId = process.env.STRIPE_PRICE_ALLIN_ANNUAL ?? "price_1TWBya2Ve258UiqtpFIzdgAL"
          const companyId = process.env.STRIPE_PRICE_COMPANY_MONTHLY ?? "price_1TWaK32Ve258UiqtmfxyHfnW"
          const companyAnnualId = process.env.STRIPE_PRICE_COMPANY_ANNUAL ?? "price_1TWaK62Ve258Uiqt3sU7ZFeU"
          if (priceId === allinId) return "allin"
          if (priceId === duoId) return "duo"
          if (priceId === personalId) return "personal"
          if (priceId === personalAnnualId) return "personal_annual"
          if (priceId === duoAnnualId) return "duo_annual"
          if (priceId === allinAnnualId) return "allin_annual"
          if (priceId === companyId) return "company"
          if (priceId === companyAnnualId) return "company_annual"
          // Legacy fallbacks for existing subscribers
          if (priceId === process.env.STRIPE_PRICE_PERSONAL_ANNUAL) return "personal_annual"
          return subscription.metadata?.plan ?? "personal"
        })()

        const endTs2 = (subscription as unknown as { current_period_end?: number }).current_period_end
          ?? subscription.items?.data?.[0]?.current_period_end
        const cancelAt2 = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
        await db
          .update(users)
          .set({
            subscriptionStatus: subscription.status,
            subscriptionPlan: isAccessible ? plan : null,
            subscriptionEndDate: endTs2 ? new Date(endTs2 * 1000) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            cancelAt: cancelAt2,
          })
          .where(eq(users.id, user.id))
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const [user] = await db
          .select({ id: users.id, email: users.email, name: users.name })
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
            cancelAtPeriodEnd: false,
            cancelAt: null,
          })
          .where(eq(users.id, user.id))

        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: "Your ItGrows.ai subscription has ended",
            html: subscriptionCancelledEmail(user.name ?? "there"),
          })
        }
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

        const [failedUser] = await db.select({ email: users.email, name: users.name })
          .from(users).where(eq(users.stripeCustomerId, customerId)).limit(1)
        if (failedUser?.email) {
          await sendEmail({
            to: failedUser.email,
            subject: "Action required: Payment failed for ItGrows Personal",
            html: paymentFailedEmail(failedUser.name ?? "there"),
          })
        }
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
