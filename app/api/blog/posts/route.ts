import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

const VM_UPLOAD_URL = "http://136.114.136.34:4001/upload"

async function uploadBase64Image(dataUrl: string, slug: string): Promise<string | null> {
  try {
    const [header, base64] = dataUrl.split(",")
    if (!base64) return null
    const mimeType = header.split(":")[1]?.split(";")[0] ?? "image/jpeg"
    const ext = mimeType.includes("png") ? ".png" : ".jpg"
    const filename = slug.slice(0, 100) + ext
    const res = await fetch(VM_UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType, filename }),
    })
    if (!res.ok) return null
    const data = await res.json() as { url?: string }
    return data.url ?? null
  } catch {
    return null
  }
}

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
    keyword: r.keyword ?? "",
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

    // If coverImageUrl is a base64 data URL, upload it to the VM image service
    // so the blog HTML references a real public URL instead of an inline blob
    let coverImageUrl = body.coverImageUrl ?? null
    if (coverImageUrl?.startsWith("data:")) {
      const uploaded = await uploadBase64Image(coverImageUrl, slug)
      if (uploaded) coverImageUrl = uploaded
    }

    const [inserted] = await db
      .insert(blogPosts)
      .values({
        userId: session.user.id,
        slug,
        title: body.title,
        content: body.content,
        metaDescription: body.metaDescription ?? "",
        keyword: body.keyword ?? null,
        keywords: body.keywords ?? [],
        siteId: body.siteId ?? null,
        siteSlug: body.siteSlug ?? null,
        coverImageUrl,
      })
      .returning()

    const post: BlogPost = {
      id: inserted.id,
      slug: inserted.slug,
      title: inserted.title,
      content: inserted.content,
      metaDescription: inserted.metaDescription ?? "",
      keywords: Array.isArray(inserted.keywords) ? (inserted.keywords as string[]) : [],
      keyword: inserted.keyword ?? body.keyword ?? "",
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
