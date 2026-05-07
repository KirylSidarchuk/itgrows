import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountType = searchParams.get("type")

  if (accountType === "personal" || accountType === "company") {
    await db
      .delete(twitterAccounts)
      .where(and(
        eq(twitterAccounts.userId, session.user.id),
        eq(twitterAccounts.accountType, accountType)
      ))
  } else {
    // Disconnect all if no type specified
    await db
      .delete(twitterAccounts)
      .where(eq(twitterAccounts.userId, session.user.id))
  }

  return NextResponse.json({ success: true })
}
