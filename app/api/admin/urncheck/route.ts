import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: does the SAME LinkedIn person URN exist on both of Elizabeth's accounts?
// This decides whether the new duplicate-guard would BLOCK her reconnect. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const accounts = rows(await db.execute(sql`
      SELECT u.email, la.page_type, la.page_name, la.is_active,
             la.linkedin_person_urn AS urn,
             to_char(la.created_at,'YYYY-MM-DD HH24:MI') AS connected
      FROM linkedin_accounts la
      JOIN users u ON u.id::text = la.user_id
      WHERE lower(u.email) IN ('eamcguire67.em@gmail.com','eamcguire.em@gmail.com')
      ORDER BY la.created_at`))

    // any URN shared across different users (system-wide)
    const dupes = rows(await db.execute(sql`
      SELECT linkedin_person_urn AS urn, count(DISTINCT user_id)::int AS users, count(*)::int AS rows_n
      FROM linkedin_accounts
      WHERE linkedin_person_urn IS NOT NULL AND page_type='personal'
      GROUP BY 1 HAVING count(DISTINCT user_id) > 1`))

    return NextResponse.json({ elizabeth_accounts: accounts, urns_shared_across_users: dupes })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
