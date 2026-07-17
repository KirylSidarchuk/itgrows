import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: full state of Som's trial + whether it maps to a live cabinet account. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "somsyd@outlook.com"
const META_UID = "4d1e94ad-7c02-4a6a-af46-58f87e02f0bf"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const out: Row = {}
  try {
    // Stripe side
    const custs = await s.customers.list({ email: EMAIL, limit: 3 })
    out.stripe_customers = custs.data.length
    const subsAll: Row[] = []
    for (const c of custs.data) {
      const subs = await s.subscriptions.list({ customer: c.id, status: "all", limit: 5 })
      for (const x of subs.data) {
        subsAll.push({
          status: x.status,
          cancel_at_period_end: x.cancel_at_period_end,
          trial_end: x.trial_end ? new Date(x.trial_end * 1000).toISOString().slice(0, 16) : null,
          current_period_end: (x as unknown as { current_period_end?: number }).current_period_end
            ? new Date((x as unknown as { current_period_end: number }).current_period_end * 1000).toISOString().slice(0, 16) : null,
          plan: x.metadata?.plan,
          userId: x.metadata?.userId,
        })
      }
    }
    out.stripe_subs = subsAll

    // DB side — does the account behind this trial actually exist & is anything set up?
    out.user_by_email = rows(await db.execute(sql`
      SELECT to_char(created_at,'YYYY-MM-DD') AS joined, subscription_status, subscription_plan, onboarding_completed
      FROM users WHERE lower(email) = ${EMAIL}`))
    out.user_by_meta_id = rows(await db.execute(sql`
      SELECT email, to_char(created_at,'YYYY-MM-DD') AS joined, subscription_status
      FROM users WHERE id = ${META_UID}::uuid`))
    // any product footprint under either identity
    out.linkedin_by_meta = rows(await db.execute(sql`SELECT count(*)::int AS n FROM linkedin_accounts WHERE user_id = ${META_UID}`))[0]
    out.posts_by_meta = rows(await db.execute(sql`SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id = ${META_UID} GROUP BY status`))
    out.brief_by_meta = rows(await db.execute(sql`SELECT count(*)::int AS n FROM linkedin_briefs WHERE user_id = ${META_UID}`))[0]
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, partial: out }, { status: 500 })
  }
}
