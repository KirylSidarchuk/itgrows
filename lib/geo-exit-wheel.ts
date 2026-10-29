// The exit-intent wheel in the browser (components/geo/ExitWheel.tsx opens it, ExitWheelModal.tsx is
// the dialog; the rules: lib/geo-promo.ts). When it may open, and what the browser keeps of it: one
// localStorage item, KEY, {"seen": <ms>} once shown and {"spun": <ms>, "until": <ms>} once spun. Shown:
// not again for 30 days; spun: never again in this browser. Where storage is refused (private windows,
// blocked site data) it opens at most once per page load. Client only.
// `spun` is also the cheap sign that this browser may hold a reward, so its reminders
// (lib/geo-guest-reward.ts) ask the server only then; `until` is the reward's date once known, and 0
// once the server says the browser has none to claim (none, past its date, or in an account already),
// so it stops asking. Where storage is refused, a spin in this page load still counts (spunHere).

/** Time on the site in this tab before the wheel may open (counted from the page load). */
export const EXIT_AFTER_MS = 15_000
/** Once shown, not again for this long. */
const AGAIN_MS = 30 * 86_400_000
const KEY = "itg_exit_wheel"

type Stored = { seen?: number; spun?: number; until?: number }

let shownHere = false
/** Spun in this page load (known even where storage is refused). */
let spunHere: Stored | null = null

/** A computer: a mouse (hover, a fine pointer) and a window 1024 px wide or more. Never a phone or tablet. */
export function isDesktop(): boolean {
  try {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 1024
  } catch {
    return false
  }
}

/** What this browser keeps, or null (nothing, unreadable, or storage refused). */
function stored(): Stored | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Stored | null
    return v && typeof v === "object" ? v : null
  } catch {
    return null
  }
}

/** Already shown in this page load, spun in this browser, or shown here in the last 30 days. */
export function exitWheelDone(now = Date.now()): boolean {
  if (shownHere) return true
  const v = stored()
  if (!v) return false
  if (typeof v.spun === "number") return true
  return typeof v.seen === "number" && Math.abs(now - v.seen) < AGAIN_MS
}

function remember(v: Stored) {
  shownHere = true
  if (typeof v.spun === "number") spunHere = v
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // Storage refused: once per page load (shownHere, spunHere).
  }
}

/** The wheel opened: not again for 30 days. */
export const markExitWheelShown = () => remember({ seen: Date.now() })

/** A reward was won in this browser (or it already had one): never again here. `expiresAt`: the
 *  reward's date, when known. */
export function markExitWheelSpun(expiresAt?: string) {
  const until = expiresAt ? Date.parse(expiresAt) : NaN
  remember(Number.isFinite(until) ? { spun: Date.now(), until } : { spun: Date.now() })
}

/** This browser may hold a reward from the website's wheel: it spun (stored, or in this page load), and
 *  the reward's date, when known, has not passed. */
export function mayHoldGuestReward(now = Date.now()): boolean {
  const v = spunHere ?? stored()
  return typeof v?.spun === "number" && (typeof v.until !== "number" || v.until > now)
}

/** The server says this browser has no reward to claim: its reminders stop asking. */
export function markGuestRewardGone() {
  const v = spunHere ?? stored()
  remember({ spun: typeof v?.spun === "number" ? v.spun : Date.now(), until: 0 })
}
