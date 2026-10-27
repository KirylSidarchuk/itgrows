import { NextRequest, NextResponse } from "next/server"
import { normaliseDomain } from "@/lib/geo-business"

// The detailed report used to be bought here ($19.99, Stripe Checkout). Since 27 Oct 2026 it is free
// once an account is created (lib/geo-pricing.ts), so nothing is sold: every call answers 410 Gone
// with the report page to go to instead. A checkout opened before then and paid later is still
// honoured by the webhook (lib/geo-business.ts unlockGeoResearch).

export const dynamic = "force-dynamic"

function gone(domain?: unknown) {
  const site = normaliseDomain(domain)
  const report = `/business/dashboard/visibility${site ? `?site=${encodeURIComponent(site)}` : ""}`
  return NextResponse.json({ error: "gone", free: true, report }, { status: 410, headers: { "Cache-Control": "no-store" } })
}

export async function POST(req: NextRequest) {
  const { domain } = (await req.json().catch(() => ({}))) as { domain?: string }
  return gone(domain)
}

export async function GET(req: NextRequest) {
  return gone(req.nextUrl.searchParams.get("domain"))
}
