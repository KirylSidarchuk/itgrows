import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await db
    .select({
      id: linkedinAccounts.id,
      pageType: linkedinAccounts.pageType,
      pageName: linkedinAccounts.pageName,
      pageHandle: linkedinAccounts.pageHandle,
      linkedinPersonUrn: linkedinAccounts.linkedinPersonUrn,
      linkedinOrgUrn: linkedinAccounts.linkedinOrgUrn,
      expiresAt: linkedinAccounts.expiresAt,
      createdAt: linkedinAccounts.createdAt,
    })
    .from(linkedinAccounts)
    .where(eq(linkedinAccounts.userId, session.user.id))

  return NextResponse.json({ accounts })
}
