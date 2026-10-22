import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoCheck, type PublicRun } from "@/lib/geo-check"
import { normaliseDomain } from "@/lib/geo-business"
import { REPORT_SITES } from "@/lib/geo-pricing"

// Follow a site from the AI-visibility cabinet. The VM records the follow and queues the day-0
// report (20 questions x 4 assistants x 3 samples), or returns the one already made this week.
//
// A site the user already follows is answered from the database (the domain and the status of its
// latest run) without asking the VM: /baseline queues a new day-0 report once the last one is a week
// old, so every repeated "Add" would pay for one again. The VM is asked for a followed site only when
// it has no day-0 report done, queued or running (the retry after a failed one).
//
// An account has the report computed for REPORT_SITES site(s): past that, a new site is refused with
// "report_limit" and the page offers to buy its report instead (the purchase follows it). Sites on
// the plan or with a bought report do not count; a site already followed always goes through. The
// slot is held before the VM is asked, in one statement under a per-user lock (geo_follow_claims,
// lib/db/migrations/add_geo_client_sites.sql), so two sites added at once cannot both get in; the
// claim is dropped when the VM call fails. Clients we set up by hand (geo_clients, lib/geo-role.ts)
// have no limit and take no claim.

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** Holds a report slot for `domain`: true when the account has fewer than REPORT_SITES counted
 *  domains besides it (free follows and claims; a domain with a paid follow or a bought report does
 *  not count), or already holds a claim for it. */
async function claimSlot(userId: string, domain: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)
    const held = rows(
      await tx.execute(sql`
        WITH counted AS (
          SELECT s.domain FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
          WHERE f.user_id = ${userId} AND f.plan <> 'paid' AND f.research_paid_at IS NULL
          UNION
          SELECT c.domain FROM geo_follow_claims c
          WHERE c.user_id = ${userId}
            AND NOT EXISTS (SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                            WHERE f.user_id = c.user_id AND s.domain = c.domain
                              AND (f.plan = 'paid' OR f.research_paid_at IS NOT NULL))
        )
        INSERT INTO geo_follow_claims (user_id, domain)
        SELECT ${userId}, ${domain}
        WHERE (SELECT count(*) FROM counted WHERE domain <> ${domain}) < ${REPORT_SITES}
        ON CONFLICT (user_id, domain) DO UPDATE SET created_at = geo_follow_claims.created_at
        RETURNING domain`)
    )
    return held.length > 0
  })
}

async function dropClaim(userId: string, domain: string) {
  await db
    .execute(sql`DELETE FROM geo_follow_claims WHERE user_id = ${userId} AND domain = ${domain}`)
    .catch(() => {})
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let site = ""
  try {
    site = String(((await req.json()) as { site?: unknown }).site ?? "").trim()
  } catch {}
  if (site.length < 3 || site.length > 300) return NextResponse.json({ error: "invalid_url" }, { status: 400 })
  const domain = normaliseDomain(site)
  if (!domain) return NextResponse.json({ error: "invalid_url" }, { status: 400 })

  const [mine] = rows(
    await db.execute(sql`
      SELECT f.site_id,
             (SELECT r.status FROM geo_runs r
              WHERE r.site_id = f.site_id AND r.kind IN ('baseline', 'weekly')
              ORDER BY r.created_at DESC LIMIT 1) AS status,
             EXISTS (SELECT 1 FROM geo_runs r
                     WHERE r.site_id = f.site_id AND r.kind = 'baseline'
                       AND r.status IN ('done', 'queued', 'running')) AS has_baseline
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain}`)
  )
  if (mine?.has_baseline) return NextResponse.json({ domain, status: mine.status ?? null })

  // A new site takes a slot unless the user is a client we set up by hand; a followed site whose
  // day-0 report failed is retried without one (its follow already counts).
  let claimed = false
  if (!mine) {
    const [who] = rows(
      await db.execute(sql`SELECT EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId}) AS client`)
    )
    if (!who?.client) {
      if (!(await claimSlot(userId, domain))) return NextResponse.json({ error: "report_limit", domain }, { status: 402 })
      claimed = true
    }
  }

  let r
  try {
    r = await geoCheck<PublicRun>("/baseline", { domain: site, user_id: userId }, 55_000)
  } catch {
    if (claimed) await dropClaim(userId, domain)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if (r.status !== 200 && r.status !== 202) {
    if (claimed) await dropClaim(userId, domain)
    return NextResponse.json({ error: r.data.error ?? "unavailable" }, { status: r.status >= 400 ? r.status : 502 })
  }

  await db
    .execute(
      sql`INSERT INTO analytics_events (user_id, event, path, props)
          VALUES (${userId}, 'geo_follow', '/business/dashboard/visibility',
                  ${JSON.stringify({ domain: r.data.domain, run: r.data.run_id, status: r.data.status })}::jsonb)`
    )
    .catch(() => {})

  return NextResponse.json({ domain: r.data.domain, status: r.data.status })
}
