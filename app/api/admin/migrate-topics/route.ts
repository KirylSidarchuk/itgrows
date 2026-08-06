import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP migration: add linkedin_briefs.topics (user's own topic plan for the next batch).
// Idempotent. Remove after running.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    await db.execute(sql`ALTER TABLE linkedin_briefs ADD COLUMN IF NOT EXISTS topics text`)
    const cols = rows(await db.execute(sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name='linkedin_briefs' AND column_name IN ('topics','avoid_topics')`))
    return NextResponse.json({ migrated: true, columns: cols })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
