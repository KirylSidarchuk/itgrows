import type { NextRequest } from "next/server"
import { ONE_PRICE_MONTH, PRICE_TEST, armAt, isLiveArm } from "@/lib/geo-pricing"
import { FRESH_VISIT_COOKIE, VISIT_COOKIE } from "@/lib/geo-price-earlier-visit"

// For scripts/i18n-check.ts: the settings this module actually reads, whatever way a loader imports it.
export { PRICE_TEST }

// The price test for a visitor, at the proxy (middleware.ts): which price a request is shown, before
// anything is rendered, so the very first page already has it. The rules are at the top of
// lib/geo-pricing.ts. Web Crypto only and no database: this runs in the Edge runtime.
//
// Two first-party cookies, HttpOnly, 400 days:
//   itg_vid    a random id, nothing else;
//   itg_price  the pin: "<epoch>.<cents>.<flag>.<signature>". The signature (HMAC with AUTH_SECRET over
//              the id and the rest) is why a visitor cannot write himself a price: a pin that does not
//              verify counts as doubt, and doubt is the one price. The flags:
//     n  new: an arm is assigned, the returning check is not settled yet (the render asks the database,
//        lib/geo-price-server.ts, and the browser settles it, /api/geo/price);
//     t  in the test, on this arm for good;
//     r  outside the test on the one price: visited before, or any doubt;
//     l  outside the test on the one price: a sales link (?ref=li).
//
// What decides, in order, with no decision on the user agent except the AI crawlers' line:
//   ?price_qa=<arm>.<hmac>  that arm for this request, nothing stored (a bad hmac is ignored);
//   an AI training or answer crawler (AI_CRAWLER)  the one price, no cookie;
//   a pin of this epoch  it holds; ?ref=li turns it into l; an arm with weight 0 moves to a live arm;
//   our own cookies that do not verify, or an older cookie of ours (OLDER_COOKIE), or no address  r;
//   ?ref=li  l;
//   anyone else, search engines, ad reviewers and link previews included  an arm, from a hash of the
//   address. A bot keeps no cookie and still sees the same arm next time, through this same path.
//
// A request reaches the render with the signed pin and the id in request headers, whatever the client
// sent is dropped (middleware.ts): the render trusts them only after verifying the signature.
//
// Who gets the cookies: only a page the browser itself opens (sec-fetch-dest document, or a client that does
// not send it). The router's own fetches of a page, a link's prefetch or a click on it, say "empty"; Next
// hides its flight headers from the proxy, so nothing else tells them apart, and a prefetch looks like the
// click. A page outside the test can start several at once, and a late answer would overwrite what the page
// already opened holds. So they get the pin in the request headers alone, for the render. When such a fetch
// did render a page, the render hands the id and the signed pin to the page (lib/geo-price-server.ts,
// PRICE_CARRY_HEADER), and the page's settle sets both cookies (/api/geo/price). A prefetch renders no page
// and leaves nothing behind.

export const VISITOR_COOKIE = "itg_vid"
export const PRICE_COOKIE = "itg_price"
export const PRICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export const PRICE_HEADER = "x-itg-price"
export const VISITOR_HEADER = "x-itg-vid"
export const PRICE_QA_HEADER = "x-itg-price-qa"
export const PRICE_EVENT_HEADER = "x-itg-price-event"
/** This pin is in the headers only, no cookie went out with it. */
export const PRICE_CARRY_HEADER = "x-itg-price-carry"
const REQUEST_HEADERS = [PRICE_HEADER, VISITOR_HEADER, PRICE_QA_HEADER, PRICE_EVENT_HEADER, PRICE_CARRY_HEADER]

export const PRICE_QA_PARAM = "price_qa"
const SALES_PARAM = "ref"
const SALES_VALUE = "li"

export type PinFlag = "n" | "t" | "r" | "l"
export interface Pin {
  epoch: string
  cents: number
  flag: PinFlag
}

/** AI training and answer crawlers, the only agents the price depends on: never a search engine, an ad
 *  reviewer or a link preview (Googlebot, AdsBot-Google, Bingbot, facebookexternalhit, Applebot ...
 *  are treated like any new visitor; Google's rules for site tests ask for that). */
const AI_CRAWLER =
  /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|cohere-ai|Bytespider|MistralAI-User|DuckAssistBot|YouBot|Amazonbot|Meta-ExternalAgent|Diffbot|Timpibot/i

export const isAiCrawler = (ua: string) => AI_CRAWLER.test(ua)

/** The sign-in. Of its cookies only the session itself: authjs.csrf-token and authjs.callback-url come from
 *  the first page of any visit (SessionProvider asks /api/auth/session), a page outside the test included. */
