import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: what actually lives on each of Elizabeth's two accounts. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    for (const email of ["eamcguire67.em@gmail.com", "eamcguire.em@gmail.com"]) {
      const u = rows(await db.execute(sql`
        SELECT id, to_char(created_at,'YYYY-MM-DD HH24:MI') AS created,
               subscription_status AS sub, subscription_plan AS plan, onboarding_completed,
               to_char(trial_ends_at,'YYYY-MM-DD') AS trial_ends
        FROM users WHERE lower(email) = ${email}`))[0]
      if (!u) { out[email] = { exists: false }; continue }
      const uid = u.id as string
      const brief = rows(await db.execute(sql`
        SELECT niche, tone, goals, target_audience, posting_frequency, is_auto_filled
        FROM linkedin_briefs WHERE user_id = ${uid}`))
      const posts = rows(await db.execute(sql`
        SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id = ${uid} GROUP BY status`))
      const li = rows(await db.execute(sql`
        SELECT page_type, page_name, is_active FROM linkedin_accounts WHERE user_id = ${uid}`))
      const events = rows(await db.execute(sql`
        SELECT event, count(*)::int AS n FROM analytics_events WHERE user_id = ${uid}::uuid GROUP BY event ORDER BY n DESC LIMIT 8`))
      const lastSeen = rows(await db.execute(sql`
        SELECT to_char(max(created_at),'YYYY-MM-DD HH24:MI') AS at FROM analytics_events WHERE user_id = ${uid}::uuid`))[0]
      out[email] = {
        created: u.created, sub: u.sub, plan: u.plan, trial_ends: u.trial_ends,
        onboarding_completed: u.onboarding_completed,
        brief, posts, linkedin: li, events, last_seen: lastSeen?.at,
      }
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
