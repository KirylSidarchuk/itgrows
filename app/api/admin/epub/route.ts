import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const u = rows(await db.execute(sql\`SELECT id FROM users WHERE lower(email)=\x27eamcguire67.em@gmail.com\x27\`))[0]
  const uid = u.id as string
  const recent = rows(await db.execute(sql\`SELECT status, to_char(published_at,\x27MM-DD HH24:MI\x27) AS pub, to_char(scheduled_for,\x27MM-DD HH24:MI\x27) AS sched, publish_error FROM linkedin_posts WHERE user_id=\${uid} ORDER BY coalesce(published_at,scheduled_for) DESC NULLS LAST LIMIT 6\`))
  return NextResponse.json({ recent })
}
