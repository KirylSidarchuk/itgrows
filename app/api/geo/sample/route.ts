import { NextResponse } from "next/server"
import { sampleSiteReport } from "@/lib/geo-report"

// The public sample report shown next to every "get the free report" button: the whole report for our
// own appslift.com, in the same shape as /api/geo/report. No sign-in. Rendered on request (never at
// build time, so a build does not depend on the database) and cached at the edge for an hour.

export const dynamic = "force-dynamic"

export async function GET() {
  const site = await sampleSiteReport().catch(() => null)
  if (!site) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ site }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
}
