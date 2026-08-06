import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: (1) report Elizabeth's reconnect state, (2) on confirm=yes delete the duplicate
// account she asked us to remove (eamcguire.em@gmail.com — no plan, no posts). Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const DUP = "eamcguire.em@gmail.com"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    // main account state — did she reconnect? (row_created changes only on first insert,
    // so compare token expiry: a fresh grant gets a new expires_at)
    out.main = rows(await db.execute(sql`
      SELECT u.email, u.subscription_status AS sub, u.subscription_plan AS plan,
             la.is_active, to_char(la.expires_at,'YYYY-MM-DD') AS token_exp
      FROM users u LEFT JOIN linkedin_accounts la ON la.user_id = u.id::text
      WHERE lower(u.email)='eamcguire67.em@gmail.com'`))

    const dup = rows(await db.execute(sql`
      SELECT id, to_char(created_at,'YYYY-MM-DD') AS created FROM users WHERE lower(email)=${DUP}`))[0]
    if (!dup) { out.duplicate = "already gone"; return NextResponse.json(out) }
    const dupId = dup.id as string

    // safety: never delete an account that has a plan or published work
    const safety = rows(await db.execute(sql`
      SELECT (SELECT count(*)::int FROM linkedin_posts WHERE user_id=${dupId}) AS posts,
             (SELECT count(*)::int FROM linkedin_briefs WHERE user_id=${dupId}) AS briefs,
             (SELECT subscription_status FROM users WHERE id=${dupId}::uuid) AS sub,
             (SELECT stripe_customer_id FROM users WHERE id=${dupId}::uuid) AS stripe`))[0]
    out.duplicate_safety = safety

    const safe = Number(safety.posts) === 0 && !safety.stripe &&
      (safety.sub === "inactive" || safety.sub === null)
    out.safe_to_delete = safe

    if (p.get("confirm") === "yes") {
      if (!safe) { out.deleted = false; out.reason = "not safe — has posts/stripe/subscription"; return NextResponse.json(out) }
      await db.execute(sql`DELETE FROM linkedin_accounts WHERE user_id = ${dupId}`)
      await db.execute(sql`DELETE FROM linkedin_briefs WHERE user_id = ${dupId}`)
      await db.execute(sql`DELETE FROM users WHERE id = ${dupId}::uuid`)
      out.deleted = true
    } else {
      out.deleted = false
      out.note = "add &confirm=yes to delete the duplicate"
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, partial: out }, { status: 500 })
  }
}
