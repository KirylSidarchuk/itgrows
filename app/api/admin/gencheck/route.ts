import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: diagnose the "generate produced nothing" + cascade data-loss report. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const email = req.nextUrl.searchParams.get("email") ?? "kiryl.sidarchuk@gmail.com"
    const u = rows(await db.execute(sql`SELECT id, subscription_status AS sub, subscription_plan AS plan FROM users WHERE lower(email)=${email}`))[0]
    if (!u) return NextResponse.json({ error: "no user" }, { status: 404 })
    const uid = u.id as string

    const accounts = rows(await db.execute(sql`
      SELECT id, page_type, page_name, is_active, to_char(created_at,'MM-DD HH24:MI') AS created
      FROM linkedin_accounts WHERE user_id = ${uid}`))
    const posts = rows(await db.execute(sql`
      SELECT status, count(*)::int AS n, count(linkedin_account_id)::int AS with_acct
      FROM linkedin_posts WHERE user_id = ${uid} GROUP BY status`))
    const recent = rows(await db.execute(sql`
      SELECT status, to_char(created_at,'MM-DD HH24:MI') AS created, linkedin_account_id IS NULL AS orphan
      FROM linkedin_posts WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 5`))
    const brief = rows(await db.execute(sql`
      SELECT (niche IS NOT NULL) AS has_niche, (topics IS NOT NULL) AS has_topics, linkedin_account_id
      FROM linkedin_briefs WHERE user_id = ${uid}`))
    // the actual FK rule in prod
    const fk = rows(await db.execute(sql`
      SELECT tc.constraint_name, rc.delete_rule, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
      JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name IN ('linkedin_posts','linkedin_briefs') AND kcu.column_name='linkedin_account_id'`))

    return NextResponse.json({ user: { sub: u.sub, plan: u.plan }, accounts, posts_by_status: posts, recent_posts: recent, brief, fk_delete_rules: fk })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
