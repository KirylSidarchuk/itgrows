import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const IMAGE_API_URL = "http://34.60.133.229:4000/images/generate"
const IMAGE_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
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

    // Build image prompt from tweet content
    const tweetText = post.content.replace(/#\w+/g, "").trim()
    const imagePrompt = `Create a clean, professional social media image for this tweet: "${tweetText}". Visual style: modern, minimal, eye-catching. No text overlays. Suitable for Twitter/X post.`

    // Call image generation API
    const imgRes = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IMAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: imagePrompt,
      }),
    })

    if (!imgRes.ok) {
      const errText = await imgRes.text()
      throw new Error(`Image API error ${imgRes.status}: ${errText}`)
    }

    const imgData = await imgRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
    }

    const parts = imgData?.candidates?.[0]?.content?.parts ?? []
    const inlineData = parts.find((p) => p?.inlineData)?.inlineData
    if (!inlineData?.data) {
      throw new Error("No image data returned from API")
    }

    const mimeType = inlineData.mimeType ?? "image/jpeg"
    const imageUrl = `data:${mimeType};base64,${inlineData.data}`

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
