import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") === "company" ? "company" : "personal"

  // Re-running this flow is destructive: LinkedIn issues one token per app+member, so a second
  // authorisation REVOKES the token we are already using. That turns this URL into a trap wherever
  // it can be opened more than once -- a customer re-opened it from an email after connecting, and
  // every visit silently killed her working connection while the cabinet still showed "connected".
  // If she is already connected and LinkedIn still accepts that token, don't re-authorise; send her
  // back to the cabinet. A genuinely dead token falls through to a normal reconnect.
  if (type === "personal" && searchParams.get("force") !== "1") {
    const existing = rows(await db.execute(sql`
      SELECT access_token FROM linkedin_accounts
      WHERE user_id = ${session.user.id}::text AND page_type = 'personal'
      ORDER BY created_at DESC LIMIT 1`))[0]
    const token = existing?.access_token as string | undefined
    if (token) {
      try {
        const check = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (check.ok) {
          await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props) VALUES (${session.user.id}, 'linkedin_connect_skipped', '/api/linkedin/connect', ${JSON.stringify({ reason: "already_connected" })}::jsonb)`).catch(() => {})
          return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?already_connected=1`)
        }
      } catch {
        // A network blip must never block a real reconnect -- fall through and re-authorise.
      }
    }
  }

  // Two separate LinkedIn apps, each approved only for its own Products (sending an app a
  // scope it lacks the Product for triggers LinkedIn's "Bummer, something went wrong"):
  //   • COMPANY app  → Community Management API (org scopes). This is the existing
  //     LINKEDIN_CLIENT_ID/SECRET (set up for Company Pages), left untouched.
  //   • PERSONAL app → Sign In with OpenID Connect + Share on LinkedIn (member scopes),
  //     configured via LINKEDIN_PERSONAL_CLIENT_ID/SECRET. Falls back to LINKEDIN_CLIENT_ID
  //     so behaviour is unchanged until the personal app vars are added in env.
  const isCompany = type === "company"
  const clientId = isCompany
    ? process.env.LINKEDIN_CLIENT_ID!
    : (process.env.LINKEDIN_PERSONAL_CLIENT_ID ?? process.env.LINKEDIN_CLIENT_ID!)
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

  await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props) VALUES (${session.user.id}, 'linkedin_connect_start', '/api/linkedin/connect', ${JSON.stringify({ type })}::jsonb)`).catch(() => {})

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
