import { PREFIXED } from "@/lib/i18n/config"

// Which pages belong to the public AI-visibility (GEO) site, for what the root layout puts outside the
// pages themselves: the cookie banner (components/CookieBanner.tsx, which had this list until 29 Oct
// 2026) and the exit-intent wheel (components/geo/ExitWheel.tsx).

/** The type of the GEO pages (app/page.tsx and the other public pages set it on their own wrapper).
 *  What sits in <body> outside that wrapper names the same family itself; without it, it came out in
 *  the browser's default serif. */
export const GEO_SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

// The GEO site, in every language (/de, /fr, /es, /ru): its home, /business and everything under it
// (the GEO cabinet and guides included), the blog, /about and the legal pages. Every other page is
// not: first of all the LinkedIn/X product (/personal, /company, /cabinet, /dashboard, /reddit…), and
// /login and /signup, which that product shares.
const GEO_PAGES: ReadonlySet<string> = new Set(["/", "/about", "/privacy", "/terms"])
const GEO_SECTIONS = ["/business", "/blog"] // each with everything under it
const LOCALE_PREFIX = new RegExp(`^/(?:${PREFIXED.join("|")})(?=/|$)`)

/** "/de/about/" -> "/about", "/de" -> "/". */
const bare = (pathname: string) => pathname.replace(LOCALE_PREFIX, "").replace(/\/+$/, "") || "/"
const under = (path: string, section: string) => path === section || path.startsWith(`${section}/`)

export function isGeoPage(pathname: string | null): boolean {
  if (!pathname) return false
  const path = bare(pathname)
  return GEO_PAGES.has(path) || GEO_SECTIONS.some((s) => under(path, s))
}

// The exit-intent wheel (lib/geo-promo.ts PROMO_WHEEL.exitIntent) is for the GEO pages a visitor
// reads before having an account: never the cabinet and its plan and checkout (/business/dashboard),
// the legal pages, or the blogs we host for clients (/blog/sites/<site>), which are theirs. Sign-in,
// sign-up and the LinkedIn/X product are not GEO pages to begin with.
const NO_EXIT_WHEEL_PAGES: ReadonlySet<string> = new Set(["/privacy", "/terms"])
const NO_EXIT_WHEEL_SECTIONS = ["/business/dashboard", "/blog/sites"] // each with everything under it

export function isExitWheelPage(pathname: string | null): boolean {
  if (!pathname || !isGeoPage(pathname)) return false
  const path = bare(pathname)
  return !NO_EXIT_WHEEL_PAGES.has(path) && !NO_EXIT_WHEEL_SECTIONS.some((s) => under(path, s))
}