const SIGNED_IN_COOKIE = /^(?:__Secure-|__Host-)?(?:authjs|next-auth)\.session-token(?:\.\d+)?$/

/** Cookies older than the test, on a request without our own: someone who has been here. The website's
 *  wheel, the language and the optional ones after "Accept" can also come up during this visit, on a page
 *  outside the test; they do not count when the visit began without any (lib/geo-price-earlier-visit.ts). */
export const hasOlderCookie = (names: string[]) =>
  names.some((n) => SIGNED_IN_COOKIE.test(n)) || (!names.includes(FRESH_VISIT_COOKIE) && names.some((n) => VISIT_COOKIE.test(n)))

/** A signed-in browser: the JWT session cookie, possibly split in chunks. */
export const SESSION_COOKIE = /(?:^|;\s*)(?:__Secure-|__Host-)?(?:authjs|next-auth)\.session-token/

const ID = /^[0-9a-f]{32}$/
const enc = new TextEncoder()
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("")

let key: Promise<CryptoKey> | null = null
function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("no server secret for the price test")
  key ??= crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return key
}

/** HMAC-SHA256 with the server secret, in hex: 32 characters unless asked for all of it. */
export async function priceHmac(message: string, whole = false): Promise<string> {
  const h = hex(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(message)))
  return whole ? h : h.slice(0, 32)
}

const same = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** The arm of a seed, a visitor's id or an account's: sha256(seed:experiment) over the live arms'
 *  weights, as pickaclass buckets its visitors. Stable with no database. */
export async function bucketArm(seed: string): Promise<number> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`${seed}:${PRICE_TEST.experiment}`)))
  let n = 0
  for (let i = 0; i < 6; i++) n = n * 256 + h[i]
  return armAt(n / 2 ** 48)
}

const pinBody = (p: Pin) => `${p.epoch}.${p.cents}.${p.flag}`

export async function signPin(id: string, pin: Pin): Promise<string> {
  const body = pinBody(pin)
  return `${body}.${await priceHmac(`price-pin|${id}|${body}`)}`
}

/** The pin of a cookie or header value, if its signature holds for this id; else null. */
export async function readPin(id: string | null | undefined, raw: string | null | undefined): Promise<Pin | null> {
  if (!id || !raw || !ID.test(id)) return null
  const m = /^([a-z0-9]+)\.(\d{1,7})\.([ntrl])\.([0-9a-f]{32})$/.exec(raw)
  if (!m) return null
  const pin: Pin = { epoch: m[1], cents: Number(m[2]), flag: m[3] as PinFlag }
  return same(m[4], await priceHmac(`price-pin|${id}|${pinBody(pin)}`)) ? pin : null
}

/** The value of a QA link for one arm: "<cents>.<hmac>". */
export const qaLinkValue = async (cents: number) => `${cents}.${await priceHmac(`price-qa|${cents}`)}`

/** The arm a QA link forces, or null: any arm of the test, with a valid hmac. Never recorded. */
export async function readQaLink(value: string | null | undefined): Promise<number | null> {
  const m = /^(\d{1,7})\.([0-9a-f]{32})$/.exec(value ?? "")
  if (!m || !PRICE_TEST.enabled) return null
  const cents = Number(m[1])
  if (!PRICE_TEST.variants.includes(cents)) return null
  return same(m[2], await priceHmac(`price-qa|${cents}`)) ? cents : null
}

/** The render's answer to the returning check, signed so that the browser cannot claim a clean check
 *  it did not get: /api/geo/price moves a pin to "t" only with this. */
export const settleToken = (id: string) => priceHmac(`price-settle|${id}`)
export const settleTokenValid = async (id: string, token: unknown) =>
  typeof token === "string" && same(token, await settleToken(id))

export function priceCookieOptions(secure: boolean) {
  return { path: "/", maxAge: PRICE_COOKIE_MAX_AGE, sameSite: "lax" as const, httpOnly: true, secure }
}

/** The first address of x-forwarded-for, as Vercel reports the visitor's; "" if there is none. */
export function visitorAddress(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || ""
}

/** What the proxy decided: the request headers for the render, the cookies for the response. */
export interface PriceDecision {
  headers: Record<string, string>
  cookies: Record<string, string>
}

const newId = () => hex(crypto.getRandomValues(new Uint8Array(16)).buffer)

/** The decision for one request; null: nothing to say, so the render shows the one price (the test is
 *  off, an AI crawler, a form post from someone not assigned, or anything failed). Never throws. */
