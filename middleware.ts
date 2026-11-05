import { auth } from "@/auth"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { localeMiddleware } from "@/lib/i18n/middleware"
import { LOCALE_HEADER } from "@/lib/i18n/config"
import { GERMAN_GUIDE_SLUGS } from "@/lib/geo-guides"
import { decidePrice, isPricedPath, priceCookieOptions, priceRequestHeaders } from "@/lib/geo-price-visitor"

// Two jobs, kept apart so the public pages never wait on a session lookup:
// 1. The cabinets (/dashboard, /business/dashboard, /cabinet) require a login, exactly as before.
// 2. The public AI-visibility pages get their language (lib/i18n/middleware.ts): /de, /fr, /es and
//    /ru are rewritten to the same page in that language, /en/… goes to the unprefixed English
//    address, and a first visit is sent once to the visitor's own language.
// 3. The German guides (/business/blog/<German slug>) are marked German, nothing else changes.
// 4. The plan's price test: the price a public GEO page shows is decided here, before it renders, and
//    reaches it in request headers (lib/geo-price-visitor.ts). The cabinets and the LinkedIn/X product
//    are not part of it.

const CABINETS = ["/dashboard", "/business/dashboard", "/cabinet"]

const requireLogin = auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isDashboard = nextUrl.pathname.startsWith("/dashboard")
  const isBusinessDashboard = nextUrl.pathname.startsWith("/business/dashboard")
  const isCabinet = nextUrl.pathname.startsWith("/cabinet")

  if ((isDashboard || isBusinessDashboard || isCabinet) && !isLoggedIn) {
    // A sales link into the GEO cabinet keeps its mark: the sign-in page pins the one price (lib/geo-price-visitor.ts).
    const sales = isBusinessDashboard && nextUrl.searchParams.get("ref") === "li" ? "&ref=li" : ""
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}${sales}`, nextUrl))
  }

  return NextResponse.next()
})

// The German guides are the #de section of the one guides list (app/business/blog/page.tsx), not a
// page of their own. /de/business/blog goes there for good (308, with the anchor), instead of the
// temporary 307 to the top of the English list that lib/i18n/middleware.ts gives every other
// prefixed address outside the GEO pages. /de/business/blog/<slug> is unchanged: 307 to the article.
const DE_GUIDES = /^\/de\/business\/blog\/?$/

// A guide in German (its slug in lib/geo-guides.ts; no database at the edge) gets the language header
// "de" and Content-Language: de, so app/layout.tsx renders <html lang="de">. Every other guide is
// English: a client-sent language header is dropped, as lib/i18n/middleware.ts does. No cookie and
// no redirect: reading a German article does not choose the visitor's language for the GEO pages.
// "<slug>.md" (the markdown alternate, a rewrite in next.config.ts) is left alone.
const GUIDE = /^\/business\/blog\/([a-z0-9-]+)\/?$/

function guide(forwarded: Headers, slug: string): NextResponse {
  const headers = new Headers(forwarded)
  if (!GERMAN_GUIDE_SLUGS.has(slug)) {
    headers.delete(LOCALE_HEADER)
    return NextResponse.next({ request: { headers } })
  }
  headers.set(LOCALE_HEADER, "de")
  const res = NextResponse.next({ request: { headers } })
  res.headers.set("Content-Language", "de")
  return res
}

// An article of the blog at /blog/<slug> shows a price too; "<slug>.md" is a rewrite, and stays as it is.
const BLOG_POST = /^\/blog\/[a-z0-9-]+\/?$/

function respond(req: NextRequest, forwarded: Headers): NextResponse {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/business/blog/")) {
    const slug = GUIDE.exec(pathname)?.[1]
    return slug ? guide(forwarded, slug) : NextResponse.next()
  }
  // An ad's landing page (/business is "/" at its own address, next.config.ts) and the blog's articles
  // have no language of their own.
  if (pathname === "/business" || BLOG_POST.test(pathname)) return NextResponse.next({ request: { headers: forwarded } })
  return localeMiddleware(req, forwarded)
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl
  if (CABINETS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return requireLogin(req, event as never)
  }
  if (DE_GUIDES.test(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = "/business/blog"
    url.hash = "de"
    const res = NextResponse.redirect(url, 308)
    res.headers.set("Cache-Control", "private, no-store")
    return res
  }
  // /terms shows no price and stays cached, but letters link it and it links "/": only a sales link is decided there.
  const termsSales = pathname === "/terms" && req.nextUrl.searchParams.get("ref") === "li"
  const price = isPricedPath(pathname) || termsSales ? await decidePrice(req) : null
  const res = respond(req, priceRequestHeaders(req, price))
  if (price) {
    const options = priceCookieOptions(req.nextUrl.protocol === "https:")
    for (const [name, value] of Object.entries(price.cookies)) res.cookies.set(name, value, options)
  }
  return res
}

// Literal lists only (Next reads them at build time). The public GEO pages here must match
// PUBLIC_GEO_PATHS in lib/i18n/config.ts; scripts/i18n-check.ts fails if they drift apart.
export const config = {
  matcher: [
    // Cabinets: login required.
    "/dashboard/:path*",
    "/business/dashboard",
    "/business/dashboard/:path*",
    "/cabinet",
    "/cabinet/:path*",
    // Public GEO pages: language and the price test.
    "/",
    // An ad's landing page: "/" at its own address (next.config.ts), so the same price test.
    "/business",
    "/business/ai-visibility-checker",
    "/business/ai-crawler-checker",
    "/business/sample-report",
    "/about",
    "/login",
    "/signup",
    "/(de|fr|es|ru)/:path*",
    // English has no prefix: /en/… is sent to the unprefixed address.
    "/en/:path*",
    // The guides: German ones are marked German (lib/geo-guides.ts), and all have a price.
    "/business/blog/:slug",
    // The blog's articles have a price too.
    "/blog/:slug",
    // No price, but a letter's link with ?ref=li pins the one price here.
    "/terms",
  ],
}
