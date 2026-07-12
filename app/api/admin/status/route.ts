import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import Stripe from "stripe"

const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const O1 = "kiryl@itgrows.ai", O2 = "kiryl.sidarchuk@gmail.com", O3 = "futurecodefounder@gmail.com"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const days = Math.min(Number(req.nextUrl.searchParams.get("days") || 3), 14)
  try {
    const regsByDay = rows(await db.execute(sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS regs
      FROM users WHERE created_at > now() - interval '1 day' * ${days}
        AND lower(email) NOT IN (${O1}, ${O2}, ${O3})
      GROUP BY 1 ORDER BY 1 DESC`))

    const recentUsers = rows(await db.execute(sql`
      SELECT email, name, to_char(created_at,'MM-DD HH24:MI') AS at, subscription_status, onboarding_completed,
             (SELECT count(*)::int FROM linkedin_accounts la WHERE la.user_id = u.id) AS li,
             (SELECT count(*)::int FROM linkedin_posts lp WHERE lp.user_id = u.id::text) AS posts
      FROM users u WHERE created_at > now() - interval '1 day' * ${days}
        AND lower(email) NOT IN (${O1}, ${O2}, ${O3})
      ORDER BY created_at DESC LIMIT 20`))

    const subs = rows(await db.execute(sql`
      SELECT email, subscription_status, subscription_plan,
             to_char(trial_ends_at,'MM-DD') AS trial_ends, to_char(cancel_at,'MM-DD') AS cancels, stripe_customer_id
      FROM users WHERE (subscription_status IN ('active','trialing','past_due') OR cancel_at IS NOT NULL)
        AND lower(email) NOT IN (${O1}, ${O2}, ${O3})
      ORDER BY subscription_end_date DESC NULLS LAST LIMIT 20`))

    // ad source for each sub (gclid in Stripe metadata)
    if (process.env.STRIPE_SECRET_KEY) {
      const s = new Stripe(process.env.STRIPE_SECRET_KEY)
      for (const su of subs) {
        const cust = su.stripe_customer_id as string | null
        su.source = null
        delete su.stripe_customer_id
        if (cust) {
          try {
            const list = await s.subscriptions.list({ customer: cust, status: "all", limit: 3 })
            su.source = list.data.some((x) => x.metadata?.gclid) ? "google_ads" : (list.data.length ? "organic" : "no_sub")
          } catch {}
        }
      }
    }

    const activity = rows(await db.execute(sql`
      SELECT to_char(date_trunc('day', created_at),'YYYY-MM-DD') AS day, event, count(*)::int AS n
      FROM analytics_events WHERE created_at > now() - interval '1 day' * ${days}
      GROUP BY 1,2 ORDER BY 1 DESC, n DESC`))

    return NextResponse.json({ now_utc: new Date().toISOString(), regs_by_day: regsByDay, recent_users: recentUsers, subscriptions_and_cancels: subs, analytics_by_day: activity })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
