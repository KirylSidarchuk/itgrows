import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { clientIp } from "@/lib/geo-check"
import { freeReportLimit } from "@/lib/geo-free-report"
import { siteReportsFor } from "@/lib/geo-report"

// Everything the AI-visibility page shows, for the sites the signed-in user follows (built in
// lib/geo-report.ts): the detailed report whole (it is free since 27 Oct 2026). And reportLimit, what
// /api/geo/follow would answer now for a new site ("report_limit", "report_ip_used" or null,
// lib/geo-free-report.ts): the page shows its hint, or the contact-us state after a reload, by it.

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const [sites, reportLimit] = await Promise.all([
    siteReportsFor(userId),
    // Only a hint: the report is never held back for it.
    freeReportLimit(userId, clientIp(req.headers)).catch(() => null),
  ])
  return NextResponse.json({ sites, reportLimit })
}
