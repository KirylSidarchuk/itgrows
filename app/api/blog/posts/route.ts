import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
  keyword: string
  publishedAt: string
  status: "published"
  siteId?: string
  siteSlug?: string
  coverImageUrl?: string
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Date.now().toString(36)
  )
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.userId, session.user.id))
    .orderBy(desc(blogPosts.publishedAt))

  const posts: BlogPost[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    content: r.content,
    metaDescription: r.metaDescription ?? "",
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
    keyword: "",
    publishedAt: r.publishedAt.toISOString(),
    status: "published",
    ...(r.siteId ? { siteId: r.siteId } : {}),
    ...(r.siteSlug ? { siteSlug: r.siteSlug } : {}),
    ...(r.coverImageUrl ? { coverImageUrl: r.coverImageUrl } : {}),
  }))

  return NextResponse.json({ posts, storage: "db" })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as {
      title: string
      content: string
      metaDescription?: string
      keywords?: string[]
      keyword?: string
      siteId?: string
      siteSlug?: string
      coverImageUrl?: string
    }

    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, error: "Missing title or content" }, { status: 400 })
    }

    const slug = slugify(body.title)

    const [inserted] = await db
      .insert(blogPosts)
      .values({
        userId: session.user.id,
        slug,
        title: body.title,
        content: body.content,
        metaDescription: body.metaDescription ?? "",
        keywords: body.keywords ?? [],
        siteId: body.siteId ?? null,
        siteSlug: body.siteSlug ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
      })
      .returning()

    const post: BlogPost = {
      id: inserted.id,
      slug: inserted.slug,
      title: inserted.title,
      content: inserted.content,
      metaDescription: inserted.metaDescription ?? "",
      keywords: Array.isArray(inserted.keywords) ? (inserted.keywords as string[]) : [],
      keyword: body.keyword ?? "",
      publishedAt: inserted.publishedAt.toISOString(),
      status: "published",
      ...(inserted.siteId ? { siteId: inserted.siteId } : {}),
      ...(inserted.siteSlug ? { siteSlug: inserted.siteSlug } : {}),
      ...(inserted.coverImageUrl ? { coverImageUrl: inserted.coverImageUrl } : {}),
    }

    return NextResponse.json({ success: true, post, storage: "db" })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
