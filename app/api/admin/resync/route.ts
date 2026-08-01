import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: resync Elizabeth's user row to her active Duo trial + reactivate LinkedIn. Owner-approved 2026-08-01.
// ?confirm=yes writes. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const out: Row = {}
  try {
    const custs = await s.customers.list({ email: EMAIL, limit: 3 })
    const cust = custs.data[0]
    if (!cust) return NextResponse.json({ error: "no customer" }, { status: 404 })
    const subs = await s.subscriptions.list({ customer: cust.id, status: "all", limit: 8 })
    const duo = subs.data.find((x) => x.status === "trialing" && x.items.data[0]?.price.unit_amount === 9900)
    if (!duo) return NextResponse.json({ error: "no active Duo trial" }, { status: 404 })

    const metaUid = duo.metadata?.userId as string | undefined
    const trialEnd = duo.trial_end ? new Date(duo.trial_end * 1000) : null
    out.duo_sub_id = duo.id
    out.duo_metadata_userId = metaUid ?? null
    out.trial_end = trialEnd?.toISOString().slice(0, 10) ?? null

    // resolve which user row: prefer metadata.userId, else the user whose queue has the failing posts
    let target = metaUid ? rows(await db.execute(sql`SELECT id, email, subscription_status, subscription_plan FROM users WHERE id = ${metaUid}::uuid`))[0] : null
    if (!target) target = rows(await db.execute(sql`SELECT id, email, subscription_status, subscription_plan FROM users WHERE lower(email)=${EMAIL}`))[0]
    if (!target) return NextResponse.json({ error: "no user row", ...out }, { status: 404 })
    out.target_user_email = target.email
    out.before = { sub: target.subscription_status, plan: target.subscription_plan }

    const uid = target.id as string
    if (p.get("confirm") === "yes" && trialEnd) {
      await db.execute(sql`
        UPDATE users SET subscription_status='trialing', subscription_plan='duo',
          trial_ends_at=${trialEnd.toISOString()}, subscription_end_date=${trialEnd.toISOString()},
          cancel_at_period_end=false, cancel_at=NULL
        WHERE id=${uid}::uuid`)
      const react = await db.execute(sql`UPDATE linkedin_accounts SET is_active=true WHERE user_id=${uid}`)
      const after = rows(await db.execute(sql`SELECT subscription_status, subscription_plan, to_char(trial_ends_at,'YYYY-MM-DD') AS trial FROM users WHERE id=${uid}::uuid`))[0]
      out.after = after
      out.linkedin_reactivated = (react as unknown as { rowCount?: number }).rowCount ?? "ok"
      out.next_scheduled = rows(await db.execute(sql`SELECT to_char(min(scheduled_for),'YYYY-MM-DD HH24:MI') AS at FROM linkedin_posts WHERE user_id=${uid} AND status='scheduled' AND scheduled_for>now()`))[0]?.at
      out.written = true
    } else {
      out.written = false
      out.note = "add &confirm=yes to write"
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
