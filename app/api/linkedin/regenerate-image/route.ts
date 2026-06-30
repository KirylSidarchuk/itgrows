import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinPosts, linkedinBriefs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { generatePostImage } from "@/lib/linkedin-image"
import { checkImageGenLimit, recordImageGen } from "@/lib/rate-limit"

export const maxDuration = 120

interface RegenerateImageRequest {
  postId: string
  imageStyle: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as RegenerateImageRequest
    const { postId, imageStyle } = body

    if (!postId || !imageStyle) {
      return NextResponse.json({ error: "postId and imageStyle are required" }, { status: 400 })
    }

    const validStyles = ["ai_art", "minimalist", "photorealistic", "infographic", "no_image"]
    if (!validStyles.includes(imageStyle)) {
      return NextResponse.json({ error: "Invalid imageStyle" }, { status: 400 })
    }

    // Verify post belongs to user
    const [post] = await db
      .select()
      .from(linkedinPosts)
      .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Spend cap: max 20 image generations/day per user, 5 regenerations per post.
    const limit = await checkImageGenLimit(userId, postId)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason === "per_post" ? "You've regenerated this image too many times." : "Daily image limit reached — try again tomorrow." },
        { status: 429 }
      )
    }

    // Get niche from brief for better image prompts
    const [brief] = await db
      .select({ niche: linkedinBriefs.niche })
      .from(linkedinBriefs)
      .where(eq(linkedinBriefs.userId, userId))
      .limit(1)

    const niche = brief?.niche ?? "business"

    // Generate new image
    const imageUrl = await generatePostImage(post.content, niche, imageStyle)
    if (imageUrl) await recordImageGen(userId, postId)

    // Update post imageUrl in DB
    await db
      .update(linkedinPosts)
      .set({ imageUrl })
      .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))

    return NextResponse.json({ imageUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
