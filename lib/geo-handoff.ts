// The quick check on "/" leaves its result in this browser for the next steps of the funnel, under two
// keys with different jobs:
// - itg_geo_checked: written as soon as a check shows its answers (app/business/AuditForm.tsx). Only the
//   pricing block reads it (app/business/PricingPlans.tsx): "You've checked {site}. Open all 5 answers".
// - itg_geo_handoff: written when the visitor heads for sign-up with a checked site (the check's own
//   buttons, or the pricing block). Sign-up shows the check's count from it, and the GEO cabinet follows
//   its site (app/business/dashboard/visibility/page.tsx). So it is never written just because a result
//   was shown: a customer who checks a competitor would have the competitor followed.
// Both hold { site, named, of, at } and count for 24 hours, how long the cabinet follows a handed-over site.

export const GEO_CHECKED_KEY = "itg_geo_checked"
export const GEO_HANDOFF_KEY = "itg_geo_handoff"
const MAX_AGE_MS = 86_400_000

export type CheckedSite = { site: string; named: number | null; of: number | null }

/** A bare domain ("example.com") and nothing else: no scheme, path, port, spaces or markup. */
export function isBareDomain(site: string): boolean {
  return site.length <= 100 && /^[^\s/?#<>@:.]+(\.[^\s/?#<>@:.]+)+$/.test(site)
}

const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)

function readKey(key: string): CheckedSite | null {
  try {
    const h = JSON.parse(localStorage.getItem(key) ?? "null") as { site?: unknown; named?: unknown; of?: unknown; at?: unknown } | null
    const site = typeof h?.site === "string" ? h.site.trim().toLowerCase() : ""
    if (!h || !isBareDomain(site)) return null
    if (typeof h.at !== "number" || Date.now() - h.at > MAX_AGE_MS) return null
    return { site, named: count(h.named), of: count(h.of) }
  } catch {
    return null
  }
}

/** The site this browser checked in the last 24 hours: the shown result first, then the hand-over. */
export function readChecked(): CheckedSite | null {
  return readKey(GEO_CHECKED_KEY) ?? readKey(GEO_HANDOFF_KEY)
}

/** A check showed its answers. */
export function rememberChecked(site: string, named: number | null, of: number | null) {
  try {
    localStorage.setItem(GEO_CHECKED_KEY, JSON.stringify({ site, named, of, at: Date.now() }))
  } catch {
    // Without storage the pricing block keeps its plain line.
  }
}

/** On the way to sign-up with a checked site. */
export function handOff(site: string, named: number | null, of: number | null) {
  try {
    localStorage.setItem(GEO_HANDOFF_KEY, JSON.stringify({ site, named, of, at: Date.now() }))
  } catch {
    // Sign-up still gets the site from the address.
  }
}
