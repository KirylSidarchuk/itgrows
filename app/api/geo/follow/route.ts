import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoCheck, type PublicRun } from "@/lib/geo-check"

// Follow a site from the AI-visibility cabinet. The VM records the follow and queues the day-0
// report (20 questions x 4 assistants x 3 samples), or returns the one already made this week.

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let site = ""
  try {
    site = String(((await req.json()) as { site?: unknown }).site ?? "").trim()
  } catch {}
  if (site.length < 3 || site.length > 300) return NextResponse.json({ error: "invalid_url" }, { status: 400 })

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
