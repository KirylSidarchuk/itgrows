import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import Stripe from "stripe"

// What actually happens when a trial ends is decided by Stripe, not by our tables: whether a card
// is on file, and what end_behavior we asked for. Read it from the source rather than infer it.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const email = p.get("email")

  try {
    const users = rows(await db.execute(sql`
      SELECT email, name, subscription_status, subscription_plan, stripe_customer_id,
             to_char(trial_ends_at, 'YYYY-MM-DD HH24:MI') AS trial_ends_at
      FROM users
      WHERE stripe_customer_id IS NOT NULL
        AND (${email}::text IS NULL OR lower(email) = lower(${email}))
        AND (${email}::text IS NOT NULL OR subscription_status IN ('active', 'trialing'))`))

    const s = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const out = []
    for (const u of users) {
      const row: Row = {
        email: u.email, name: u.name, plan: u.subscription_plan,
        status_in_db: u.subscription_status, trial_ends_at: u.trial_ends_at,
      }
      try {
        const subs = await s.subscriptions.list({
          customer: u.stripe_customer_id as string, status: "all", limit: 5,
          expand: ["data.default_payment_method"],
        })
        const sub = subs.data.find((x) => x.status === "trialing" || x.status === "active") ?? subs.data[0]
        if (!sub) { row.stripe = "no subscription"; out.push(row); continue }

        const methods = await s.paymentMethods.list({ customer: u.stripe_customer_id as string, limit: 5 })
        const cust = await s.customers.retrieve(u.stripe_customer_id as string) as Stripe.Customer
        const hasCard = methods.data.length > 0
          || !!sub.default_payment_method
          || !!cust.invoice_settings?.default_payment_method

        row.stripe_status = sub.status
        row.trial_end_utc = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString().slice(0, 16).replace("T", " ") : null
        row.card_on_file = hasCard
        row.card_brand_last4 = methods.data[0] ? `${methods.data[0].card?.brand} ****${methods.data[0].card?.last4}` : null
        row.missing_payment_method_behaviour = sub.trial_settings?.end_behavior?.missing_payment_method ?? "(default: create_invoice)"
        row.cancel_at_period_end = sub.cancel_at_period_end
        // The bottom line the owner actually needs. A cancelled subscription -- or one already set
        // to stop at period end -- never reaches the charge, so say so instead of reporting the
        // happy path for a customer who is on their way out.
        row.what_happens_at_trial_end =
          sub.status === "canceled" ? "already cancelled -- no further charge"
          : sub.cancel_at_period_end ? "set to cancel at period end -- no further charge"
          : hasCard ? "charges the card and becomes a paying subscription"
          : sub.trial_settings?.end_behavior?.missing_payment_method === "cancel"
              ? "cancels automatically -- no charge, access switches off"
              : "no card on file; Stripe will not be able to charge"
      } catch (e) {
        row.stripe_error = (e as Error).message
      }
      out.push(row)
    }
    return NextResponse.json({ checked_at_utc: new Date().toISOString().slice(0, 16).replace("T", " "), customers: out })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
