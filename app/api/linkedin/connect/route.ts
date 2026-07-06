import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") === "company" ? "company" : "personal"

  // Two separate LinkedIn apps: a PERSONAL app (Sign In with OpenID Connect + Share on
  // LinkedIn → member scopes) and a COMPANY app (Community Management API → organization
  // scopes). Each app is only approved for its own Products — sending an app a scope it
  // lacks the Product for triggers LinkedIn's "Bummer, something went wrong". So the
  // personal flow must NOT request org scopes, and the company flow must use the company app.
  const isCompany = type === "company"
  const clientId = isCompany
    ? (process.env.LINKEDIN_COMPANY_CLIENT_ID ?? process.env.LINKEDIN_CLIENT_ID!)
    : process.env.LINKEDIN_CLIENT_ID!
  const scope = isCompany
    ? "r_organization_social rw_organization_admin w_organization_social"
    : "openid profile email w_member_social"

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/linkedin/callback`,
    // Encode type into state so callback knows which flow to run
    state: `${session.user.id}:${type}`,
    scope,
  })

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
