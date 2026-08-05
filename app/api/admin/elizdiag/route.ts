import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: Elizabeth LinkedIn token + recent publish errors. Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id, subscription_status, subscription_plan FROM users WHERE lower(email)='eamcguire67.em@gmail.com'`))[0]
    const uid = u.id as string
    const li = rows(await db.execute(sql`
      SELECT page_type, page_name, is_active,
             (access_token IS NOT NULL) AS has_token,
             to_char(expires_at,'YYYY-MM-DD HH24:MI') AS token_exp,
             (expires_at < now()) AS token_expired,
             to_char(created_at,'YYYY-MM-DD') AS connected
      FROM linkedin_accounts WHERE user_id = ${uid} ORDER BY created_at`))
    const recent = rows(await db.execute(sql`
      SELECT status, to_char(published_at,'MM-DD HH24:MI') AS pub, to_char(scheduled_for,'MM-DD HH24:MI') AS sched, publish_error
      FROM linkedin_posts WHERE user_id = ${uid} AND (status='published' OR status='failed')
      ORDER BY coalesce(published_at, scheduled_for) DESC NULLS LAST LIMIT 8`))
    return NextResponse.json({ user: { sub: u.subscription_status, plan: u.subscription_plan }, linkedin_accounts: li, recent_posts: recent })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
