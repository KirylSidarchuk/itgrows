import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: Pickaclass scheduled posts grouped by generation date. The wrong-brief batches were
// generated on 2026-08-05/06; anything older is legitimate. ?confirm=yes deletes the bad batches.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const PICK = "8f9b7dc9-8f36-4979-9686-87ed26ed7c90"
const BAD_FROM = "2026-08-05"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    out.scheduled_by_generation_date = rows(await db.execute(sql.raw(
      `SELECT to_char(created_at,'YYYY-MM-DD') AS generated_on, count(*)::int AS n,
              to_char(min(scheduled_for),'MM-DD') AS first_slot, to_char(max(scheduled_for),'MM-DD') AS last_slot
       FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled'
       GROUP BY 1 ORDER BY 1`)))

    out.would_delete = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n FROM linkedin_posts
       WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND created_at >= '${BAD_FROM}'`)))[0]

    out.would_keep = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n FROM linkedin_posts
       WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND created_at < '${BAD_FROM}'`)))[0]

    out.keep_samples = rows(await db.execute(sql.raw(
      `SELECT left(content,110) AS preview, to_char(scheduled_for,'MM-DD') AS slot, to_char(created_at,'MM-DD') AS created
       FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND created_at < '${BAD_FROM}'
       ORDER BY scheduled_for LIMIT 4`)))

    if (p.get("confirm") === "yes") {
      await db.execute(sql.raw(
        `DELETE FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND created_at >= '${BAD_FROM}'`))
      out.after = rows(await db.execute(sql.raw(
        `SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id='${PICK}' GROUP BY status`)))
      out.next_slot = rows(await db.execute(sql.raw(
        `SELECT to_char(min(scheduled_for),'YYYY-MM-DD HH24:MI') AS at FROM linkedin_posts
         WHERE linkedin_account_id='${PICK}' AND status='scheduled'`)))[0]
      out.deleted = true
    } else {
      out.note = "add &confirm=yes to delete posts generated on/after " + BAD_FROM
    }
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? ""), partial: out }, { status: 500 })
  }
}
