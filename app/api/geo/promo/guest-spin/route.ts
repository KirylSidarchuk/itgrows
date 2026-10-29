import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { clientIp } from "@/lib/geo-check"
import { checkIPRateLimit } from "@/lib/rate-limit"
import { GUEST_WHEEL_COOKIE, type GuestPromoView } from "@/lib/geo-promo"
import { guestReward, guestSpin } from "@/lib/geo-promo-server"

// The launch-rewards wheel on the website, before an account (the exit-intent dialog,
// components/geo/ExitWheelModal.tsx; the rules: lib/geo-promo.ts). No sign-in.
//
// GET -> GuestPromoView: this browser's reward (its itg_wheel cookie), claimed or not, until its date,
// or { reward: null }. Without the cookie it answers without the database.
// POST spins, for a visitor who is not signed in (a signed-in account spins in the cabinet: 409
// "signed_in"), from our own pages only (Origin and Sec-Fetch-Site: 403 "forbidden"), TRIES per
// address per WINDOW_MS (429). The reward is drawn on the server, as the cabinet's
// (lib/geo-promo-server.ts guestSpin), and kept PROMO_WHEEL.validDays: one per browser (the cookie) and
// one per internet address (a browser without the cookie, on an address that has an unclaimed reward,
// gets that reward and its cookie, never a new draw). 403 "off" with PROMO_WHEEL.enabled or .exitIntent
// false.
// The cookie is set only here, on the visitor's spin, and only keeps the reward they asked for:
// httpOnly, Secure, SameSite=Lax, until the reward's date (7 days from the spin).
// The page counts geo_wheel_exit_seen / geo_wheel_exit_spin itself (/api/track, like every public-page
// event); the move into an account is counted where it happens (geo_wheel_claimed).

export const dynamic = "force-dynamic"

const TRIES = 10
const WINDOW_MS = 10 * 60_000
const NO_STORE = { "Cache-Control": "no-store" }

/** Sent by a page of this site: the browser's Origin is this host, and Sec-Fetch-Site (where sent) agrees. */
function sameOrigin(req: NextRequest): boolean {
  const site = req.headers.get("sec-fetch-site")
  if (site && site !== "same-origin") return false
  const origin = req.headers.get("origin")
  if (!origin) return false
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const g = await guestReward(req.cookies.get(GUEST_WHEEL_COOKIE)?.value)
    const body: GuestPromoView = { reward: g ? { id: g.reward, expiresAt: g.expiresAt, claimed: g.claimed } : null }
    return NextResponse.json(body, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502, headers: NO_STORE })
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const ip = clientIp(req.headers)
  if (!ip) return NextResponse.json({ error: "unavailable" }, { status: 400 })
  if (!checkIPRateLimit(`guest-wheel:${ip}`, TRIES, WINDOW_MS).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  const session = await auth().catch(() => null)
  if (session?.user?.id) return NextResponse.json({ error: "signed_in" }, { status: 409 })

  let result: Awaited<ReturnType<typeof guestSpin>>
  try {
    result = await guestSpin(req.cookies.get(GUEST_WHEEL_COOKIE)?.value, ip)
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 })

  const { guest, fresh } = result
  const body: GuestPromoView = { reward: { id: guest.reward, expiresAt: guest.expiresAt, claimed: guest.claimed }, fresh }
  const res = NextResponse.json(body, { headers: NO_STORE })
  res.cookies.set(GUEST_WHEEL_COOKIE, guest.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor((Date.parse(guest.expiresAt) - Date.now()) / 1000)),
  })
  return res
}
