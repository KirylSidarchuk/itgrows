import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramAccounts, instagramPosts, users } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"
import { hasAccess } from "@/lib/access"

async function publishInstagramPost(post: {
  id: string
  content: string
  instagramAccountId: string | null
  imageUrl: string | null
}, baseUrl: string): Promise<{ success: boolean; error?: string; instagramPostId?: string }> {
  if (!post.instagramAccountId) {
    return { success: false, error: "No Instagram account linked" }
  }

  const [account] = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.id, post.instagramAccountId))
    .limit(1)

  if (!account) {
    return { success: false, error: "Instagram account not found" }
  }

  // Check if token has expired
  if (account.tokenExpiresAt) {
    const expiresAt = new Date(account.tokenExpiresAt)
    const now = new Date()
    if (expiresAt <= now) {
      return { success: false, error: "instagram_token_expired" }
    }
  }

  if (!account.instagramUserId) {
    return { success: false, error: "Instagram user ID not found on account" }
  }

  if (!post.imageUrl) {
    return { success: false, error: "image_required" }
  }

  // Build a public image URL — Instagram Graph API requires a public HTTP URL
  const publicImageUrl = `${baseUrl}/api/instagram/post-image/${post.id}`

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.instagramUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: publicImageUrl,
        caption: post.content,
        access_token: account.accessToken,
      }),
    }
  )

  if (!containerRes.ok) {
    const errText = await containerRes.text()
    return { success: false, error: `Instagram media create ${containerRes.status}: ${errText}` }
  }

  const containerData = await containerRes.json() as { id?: string }
  const containerId = containerData.id

  if (!containerId) {
    return { success: false, error: "Instagram API did not return a container ID" }
  }

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.instagramUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: account.accessToken,
      }),
    }
  )

  if (!publishRes.ok) {
    const errText = await publishRes.text()
    return { success: false, error: `Instagram media_publish ${publishRes.status}: ${errText}` }
  }

  const publishData = await publishRes.json() as { id?: string }
  return { success: true, instagramPostId: publishData.id }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"

  try {
    const now = new Date()

    // Find all scheduled Instagram posts due to publish
    const duePosts = await db
      .select()
      .from(instagramPosts)
      .where(
        and(
          eq(instagramPosts.status, "scheduled"),
          lte(instagramPosts.scheduledFor, now)
        )
      )

    let published = 0
    let failed = 0

    for (const post of duePosts) {
      // Check user has an active subscription or trial
      const [postUser] = await db
        .select({
          subscriptionPlan: users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus,
          trialEndsAt: users.trialEndsAt,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, post.userId))
        .limit(1)

      if (
        !postUser ||
        !hasAccess({
          subscriptionStatus: postUser.subscriptionStatus ?? null,
          subscriptionPlan: postUser.subscriptionPlan ?? null,
          trialEndsAt: postUser.trialEndsAt ?? null,
        })
      ) {
        await db
          .update(instagramPosts)
          .set({ status: "failed", publishError: "subscription_required" })
          .where(eq(instagramPosts.id, post.id))
        failed++
        continue
      }

      // If imageUrl is missing, reschedule to tomorrow — no failure email
      if (!post.imageUrl) {
        const tomorrow = new Date((post.scheduledFor ?? now).getTime() + 24 * 60 * 60 * 1000)
        console.warn(
          `[publish-instagram] Post ${post.id} has no image — rescheduling to ${tomorrow.toISOString()}`
        )
        await db
          .update(instagramPosts)
          .set({ scheduledFor: tomorrow })
          .where(eq(instagramPosts.id, post.id))
        continue
      }

      const result = await publishInstagramPost(
        {
          id: post.id,
          content: post.content,
          instagramAccountId: post.instagramAccountId,
          imageUrl: post.imageUrl,
        },
        baseUrl
      )

      if (result.success) {
        await db
          .update(instagramPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            instagramPostId: result.instagramPostId ?? null,
            publishError: null,
          })
          .where(eq(instagramPosts.id, post.id))
        published++
        console.log(`[publish-instagram] Published post ${post.id} → ${result.instagramPostId}`)
      } else {
        // Token expired: mark failed, log only (no email)
        if (result.error === "instagram_token_expired") {
          await db
            .update(instagramPosts)
            .set({ status: "failed", publishError: result.error })
            .where(eq(instagramPosts.id, post.id))
          failed++
          console.warn(
            `[publish-instagram] Token expired for post ${post.id} (user ${post.userId})`
          )
          continue
        }

        await db
          .update(instagramPosts)
          .set({ status: "failed", publishError: result.error ?? "Unknown error" })
          .where(eq(instagramPosts.id, post.id))
        failed++
        console.error(`[publish-instagram] Failed to publish post ${post.id}:`, result.error)
      }
    }

    return NextResponse.json({ published, failed, total: duePosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[publish-instagram] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
