import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.userId, userId))
      .limit(1)

    return NextResponse.json({ account: account ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
