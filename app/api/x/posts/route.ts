import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const posts = await db
      .select()
      .from(twitterPosts)
      .where(eq(twitterPosts.userId, userId))
      .orderBy(desc(twitterPosts.createdAt))

    return NextResponse.json({ posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
