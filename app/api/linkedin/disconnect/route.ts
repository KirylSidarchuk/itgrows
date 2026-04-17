import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("id")

  if (accountId) {
    // Delete specific account (verify ownership)
    await db
      .delete(linkedinAccounts)
      .where(and(eq(linkedinAccounts.id, accountId), eq(linkedinAccounts.userId, session.user.id)))
  } else {
    // Delete all LinkedIn accounts for the user
    await db.delete(linkedinAccounts).where(eq(linkedinAccounts.userId, session.user.id))
  }

  return NextResponse.json({ success: true })
}
