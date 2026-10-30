import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { ONE_PRICE_MONTH, PRICE_TEST, accountMonthCents, geoPrices, type GeoPrices } from "@/lib/geo-pricing"

// The plan's price for one account, on the server (the test and its rules: lib/geo-pricing.ts). The
// account's variant was drawn when it was created (users.geo_price_variant); a client set up by hand
// (geo_clients) is on the one price whatever it says. /api/geo/report hands the prices to the plan
// page and the end of the report, /api/geo/checkout charges them, and the analytics events carry the
// variant: geo_plan_view (/api/geo/plan-view), geo_checkout_started (/api/geo/checkout) and
// geo_plan_paid (the webhook, lib/geo-business.ts geoPlanCheckoutCompleted). With the test off (since
// 30 Oct 2026) every account gets the one price and variant null, `paid` included.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export interface AccountPrices {
  /** The test's monthly price this account sees, in cents, or null when it is on the one price
   *  outside the test (from before it, a client set up by hand, or the test off). */
  variant: number | null
  /** What a new plan costs this account now. */
  prices: GeoPrices
  /** What a plan it already has was bought at, for the billing line: its own variant while the test
   *  runs, the one price once it is off (a checkout then charges the one price, whatever the variant). */
  paid: GeoPrices
}

export async function accountPrices(userId: string): Promise<AccountPrices> {
  const [r] = rows(
    await db.execute(sql`
      SELECT u.geo_price_variant AS variant,
             EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = u.id::text) AS client
      FROM users u WHERE u.id::text = ${userId}`)
  )
  const stored = r?.variant === null || r?.variant === undefined ? null : Number(r.variant)
  const client = r?.client === true
  const month = accountMonthCents(stored, client)
  const own = stored !== null && !client
  return {
    variant: own && PRICE_TEST.enabled ? month : null,
    prices: geoPrices(month),
    paid: geoPrices(own && PRICE_TEST.enabled ? stored : ONE_PRICE_MONTH),
  }
}

/** The variant for a Telegram line: "тест цены, вариант $299/мес" (a checkout opened under the test),
 *  the one price outside a running test, or, with the test off, the one price for everyone. */
export function variantLine(variant: number | null, monthCents: number): string {
  const p = geoPrices(monthCents)
  if (variant !== null) return `тест цены, вариант ${p.month.label}/мес`
  return PRICE_TEST.enabled ? `старая цена ${p.month.label}/мес (вне теста)` : `единая цена ${p.month.label}/мес`
}
