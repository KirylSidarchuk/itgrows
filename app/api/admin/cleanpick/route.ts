import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: classify Pickaclass scheduled posts as education-related (genuinely on-brand) vs
// everything else (written from the wrong brief). ?confirm=yes deletes the non-education ones.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const PICK = "8f9b7dc9-8f36-4979-9686-87ed26ed7c90"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// Pickaclass = Online Education / Professional Development / AI Learning Platform
const EDU = `(content ILIKE '%cours%' OR content ILIKE '%learn%' OR content ILIKE '%skill%'
  OR content ILIKE '%student%' OR content ILIKE '%educat%' OR content ILIKE '%training%'
  OR content ILIKE '%upskill%' OR content ILIKE '%curricul%' OR content ILIKE '%teach%')`

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    out.scheduled_total = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled'`)))[0]

    out.education_related = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND ${EDU}`)))[0]

    out.not_education = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n, to_char(min(created_at),'MM-DD') AS gen_from, to_char(max(created_at),'MM-DD') AS gen_to
       FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND NOT ${EDU}`)))[0]

    out.education_samples = rows(await db.execute(sql.raw(
      `SELECT left(content,120) AS preview, to_char(scheduled_for,'MM-DD') AS slot, to_char(created_at,'MM-DD') AS created
       FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND ${EDU}
       ORDER BY scheduled_for LIMIT 5`)))

    if (p.get("confirm") === "yes") {
      await db.execute(sql.raw(
        `DELETE FROM linkedin_posts WHERE linkedin_account_id='${PICK}' AND status='scheduled' AND NOT ${EDU}`))
      out.after = rows(await db.execute(sql.raw(
        `SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id='${PICK}' GROUP BY status`)))
      out.deleted = true
    } else {
      out.note = "add &confirm=yes to delete the non-education scheduled posts"
    }
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? ""), partial: out }, { status: 500 })
  }
}
