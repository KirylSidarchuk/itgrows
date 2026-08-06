import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: which account do the just-generated posts belong to vs the personal account the UI shows.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='kiryl.sidarchuk@gmail.com'`))[0]
    const uid = u.id as string
    const byAccount = rows(await db.execute(sql`
      SELECT la.page_type, la.page_name, la.is_active, lp.linkedin_account_id, count(*)::int AS posts,
             to_char(max(lp.created_at),'MM-DD HH24:MI') AS newest
      FROM linkedin_posts lp
      LEFT JOIN linkedin_accounts la ON la.id = lp.linkedin_account_id
      WHERE lp.user_id = ${uid}
      GROUP BY 1,2,3,4 ORDER BY newest DESC NULLS LAST`))
    const personal = rows(await db.execute(sql`
      SELECT id, is_active FROM linkedin_accounts WHERE user_id = ${uid} AND page_type='personal'`))
    return NextResponse.json({ posts_grouped_by_account: byAccount, personal_account: personal })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
