import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

interface PublishRequest {
  postId: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as PublishRequest
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }

    // Get post (verify ownership)
    const [post] = await db
      .select()
      .from(twitterPosts)
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.status === "published") {
      return NextResponse.json({ error: "Post already published" }, { status: 400 })
    }

    // Get Twitter account
    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.userId, userId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "No Twitter/X account connected" }, { status: 400 })
    }

    // Post to Twitter API v2
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify({ text: post.content }),
    })

    if (!tweetRes.ok) {
      const errText = await tweetRes.text()
      await db
        .update(twitterPosts)
        .set({ status: "failed", errorMessage: errText })
        .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))

      return NextResponse.json(
        { error: `Twitter API error ${tweetRes.status}: ${errText}` },
        { status: 502 }
      )
    }

    const tweetData = await tweetRes.json() as { data?: { id: string } }
    const twitterPostId = tweetData.data?.id ?? null

    // Update post as published
    await db
      .update(twitterPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        twitterPostId,
        errorMessage: null,
      })
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))

    return NextResponse.json({ success: true, twitterPostId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
