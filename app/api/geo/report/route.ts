import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { clientIp } from "@/lib/geo-check"
import { freeReportLimit } from "@/lib/geo-free-report"
import { accountPrices } from "@/lib/geo-price-test"
import { isGeoClient } from "@/lib/geo-role"
import { siteReportsFor } from "@/lib/geo-report"

// Everything the AI-visibility page shows, for the sites the signed-in user follows (built in
// lib/geo-report.ts): the detailed report whole (it is free since 27 Oct 2026). And reportLimit, what
// /api/geo/follow would answer now for a new site ("report_limit", "report_ip_used" or null,
// lib/geo-free-report.ts): the page shows its hint, or the contact-us state after a reload, by it.
// And the account's plan prices (lib/geo-price-test.ts): price, what a new plan costs it (the plan page
// and the end of the report show it, /api/geo/checkout charges it), and paidPrice, what a plan it has
// was bought at (the billing line). Null if they could not be read: the page then names no price.
// And noOffer: an account on terms we arranged by hand (a client we set up, free or billed by invoice) sees
// no price and no offer on any site it opens, its own or another. The prices are not even sent to it.

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const [sites, reportLimit, price] = await Promise.all([
    siteReportsFor(userId),
    // Only a hint: the report is never held back for it.
    freeReportLimit(userId, clientIp(req.headers)).catch(() => null),
    accountPrices(userId).catch(() => null),
  ])
  const noOffer = sites.some((s) => s.client && !(s.plan === "paid" && !s.invoiced)) || (await isGeoClient(userId))
  return NextResponse.json({
    sites,
    reportLimit,
    noOffer,
    price: noOffer ? null : (price?.prices ?? null),
    paidPrice: noOffer ? null : (price?.paid ?? null),
  })
}
