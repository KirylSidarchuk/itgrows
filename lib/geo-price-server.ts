import { cache } from "react"
import { headers } from "next/headers"
import { GEO_PRICES, ONE_PRICE_MONTH, PRICE_TEST, geoPrices, type GeoPrices } from "@/lib/geo-pricing"
import { accountPrices } from "@/lib/geo-price-test"
import { returningVisitor } from "@/lib/geo-price-returning"
import {
  PRICE_CARRY_HEADER,
  PRICE_EVENT_HEADER,
  PRICE_HEADER,
  PRICE_QA_HEADER,
  SESSION_COOKIE,
  VISITOR_HEADER,
  readPin,
  readQaLink,
  settleToken,
  visitorAddress,
} from "@/lib/geo-price-visitor"

// The one server function that says what price this request shows (rules: lib/geo-pricing.ts), for
// server components: a page's text and JSON-LD read it directly, its client components through
// components/geo/PriceScope.tsx. Remembered for the request. A QA link first; a signed-in account next:
// its own price, a hand-set client or an account from before the test the one price (lib/geo-price-test.ts);
// otherwise the visitor's pin from the proxy (lib/geo-price-visitor.ts). A pin not yet settled asks the
// database once whether this visitor has been here before. No header (an AI crawler, a static page, the
// test off), a pin that does not verify, or any error: the one price. Reading the request's headers
// makes the route dynamic; every priced page must be, see CACHING at the top of lib/geo-pricing.ts.

/** What the page's client side needs: the price, and what to tell the server (components/geo/PriceProvider.tsx). */
export interface PriceClientState {
  monthCents: number
  /** "new": assigned on this visit, to be settled; "test": in the test; "out": everyone else, nothing is recorded. */
  state: "new" | "test" | "out"
  /** The render's returning check, for "new". */
  verdict: "ok" | "returning" | "doubt" | null
  /** The signed proof of a clean check. */
  token: string | null
  /** A sales link has just taken this visitor out of the test. */
  event: "ref" | null
  /** The id and the signed pin, only for "new" on a page the router fetched: no cookie went out with them,
   *  and the settle sets both from these (lib/geo-price-visitor.ts). */
  id?: string
  pin?: string
}

export interface VisitorPrice {
  monthCents: number
  prices: GeoPrices
  client: PriceClientState
}

const out = (monthCents: number, event: "ref" | null = null): VisitorPrice => ({
  monthCents,
  prices: monthCents === ONE_PRICE_MONTH ? GEO_PRICES : geoPrices(monthCents),
  client: { monthCents, state: "out", verdict: null, token: null, event },
})

/** The account's monthly price when this browser is signed in; null when it is not. The session is read
 *  only if its cookie is there, so an anonymous visitor costs nothing here. */
async function signedInMonth(h: Headers): Promise<number | null> {
  if (!SESSION_COOKIE.test(h.get("cookie") ?? "")) return null
  const { auth } = await import("@/auth")
  const userId = (await auth())?.user?.id
  if (!userId) return null
  return (await accountPrices(userId)).prices.monthCents
}

export const visitorPrice = cache(async (): Promise<VisitorPrice> => {
  try {
    const h = await headers()
    const qa = await readQaLink(h.get(PRICE_QA_HEADER))
    if (qa !== null) return out(qa)
    // A sales link has just pinned this browser: the page tells the server, which moves a signed-in account too.
    const event = PRICE_TEST.enabled && h.get(PRICE_EVENT_HEADER) === "ref" ? "ref" : null
    const account = await signedInMonth(h)
    if (account !== null) return out(account, event)
    if (!PRICE_TEST.enabled) return out(ONE_PRICE_MONTH)

    const id = h.get(VISITOR_HEADER)
    const pin = await readPin(id, h.get(PRICE_HEADER))
    if (!id || !pin || pin.epoch !== PRICE_TEST.epoch) return out(ONE_PRICE_MONTH)
    if (pin.flag === "r") return out(ONE_PRICE_MONTH)
    if (pin.flag === "l") return out(ONE_PRICE_MONTH, event)

    const test = (monthCents: number, client: Omit<PriceClientState, "monthCents" | "event">): VisitorPrice => ({
      monthCents,
      prices: geoPrices(monthCents),
      client: { monthCents, event: null, ...client },
    })
    if (pin.flag === "t") return test(pin.cents, { state: "test", verdict: null, token: null })

    const answer = await returningVisitor(visitorAddress(h), h.get("user-agent") ?? "")
    const carry = h.get(PRICE_CARRY_HEADER) ? { id, pin: h.get(PRICE_HEADER) as string } : {}
    if (answer === "new") return test(pin.cents, { state: "new", verdict: "ok", token: await settleToken(id), ...carry })
    return test(ONE_PRICE_MONTH, { state: "new", verdict: answer, token: null, ...carry })
  } catch {
    return out(ONE_PRICE_MONTH)
  }
})
