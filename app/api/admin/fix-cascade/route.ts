import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP migration: disconnecting a LinkedIn account must NOT destroy the user's content.
// linkedin_posts / linkedin_briefs referenced linkedin_accounts with ON DELETE CASCADE, so
// clicking "Disconnect" silently deleted every post for that account. Switch to SET NULL.
// Idempotent. Remove after running.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    await db.execute(sql`ALTER TABLE linkedin_posts DROP CONSTRAINT IF EXISTS linkedin_posts_linkedin_account_id_fkey`)
    await db.execute(sql`ALTER TABLE linkedin_posts ADD CONSTRAINT linkedin_posts_linkedin_account_id_fkey
      FOREIGN KEY (linkedin_account_id) REFERENCES linkedin_accounts(id) ON DELETE SET NULL`)

    await db.execute(sql`ALTER TABLE linkedin_briefs DROP CONSTRAINT IF EXISTS linkedin_briefs_linkedin_account_id_fkey`)
    await db.execute(sql`ALTER TABLE linkedin_briefs ADD CONSTRAINT linkedin_briefs_linkedin_account_id_fkey
      FOREIGN KEY (linkedin_account_id) REFERENCES linkedin_accounts(id) ON DELETE SET NULL`)

    const after = rows(await db.execute(sql`
      SELECT tc.table_name, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
      JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name IN ('linkedin_posts','linkedin_briefs') AND kcu.column_name='linkedin_account_id'`))
    return NextResponse.json({ migrated: true, delete_rules: after })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
