import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const IMAGE_API_URL = "http://34.60.133.229:4000/v1/images/generations"
const IMAGE_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

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
        model: "imagen-3.0-generate-002",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      }),
    })

    if (!imgRes.ok) {
      const errText = await imgRes.text()
      throw new Error(`Image API error ${imgRes.status}: ${errText}`)
    }

    const imgData = await imgRes.json() as {
      data?: Array<{ url?: string; b64_json?: string }>
    }

    const imageEntry = imgData.data?.[0]
    if (!imageEntry) {
      throw new Error("No image data returned from API")
    }

    let imageUrl: string

    if (imageEntry.url) {
      imageUrl = imageEntry.url
    } else if (imageEntry.b64_json) {
      imageUrl = `data:image/png;base64,${imageEntry.b64_json}`
    } else {
      throw new Error("Image API returned no URL or base64 data")
    }

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
