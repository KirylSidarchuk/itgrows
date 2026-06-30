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

// Stripe Customer Portal — lets the user change plan (with proration), update their card,
// view invoices, and cancel. Portal configuration is created once in Stripe.
const PORTAL_CONFIG = process.env.STRIPE_PORTAL_CONFIG_ID ?? "bpc_1To2Z12Ve258Uiqtzw0VP7l8"

export async function POST() {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet — start a plan or trial first." },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://itgrows.ai"
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    configuration: PORTAL_CONFIG,
    return_url: `${baseUrl}/cabinet?tab=account`,
  })

  return NextResponse.json({ url: portal.url })
}
