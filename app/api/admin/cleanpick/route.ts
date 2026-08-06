import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: remove SCHEDULED Pickaclass posts generated from the wrong (personal AI/AR) brief.
// Published posts are never touched. ?confirm=yes deletes. Constant id — no injection risk.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const PICK = "8f9b7dc9-8f36-4979-9686-87ed26ed7c90"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const OFFBRAND = `(content ILIKE '%augmented reality%' OR content ILIKE '%3D%' OR content ILIKE '%AR/%'
  OR content ILIKE '% AR %' OR content ILIKE '%immersive%' OR content ILIKE '%scanning%'
  OR content ILIKE '%MagiScan%')`

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    out.current = rows(await db.execute(sql.raw(
      `SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' GROUP BY status`)))

    out.offbrand_scheduled = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n, to_char(min(scheduled_for),'MM-DD') AS first_slot, to_char(max(scheduled_for),'MM-DD') AS last_slot
       FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' AND status='scheduled' AND ${OFFBRAND}`)))[0]

    out.onbrand_scheduled = rows(await db.execute(sql.raw(
      `SELECT count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' AND status='scheduled' AND NOT ${OFFBRAND}`)))[0]

    out.onbrand_samples = rows(await db.execute(sql.raw(
      `SELECT left(content,110) AS preview, to_char(scheduled_for,'MM-DD') AS slot
       FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' AND status='scheduled' AND NOT ${OFFBRAND}
       ORDER BY scheduled_for LIMIT 4`)))

    if (p.get("confirm") === "yes") {
      await db.execute(sql.raw(
        `DELETE FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' AND status='scheduled' AND ${OFFBRAND}`))
      out.after = rows(await db.execute(sql.raw(
        `SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id = '${PICK}' GROUP BY status`)))
      out.deleted = true
    } else {
      out.note = "add &confirm=yes to delete"
    }
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? ""), partial: out }, { status: 500 })
  }
}
