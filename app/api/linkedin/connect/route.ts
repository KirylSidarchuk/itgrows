import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") === "company" ? "company" : "personal"

  // Company page connection only needs organization scopes.
  // openid/profile/email scopes require "Sign In with LinkedIn using OpenID Connect" product
  // which is not enabled on this app — using them causes "Bummer, something went wrong".
  const scope =
    type === "company"
      ? "r_organization_social rw_organization_admin w_organization_social"
      : "openid profile email w_member_social r_organization_social w_organization_social"

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/linkedin/callback`,
    // Encode type into state so callback knows which flow to run
    state: `${session.user.id}:${type}`,
    scope,
  })

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
