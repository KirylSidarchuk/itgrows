import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Serves a LinkedIn post's cover image by id, so the posts list API can return a
// lightweight URL instead of the ~1MB base64 data URL stored in the DB.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params

  const [post] = await db
    .select({ imageUrl: linkedinPosts.imageUrl })
    .from(linkedinPosts)
    .where(eq(linkedinPosts.id, postId))
    .limit(1)

  const imageUrl = post?.imageUrl
  if (!imageUrl) {
    return NextResponse.json({ error: "No image for this post" }, { status: 404 })
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return NextResponse.redirect(imageUrl)
  }

  if (imageUrl.startsWith("data:")) {
    const [meta, base64Data] = imageUrl.split(",")
    const mimeType = meta.match(/data:([^;]+);/)?.[1] ?? "image/jpeg"
    const buffer = Buffer.from(base64Data, "base64")
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  }

  return NextResponse.json({ error: "Unsupported image format" }, { status: 400 })
}
