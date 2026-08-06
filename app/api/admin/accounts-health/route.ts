import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Publishing health for every paying/trialing customer: which accounts are connected, whether the
// stored token is still usable, and what is queued to go out next. The audit found we had no way to
// see a broken connection before the customer told us -- every incident so far was caught by hand.
// Read-only and token-gated; it touches no customer content.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const email = p.get("email")
  const probe = p.get("probe") === "yes"

  try {
    const accounts = rows(await db.execute(sql`
      SELECT u.email, u.name, u.subscription_status,
             la.id AS account_id, la.page_type, la.page_name, la.is_active,
             to_char(la.created_at, 'YYYY-MM-DD HH24:MI') AS connected_at,
             to_char(la.expires_at, 'YYYY-MM-DD') AS token_expires,
             (la.expires_at IS NOT NULL AND la.expires_at < now()) AS token_expired,
             left(la.access_token, 12) AS token_head,
             (SELECT count(*)::int FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'scheduled') AS queued,
             (SELECT to_char(min(lp.scheduled_for), 'YYYY-MM-DD HH24:MI') FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'scheduled') AS next_post_utc,
             (SELECT to_char(max(lp.published_at), 'YYYY-MM-DD HH24:MI') FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'published') AS last_published_utc,
             (SELECT count(*)::int FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'failed') AS failed
      FROM linkedin_accounts la
      JOIN users u ON u.id::text = la.user_id
      WHERE (${email}::text IS NULL OR lower(u.email) = lower(${email}))
        AND (${email}::text IS NOT NULL OR u.subscription_status IN ('active', 'trialing'))
      ORDER BY u.email, la.page_type`))

    // A stored token can be revoked at LinkedIn's end while still looking fine in our table --
    // that is exactly how the last incident stayed invisible. Ask LinkedIn directly.
    if (probe) {
      const live = rows(await db.execute(sql`
        SELECT la.id, la.access_token FROM linkedin_accounts la
        JOIN users u ON u.id::text = la.user_id
        WHERE (${email}::text IS NULL OR lower(u.email) = lower(${email}))
          AND (${email}::text IS NOT NULL OR u.subscription_status IN ('active', 'trialing'))`))
      const verdicts: Record<string, string> = {}
      await Promise.all(live.map(async (r) => {
        try {
          const res = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${r.access_token as string}` },
          })
          verdicts[r.id as string] = res.ok ? "ok" : `${res.status} ${(await res.text()).slice(0, 120)}`
        } catch (e) {
          verdicts[r.id as string] = `network: ${(e as Error).message}`
        }
      }))
      for (const a of accounts) a.linkedin_says = verdicts[a.account_id as string] ?? "n/a"
    }

    return NextResponse.json({
      checked_at_utc: new Date().toISOString().slice(0, 16).replace("T", " "),
      note: probe ? "linkedin_says came from a live LinkedIn call" : "add &probe=yes to verify each token against LinkedIn",
      accounts,
    })
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? "") }, { status: 500 })
  }
}
