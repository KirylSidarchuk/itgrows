import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP: cancel eamcguire's stranded past_due Personal + report Duo-trial card vs Personal card.
// Owner-approved 2026-08-01. Requires ?confirm=yes to actually cancel. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"

async function cardOf(s: Stripe, sub: Stripe.Subscription, cust: Stripe.Customer): Promise<string> {
  let pmId = (sub.default_payment_method as string | null) ??
    (cust.invoice_settings?.default_payment_method as string | null) ?? null
  if (!pmId) return "none-on-file"
  try {
    const pm = await s.paymentMethods.retrieve(pmId)
    const c = pm.card
    return c ? `${c.brand} •••• ${c.last4} exp ${c.exp_month}/${c.exp_year}` : "non-card"
  } catch { return "unretrievable" }
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const out: Record<string, unknown> = {}
  try {
    const custs = await s.customers.list({ email: EMAIL, limit: 3 })
    const cust = custs.data[0]
    if (!cust) return NextResponse.json({ error: "no customer" }, { status: 404 })
    const subs = await s.subscriptions.list({ customer: cust.id, status: "all", limit: 8 })
    const personal = subs.data.find((x) => x.status === "past_due" && x.items.data[0]?.price.unit_amount === 4900)
    const duo = subs.data.find((x) => x.status === "trialing" && x.items.data[0]?.price.unit_amount === 9900)

    out.personal_card = personal ? await cardOf(s, personal, cust) : "no-past_due-personal"
    out.duo_trial_card = duo ? await cardOf(s, duo, cust) : "no-duo-trial"
    out.same_card = out.personal_card !== "none-on-file" && out.personal_card === out.duo_trial_card
    out.duo_trial_end = duo?.trial_end ? new Date(duo.trial_end * 1000).toISOString().slice(0, 10) : null

    if (personal) {
      out.personal_sub_id = personal.id
      out.personal_status_before = personal.status
      if (p.get("confirm") === "yes") {
        const cancelled = await s.subscriptions.cancel(personal.id)
        out.personal_status_after = cancelled.status
        out.cancelled = true
      } else {
        out.cancelled = false
        out.note = "add &confirm=yes to cancel the past_due Personal"
      }
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
