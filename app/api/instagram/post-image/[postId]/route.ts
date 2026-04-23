import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params

  const [post] = await db
    .select({ imageUrl: instagramPosts.imageUrl })
    .from(instagramPosts)
    .where(eq(instagramPosts.id, postId))
    .limit(1)

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const imageUrl = post.imageUrl
  if (!imageUrl) {
    return NextResponse.json({ error: "No image for this post" }, { status: 404 })
  }

  // If it's already a public HTTP URL, redirect to it
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return NextResponse.redirect(imageUrl)
  }

  // Handle base64 data URL
  if (imageUrl.startsWith("data:")) {
    const [meta, base64Data] = imageUrl.split(",")
    const mimeMatch = meta.match(/data:([^;]+);/)
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"
    const buffer = Buffer.from(base64Data, "base64")

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    })
  }

  return NextResponse.json({ error: "Unsupported image format" }, { status: 400 })
}
