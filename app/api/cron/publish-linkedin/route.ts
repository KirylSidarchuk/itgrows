import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, users } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { postPublishedEmail, postFailedEmail, linkedinTokenExpiredEmail } from "@/lib/email-templates"

interface LinkedInUgcPostBody {
  author: string
  lifecycleState: string
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: string }
      shareMediaCategory: string
    }
  }
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": string
  }
}

async function publishPost(post: {
  id: string
  content: string
  linkedinAccountId: string | null
}): Promise<{ success: boolean; error?: string; linkedinPostId?: string }> {
  if (!post.linkedinAccountId) {
    return { success: false, error: "No LinkedIn account linked" }
  }

  const [account] = await db
    .select()
    .from(linkedinAccounts)
    .where(eq(linkedinAccounts.id, post.linkedinAccountId))
    .limit(1)

  if (!account) {
    return { success: false, error: "LinkedIn account not found" }
  }

  // Check if LinkedIn token has expired
  if (account.expiresAt) {
    const expiresAt = new Date(account.expiresAt)
    const now = new Date()
    if (expiresAt <= now) {
      return { success: false, error: "linkedin_token_expired" }
    }
  }

  let authorUrn: string
  if (account.pageType === "organization" && account.linkedinOrgUrn) {
    const orgUrn = account.linkedinOrgUrn
    authorUrn = orgUrn.startsWith("urn:li:") ? orgUrn : `urn:li:organization:${orgUrn}`
  } else if (account.linkedinPersonUrn) {
    const personUrn = account.linkedinPersonUrn
    authorUrn = personUrn.startsWith("urn:li:") ? personUrn : `urn:li:member:${personUrn}`
  } else {
    return { success: false, error: "No LinkedIn URN found" }
  }

  const ugcBody: LinkedInUgcPostBody = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: post.content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  const liResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${account.accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(ugcBody),
  })

  if (!liResponse.ok) {
    const errText = await liResponse.text()
    return { success: false, error: `LinkedIn API ${liResponse.status}: ${errText}` }
  }

  const liData = await liResponse.json() as { id?: string }
  return { success: true, linkedinPostId: liData.id }
}

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
      .from(linkedinPosts)
      .where(
        and(
          eq(linkedinPosts.status, "scheduled"),
          lte(linkedinPosts.scheduledFor, now)
        )
      )

    let published = 0
    let failed = 0

    for (const post of duePosts) {
      // Skip posts for users without an active Personal subscription
      const [postUser] = await db.select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, email: users.email, name: users.name })
        .from(users).where(eq(users.id, post.userId)).limit(1)
      const hasAccess = postUser && postUser.subscriptionStatus === "active" &&
        (postUser.subscriptionPlan === "personal" || postUser.subscriptionPlan === "personal_annual")
      if (!hasAccess) {
        await db
          .update(linkedinPosts)
          .set({ status: "failed", publishError: "subscription_required" })
          .where(eq(linkedinPosts.id, post.id))
        failed++
        continue
      }

      const result = await publishPost(post)

      if (result.success) {
        await db
          .update(linkedinPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            linkedinPostId: result.linkedinPostId ?? null,
            publishError: null,
          })
          .where(eq(linkedinPosts.id, post.id))
        published++
        if (postUser?.email) {
          await sendEmail({
            to: postUser.email,
            subject: "✅ Your LinkedIn post is live!",
            html: postPublishedEmail(postUser.name ?? "there", post.content, result.linkedinPostId ?? null),
          })
        }
      } else {
        await db
          .update(linkedinPosts)
          .set({ status: "failed", publishError: result.error ?? "Unknown error" })
          .where(eq(linkedinPosts.id, post.id))
        failed++
        console.error(`[publish-linkedin] Failed to publish post ${post.id}:`, result.error)
        if (result.error === "linkedin_token_expired" && postUser?.email) {
          await sendEmail({
            to: postUser.email,
            subject: "Action required: Reconnect your LinkedIn to ItGrows",
            html: linkedinTokenExpiredEmail(postUser.name ?? "there"),
          })
        } else if (postUser?.email) {
          await sendEmail({
            to: postUser.email,
            subject: "⚠️ Your LinkedIn post failed to publish",
            html: postFailedEmail(postUser.name ?? "there", post.content, result.error ?? "Unknown error"),
          })
        }
      }
    }

    return NextResponse.json({ published, failed, total: duePosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[publish-linkedin] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
