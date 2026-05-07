import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

interface DeleteImageRequest {
  postId: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as DeleteImageRequest
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }

    // Verify ownership
    const [post] = await db
      .select()
      .from(twitterPosts)
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await db
      .update(twitterPosts)
      .set({ imageUrl: null })
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
