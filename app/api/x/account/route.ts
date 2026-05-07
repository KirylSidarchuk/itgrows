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

    const accounts = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.userId, userId))

    const personalAccount = accounts.find((a) => a.accountType === "personal") ?? null
    const companyAccount = accounts.find((a) => a.accountType === "company") ?? null

    // Keep backward-compat: return first account as `account`
    return NextResponse.json({
      account: personalAccount ?? companyAccount ?? null,
      personalAccount,
      companyAccount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
