import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"

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

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as { postId?: string; content?: string }
    const { postId, content } = body

    if (!postId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "postId and non-empty content are required" }, { status: 400 })
    }
    if (content.length > 280) {
      return NextResponse.json({ error: "Content exceeds 280 characters" }, { status: 400 })
    }

    const [updatedPost] = await db
      .update(twitterPosts)
      .set({ content })
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))
      .returning()

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, post: updatedPost })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
