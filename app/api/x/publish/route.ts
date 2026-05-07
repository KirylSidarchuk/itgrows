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

    // If post has an image, upload it to Twitter media upload endpoint first
    let mediaId: string | null = null
    if (post.imageUrl) {
      try {
        // Download the image
        const imgRes = await fetch(post.imageUrl)
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer()
          const imgBytes = Buffer.from(imgBuffer)
          const contentType = imgRes.headers.get("content-type") ?? "image/jpeg"

          // Upload to Twitter media upload (v1.1)
          const formData = new FormData()
          const blob = new Blob([imgBytes], { type: contentType })
          formData.append("media", blob, "image.jpg")

          const mediaRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
            },
            body: formData,
          })

          if (mediaRes.ok) {
            const mediaData = await mediaRes.json() as { media_id_string?: string }
            mediaId = mediaData.media_id_string ?? null
          }
        }
      } catch {
        // If media upload fails, publish without image
        mediaId = null
      }
    }

    // Build tweet body
    const tweetBody: { text: string; media?: { media_ids: string[] } } = { text: post.content }
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] }
    }

    // Post to Twitter API v2
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify(tweetBody),
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
