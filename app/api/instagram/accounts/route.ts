import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { instagramAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await db
    .select({
      id: instagramAccounts.id,
      username: instagramAccounts.username,
      name: instagramAccounts.name,
      profilePicture: instagramAccounts.profilePicture,
      instagramUserId: instagramAccounts.instagramUserId,
      tokenExpiresAt: instagramAccounts.tokenExpiresAt,
      createdAt: instagramAccounts.createdAt,
    })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.userId, session.user.id))

  return NextResponse.json({ accounts })
}
