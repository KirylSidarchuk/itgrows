import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: owners of LinkedIn URNs shared across multiple ItGrows accounts. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const shared = rows(await db.execute(sql`
      SELECT la.linkedin_person_urn AS urn, u.email,
             u.subscription_status AS sub, u.subscription_plan AS plan,
             la.is_active, to_char(la.created_at, 'YYYY-MM-DD HH24:MI') AS connected
      FROM linkedin_accounts la
      JOIN users u ON u.id::text = la.user_id
      WHERE la.page_type = 'personal'
        AND la.linkedin_person_urn IN (
          SELECT linkedin_person_urn FROM linkedin_accounts
          WHERE linkedin_person_urn IS NOT NULL AND page_type = 'personal'
          GROUP BY 1 HAVING count(DISTINCT user_id) > 1
        )
      ORDER BY la.linkedin_person_urn, la.created_at`))
    return NextResponse.json({ shared_detail: shared })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
