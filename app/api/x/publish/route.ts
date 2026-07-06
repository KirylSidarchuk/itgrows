import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { hasAccess } from "@/lib/access"

interface PublishRequest {
  postId: string
}

async function refreshTwitterToken(account: typeof twitterAccounts.$inferSelect): Promise<string | null> {
  if (!account.refreshToken) return null

  const clientId = process.env.TWITTER_CLIENT_ID!
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientId,
    }),
  })

  if (!res.ok) {
    console.error("[publish-x] Token refresh failed:", await res.text())
    return null
  }

  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number }

  // Update token in DB
  await db.update(twitterAccounts).set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? account.refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }).where(eq(twitterAccounts.id, account.id))

  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Require an active subscription/trial to publish (parity with LinkedIn publish;
    // otherwise a lapsed user with a valid X token could keep publishing for free).
    const [subUser] = await db
      .select({ subscriptionStatus: users.subscriptionStatus, subscriptionPlan: users.subscriptionPlan, trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!hasAccess({ subscriptionStatus: subUser?.subscriptionStatus ?? null, subscriptionPlan: subUser?.subscriptionPlan ?? null, trialEndsAt: subUser?.trialEndsAt ?? null })) {
      return NextResponse.json({ error: "subscription_required", message: "Your subscription has ended. Reactivate to publish." }, { status: 403 })
    }

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

    // Get Twitter account matching the post's accountType
    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(and(eq(twitterAccounts.userId, userId), eq(twitterAccounts.accountType, post.accountType)))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: `No Twitter/X ${post.accountType} account connected` }, { status: 400 })
    }

    // Refresh token if expired or expiring within 5 minutes
    let accessToken = account.accessToken

    if (account.expiresAt && account.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
      const newToken = await refreshTwitterToken(account)
      if (newToken) {
        accessToken = newToken
      } else {
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: "Token refresh failed" })
          .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))
        return NextResponse.json({ error: "Token refresh failed" }, { status: 502 })
      }
    }

    // TODO: Media upload requires OAuth 1.0a (not Bearer token) for Twitter v1.1 media/upload.json
    // Skipping media upload for now — posting text-only even if imageUrl exists
    if (post.imageUrl) {
      console.warn(`[publish-x] Media upload not yet supported (post ${post.id}). Publishing text-only.`)
    }

    // Build tweet body (text only)
    const tweetBody = { text: post.content }

    // Post to Twitter API v2
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
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

    // Be honest that X media upload isn't wired yet: if the post had an image, it was
    // published text-only. The client surfaces this instead of silently claiming full success.
    return NextResponse.json({ success: true, twitterPostId, imageSkipped: !!post.imageUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
