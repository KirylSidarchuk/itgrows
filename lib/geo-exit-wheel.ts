// The exit-intent wheel in the browser (components/geo/ExitWheel.tsx opens it, ExitWheelModal.tsx is
// the dialog; the rules: lib/geo-promo.ts). When it may open, and what the browser keeps of it: one
// localStorage item, KEY, {"seen": <ms>} once shown and {"spun": <ms>} once spun. Shown: not again for
// 30 days; spun: never again in this browser. Where storage is refused (private windows, blocked site
// data) it opens at most once per page load. Client only.

/** Time on the site in this tab before the wheel may open (counted from the page load). */
export const EXIT_AFTER_MS = 15_000
/** Once shown, not again for this long. */
const AGAIN_MS = 30 * 86_400_000
const KEY = "itg_exit_wheel"

let shownHere = false

/** A computer: a mouse (hover, a fine pointer) and a window 1024 px wide or more. Never a phone or tablet. */
export function isDesktop(): boolean {
  try {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 1024
  } catch {
    return false
  }
}

/** Already shown in this page load, spun in this browser, or shown here in the last 30 days. */
export function exitWheelDone(now = Date.now()): boolean {
  if (shownHere) return true
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as { seen?: unknown; spun?: unknown } | null
    if (!v || typeof v !== "object") return false
    if (typeof v.spun === "number") return true
    return typeof v.seen === "number" && Math.abs(now - v.seen) < AGAIN_MS
  } catch {
    return false
  }
}

function remember(v: { seen: number } | { spun: number }) {
  shownHere = true
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // Storage refused: once per page load (shownHere).
  }
}

/** The wheel opened: not again for 30 days. */
export const markExitWheelShown = () => remember({ seen: Date.now() })
/** A reward was won in this browser (or it already had one): never again here. */
export const markExitWheelSpun = () => remember({ spun: Date.now() })
