import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post] = await db.select({ coverImageUrl: blogPosts.coverImageUrl }).from(blogPosts).where(eq(blogPosts.slug, slug))

  if (!post?.coverImageUrl) return new NextResponse(null, { status: 404 })

  if (post.coverImageUrl.startsWith("data:")) {
    const [header, base64] = post.coverImageUrl.split(",")
    const mimeType = header.split(":")[1].split(";")[0]
    const buffer = Buffer.from(base64, "base64")
    return new NextResponse(buffer, {
      headers: { "Content-Type": mimeType, "Cache-Control": "public, max-age=86400" },
    })
  }
  return NextResponse.redirect(post.coverImageUrl)
}
