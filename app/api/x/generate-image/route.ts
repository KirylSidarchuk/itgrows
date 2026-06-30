import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { openaiGenerateImage } from "@/lib/llm-client"
import { checkImageGenLimit, recordImageGen } from "@/lib/rate-limit"

const IMAGE_API_URL = "http://34.60.133.229:4000/images/generate"
const IMAGE_API_KEY = process.env.LLM_API_KEY ?? "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const IMAGE_MODEL = "gemini-3-pro-image-preview"

interface GenerateImageRequest {
  postId: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as GenerateImageRequest
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

    // Spend cap: max 20 image generations/day per user, 5 per post.
    const limit = await checkImageGenLimit(userId, postId)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason === "per_post" ? "You've regenerated this image too many times." : "Daily image limit reached — try again tomorrow." },
        { status: 429 }
      )
    }

    // Build image prompt from tweet content
    const tweetText = post.content.replace(/#\w+/g, "").trim()
    const imagePrompt = `Create a clean, professional social media image for this tweet: "${tweetText}". Visual style: modern, minimal, eye-catching. No text overlays. Suitable for Twitter/X post.`

    // Try the gateway image API; fall back to OpenAI on any failure.
    let imageUrl: string | null = null
    try {
      const imgRes = await fetch(IMAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IMAGE_API_KEY}`,
        },
        body: JSON.stringify({ model: IMAGE_MODEL, prompt: imagePrompt }),
      })
      if (imgRes.ok) {
        const imgData = await imgRes.json() as {
          candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
        }
        const parts = imgData?.candidates?.[0]?.content?.parts ?? []
        const inlineData = parts.find((p) => p?.inlineData)?.inlineData
        if (inlineData?.data) {
          imageUrl = `data:${inlineData.mimeType ?? "image/jpeg"};base64,${inlineData.data}`
        }
      }
    } catch {
      // gateway failed — fall through to OpenAI fallback
    }

    if (!imageUrl) {
      imageUrl = await openaiGenerateImage(imagePrompt)
    }
    if (!imageUrl) {
      throw new Error("Image generation failed (gateway + OpenAI)")
    }
    await recordImageGen(userId, postId)

    // Save imageUrl to twitterPosts
    await db
      .update(twitterPosts)
      .set({ imageUrl })
      .where(and(eq(twitterPosts.id, postId), eq(twitterPosts.userId, userId)))

    return NextResponse.json({ imageUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
