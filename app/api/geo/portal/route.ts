import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { GEO_PLAN, stripeClient } from "@/lib/geo-business"
import { isGeoClient } from "@/lib/geo-role"

// "Manage subscription" in the AI-visibility cabinet: a Stripe Billing Portal session on the GEO
// plan's own portal configuration (not the LinkedIn/X one in app/api/stripe/portal): cancel at the
// end of the paid period, change the payment method, see invoices; no switching plans. It comes back
// to /business/dashboard/plan. The configuration is found by its metadata (product = geo_business)
// and created on first use.
//
// Only for a user who pays the plan for a followed site, or a client we set up by hand
// (geo_clients), and who has a Stripe customer: no customer is created here. Answers { url } or
// { error }.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const RETURN_URL = "https://www.itgrows.ai/business/dashboard/plan"

let configId: string | null = null

/** The GEO portal configuration: the active one marked product = geo_business, else a new one. */
async function geoPortalConfiguration(stripe: Stripe): Promise<string> {
  if (configId) return configId
  for await (const c of stripe.billingPortal.configurations.list({ active: true, limit: 100 })) {
    if (c.metadata?.product === GEO_PLAN) return (configId = c.id)
  }
  const created = await stripe.billingPortal.configurations.create({
    name: "ItGrows for Business — AI visibility",
    business_profile: { headline: "ItGrows for Business — AI visibility" },
    default_return_url: RETURN_URL,
    features: {
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_update: { enabled: false },
      customer_update: { enabled: false },
    },
    metadata: { product: GEO_PLAN },
  })
  return (configId = created.id)
}

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const [paid] = rows(
    await db.execute(sql`SELECT 1 FROM geo_follows WHERE user_id = ${userId} AND plan = 'paid' LIMIT 1`)
  )
  if (!paid && !(await isGeoClient(userId))) return NextResponse.json({ error: "no_plan" }, { status: 403 })

  const [user] = await db.select({ customer: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.customer) return NextResponse.json({ error: "no_billing" }, { status: 404 })

  try {
    const stripe = stripeClient()
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.customer,
      configuration: await geoPortalConfiguration(stripe),
      return_url: RETURN_URL,
    })
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error("[geo-portal]", (err as Error).message)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
}
