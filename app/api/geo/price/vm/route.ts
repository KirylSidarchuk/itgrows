import { NextRequest, NextResponse } from "next/server"
import { vmAuthorized } from "@/lib/geo-check"
import { PRICE_TEST, drawPriceVariant } from "@/lib/geo-pricing"
import { qaLinkValue } from "@/lib/geo-price-visitor"

// The price test for the VM's scripts, behind the VM's token, so they hold no copy of its settings.
// POST { action: "draw" } -> { variant }: the arm for an account made with no visitor behind it (the Meta
//   form's leads, /root/geo_check/meta_leads.py); null with the test off. If this cannot be reached, the
//   script leaves the variant empty: the one price.
// POST { action: "qa" } -> { links }: the QA links of every arm (scripts/price-qa-links.ts).

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!vmAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { action?: unknown }
  if (body.action === "draw") return NextResponse.json({ variant: drawPriceVariant() })
  if (body.action === "qa") {
    const links = await Promise.all(
      PRICE_TEST.variants.map(async (cents) => ({ cents, query: `?price_qa=${await qaLinkValue(cents)}` }))
    )
    return NextResponse.json({ enabled: PRICE_TEST.enabled, links })
  }
  return NextResponse.json({ error: "unknown_action" }, { status: 400 })
}
