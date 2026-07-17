import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { users, linkedinAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { subscriptionActivatedEmail, paymentFailedEmail, subscriptionCancelledEmail } from "@/lib/email-templates"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

// This Stripe account also powers other products (e.g. magiscan) whose events reach this
// same webhook. Map a price id to our plan, or null if it isn't one of ItGrows' prices,
// so we only alert on OUR billing.
function itgrowsPlanFromPrice(priceId?: string): string | null {
  if (!priceId) return null
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_ALLIN_MONTHLY ?? "price_1TVW9h2Ve258UiqtqaTvpEcz"]: "allin",
    [process.env.STRIPE_PRICE_DUO_MONTHLY ?? "price_1TVW9h2Ve258UiqtSRGFgtOS"]: "duo",
    [process.env.STRIPE_PRICE_PERSONAL_MONTHLY ?? "price_1TVW9g2Ve258UiqtC8gMDr6y"]: "personal",
    [process.env.STRIPE_PRICE_PERSONAL_ANNUAL_NEW ?? "price_1TWByX2Ve258Uiqt7bJsbxcl"]: "personal_annual",
    [process.env.STRIPE_PRICE_DUO_ANNUAL ?? "price_1TWByY2Ve258Uiqtc5ewdi5u"]: "duo_annual",
    [process.env.STRIPE_PRICE_ALLIN_ANNUAL ?? "price_1TWBya2Ve258UiqtpFIzdgAL"]: "allin_annual",
    [process.env.STRIPE_PRICE_COMPANY_MONTHLY ?? "price_1TWaK32Ve258UiqtmfxyHfnW"]: "company",
    [process.env.STRIPE_PRICE_COMPANY_ANNUAL ?? "price_1TWaK62Ve258Uiqt3sU7ZFeU"]: "company_annual",
  }
  return map[priceId] ?? null
}
// True if the subscription is one of ours (by price, or by ItGrows-specific metadata.plan).
function itgrowsSubPlan(priceId?: string, metaPlan?: string | null): string | null {
  const byPrice = itgrowsPlanFromPrice(priceId)
  if (byPrice) return byPrice
  if (metaPlan === "company_page" || metaPlan === "company_page_plan") return metaPlan
  return null
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
          const organizationId = subscription.metadata?.organizationId ?? session.metadata?.organizationId

          // Handle LinkedIn Company Page subscription activation
          if (plan === "company_page" && organizationId) {
            await db
              .update(linkedinAccounts)
              .set({
                isActive: true,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
              })
              .where(eq(linkedinAccounts.id, organizationId))

            if (userId) {
              const [orgUser] = await db.select({ email: users.email, name: users.name })
                .from(users).where(eq(users.id, userId)).limit(1)
              const orgName = subscription.metadata?.orgName ?? "Company page"
              fetch("https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: 372194458,
                  text: `💳 Новая подписка Company Page!\n👤 ${orgUser?.name ?? ""} ${orgUser?.email ?? ""}\n📦 Страница: ${orgName}\n💰 $99/мес`,
                }),
              }).catch(() => {})
            }
            break
          }

          // Handle Company Page PLAN subscription (Single/Two/Unlimited). Standalone bundle:
          // the company's LinkedIn Page(s) + X. Grant access (subscriptionStatus/plan) so the user
          // can generate & publish — but NEVER overwrite an existing personal plan (a buyer who has
          // a personal plan AND a company add-on keeps their personal plan).
          if (plan === "company_page_plan" && userId) {
            const isTrialing = subscription.status === "trialing"
            const [existing] = await db
              .select({ subscriptionPlan: users.subscriptionPlan })
              .from(users).where(eq(users.id, userId)).limit(1)
            await db
              .update(users)
              .set({
                companyPagePlan: subscription.metadata?.tier ?? null,
                ...(existing?.subscriptionPlan ? {} : {
                  subscriptionStatus: isTrialing ? "trialing" : "active",
                  subscriptionPlan: "company",
                }),
              })
              .where(eq(users.id, userId))
            break
          }

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

          // Notify owner in Telegram
          fetch("https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: 372194458,
              text: `💳 Новая подписка!\n👤 ${updatedUser?.name ?? ""} ${updatedUser?.email ?? ""}\n📦 План: ${plan ?? "personal"}\n${subscription.metadata?.gclid ? `🎯 из Google Ads (gclid ${subscription.metadata.gclid.slice(0, 16)}…)` : "🌱 органика/не реклама"}`,
            }),
          }).catch(() => {})
          } // end if (userId)
        } // end if (session.subscription)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const amount = (invoice as unknown as { amount_paid?: number }).amount_paid ?? 0
        if (amount > 0) {
          // Real money collected (first charge after the 14-day trial, or a renewal).
          const subId = (invoice as unknown as { subscription?: string }).subscription
          if (!subId) break
          let sub: Stripe.Subscription
          try {
            sub = await stripe.subscriptions.retrieve(subId)
          } catch { break }
          const plan = itgrowsSubPlan(sub.items?.data?.[0]?.price?.id, sub.metadata?.plan)
          if (!plan) break // event for another product on this Stripe account (e.g. magiscan)
          const gclid = sub.metadata?.gclid
          let uEmail: string | undefined
          const uid = sub.metadata?.userId
          if (uid) {
            const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, uid)).limit(1)
            uEmail = u?.email
          }
          console.log("[ads] real payment", { amount, plan, gclid, email: uEmail })
          fetch("https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: 372194458,
              text: `\ud83d\udcb0 \u0420\u0415\u0410\u041b\u042c\u041d\u0410\u042f \u041e\u041f\u041b\u0410\u0422\u0410 $${(amount / 100).toFixed(2)}\n\ud83d\udc64 ${uEmail ?? ""}\n\ud83d\udce6 ${plan ?? ""}\n\ud83c\udfaf gclid: ${gclid ?? "\u2014"}`,
            }),
          }).catch(() => {})
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        // Handle LinkedIn Company Page subscription update
        if (subscription.metadata?.plan === "company_page" && subscription.metadata?.organizationId) {
          await db
            .update(linkedinAccounts)
            .set({ subscriptionStatus: subscription.status })
            .where(eq(linkedinAccounts.id, subscription.metadata.organizationId))
          break
        }

        // Handle Company Page PLAN subscription update — keep quota + access in sync
        if (subscription.metadata?.plan === "company_page_plan") {
          const uid = subscription.metadata?.userId
          if (uid) {
            const accessible = ["active", "trialing"].includes(subscription.status)
            const [existing] = await db
              .select({ subscriptionPlan: users.subscriptionPlan })
              .from(users).where(eq(users.id, uid)).limit(1)
            // Only manage subscriptionStatus/plan for company-primary users (plan "company" or
            // none) — never disturb someone whose primary plan is a personal one.
            const companyPrimary = !existing?.subscriptionPlan || existing.subscriptionPlan === "company"
            await db
              .update(users)
              .set({
                companyPagePlan: accessible ? (subscription.metadata?.tier ?? null) : null,
                ...(companyPrimary ? {
                  subscriptionStatus: subscription.status === "trialing" ? "trialing" : (accessible ? "active" : "inactive"),
                  subscriptionPlan: accessible ? "company" : null,
                } : {}),
              })
              .where(eq(users.id, uid))
          }
          break
        }

        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        )

        if (customer.deleted) break

        // Cancel alert — fire on the Stripe event itself, BEFORE the local user lookup, so a
        // trial that was cancelled AND the account deleted (their users row is gone -> the sync
        // below `break`s) still notifies. Gated to ItGrows-priced subs so magiscan is ignored.
        {
          const prevAttrs = (event.data as unknown as { previous_attributes?: { cancel_at_period_end?: boolean } }).previous_attributes
          const updPlan = itgrowsSubPlan(subscription.items?.data?.[0]?.price?.id, subscription.metadata?.plan)
          if (updPlan && subscription.cancel_at_period_end === true && prevAttrs?.cancel_at_period_end === false) {
            const isTrial = subscription.status === "trialing"
            const endsAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString().slice(0, 10) : "\u2014"
            const gclid = subscription.metadata?.gclid
            const [maybeUser] = await db
              .select({ name: users.name, email: users.email })
              .from(users).where(eq(users.stripeCustomerId, subscription.customer as string)).limit(1)
            const who = maybeUser?.email ?? (customer as Stripe.Customer).email ?? "(\u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0443\u0434\u0430\u043b\u0451\u043d)"
            const nm = maybeUser?.name ?? ""
            fetch("https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: 372194458,
                text: `${isTrial ? "\u274c \u041e\u0442\u043c\u0435\u043d\u0430 \u0422\u0420\u0418\u0410\u041b\u0410 (\u0434\u043e \u043e\u043f\u043b\u0430\u0442\u044b)" : "\u274c \u041e\u0442\u043c\u0435\u043d\u0430 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0438"}\n\ud83d\udc64 ${nm} ${who}\n\ud83d\udce6 ${updPlan}\n\ud83d\udcc5 \u0434\u043e ${endsAt}${gclid ? `\n\ud83c\udfaf gclid: ${gclid}` : ""}`,
              }),
            }).catch(() => {})
          }
        }

        const [user] = await db
          .select({ id: users.id, email: users.email, name: users.name })
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

        // Handle LinkedIn Company Page subscription deletion
        if (subscription.metadata?.plan === "company_page" && subscription.metadata?.organizationId) {
          await db
            .update(linkedinAccounts)
            .set({ isActive: false, subscriptionStatus: "inactive", stripeSubscriptionId: null })
            .where(eq(linkedinAccounts.id, subscription.metadata.organizationId))
          break
        }

        // Handle Company Page PLAN subscription deletion — clear quota + access (company-primary only)
        if (subscription.metadata?.plan === "company_page_plan") {
          const uid = subscription.metadata?.userId
          if (uid) {
            const [existing] = await db
              .select({ subscriptionPlan: users.subscriptionPlan })
              .from(users).where(eq(users.id, uid)).limit(1)
            const companyPrimary = !existing?.subscriptionPlan || existing.subscriptionPlan === "company"
            await db.update(users).set({
              companyPagePlan: null,
              ...(companyPrimary ? { subscriptionStatus: "inactive", subscriptionPlan: null } : {}),
            }).where(eq(users.id, uid))
          }
          break
        }

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
