import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP ops peek: checkout sessions + customers for an email. Token-gated, read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const email = (p.get("email") || "").toLowerCase()
  if (!email || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "bad request" }, { status: 400 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    const customers = await s.customers.list({ email, limit: 5 })
    const sessions = await s.checkout.sessions.list({ limit: 60 })
    const mine = sessions.data
      .filter((x) => (x.customer_details?.email || x.customer_email || "").toLowerCase() === email)
      .map((x) => ({
        created: new Date(x.created * 1000).toISOString().slice(0, 16),
        status: x.status,
        payment_status: x.payment_status,
        mode: x.mode,
        amount_total: x.amount_total,
        plan: x.metadata?.plan,
        url_alive: !!x.url,
      }))
    return NextResponse.json({
      customers: customers.data.map((c) => ({ id: c.id, created: new Date(c.created * 1000).toISOString().slice(0, 16) })),
      checkout_sessions: mine,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
