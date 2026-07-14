import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: verify Som's trialing subscription is linked to a cabinet user. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const subs = await s.subscriptions.list({ status: "trialing", limit: 10 })
  const out = []
  for (const x of subs.data) {
    const cust = typeof x.customer === "string" ? await s.customers.retrieve(x.customer) : x.customer
    const custEmail = (cust as Stripe.Customer).email
    const userId = x.metadata?.userId
    let dbUser: Row | null = null
    if (userId) {
      dbUser = rows(await db.execute(sql`SELECT email, subscription_status, subscription_plan, onboarding_completed,
        EXISTS(SELECT 1 FROM linkedin_accounts la WHERE la.user_id = users.id::text) AS has_linkedin,
        (SELECT count(*)::int FROM linkedin_posts lp WHERE lp.user_id = users.id::text) AS posts
        FROM users WHERE id = ${userId}::uuid`))[0] ?? null
    }
    out.push({
      sub_id: x.id,
      trial_end: new Date((x.trial_end ?? 0) * 1000).toISOString().slice(0, 10),
      cancel_at_period_end: x.cancel_at_period_end,
      customer_email: custEmail,
      metadata: x.metadata,
      db_user: dbUser,
    })
  }
  return NextResponse.json({ trialing: out })
}
