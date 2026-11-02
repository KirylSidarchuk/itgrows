import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isBot } from "@/lib/i18n/config"
import { ONE_PRICE_MONTH, PRICE_TEST } from "@/lib/geo-pricing"
import { salesPriceAccount } from "@/lib/geo-price-test"
import { PRICE_COOKIE, VISITOR_COOKIE, priceCookieOptions, readPin, settleTokenValid, signPin } from "@/lib/geo-price-visitor"

// The page's small talk about the price test (components/geo/PriceProvider.tsx). Only for a browser that
// holds a pin signed by the proxy, or, for a settle with no cookies of ours at all, brings one the render
// signed for it (a page the router fetched gets no cookies, lib/geo-price-visitor.ts). It can never lower a
// price: a pin goes from "n" to "t" only with the render's signed token.
//
// POST { action: "settle", verdict, token, id, pin, local, source, utm, path }
//   A visitor assigned on this visit. A clean check and nothing remembered in the browser: he stays on his
//   arm for good (flag "t") and his exposure row is written, once. The browser remembers an earlier visit
//   (local): pinned to the one price, and the row says so ("returning"), so the report leaves him out. The
//   server recognised him: pinned to the one price, no row. The check timed out or failed ("doubt"):
//   pinned to the one price, and a row with that status, so the report shows if that ever becomes many.
//   A clean check whose token does not fit the id held (another tab answered first), or a verdict that is
//   none of these: nothing changes, the next page settles.
// POST { action: "seen" }  the price card came into view: card_seen_at, once per visitor.
// POST { action: "ref" }   a sales link took him out of the test: his row, if he has one, stops counting;
//   a signed-in account takes the one price (lib/geo-price-test.ts).
//
// The row holds the random id, the arm, the time, where he came from: no address. So it needs no analytics
// consent; it is in the Privacy policy, and the purge deletes it after 24 months. Bots get a pin but no row.
// Anything failing answers {} and leaves things as they were: the site never breaks on the test.

export const dynamic = "force-dynamic"

type Body = {
  action?: unknown
  verdict?: unknown
  token?: unknown
  id?: unknown
  pin?: unknown
  local?: unknown
  source?: unknown
  utm?: unknown
  path?: unknown
}

const text = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null)

function utmOf(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== "object") return null
  const entries = Object.entries(v as Record<string, unknown>)
    .filter(([k, s]) => /^utm_[a-z]{1,12}$/.test(k) && typeof s === "string")
    .slice(0, 6)
    .map(([k, s]) => [k, (s as string).slice(0, 120)])
  return entries.length ? Object.fromEntries(entries) : null
}

async function writeRow(id: string, arm: number, status: "test" | "returning" | "doubt", b: Body) {
  const utm = utmOf(b.utm)
  await db.execute(sql`
    INSERT INTO geo_price_exposures (experiment, visitor_id, arm, status, source, utm, path)
    VALUES (${PRICE_TEST.experiment}, ${id}, ${arm}, ${status}, ${text(b.source, 120)}, ${utm ? JSON.stringify(utm) : null}::jsonb, ${text(b.path, 200)})
    ON CONFLICT (experiment, visitor_id) DO NOTHING`)
}

export async function POST(req: NextRequest) {
  const none = () => NextResponse.json({})
  try {
    if (!PRICE_TEST.enabled) return none()
    const b = (await req.json().catch(() => ({}))) as Body
    const heldId = req.cookies.get(VISITOR_COOKIE)?.value
    const heldPin = req.cookies.get(PRICE_COOKIE)?.value
    // No cookies of ours at all: the page the router fetched brings what the render signed. Cookies that do
    // not verify stay a doubt, and what they hold decides.
    const carried = b.action === "settle" && !heldId && !heldPin
    const id = carried ? text(b.id, 64) : heldId
    const pin = await readPin(id, carried ? text(b.pin, 200) : heldPin)
    if (!id || !pin || pin.epoch !== PRICE_TEST.epoch) return none()
    const bot = isBot(req.headers.get("user-agent"))

    if (b.action === "seen") {
      if (pin.flag === "t" && !bot) {
        await db.execute(sql`
          UPDATE geo_price_exposures SET card_seen_at = now()
          WHERE experiment = ${PRICE_TEST.experiment} AND visitor_id = ${id} AND card_seen_at IS NULL`)
      }
      return none()
    }

    if (b.action === "ref") {
      if (pin.flag !== "l") return none()
      await db.execute(sql`
        UPDATE geo_price_exposures SET status = 'ref'
        WHERE experiment = ${PRICE_TEST.experiment} AND visitor_id = ${id} AND status = 'test'`)
      const userId = (await auth())?.user?.id
      return NextResponse.json({ refresh: userId ? await salesPriceAccount(userId) : false })
    }

    if (b.action !== "settle") return none()
    if (pin.flag !== "n") return NextResponse.json({ monthCents: pin.cents })

    const local = b.local === true
    const clean = b.verdict === "ok" && !local
    if (clean && !(await settleTokenValid(id, b.token))) return none()
    if (!clean && !local && b.verdict !== "returning" && b.verdict !== "doubt") return none()
    const next = clean
      ? { epoch: pin.epoch, cents: pin.cents, flag: "t" as const }
      : { epoch: pin.epoch, cents: ONE_PRICE_MONTH, flag: "r" as const }
    const res = NextResponse.json({ monthCents: next.cents })
    const options = priceCookieOptions(req.nextUrl.protocol === "https:")
    res.cookies.set(PRICE_COOKIE, await signPin(id, next), options)
    if (carried) res.cookies.set(VISITOR_COOKIE, id, options)
    if (!bot) {
      // A row that cannot be written costs only the count: the pin still goes out.
      const status = clean ? "test" : b.verdict === "doubt" ? "doubt" : b.verdict === "ok" ? "returning" : null
      if (status) await writeRow(id, pin.cents, status, b).catch(() => {})
    }
    return res
  } catch {
    return none()
  }
}
