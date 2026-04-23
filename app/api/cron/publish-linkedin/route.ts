import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, users } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { postPublishedEmail, postFailedEmail, linkedinTokenExpiredEmail } from "@/lib/email-templates"
import { hasAccess } from "@/lib/access"

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
      console.warn("[publish-linkedin] registerUpload failed:", await registerRes.text())
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
      console.warn("[publish-linkedin] No asset URN or upload URL in register response")
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
      console.warn("[publish-linkedin] Image upload failed:", await uploadRes.text())
      return null
    }

    return assetUrn
  } catch (err) {
    console.warn("[publish-linkedin] uploadImageToLinkedIn error:", err)
    return null
  }
}

async function publishPost(post: {
  id: string
  content: string
  linkedinAccountId: string | null
  imageUrl?: string | null
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

  // Image is required — skip if missing
  if (!post.imageUrl) {
    return { success: false, error: "image_required" }
  }

  // Upload image; if it fails, do not fall back to text-only — return error so post stays scheduled
  const assetUrn = await uploadImageToLinkedIn(account.accessToken, authorUrn, post.imageUrl)
  if (!assetUrn) {
    return { success: false, error: "image_upload_failed" }
  }

  const ugcBody: LinkedInUgcPostBody = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: post.content },
        shareMediaCategory: "IMAGE",
        media: [
          {
            status: "READY",
            media: assetUrn,
          },
        ],
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
      // Skip posts for users without an active Personal subscription or active trial
      const [postUser] = await db.select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt, email: users.email, name: users.name })
        .from(users).where(eq(users.id, post.userId)).limit(1)
      if (!postUser || !hasAccess({ subscriptionStatus: postUser.subscriptionStatus ?? null, subscriptionPlan: postUser.subscriptionPlan ?? null, trialEndsAt: postUser.trialEndsAt ?? null })) {
        await db
          .update(linkedinPosts)
          .set({ status: "failed", publishError: "subscription_required" })
          .where(eq(linkedinPosts.id, post.id))
        failed++
        continue
      }

      const result = await publishPost({ id: post.id, content: post.content, linkedinAccountId: post.linkedinAccountId, imageUrl: post.imageUrl })

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
        // For transient/retriable errors (missing image, upload failure) — leave as scheduled so cron retries
        const isRetriable = result.error === "image_required" || result.error === "image_upload_failed"
        if (isRetriable) {
          console.warn(`[publish-linkedin] Skipping post ${post.id} (will retry): ${result.error}`)
          // Do not increment failed; post stays scheduled
          continue
        }

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
