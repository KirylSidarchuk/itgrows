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
      SELECT u.email, u.name, to_char(u.created_at,'MM-DD HH24:MI') AS at, u.subscription_status, u.onboarding_completed,
             to_char(u.onboarding_email_sent_at,'MM-DD HH24:MI') AS onboarding_email_at,
             u.linkedin_reminder_sent,
             EXISTS(SELECT 1 FROM linkedin_accounts la WHERE la.user_id = u.id::text) AS has_linkedin
      FROM users u WHERE u.created_at > now() - interval '1 day' * ${days}
        AND lower(u.email) NOT IN (${O1}, ${O2}, ${O3})
      ORDER BY u.created_at DESC LIMIT 20`))

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

    let nudges: Row[] = []
    try { nudges = rows(await db.execute(sql`
      SELECT to_char(ue.created_at,'MM-DD HH24:MI') AS at, u.email
      FROM usage_events ue LEFT JOIN users u ON u.id = ue.user_id
      WHERE ue.action = 'posts_ready_nudge'
      ORDER BY ue.created_at DESC LIMIT 20`)) } catch {}
    // DIAG: have the connect-nudge crons ever worked? + reproduce the join
    const diag: Row = {}
    try {
      diag.users_ever_onboarding_emailed = (rows(await db.execute(sql`SELECT count(*)::int AS n FROM users WHERE onboarding_email_sent_at IS NOT NULL`))[0] || {}).n
      diag.users_ever_linkedin_reminded = (rows(await db.execute(sql`SELECT count(*)::int AS n FROM users WHERE linkedin_reminder_sent = true`))[0] || {}).n
    } catch (e) { diag.count_err = (e as Error).message }
    try {
      // reproduce drizzle eq(linkedinAccounts.userId, users.id) WITHOUT cast
      await db.execute(sql`SELECT 1 FROM users u WHERE NOT EXISTS (SELECT 1 FROM linkedin_accounts la WHERE la.user_id = u.id) LIMIT 1`)
      diag.uncast_join = "ok"
    } catch (e) { diag.uncast_join = "ERROR: " + (e as Error).message }

    return NextResponse.json({ now_utc: new Date().toISOString(), regs_by_day: regsByDay, recent_users: recentUsers, subscriptions_and_cancels: subs, analytics_by_day: activity, nudges_sent: nudges, diag })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
