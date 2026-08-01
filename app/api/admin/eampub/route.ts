import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: Elizabeth's publish history. Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    for (const email of ["eamcguire67.em@gmail.com", "eamcguire.em@gmail.com"]) {
      const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)=${email}`))[0]
      if (!u) { out[email] = { exists: false }; continue }
      const uid = u.id as string
      const agg = rows(await db.execute(sql`
        SELECT to_char(max(published_at),'YYYY-MM-DD HH24:MI') AS last_published,
               count(*) FILTER (WHERE status='published')::int AS published,
               count(*) FILTER (WHERE status='scheduled')::int AS scheduled,
               count(*) FILTER (WHERE status='failed')::int AS failed
        FROM linkedin_posts WHERE user_id=${uid}`))[0]
      const recent = rows(await db.execute(sql`
        SELECT status, to_char(published_at,'MM-DD HH24:MI') AS pub, to_char(scheduled_for,'MM-DD HH24:MI') AS sched, publish_error
        FROM linkedin_posts WHERE user_id=${uid} AND (status='published' OR status='failed')
        ORDER BY coalesce(published_at, scheduled_for) DESC NULLS LAST LIMIT 6`))
      out[email] = { ...agg, recent }
    }
    return NextResponse.json({ now: new Date().toISOString(), ...out })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
