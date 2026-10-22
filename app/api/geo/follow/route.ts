import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoCheck, type PublicRun } from "@/lib/geo-check"
import { normaliseDomain } from "@/lib/geo-business"
import { REPORT_SITES } from "@/lib/geo-pricing"

// Follow a site from the AI-visibility cabinet. The VM records the follow and queues the day-0
// report (20 questions x 4 assistants x 3 samples), or returns the one already made this week.
// An account has the report computed for REPORT_SITES site(s): past that, a new site is refused with
// "report_limit" and the page offers to buy its report instead (the purchase follows it). Sites on
// the plan or with a bought report do not count; a site already followed always goes through. Clients
// we set up by hand (geo_clients, lib/geo-role.ts) have no limit.

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

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
      SELECT bool_or(s.domain = ${domain}) AS followed,
             count(*) FILTER (WHERE f.plan <> 'paid' AND f.research_paid_at IS NULL)::int AS included,
             EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId}) AS client
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId}`)
  )
  if (!mine?.followed && !mine?.client && Number(mine?.included ?? 0) >= REPORT_SITES) {
    return NextResponse.json({ error: "report_limit", domain }, { status: 402 })
  }

  let r
  try {
    r = await geoCheck<PublicRun>("/baseline", { domain: site, user_id: userId }, 55_000)
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if (r.status !== 200 && r.status !== 202) {
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
