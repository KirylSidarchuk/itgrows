import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import Stripe from "stripe"

// TEMP: extend the trial as goodwill after the reconnect incident. Owner-approved, one customer,
// read-only until ?confirm=yes. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"
const EXTRA_DAYS = 14
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`
      SELECT id, stripe_customer_id FROM users WHERE lower(email) = ${EMAIL}`))[0]
    if (!u?.stripe_customer_id) return NextResponse.json({ error: "no stripe customer" })

    const s = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const subs = await s.subscriptions.list({ customer: u.stripe_customer_id as string, status: "all", limit: 5 })
    const sub = subs.data.find((x) => x.status === "trialing")
    if (!sub) return NextResponse.json({ error: "no trialing subscription", statuses: subs.data.map((x) => x.status) })

    const current = sub.trial_end!
    const next = current + EXTRA_DAYS * 24 * 60 * 60
    const iso = (t: number) => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ")

    const out: Row = {
      subscription: sub.id,
      trial_end_now: iso(current),
      trial_end_after: iso(next),
      extra_days: EXTRA_DAYS,
    }

    if (p.get("confirm") === "yes") {
      const updated = await s.subscriptions.update(sub.id, {
        trial_end: next,
        proration_behavior: "none",
      })
      out.applied = true
      out.stripe_status_after = updated.status
      out.stripe_trial_end_after = iso(updated.trial_end!)
      // Keep our own column in step rather than waiting on the webhook.
      await db.execute(sql`
        UPDATE users SET trial_ends_at = to_timestamp(${next}) WHERE id = ${u.id}::uuid`)
      out.db_trial_ends_at = rows(await db.execute(sql`
        SELECT to_char(trial_ends_at,'YYYY-MM-DD HH24:MI') AS at FROM users WHERE id = ${u.id}::uuid`))[0]
    } else {
      out.note = "add &confirm=yes to apply"
    }
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
