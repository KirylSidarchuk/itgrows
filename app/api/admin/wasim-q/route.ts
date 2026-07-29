import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: wasim queue depth + recent post statuses. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='wasim@me.com'`))[0]
    if (!u) return NextResponse.json({ error: "no wasim" }, { status: 404 })
    const uid = u.id as string
    const byStatus = rows(await db.execute(sql`SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id=${uid} GROUP BY status`))
    const nextScheduled = rows(await db.execute(sql`
      SELECT to_char(scheduled_for,'YYYY-MM-DD HH24:MI') AS at FROM linkedin_posts
      WHERE user_id=${uid} AND status='scheduled' ORDER BY scheduled_for ASC LIMIT 5`))
    const recent = rows(await db.execute(sql`
      SELECT status, to_char(scheduled_for,'MM-DD HH24:MI') AS sched, to_char(published_at,'MM-DD HH24:MI') AS pub, publish_error
      FROM linkedin_posts WHERE user_id=${uid} ORDER BY coalesce(published_at, scheduled_for) DESC NULLS LAST LIMIT 8`))
    return NextResponse.json({ now: new Date().toISOString(), by_status: byStatus, next_scheduled: nextScheduled.map(r=>r.at), recent })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
