import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Get personal account token
    const [personal] = await db
      .select()
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
      .limit(1)

    if (!personal) {
      return NextResponse.json({ error: "No LinkedIn account connected" }, { status: 400 })
    }

    const accessToken = personal.accessToken
    const expiresAt = personal.expiresAt

    // Fetch all org pages where user is admin
    const orgsRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!orgsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch organizations from LinkedIn" }, { status: 502 })
    }

    const orgsData = await orgsRes.json() as {
      elements?: Array<{ organization: string }>
    }

    if (!orgsData.elements || orgsData.elements.length === 0) {
      return NextResponse.json({ added: 0, updated: 0 })
    }

    let added = 0
    let updated = 0

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
        // ignore
      }

      const [existing] = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.linkedinOrgUrn, orgUrn)))
        .limit(1)

      if (existing) {
        await db
          .update(linkedinAccounts)
          .set({ accessToken, expiresAt, pageName: orgName, pageHandle: orgHandle })
          .where(eq(linkedinAccounts.id, existing.id))
        updated++
      } else {
        await db.insert(linkedinAccounts).values({
          userId,
          accessToken,
          expiresAt,
          linkedinOrgUrn: orgUrn,
          pageType: "organization",
          pageName: orgName,
          pageHandle: orgHandle,
          isActive: false,
        })
        added++
      }
    }

    return NextResponse.json({ added, updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
