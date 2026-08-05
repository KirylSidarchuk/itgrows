import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: compare LinkedIn/X token state across all active customers. Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const users = rows(await db.execute(sql`
      SELECT id, email, subscription_status AS sub, subscription_plan AS plan
      FROM users WHERE subscription_status IN ('active','trialing','past_due') ORDER BY email`))
    const out: Row[] = []
    for (const u of users) {
      const uid = u.id as string
      const li = rows(await db.execute(sql`
        SELECT page_type, page_name, is_active, to_char(expires_at,'YYYY-MM-DD') AS exp,
               (expires_at < now()) AS expired, to_char(created_at,'YYYY-MM-DD') AS connected
        FROM linkedin_accounts WHERE user_id = ${uid}`))
      const tw = rows(await db.execute(sql`
        SELECT username, account_type, (refresh_token IS NOT NULL) AS has_refresh,
               to_char(expires_at,'YYYY-MM-DD HH24:MI') AS exp
        FROM twitter_accounts WHERE user_id = ${uid}::uuid`))
      const lastPub = rows(await db.execute(sql`
        SELECT to_char(max(published_at),'MM-DD') AS li_last FROM linkedin_posts WHERE user_id=${uid} AND status='published'`))[0]
      const recentErr = rows(await db.execute(sql`
        SELECT publish_error, count(*)::int AS n FROM linkedin_posts
        WHERE user_id=${uid} AND status='failed' AND created_at > now() - interval '30 days'
        GROUP BY 1 ORDER BY n DESC LIMIT 3`))
      out.push({ email: u.email, sub: u.sub, plan: u.plan, linkedin: li, x: tw, li_last_published: lastPub?.li_last, recent_fail_reasons: recentErr })
    }
    return NextResponse.json({ customers: out.filter((c) => !(c.email as string).includes("kiryl")) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
