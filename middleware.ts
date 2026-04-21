import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
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

export const config = {
  matcher: ["/dashboard/:path*", "/business/dashboard", "/business/dashboard/:path*", "/cabinet", "/cabinet/:path*"],
}
