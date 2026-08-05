import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: re-queue Elizabeth's failed posts onto free daily slots after her current queue.
// ?confirm=yes writes. Owner-approved 2026-08-05. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='eamcguire67.em@gmail.com'`))[0]
    const uid = u.id as string

    // current queue shape: how many scheduled per day
    const perDay = rows(await db.execute(sql`
      SELECT to_char(scheduled_for,'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM linkedin_posts WHERE user_id=${uid} AND status='scheduled'
      GROUP BY 1 ORDER BY 1`))

    // last scheduled day
    const last = rows(await db.execute(sql`
      SELECT to_char(max(scheduled_for),'YYYY-MM-DD') AS d FROM linkedin_posts
      WHERE user_id=${uid} AND status='scheduled'`))[0]

    const failed = rows(await db.execute(sql`
      SELECT id, to_char(scheduled_for,'MM-DD') AS was
      FROM linkedin_posts WHERE user_id=${uid} AND status='failed' ORDER BY scheduled_for`))

    const plan: Row[] = []
    const lastDay = last?.d ? new Date(`${last.d}T10:00:00Z`) : new Date()
    failed.forEach((f, i) => {
      const d = new Date(lastDay)
      d.setUTCDate(d.getUTCDate() + i + 1) // one per day, after the existing queue
      plan.push({ id: f.id, was: f.was, new_slot: d.toISOString().slice(0, 16).replace("T", " ") })
    })

    if (p.get("confirm") === "yes") {
      for (const item of plan) {
        await db.execute(sql`
          UPDATE linkedin_posts
          SET status='scheduled', publish_error=NULL, scheduled_for=${new Date(item.new_slot + ":00Z").toISOString()}
          WHERE id=${item.id}::uuid AND user_id=${uid}`)
      }
      const after = rows(await db.execute(sql`
        SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id=${uid} GROUP BY status`))
      return NextResponse.json({ requeued: plan.length, plan, after })
    }
    return NextResponse.json({ current_per_day: perDay, last_scheduled: last?.d, failed_count: failed.length, plan, note: "add &confirm=yes to apply" })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
