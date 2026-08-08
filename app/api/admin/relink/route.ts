import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: Disconnect deletes the linkedin_accounts row, and the FK is ON DELETE SET NULL, so the
// customer's whole publishing history survives in the table but detaches from any account -- and
// the cabinet lists posts per account, so to her it looks like everything was deleted. Re-point the
// orphans at her current account to give the history back. Read-only until ?confirm=yes.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)=${EMAIL}`))[0]
    const uid = u.id as string
    const acc = rows(await db.execute(sql`
      SELECT id, page_type FROM linkedin_accounts WHERE user_id=${uid}::text AND page_type='personal'
      ORDER BY created_at DESC LIMIT 1`))[0]
    if (!acc) return NextResponse.json({ error: "no personal account to attach to" })
    const accId = acc.id as string
    out.target_account = accId

    out.orphans_before = rows(await db.execute(sql`
      SELECT status, count(*)::int AS n FROM linkedin_posts
      WHERE user_id=${uid} AND linkedin_account_id IS NULL GROUP BY 1`))

    if (p.get("confirm") === "yes") {
      // Only published history is restored: a stale failed row would just re-surface an error she
      // has already lived through.
      await db.execute(sql`
        UPDATE linkedin_posts SET linkedin_account_id = ${accId}::uuid
        WHERE user_id = ${uid} AND linkedin_account_id IS NULL AND status = 'published'`)
      out.restored = true
    } else {
      out.note = "add &confirm=yes to re-attach the published history"
    }

    out.after = rows(await db.execute(sql`
      SELECT status, linkedin_account_id::text AS account, count(*)::int AS n
      FROM linkedin_posts WHERE user_id=${uid} GROUP BY 1,2 ORDER BY 1`))
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? ""), partial: out }, { status: 500 })
  }
}
