import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP diagnostic: trace a subscriber's ad source (gclid) from Stripe metadata.
// Token-gated, server-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: "no stripe key in env" }, { status: 500 })
  const stripe = new Stripe(key)
  try {
    const customers = await stripe.customers.list({ email, limit: 5 })
    const out: unknown[] = []
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 5 })
      out.push({
        customer: c.id,
        customer_created: new Date(c.created * 1000).toISOString(),
        subs: subs.data.map((s) => ({
          id: s.id,
          status: s.status,
          created: new Date(s.created * 1000).toISOString(),
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
          plan: s.metadata?.plan ?? null,
          gclid: s.metadata?.gclid ?? null,
          metadata: s.metadata,
        })),
      })
    }
    return NextResponse.json({ email, count: customers.data.length, customers: out })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
