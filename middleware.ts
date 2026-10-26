import { auth } from "@/auth"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { localeMiddleware } from "@/lib/i18n/middleware"
import { LOCALE_HEADER } from "@/lib/i18n/config"
import { GERMAN_GUIDE_SLUGS } from "@/lib/geo-guides"

// Two jobs, kept apart so the public pages never wait on a session lookup:
// 1. The cabinets (/dashboard, /business/dashboard, /cabinet) require a login, exactly as before.
// 2. The public AI-visibility pages get their language (lib/i18n/middleware.ts): /de, /fr, /es and
//    /ru are rewritten to the same page in that language, /en/… goes to the unprefixed English
//    address, and a first visit is sent once to the visitor's own language.
// 3. The German guides (/business/blog/<German slug>) are marked German, nothing else changes.

const CABINETS = ["/dashboard", "/business/dashboard", "/cabinet"]

const requireLogin = auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isDashboard = nextUrl.pathname.startsWith("/dashboard")
  const isBusinessDashboard = nextUrl.pathname.startsWith("/business/dashboard")
  const isCabinet = nextUrl.pathname.startsWith("/cabinet")

  if ((isDashboard || isBusinessDashboard || isCabinet) && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl))
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

function guide(req: NextRequest, slug: string): NextResponse {
  const headers = new Headers(req.headers)
  if (!GERMAN_GUIDE_SLUGS.has(slug)) {
    headers.delete(LOCALE_HEADER)
    return NextResponse.next({ request: { headers } })
  }
  headers.set(LOCALE_HEADER, "de")
  const res = NextResponse.next({ request: { headers } })
  res.headers.set("Content-Language", "de")
  return res
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
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
  if (pathname.startsWith("/business/blog/")) {
    const slug = GUIDE.exec(pathname)?.[1]
    return slug ? guide(req, slug) : NextResponse.next()
  }
  return localeMiddleware(req)
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
    // Public GEO pages: language.
    "/",
    "/business/ai-visibility-checker",
    "/business/ai-crawler-checker",
    "/business/sample-report",
    "/about",
    "/login",
    "/signup",
    "/(de|fr|es|ru)/:path*",
    // English has no prefix: /en/… is sent to the unprefixed address.
    "/en/:path*",
    // The guides: German ones are marked German (lib/geo-guides.ts).
    "/business/blog/:slug",
  ],
}
