import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // userId
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=oauth_denied`)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("LinkedIn token exchange failed:", errText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=token_failed`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      expires_in: number
    }

    const accessToken = tokenData.access_token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Fetch user profile via OpenID userinfo endpoint
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let personUrn: string | null = null
    let pageName: string | null = null
    let pageHandle: string | null = null

    if (profileRes.ok) {
      const profile = await profileRes.json() as {
        sub?: string
        name?: string
        email?: string
        given_name?: string
        family_name?: string
      }
      // sub is the person URN id (numeric), build urn
      if (profile.sub) {
        personUrn = `urn:li:person:${profile.sub}`
      }
      pageName = profile.name ?? profile.given_name ?? null
    }

    // Save personal account
    const userId = state

    // Upsert personal account — replace if already exists
    const existing = await db
      .select({ id: linkedinAccounts.id })
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(linkedinAccounts)
        .set({
          accessToken,
          expiresAt,
          linkedinPersonUrn: personUrn,
          pageName,
          pageHandle,
        })
        .where(eq(linkedinAccounts.id, existing[0].id))
    } else {
      await db.insert(linkedinAccounts).values({
        userId,
        accessToken,
        expiresAt,
        linkedinPersonUrn: personUrn,
        pageType: "personal",
        pageName,
        pageHandle,
      })
    }

    // Fetch org pages where user is admin
    try {
      const orgsRes = await fetch(
        "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json() as {
          elements?: Array<{
            organization: string // urn:li:organization:xxx
          }>
        }

        if (orgsData.elements && orgsData.elements.length > 0) {
          for (const elem of orgsData.elements) {
            const orgUrn = elem.organization
            const orgId = orgUrn.split(":").pop()

            // Fetch org details
            let orgName: string | null = null
            let orgHandle: string | null = null
            try {
              const orgRes = await fetch(
                `https://api.linkedin.com/v2/organizations/${orgId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              )
              if (orgRes.ok) {
                const orgDetail = await orgRes.json() as {
                  localizedName?: string
                  vanityName?: string
                }
                orgName = orgDetail.localizedName ?? null
                orgHandle = orgDetail.vanityName ?? null
              }
            } catch {
              // ignore org detail fetch errors
            }

            // Upsert org account
            const existingOrg = await db
              .select({ id: linkedinAccounts.id })
              .from(linkedinAccounts)
              .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.linkedinOrgUrn, orgUrn)))
              .limit(1)

            if (existingOrg.length > 0) {
              await db
                .update(linkedinAccounts)
                .set({ accessToken, expiresAt, pageName: orgName, pageHandle: orgHandle })
                .where(eq(linkedinAccounts.id, existingOrg[0].id))
            } else {
              await db.insert(linkedinAccounts).values({
                userId,
                accessToken,
                expiresAt,
                linkedinPersonUrn: personUrn,
                linkedinOrgUrn: orgUrn,
                pageType: "organization",
                pageName: orgName,
                pageHandle: orgHandle,
              })
            }
          }
        }
      }
    } catch (orgErr) {
      console.error("Failed to fetch LinkedIn organizations:", orgErr)
      // Non-fatal: personal account is already saved
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?connected=1`)
  } catch (err) {
    console.error("LinkedIn callback error:", err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=server_error`)
  }
}
