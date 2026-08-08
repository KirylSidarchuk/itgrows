import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP diagnostic for the Elizabeth reconnect incident. Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    const u = rows(await db.execute(sql`SELECT id, email, subscription_status FROM users WHERE lower(email)=${EMAIL}`))[0]
    out.user = u
    const uid = u.id as string

    // every linkedin_accounts row that has ever belonged to her
    out.accounts = rows(await db.execute(sql`
      SELECT id, page_type, page_name, is_active, left(access_token,10) AS tok,
             to_char(created_at,'MM-DD HH24:MI') AS created, to_char(expires_at,'MM-DD') AS expires
      FROM linkedin_accounts WHERE user_id = ${uid}::text ORDER BY created_at`))

    // where did her posts go? keyed by user_id, which survives account changes
    out.posts_by_status_and_account = rows(await db.execute(sql`
      SELECT status, linkedin_account_id::text AS account_id, count(*)::int AS n,
             to_char(min(scheduled_for),'MM-DD') AS first_slot, to_char(max(scheduled_for),'MM-DD') AS last_slot
      FROM linkedin_posts WHERE user_id = ${uid}
      GROUP BY 1,2 ORDER BY 1,3 DESC`))

    out.total_posts_for_user = rows(await db.execute(sql`
      SELECT count(*)::int AS n FROM linkedin_posts WHERE user_id = ${uid}`))[0]

    out.orphaned_posts = rows(await db.execute(sql`
      SELECT status, count(*)::int AS n FROM linkedin_posts
      WHERE user_id = ${uid} AND linkedin_account_id IS NULL GROUP BY 1`))

    out.failed_detail = rows(await db.execute(sql`
      SELECT left(content,80) AS preview, publish_error, to_char(scheduled_for,'MM-DD HH24:MI') AS slot
      FROM linkedin_posts WHERE user_id = ${uid} AND status='failed' LIMIT 5`))

    // her connect/callback trail today
    out.events_today = rows(await db.execute(sql`
      SELECT event, path, props::text, to_char(created_at,'MM-DD HH24:MI:SS') AS at
      FROM analytics_events WHERE user_id = ${uid} AND created_at > now() - interval '2 days'
      ORDER BY created_at DESC LIMIT 40`))

    // is there any OTHER user row sharing her linkedin identity? (duplicate-account theory)
    out.same_urn_elsewhere = rows(await db.execute(sql`
      SELECT la.user_id, u.email, la.page_type, to_char(la.created_at,'MM-DD HH24:MI') AS created
      FROM linkedin_accounts la LEFT JOIN users u ON u.id::text = la.user_id
      WHERE la.linkedin_person_urn IN (
        SELECT linkedin_person_urn FROM linkedin_accounts WHERE user_id = ${uid}::text AND linkedin_person_urn IS NOT NULL)`))

    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? ""), partial: out }, { status: 500 })
  }
}
