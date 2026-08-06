import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: who triggered the recent LinkedIn connect events + Elizabeth's current token state.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const events = rows(await db.execute(sql`
      SELECT to_char(ae.created_at,'MM-DD HH24:MI') AS at, ae.event, u.email, ae.props
      FROM analytics_events ae LEFT JOIN users u ON u.id = ae.user_id
      WHERE ae.event LIKE 'linkedin_%' AND ae.created_at > now() - interval '3 days'
      ORDER BY ae.created_at DESC LIMIT 20`))

    const eliz = rows(await db.execute(sql`
      SELECT u.email, la.page_type, la.is_active,
             to_char(la.expires_at,'YYYY-MM-DD') AS token_exp,
             to_char(la.created_at,'MM-DD HH24:MI') AS row_created
      FROM linkedin_accounts la JOIN users u ON u.id::text = la.user_id
      WHERE lower(u.email) LIKE 'eamcguire%'`))

    const nextPost = rows(await db.execute(sql`
      SELECT to_char(min(lp.scheduled_for),'YYYY-MM-DD HH24:MI') AS next
      FROM linkedin_posts lp JOIN users u ON u.id::text = lp.user_id
      WHERE lower(u.email)='eamcguire67.em@gmail.com' AND lp.status='scheduled'`))[0]

    return NextResponse.json({ now: new Date().toISOString(), recent_linkedin_events: events, elizabeth_accounts: eliz, elizabeth_next_post: nextPost?.next })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
