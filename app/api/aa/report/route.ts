import { NextRequest, NextResponse } from "next/server"
import { aaReport, aaSite, aaAuthorized } from "@/lib/agent-analytics"

// The weekly Agent Analytics report of one site: GET /api/aa/report?site=youmoir.com&days=7 with the VM token.
// Venture OS reads it every Monday for each project (lib/agent-analytics.ts aaReport).
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!aaAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const site = aaSite(req.nextUrl.searchParams.get("site"))
  if (!site) return NextResponse.json({ error: "unknown_site" }, { status: 400 })
  const days = Number(req.nextUrl.searchParams.get("days") ?? 7) || 7
  return NextResponse.json(await aaReport(site, days), { headers: { "Cache-Control": "no-store" } })
}
