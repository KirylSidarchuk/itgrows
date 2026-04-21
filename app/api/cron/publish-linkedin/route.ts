import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"

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
      } else {
        await db
          .update(linkedinPosts)
          .set({ status: "failed", publishError: result.error ?? "Unknown error" })
          .where(eq(linkedinPosts.id, post.id))
        failed++
        console.error(`[publish-linkedin] Failed to publish post ${post.id}:`, result.error)
      }
    }

    return NextResponse.json({ published, failed, total: duePosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[publish-linkedin] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
