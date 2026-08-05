import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: Elizabeth's queue — what would publish immediately vs later, and the dead failed posts.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='eamcguire67.em@gmail.com'`))[0]
    const uid = u.id as string
    const overdue = rows(await db.execute(sql`
      SELECT count(*)::int AS n, to_char(min(scheduled_for),'MM-DD HH24:MI') AS earliest, to_char(max(scheduled_for),'MM-DD HH24:MI') AS latest
      FROM linkedin_posts WHERE user_id=${uid} AND status='scheduled' AND scheduled_for <= now()`))[0]
    const future = rows(await db.execute(sql`
      SELECT to_char(scheduled_for,'MM-DD HH24:MI') AS at FROM linkedin_posts
      WHERE user_id=${uid} AND status='scheduled' AND scheduled_for > now() ORDER BY scheduled_for LIMIT 8`))
    const failed = rows(await db.execute(sql`
      SELECT to_char(scheduled_for,'MM-DD HH24:MI') AS sched,
             CASE WHEN publish_error LIKE '%REVOKED%' THEN 'revoked'
                  WHEN publish_error='subscription_required' THEN 'subscription'
                  ELSE left(coalesce(publish_error,'?'),40) END AS reason
      FROM linkedin_posts WHERE user_id=${uid} AND status='failed' ORDER BY scheduled_for`))
    const acct = rows(await db.execute(sql`
      SELECT is_active, to_char(expires_at,'YYYY-MM-DD') AS exp FROM linkedin_accounts WHERE user_id=${uid}`))
    return NextResponse.json({ now: new Date().toISOString(), would_publish_immediately: overdue, next_future: future.map(r => r.at), failed_posts: failed, account: acct })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
