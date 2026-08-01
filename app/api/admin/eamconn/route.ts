import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: what eamcguire has connected (LinkedIn personal/company + X). Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    for (const email of ["eamcguire67.em@gmail.com", "eamcguire.em@gmail.com"]) {
      const u = rows(await db.execute(sql`SELECT id, subscription_status, subscription_plan FROM users WHERE lower(email)=${email}`))[0]
      if (!u) { out[email] = { exists: false }; continue }
      const uid = u.id as string
      const li = rows(await db.execute(sql`
        SELECT page_type, page_name, page_handle, is_active,
               (access_token IS NOT NULL) AS has_token, to_char(expires_at,'YYYY-MM-DD') AS token_exp,
               subscription_status AS acct_sub
        FROM linkedin_accounts WHERE user_id = ${uid} ORDER BY created_at`))
      const tw = rows(await db.execute(sql`
        SELECT * FROM twitter_accounts WHERE user_id = ${uid}::uuid`)).map(r => ({
          handle: r.handle ?? r.username ?? r.screen_name, active: r.is_active, has_token: !!r.access_token }))
      const briefs = rows(await db.execute(sql`SELECT niche FROM linkedin_briefs WHERE user_id = ${uid}`))
      out[email] = {
        exists: true, sub: u.subscription_status, plan: u.subscription_plan,
        linkedin_accounts: li, twitter_accounts: tw, briefs,
      }
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
