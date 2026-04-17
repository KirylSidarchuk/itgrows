import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

interface PublishRequest {
  postId: string
}

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
      .from(linkedinPosts)
      .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.status === "published") {
      return NextResponse.json({ error: "Post already published" }, { status: 400 })
    }

    // Get LinkedIn account
    const accountId = post.linkedinAccountId
    if (!accountId) {
      return NextResponse.json({ error: "No LinkedIn account linked to this post" }, { status: 400 })
    }

    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.id, accountId), eq(linkedinAccounts.userId, userId)))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "LinkedIn account not found" }, { status: 404 })
    }

    // Determine author URN
    let authorUrn: string
    if (account.pageType === "organization" && account.linkedinOrgUrn) {
      authorUrn = `urn:li:organization:${account.linkedinOrgUrn}`
    } else if (account.linkedinPersonUrn) {
      authorUrn = `urn:li:person:${account.linkedinPersonUrn}`
    } else {
      return NextResponse.json({ error: "No LinkedIn URN found for this account" }, { status: 400 })
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
      // Mark as failed
      await db
        .update(linkedinPosts)
        .set({ status: "failed", publishError: errText })
        .where(eq(linkedinPosts.id, postId))

      return NextResponse.json(
        { error: `LinkedIn API error ${liResponse.status}: ${errText}` },
        { status: 502 }
      )
    }

    const liData = await liResponse.json() as { id?: string }
    const linkedinPostId = liData.id ?? null

    // Update DB
    await db
      .update(linkedinPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        linkedinPostId,
        publishError: null,
      })
      .where(eq(linkedinPosts.id, postId))

    return NextResponse.json({ success: true, linkedinPostId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
