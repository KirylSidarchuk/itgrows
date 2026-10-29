import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { normaliseDomain } from "@/lib/geo-business"
import { accountPrices } from "@/lib/geo-price-test"

// The launch-rewards wheel was on screen, ready to spin (app/business/dashboard/launch-wheel.tsx, once
// per page load): analytics_events 'geo_wheel_seen', with the price test's variant decided here, and
// where: "report" (the end of the report) or "plan" (the plan page). With geo_wheel_spin
// (/api/geo/promo/spin) and geo_plan_paid props.reward it counts the wheel per variant.
// POST { where, domain } -> { ok: true }, whatever happens: analytics never gets in the way.

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { where?: unknown; domain?: unknown }
  const where = body.where === "plan" ? "plan" : "report"
  try {
    const { variant, prices } = await accountPrices(userId)
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_wheel_seen', ${where === "plan" ? "/business/dashboard/plan" : "/business/dashboard/visibility"},
              ${JSON.stringify({ where, variant, month_cents: prices.monthCents, domain: normaliseDomain(body.domain) })}::jsonb)`)
  } catch {
    // Analytics never gets in the way.
  }
  return NextResponse.json({ ok: true })
}
