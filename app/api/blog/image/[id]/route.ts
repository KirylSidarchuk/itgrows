import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [post] = await db.select({ coverImageUrl: blogPosts.coverImageUrl }).from(blogPosts).where(eq(blogPosts.id, id))

  if (!post?.coverImageUrl) {
    return new NextResponse(null, { status: 404 })
  }

  // Parse data URL: "data:image/jpeg;base64,..."
  const dataUrl = post.coverImageUrl
  if (dataUrl.startsWith("data:")) {
    const [header, base64] = dataUrl.split(",")
    const mimeType = header.split(":")[1].split(";")[0]
    const buffer = Buffer.from(base64, "base64")
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  }

  // If it's already a URL, redirect
  return NextResponse.redirect(dataUrl)
}
