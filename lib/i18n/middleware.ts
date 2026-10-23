import { NextResponse, type NextRequest } from "next/server"
import {
  DEFAULT,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  PATH_ALIASES,
  isBot,
  isLocale,
  isPublicGeoPath,
  preferredLocale,
  splitLocale,
  type Locale,
  type PublicGeoPath,
} from "./config"
import { localePath } from "./paths"

// The language of a public GEO request, decided once at the edge (middleware.ts calls this for
// every path its matcher lets through that is not a cabinet):
//
//   /de/about          -> rewritten to /about, x-itg-locale: de, NEXT_LOCALE=de cookie set
//   /de/business       -> 308 to /de (as /business goes to "/")
//   /de/personal       -> 307 to /personal (only the public GEO pages exist in other languages)
//   /en/about, /en     -> 308 to /about, "/" and NEXT_LOCALE=en: English has no prefix, and this
//                         makes it reachable by address, without the switcher's JavaScript
//   /about             -> x-itg-locale from the NEXT_LOCALE cookie, else "en"; except the first
//                         visit of a person (no cookie, a browser, Accept-Language preferring
//                         de/fr/es/ru, a GET): 307 to /de/about, once (that visit sets the cookie)
//   ad clicks, /login and /signup: the cookie or English, never that first-visit redirect
//   bots, and requests without Accept-Language: English on unprefixed pages, never a redirect,
//   never a cookie
//
// The header is set on the request, not trusted from the client: whatever x-itg-locale arrives
// is overwritten here.

const COOKIE = { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax" as const }

// An ad click lands in the ad's language: the campaigns are English, and a Spanish browser must not
// turn an English ad's page into the Spanish one (with a year-long cookie on top). The markers of
// AD_CLICK in next.config.ts, plus Meta's and Microsoft's click ids.
const AD_CLICK_KEYS = ["gclid", "gbraid", "wbraid", "gad_source", "fbclid", "msclkid"]
// Meta ads arrive with utm_medium=paid_social (see the Ads session notes), search ads with cpc/ppc.
const PAID_MEDIUM = /^(cpc|ppc|paid|paid[_-]?social|paid[_-]?search)$/i

function isAdClick(req: NextRequest): boolean {
  const q = req.nextUrl.searchParams
  return AD_CLICK_KEYS.some((k) => q.has(k)) || PAID_MEDIUM.test(q.get("utm_medium") ?? "")
}

// The sign-in pages are also entered from the English LinkedIn/X product and /cabinet, so the
// browser's language does not pick theirs: only an explicit /xx address or the cookie does.
const NO_DETECTION: ReadonlySet<string> = new Set<PublicGeoPath>(["/login", "/signup"])

// "/en" and "/en/…", the rest of the path in group 1.
const EN_PREFIX = /^\/en(?=\/|$)(.*)$/

function isPrefetch(req: NextRequest): boolean {
  const purpose = req.headers.get("sec-purpose") ?? req.headers.get("purpose") ?? ""
  return req.headers.has("next-router-prefetch") || /prefetch/i.test(purpose)
}

function serve(req: NextRequest, locale: Locale, rewriteTo?: URL): NextResponse {
  const headers = new Headers(req.headers)
  headers.set(LOCALE_HEADER, locale)
  const res = rewriteTo
    ? NextResponse.rewrite(rewriteTo, { request: { headers } })
    : NextResponse.next({ request: { headers } })
  res.headers.set("Content-Language", locale)
  return res
}

function redirect(req: NextRequest, href: string, status: 307 | 308): NextResponse {
  const url = req.nextUrl.clone()
  const cut = href.indexOf("#")
  url.pathname = cut === -1 ? href : href.slice(0, cut)
  const res = NextResponse.redirect(url, status)
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export function localeMiddleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const acceptLanguage = req.headers.get("accept-language")?.trim()
  const machine = isBot(req.headers.get("user-agent")) || !acceptLanguage

  const en = EN_PREFIX.exec(pathname)
  if (en) {
    const rest = en[1] || "/"
    const target = Object.prototype.hasOwnProperty.call(PATH_ALIASES, rest) ? PATH_ALIASES[rest] : rest
    if (!isPublicGeoPath(target)) return redirect(req, rest, 307)
    const res = redirect(req, localePath(DEFAULT, target), 308)
    if (!machine && !isPrefetch(req) && req.cookies.get(LOCALE_COOKIE)?.value !== DEFAULT) {
      res.cookies.set(LOCALE_COOKIE, DEFAULT, COOKIE)
    }
    return res
  }

  const { locale: prefix, path } = splitLocale(pathname)

  if (prefix) {
    const alias = Object.prototype.hasOwnProperty.call(PATH_ALIASES, path) ? PATH_ALIASES[path] : null
    if (alias) return redirect(req, localePath(prefix, alias), 308)
    if (!isPublicGeoPath(path)) return redirect(req, path, 307)
    const target = req.nextUrl.clone()
    target.pathname = path
    const res = serve(req, prefix, target)
    if (!machine && !isPrefetch(req) && req.cookies.get(LOCALE_COOKIE)?.value !== prefix) {
      res.cookies.set(LOCALE_COOKIE, prefix, COOKIE)
    }
    return res
  }

  if (!isPublicGeoPath(pathname)) return NextResponse.next()
  if (machine) return serve(req, DEFAULT)

  const chosen = req.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return serve(req, chosen)
  // localePath(DEFAULT, …) is the bare English address ("/login/" -> "/login").
  if (isAdClick(req) || NO_DETECTION.has(localePath(DEFAULT, pathname))) return serve(req, DEFAULT)

  const preferred = preferredLocale(acceptLanguage)
  const navigation = (req.method === "GET" || req.method === "HEAD") && !isPrefetch(req)
  if (preferred && preferred !== DEFAULT && navigation) {
    const res = redirect(req, localePath(preferred, pathname), 307)
    res.headers.set("Vary", "Accept-Language, Cookie, User-Agent")
    return res
  }
  return serve(req, DEFAULT)
}
