import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await db
    .delete(twitterAccounts)
    .where(eq(twitterAccounts.userId, session.user.id))

  return NextResponse.json({ success: true })
}
