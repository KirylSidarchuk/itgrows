import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: publishing health for every subscribed/trial user. Token-gated, read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const users = rows(await db.execute(sql`
      SELECT id, email, subscription_status AS status, subscription_plan AS plan,
             to_char(trial_ends_at, 'YYYY-MM-DD') AS trial_ends,
             to_char(subscription_end_date, 'YYYY-MM-DD') AS sub_end,
             to_char(created_at, 'YYYY-MM-DD') AS joined
      FROM users
      WHERE subscription_status IN ('active','trialing','past_due') OR trial_ends_at > now()
      ORDER BY subscription_end_date DESC NULLS LAST`))

    for (const u of users) {
      const uid = u.id as string
      delete u.id
      const byStatus = rows(await db.execute(sql`
        SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id = ${uid} GROUP BY status`))
      u.posts = Object.fromEntries(byStatus.map((r) => [r.status as string, r.n]))
      const pub = rows(await db.execute(sql`
        SELECT to_char(max(published_at), 'YYYY-MM-DD HH24:MI') AS last_published,
               count(*)::int AS published_total
        FROM linkedin_posts WHERE user_id = ${uid} AND status = 'published'`))[0]
      u.last_published = pub?.last_published ?? null
      u.published_total = pub?.published_total ?? 0
      const nextS = rows(await db.execute(sql`
        SELECT to_char(min(scheduled_for), 'YYYY-MM-DD HH24:MI') AS next_scheduled
        FROM linkedin_posts WHERE user_id = ${uid} AND status = 'scheduled' AND scheduled_for > now()`))[0]
      u.next_scheduled = nextS?.next_scheduled ?? null
      const errs = rows(await db.execute(sql`
        SELECT publish_error, count(*)::int AS n FROM linkedin_posts
        WHERE user_id = ${uid} AND status = 'failed' AND publish_error IS NOT NULL
        GROUP BY publish_error ORDER BY n DESC LIMIT 3`))
      u.fail_reasons = errs.map((e) => `${e.publish_error} x${e.n}`)
    }
    return NextResponse.json({ now: new Date().toISOString(), subscribers: users })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
