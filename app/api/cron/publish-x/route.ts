import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all scheduled posts due to publish
    const duePosts = await db
      .select()
      .from(twitterPosts)
      .where(
        and(
          eq(twitterPosts.status, "scheduled"),
          lte(twitterPosts.scheduledAt, now)
        )
      )

    let published = 0
    let failed = 0

    for (const post of duePosts) {
      // Get Twitter account for this user matching the post's accountType
      const [account] = await db
        .select()
        .from(twitterAccounts)
        .where(and(eq(twitterAccounts.userId, post.userId), eq(twitterAccounts.accountType, post.accountType)))
        .limit(1)

      if (!account) {
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: `No Twitter ${post.accountType} account connected` })
          .where(eq(twitterPosts.id, post.id))
        failed++
        continue
      }

      // Post to Twitter API v2
      try {
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
            .set({ status: "failed", errorMessage: `Twitter API ${tweetRes.status}: ${errText}` })
            .where(eq(twitterPosts.id, post.id))
          failed++
          console.error(`[publish-x] Failed to publish post ${post.id}:`, errText)
          continue
        }

        const tweetData = await tweetRes.json() as { data?: { id: string } }
        const twitterPostId = tweetData.data?.id ?? null

        await db
          .update(twitterPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            twitterPostId,
            errorMessage: null,
          })
          .where(eq(twitterPosts.id, post.id))
        published++
      } catch (postErr) {
        const errMsg = postErr instanceof Error ? postErr.message : "Unknown error"
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: errMsg })
          .where(eq(twitterPosts.id, post.id))
        failed++
        console.error(`[publish-x] Exception publishing post ${post.id}:`, errMsg)
      }
    }

    return NextResponse.json({ published, failed, total: duePosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[publish-x] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
