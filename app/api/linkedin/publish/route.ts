import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import sharp from "sharp"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, users } from "@/lib/db/schema"
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
      media?: Array<{
        status: string
        media: string
        originalUrl?: string
      }>
    }
  }
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": string
  }
}

async function uploadImageToLinkedIn(
  accessToken: string,
  authorUrn: string,
  imageDataUrl: string,
): Promise<string | null> {
  try {
    // Step 1: Register upload
    const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    })

    if (!registerRes.ok) {
      console.warn("[linkedin/publish] registerUpload failed:", await registerRes.text())
      return null
    }

    const registerData = await registerRes.json() as {
      value?: {
        asset?: string
        uploadMechanism?: {
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
            uploadUrl?: string
          }
        }
      }
    }

    const assetUrn = registerData.value?.asset
    const uploadUrl =
      registerData.value?.uploadMechanism?.[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ]?.uploadUrl

    if (!assetUrn || !uploadUrl) {
      console.warn("[linkedin/publish] No asset URN or upload URL in register response")
      return null
    }

    // Step 2: Upload binary image
    const base64Data = imageDataUrl.replace(/^data:[^;]+;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")
    // Strip all metadata (EXIF, XMP, C2PA) to remove Content Credentials badge
    const strippedBuffer = await sharp(imageBuffer).withMetadata({}).toBuffer()

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
        Authorization: `Bearer ${accessToken}`,
      },
      body: new Uint8Array(strippedBuffer),
    })

    if (!uploadRes.ok) {
      console.warn("[linkedin/publish] Image upload failed:", await uploadRes.text())
      return null
    }

    return assetUrn
  } catch (err) {
    console.warn("[linkedin/publish] uploadImageToLinkedIn error:", err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Check subscription
    const [user] = await db.select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus })
      .from(users).where(eq(users.id, userId)).limit(1)
    const hasAccess = user && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") &&
      (user.subscriptionPlan === "personal" || user.subscriptionPlan === "personal_annual")
    if (!hasAccess) {
      return NextResponse.json({ error: "subscription_required", message: "Active Personal subscription required" }, { status: 403 })
    }

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

    // Check token expiry
    if (account.expiresAt) {
      const expiresAt = new Date(account.expiresAt)
      if (expiresAt <= new Date()) {
        return NextResponse.json({
          error: "linkedin_token_expired",
          message: "Your LinkedIn connection has expired. Please reconnect from the Account tab.",
        }, { status: 401 })
      }
    }

    // Determine author URN
    let authorUrn: string
    if (account.pageType === "organization" && account.linkedinOrgUrn) {
      const orgUrn = account.linkedinOrgUrn
      authorUrn = orgUrn.startsWith("urn:li:") ? orgUrn : `urn:li:organization:${orgUrn}`
    } else if (account.linkedinPersonUrn) {
      const personUrn = account.linkedinPersonUrn
      authorUrn = personUrn.startsWith("urn:li:") ? personUrn : `urn:li:member:${personUrn}`
    } else {
      return NextResponse.json({ error: "No LinkedIn URN found for this account" }, { status: 400 })
    }

    // Try to upload image if available
    let assetUrn: string | null = null
    if (post.imageUrl) {
      assetUrn = await uploadImageToLinkedIn(account.accessToken, authorUrn, post.imageUrl)
    }

    const ugcBody: LinkedInUgcPostBody = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: post.content },
          shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
          ...(assetUrn
            ? {
                media: [
                  {
                    status: "READY",
                    media: assetUrn,
                  },
                ],
              }
            : {}),
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
