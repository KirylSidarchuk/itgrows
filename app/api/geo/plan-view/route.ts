import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { normaliseDomain } from "@/lib/geo-business"
import { accountPrices } from "@/lib/geo-price-test"

// The plan page showed the account its prices (app/business/dashboard/plan/page.tsx, once per page
// load): analytics_events 'geo_plan_view', with the price variant decided here rather than by the page.
// props.variant is the price test's monthly price in cents, or null for an account on the one price
// outside the test; month_cents is what the page showed. With geo_checkout_started (/api/geo/checkout)
// and geo_plan_paid (the webhook, lib/geo-business.ts) it makes the count per variant.
// POST { domain? } -> { ok: true }, whatever happens: analytics never gets in the way.

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { domain?: unknown }
  try {
    const { variant, prices } = await accountPrices(userId)
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_plan_view', '/business/dashboard/plan',
              ${JSON.stringify({ variant, month_cents: prices.monthCents, domain: normaliseDomain(body.domain) })}::jsonb)`)
  } catch {
    // Analytics never gets in the way.
  }
  return NextResponse.json({ ok: true })
}
