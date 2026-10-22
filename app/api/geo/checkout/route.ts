import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { GEO_PLAN, geoBusinessPriceId, stripeClient } from "@/lib/geo-business"

// Start the $499/month AI-visibility plan for one of the user's followed sites. Stripe Checkout,
// no trial; the webhook turns the follow into plan = 'paid'.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { domain } = (await req.json().catch(() => ({}))) as { domain?: string }
  const site = String(domain ?? "").trim().toLowerCase()
  if (!site) return NextResponse.json({ error: "domain_required" }, { status: 400 })

  const [follow] = rows(
    await db.execute(sql`SELECT f.plan FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                         WHERE f.user_id = ${userId} AND s.domain = ${site}`)
  )
  if (!follow) return NextResponse.json({ error: "not_followed" }, { status: 404 })
  if (follow.plan === "paid") return NextResponse.json({ error: "already_paid" }, { status: 409 })

  const stripe = stripeClient()
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined, metadata: { userId } })
    customerId = customer.id
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId))
  }

  const base = "https://www.itgrows.ai"
  const back = `${base}/business/dashboard/plan?site=${encodeURIComponent(site)}`
  const meta = { userId, plan: GEO_PLAN, domain: site }
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: await geoBusinessPriceId(stripe), quantity: 1 }],
    success_url: `${back}&paid=1`,
    cancel_url: back,
    allow_promotion_codes: true,
    metadata: meta,
    subscription_data: { metadata: meta, description: `AI visibility for ${site}` },
  })

  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_checkout_started', '/business/dashboard/plan', ${JSON.stringify({ domain: site, session: checkout.id })}::jsonb)`)
    .catch(() => {})
  return NextResponse.json({ url: checkout.url })
}
