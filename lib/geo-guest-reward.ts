import { useEffect, useSyncExternalStore } from "react"
import { markGuestRewardGone, mayHoldGuestReward } from "@/lib/geo-exit-wheel"
import { isWheelReward, type GuestPromoView, type WheelReward } from "@/lib/geo-promo"
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config"

// A reward won on the website's wheel (components/geo/ExitWheelModal.tsx; the rules: lib/geo-promo.ts),
// as the browser knows it before an account, for its reminders (components/geo/GuestRewardNote.tsx: at
// the quick check's form, at its account offer, on /signup and /login). The server keeps the reward
// (geo_guest_promos, the httpOnly itg_wheel cookie); GET /api/geo/promo/guest-spin says whether this
// browser holds one. The browser asks only where it has spun (lib/geo-exit-wheel.ts mayHoldGuestReward:
// its localStorage flag, or a spin in this page load), at most once per page load, so the visitors who
// never spun send no request. The spin itself, and the exit wheel's own check, hand the reward over
// with no request (holdGuestReward). Shown only while it can still be claimed: not in an account yet,
// not past its date. Client only.

export type HeldReward = { id: WheelReward; expiresAt: string }

const API = "/api/geo/promo/guest-spin"
let held: HeldReward | null = null
let asked = false
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}
const current = () => held
const nothing = () => null

/** The server's answer for this browser's reward (the spin's, or GET's): kept for the page while it can
 *  still be claimed; otherwise none, and the browser stops asking. */
export function holdGuestReward(r: GuestPromoView["reward"]) {
  const ok = r && isWheelReward(r.id) && !r.claimed && Date.parse(r.expiresAt) > Date.now()
  held = ok ? { id: r.id, expiresAt: r.expiresAt } : null
  if (!ok) markGuestRewardGone()
  for (const onChange of listeners) onChange()
}

async function ask() {
  if (asked || held || !mayHoldGuestReward()) return
  asked = true
  try {
    const r = await fetch(API, { cache: "no-store" })
    // A failed answer is not "no reward": asked again on the next page load.
    if (!r.ok) return
    const j = (await r.json()) as GuestPromoView
    holdGuestReward(j?.reward ?? null)
  } catch {
    // The reminder never gets in the way of the page.
  }
}

/** This browser's reward from the website's wheel while it can be claimed; null while unknown, without
 *  one, and when `on` is false (signed in: the account takes it in the cabinet). */
export function useGuestReward(on: boolean): HeldReward | null {
  const reward = useSyncExternalStore(subscribe, current, nothing)
  useEffect(() => {
    if (on) void ask()
  }, [on])
  return on ? reward : null
}

/** The reward's date in the page's language ("November 5 at 2:20 PM", "5. November um 14:20"): the
 *  wheel and the reminders say it the same way. */
export const rewardUntil = (locale: Locale, iso: string) =>
  new Date(iso).toLocaleString(INTL_LOCALE[locale], { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })
