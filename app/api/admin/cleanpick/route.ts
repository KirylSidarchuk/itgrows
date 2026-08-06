import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: remove the SCHEDULED Pickaclass posts that were generated from the wrong (personal
// AI/AR/MagiScan) brief. Published posts are never touched. ?confirm=yes deletes.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const PICK = "8f9b7dc9-8f36-4979-9686-87ed26ed7c90"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// Off-brand for an online-education page = the MagiScan/AR/3D subject matter.
const OFFBRAND = `(content ILIKE '%AR %' OR content ILIKE '%augmented reality%' OR content ILIKE '%3D%'
  OR content ILIKE '%AR/%' OR content ILIKE '%immersive%' OR content ILIKE '%scanning%'
  OR content ILIKE '%MagiScan%')`

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const summary = rows(await db.execute(sql`
      SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id = ${PICK}::uuid GROUP BY status`))

    const offbrand = rows(await db.execute(sql.raw(`
      SELECT count(*)::int AS n, to_char(min(scheduled_for),'MM-DD') AS first_slot, to_char(max(scheduled_for),'MM-DD') AS last_slot
      FROM linkedin_posts
      WHERE linkedin_account_id = '${PICK}'::uuid AND status='scheduled' AND ${OFFBRAND}`)))[0]

    const onbrand = rows(await db.execute(sql.raw(`
      SELECT count(*)::int AS n FROM linkedin_posts
      WHERE linkedin_account_id = '${PICK}'::uuid AND status='scheduled' AND NOT ${OFFBRAND}`)))[0]

    const samples = rows(await db.execute(sql.raw(`
      SELECT left(content,110) AS preview, to_char(scheduled_for,'MM-DD') AS slot
      FROM linkedin_posts
      WHERE linkedin_account_id = '${PICK}'::uuid AND status='scheduled' AND NOT ${OFFBRAND}
      ORDER BY scheduled_for LIMIT 4`)))

    const out: Row = { current: summary, offbrand_scheduled: offbrand, onbrand_scheduled: onbrand, onbrand_samples: samples }

    if (p.get("confirm") === "yes") {
      const del = await db.execute(sql.raw(`
        DELETE FROM linkedin_posts
        WHERE linkedin_account_id = '${PICK}'::uuid AND status='scheduled' AND ${OFFBRAND}`))
      out.deleted = (del as unknown as { rowCount?: number }).rowCount ?? "ok"
      out.after = rows(await db.execute(sql`
        SELECT status, count(*)::int AS n FROM linkedin_posts WHERE linkedin_account_id = ${PICK}::uuid GROUP BY status`))
    } else {
      out.note = "add &confirm=yes to delete the off-brand scheduled posts"
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
