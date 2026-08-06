import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: what exactly is queued on the Pickaclass company page — personal-voice content?
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const PICK = "8f9b7dc9-8f36-4979-9686-87ed26ed7c90"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const byStatus = rows(await db.execute(sql`
      SELECT status, count(*)::int AS n,
             to_char(min(scheduled_for),'MM-DD HH24:MI') AS first_slot,
             to_char(max(scheduled_for),'MM-DD HH24:MI') AS last_slot
      FROM linkedin_posts WHERE linkedin_account_id = ${PICK}::uuid GROUP BY status`))

    // the 5 generated tonight + a few older ones, with a voice hint
    const recent = rows(await db.execute(sql`
      SELECT status, to_char(created_at,'MM-DD HH24:MI') AS created,
             to_char(scheduled_for,'MM-DD HH24:MI') AS slot,
             left(content, 160) AS preview,
             (content ILIKE 'I %' OR content ILIKE '%I have%' OR content ILIKE '%my %') AS sounds_personal,
             (content ILIKE 'We %' OR content ILIKE '%our %' OR content ILIKE '%we have%') AS sounds_company
      FROM linkedin_posts WHERE linkedin_account_id = ${PICK}::uuid
      ORDER BY created_at DESC LIMIT 8`))

    const nextDue = rows(await db.execute(sql`
      SELECT count(*)::int AS due_next_24h FROM linkedin_posts
      WHERE linkedin_account_id = ${PICK}::uuid AND status='scheduled'
        AND scheduled_for <= now() + interval '24 hours'`))[0]

    const acct = rows(await db.execute(sql`
      SELECT page_name, is_active, subscription_status FROM linkedin_accounts WHERE id = ${PICK}::uuid`))[0]

    return NextResponse.json({ account: acct, by_status: byStatus, due_next_24h: nextDue?.due_next_24h, recent })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
