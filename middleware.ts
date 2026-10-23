import { auth } from "@/auth"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { localeMiddleware } from "@/lib/i18n/middleware"

// Two jobs, kept apart so the public pages never wait on a session lookup:
// 1. The cabinets (/dashboard, /business/dashboard, /cabinet) require a login, exactly as before.
// 2. The public AI-visibility pages get their language (lib/i18n/middleware.ts): /de, /fr, /es and
//    /ru are rewritten to the same page in that language, /en/… goes to the unprefixed English
//    address, and a first visit is sent once to the visitor's own language.

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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl
  if (CABINETS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return requireLogin(req, event as never)
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
  ],
}
