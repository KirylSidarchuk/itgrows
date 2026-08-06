import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: what niche is stored in each of kiryl's briefs, and which account they map to.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='kiryl.sidarchuk@gmail.com'`))[0]
    const uid = u.id as string
    const briefs = rows(await db.execute(sql`
      SELECT la.page_name, la.page_type, lb.linkedin_account_id,
             left(lb.niche, 90) AS niche, left(lb.company_name,40) AS company,
             left(lb.target_audience, 70) AS audience,
             to_char(lb.updated_at,'MM-DD HH24:MI') AS updated
      FROM linkedin_briefs lb
      LEFT JOIN linkedin_accounts la ON la.id = lb.linkedin_account_id
      WHERE lb.user_id = ${uid}
      ORDER BY lb.updated_at DESC`))
    return NextResponse.json({ briefs })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
