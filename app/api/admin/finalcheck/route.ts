import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP final verification of every factual claim in the customer email. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id, subscription_status AS sub, subscription_plan AS plan FROM users WHERE lower(email)='eamcguire67.em@gmail.com'`))[0]
    const uid = u.id as string

    const dupGone = rows(await db.execute(sql`SELECT count(*)::int AS n FROM users WHERE lower(email)='eamcguire.em@gmail.com'`))[0]
    const posts = rows(await db.execute(sql`SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id=${uid} GROUP BY status`))
    const nextPost = rows(await db.execute(sql`SELECT to_char(min(scheduled_for),'YYYY-MM-DD HH24:MI') AS at FROM linkedin_posts WHERE user_id=${uid} AND status='scheduled' AND scheduled_for > now()`))[0]
    const acct = rows(await db.execute(sql`SELECT is_active, to_char(expires_at,'YYYY-MM-DD') AS exp, to_char(created_at,'YYYY-MM-DD HH24:MI') AS row_created FROM linkedin_accounts WHERE user_id=${uid}`))
    // topics column reachable through the ORM path the app uses?
    const briefCols = rows(await db.execute(sql`SELECT topics, avoid_topics FROM linkedin_briefs WHERE user_id=${uid}`))
    // did she reconnect since the incident? (a fresh grant changes expires_at)
    const reconnected = acct.some((a) => (a.exp as string) > "2026-09-07")

    return NextResponse.json({
      now: new Date().toISOString(),
      duplicate_deleted: Number(dupGone.n) === 0,
      subscription: { sub: u.sub, plan: u.plan },
      posts_by_status: posts,
      failed_count: posts.find((p) => p.status === "failed")?.n ?? 0,
      next_scheduled_post: nextPost?.at ?? null,
      linkedin_account: acct,
      elizabeth_reconnected: reconnected,
      topics_column_readable: briefCols.length >= 0,
      topics_current_value: briefCols.map((b) => b.topics),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
