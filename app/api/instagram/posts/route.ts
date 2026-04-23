import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { instagramPosts } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const posts = await db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.userId, userId))
      .orderBy(desc(instagramPosts.scheduledFor))

    return NextResponse.json({ posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await db
      .delete(instagramPosts)
      .where(and(eq(instagramPosts.id, postId), eq(instagramPosts.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
