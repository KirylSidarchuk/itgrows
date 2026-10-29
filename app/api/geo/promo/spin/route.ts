import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { REWARD_RU } from "@/lib/geo-promo"
import { promoView, spinWheel } from "@/lib/geo-promo-server"
import { accountPrices, variantLine } from "@/lib/geo-price-test"
import { sendOwner } from "@/lib/telegram"

// The launch-rewards wheel (lib/geo-promo.ts). GET -> PromoView: whether the signed-in account can
// spin, the site of its report, and its reward (with its date). POST spins, once per account: the
// reward is drawn on the server (lib/geo-promo-server.ts spinWheel) and the page only turns the wheel
// to it. A second POST answers with the reward already won. Only a free account with its report, that
// has never had the plan and is not a client set up by hand: else 403 { error: "not_eligible" }, or
// "off" with PROMO_WHEEL.enabled false. A fresh spin is counted (analytics_events 'geo_wheel_spin',
// props.reward and props.variant, the price test's variant decided here) and told to Kiryl.

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    return NextResponse.json(await promoView(userId))
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
}

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  let result: Awaited<ReturnType<typeof spinWheel>>
  try {
    result = await spinWheel(userId)
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 })
  if (result.fresh) {
    const { reward, site, expires_at } = result.state
    const price = await accountPrices(userId).catch(() => null)
    const variant = price?.variant ?? null
    await db
      .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${userId}, 'geo_wheel_spin', '/business/dashboard',
                ${JSON.stringify({ reward, variant, month_cents: price?.prices.monthCents ?? null, domain: site, expires_at })}::jsonb)`)
      .catch(() => {})
    const until = new Date(expires_at).toISOString().slice(0, 16).replace("T", " ")
    void sendOwner(
      `🎡 Колесо GEO: ${session?.user?.email ?? userId} — ${site}\n🎁 ${REWARD_RU[reward]}, действует до ${until} UTC` +
        (price ? `\n🧪 ${variantLine(variant, price.prices.monthCents)}` : "")
    )
  }
  return NextResponse.json(result.view)
}
