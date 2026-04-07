import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { BlogPost } from "../route"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params

  const [row] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.userId, session.user.id)))

  if (!row) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const post: BlogPost = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    metaDescription: row.metaDescription ?? "",
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    keyword: "",
    publishedAt: row.publishedAt.toISOString(),
    status: "published",
    ...(row.siteId ? { siteId: row.siteId } : {}),
    ...(row.siteSlug ? { siteSlug: row.siteSlug } : {}),
    ...(row.coverImageUrl ? { coverImageUrl: row.coverImageUrl } : {}),
  }

  return NextResponse.json({ post })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await db
    .delete(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.userId, session.user.id)))
    .returning()

  if (result.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
