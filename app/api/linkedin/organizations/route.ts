import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgs = await db
    .select({
      id: linkedinAccounts.id,
      pageType: linkedinAccounts.pageType,
      pageName: linkedinAccounts.pageName,
      pageHandle: linkedinAccounts.pageHandle,
      linkedinOrgUrn: linkedinAccounts.linkedinOrgUrn,
      isActive: linkedinAccounts.isActive,
      stripeSubscriptionId: linkedinAccounts.stripeSubscriptionId,
      subscriptionStatus: linkedinAccounts.subscriptionStatus,
      createdAt: linkedinAccounts.createdAt,
    })
    .from(linkedinAccounts)
    .where(
      and(
        eq(linkedinAccounts.userId, session.user.id),
        eq(linkedinAccounts.pageType, "organization")
      )
    )

  return NextResponse.json({ organizations: orgs })
}
