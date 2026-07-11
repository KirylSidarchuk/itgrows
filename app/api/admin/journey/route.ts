import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Read a user's full event journey + a funnel snapshot. Token-gated, read-only.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const email = p.get("email")
  const limit = Math.min(Number(p.get("limit") || 200), 500)
  try {
    // funnel: distinct users/anons per event over the last 30 days
    const funnel = rows(await db.execute(sql`
      SELECT event, count(*)::int AS hits,
             count(DISTINCT coalesce(user_id::text, anon_id))::int AS people
      FROM analytics_events
      WHERE created_at > now() - interval '30 days'
      GROUP BY event ORDER BY people DESC LIMIT 40`))

    let user = null, journey: Row[] = []
    if (email) {
      const u = rows(await db.execute(sql`
        SELECT id, email, name, created_at, subscription_status, onboarding_completed
        FROM users WHERE lower(email) = lower(${email}) LIMIT 1`))[0]
      if (u) {
        user = u
        journey = rows(await db.execute(sql`
          SELECT event, path, props, created_at
          FROM analytics_events
          WHERE user_id = ${u.id} OR anon_id IN (
            SELECT DISTINCT anon_id FROM analytics_events WHERE user_id = ${u.id} AND anon_id IS NOT NULL
          )
          ORDER BY created_at ASC LIMIT ${limit}`))
      }
    }
    return NextResponse.json({ funnel_30d: funnel, user, journey })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