export async function decidePrice(req: NextRequest): Promise<PriceDecision | null> {
  try {
    if (!PRICE_TEST.enabled) return null
    const q = req.nextUrl.searchParams
    const qa = q.get(PRICE_QA_PARAM)
    if (qa && (await readQaLink(qa)) !== null) return { headers: { [PRICE_QA_HEADER]: qa }, cookies: {} }
    const ua = req.headers.get("user-agent") ?? ""
    if (isAiCrawler(ua)) return null

    const read = req.method === "GET" || req.method === "HEAD"
    const dest = req.headers.get("sec-fetch-dest")
    // See the top of this file: only a page the browser itself opens gets new cookies, or a sales link's pin.
    const opening = read && (dest === null || dest === "document")
    const sales = opening && q.get(SALES_PARAM) === SALES_VALUE
    const heldId = req.cookies.get(VISITOR_COOKIE)?.value
    const heldPin = req.cookies.get(PRICE_COOKIE)?.value
    const id = heldId && ID.test(heldId) ? heldId : newId()
    const pin = heldId ? await readPin(id, heldPin) : null

    if (pin && pin.epoch === PRICE_TEST.epoch) {
      const inTest = pin.flag === "n" || pin.flag === "t"
      let next = pin
      let event: string | null = null
      if (sales && pin.flag !== "l") {
        next = { epoch: pin.epoch, cents: ONE_PRICE_MONTH, flag: "l" }
        event = "ref"
      } else if (inTest && !isLiveArm(pin.cents)) {
        // An arm with weight 0 releases those who have not paid (a payer is priced by the account). Any
        // request may write this: same id, and the arm follows from the id.
        next = { ...pin, cents: await bucketArm(id) }
      }
      const value = next === pin ? (heldPin as string) : await signPin(id, next)
      return {
        headers: { [PRICE_HEADER]: value, [VISITOR_HEADER]: id, ...(event ? { [PRICE_EVENT_HEADER]: event } : {}) },
        cookies: next === pin ? {} : { [PRICE_COOKIE]: value },
      }
    }
    if (!read) return null

    let next: Pin = { epoch: PRICE_TEST.epoch, cents: ONE_PRICE_MONTH, flag: sales ? "l" : "r" }
    const address = visitorAddress(req.headers)
    const fresh = !heldId && !heldPin && !hasOlderCookie(req.cookies.getAll().map((c) => c.name))
    if (!sales && fresh && address) {
      // The arm from the address alone, not from the new id or the agent: the first page of a visitor, a bot
      // that never keeps the cookie, a visitor who cleared his cookies, and one person going from Instagram's
      // in-app browser to Safari on the same connection all get the same answer.
      next = { epoch: PRICE_TEST.epoch, cents: await bucketArm(await priceHmac(`price-seed|${address}`)), flag: "n" }
    }
    const value = await signPin(id, next)
    if (!opening) return { headers: { [PRICE_HEADER]: value, [VISITOR_HEADER]: id, [PRICE_CARRY_HEADER]: "1" }, cookies: {} }
    return {
      headers: { [PRICE_HEADER]: value, [VISITOR_HEADER]: id, ...(sales ? { [PRICE_EVENT_HEADER]: "ref" } : {}) },
      cookies: { [VISITOR_COOKIE]: id, [PRICE_COOKIE]: value },
    }
  } catch {
    return null
  }
}

/** A copy of the request's headers carrying the decision, with whatever the client sent under our
 *  header names dropped. */
export function priceRequestHeaders(req: NextRequest, decision: PriceDecision | null): Headers {
  const h = new Headers(req.headers)
  for (const name of REQUEST_HEADERS) h.delete(name)
  if (decision) for (const [name, value] of Object.entries(decision.headers)) h.set(name, value)
  return h
}

/** The GEO pages that show a price or lead to one. Not the cabinets (the account decides there), not
 *  the LinkedIn/X product, not the markdown alternates: they stay at the one price. */
const GUIDE = /^\/business\/blog\/[a-z0-9-]+\/?$/
const BLOG_POST = /^\/blog\/[a-z0-9-]+\/?$/
const LOCALE_PREFIX = /^\/(?:de|fr|es|ru)(?=\/|$)/
const PRICED_PAGES: ReadonlySet<string> = new Set([
  "/",
  "/business",
  "/business/ai-visibility-checker",
  "/business/ai-crawler-checker",
  "/business/sample-report",
  "/about",
  "/login",
  "/signup",
])

export function isPricedPath(pathname: string): boolean {
  const path = (pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname).replace(LOCALE_PREFIX, "") || "/"
  return PRICED_PAGES.has(path) || (path === pathname && (GUIDE.test(path) || BLOG_POST.test(path)))
}
