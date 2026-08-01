import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP: eamcguire past_due->trialing-duo detail + any real payment this week. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const out: Record<string, unknown> = {}
  try {
    for (const email of ["eamcguire67.em@gmail.com", "eamcguire.em@gmail.com"]) {
      const custs = await s.customers.list({ email, limit: 3 })
      const rows: unknown[] = []
      for (const c of custs.data) {
        const subs = await s.subscriptions.list({ customer: c.id, status: "all", limit: 6 })
        for (const x of subs.data) {
          rows.push({
            status: x.status,
            plan: x.metadata?.plan,
            price: x.items.data[0]?.price.id,
            amount: x.items.data[0]?.price.unit_amount,
            trial_end: x.trial_end ? new Date(x.trial_end * 1000).toISOString().slice(0, 10) : null,
            created: new Date(x.created * 1000).toISOString().slice(0, 10),
            cancel_at_period_end: x.cancel_at_period_end,
          })
        }
      }
      out[email] = { customers: custs.data.length, subs: rows }
    }
    // any real payment (invoice.paid amount>0) in last 10 days
    const since = Math.floor(Date.now() / 1000) - 10 * 86400
    const invs = await s.invoices.list({ limit: 30, created: { gte: since } })
    out.recent_paid = invs.data.filter((i) => (i.amount_paid ?? 0) > 0).map((i) => ({
      email: i.customer_email, amount: i.amount_paid, date: new Date((i.created) * 1000).toISOString().slice(0, 10),
    }))
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
