import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts, connectedSites } from "@/lib/db/schema"
import { storeImage } from "@/lib/image-store"
import { and, eq, desc } from "drizzle-orm"
import { slugBase } from "@/lib/slug"

async function uploadBase64Image(dataUrl: string, slug: string): Promise<string | null> {
  const stored = await storeImage(dataUrl, slug.slice(0, 100))
  return stored?.url ?? null
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

// A post may only go to a blog the caller owns. The site is looked up by id or slug among the
// caller's own connected sites; whatever slug the request carries is never trusted on its own
// (it used to be, so any account could publish into another client's blog or onto itgrows.ai/blog).
async function ownedSite(userId: string, siteId?: string | null, siteSlug?: string | null) {
  if (!siteId && !siteSlug) return null
  try {
    const [s] = await db
      .select({ id: connectedSites.id, siteSlug: connectedSites.siteSlug, blogDomain: connectedSites.blogDomain })
      .from(connectedSites)
      .where(and(siteId ? eq(connectedSites.id, siteId) : eq(connectedSites.siteSlug, siteSlug!), eq(connectedSites.userId, userId)))
      .limit(1)
    return s ?? null
  } catch {
    return null
  }
}

function slugify(text: string): string {
  return (
    slugBase(text) +
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

    const owned = await ownedSite(session.user.id, body.siteId, body.siteSlug)
    if ((body.siteId || body.siteSlug) && !owned) {
      return NextResponse.json({ success: false, error: "site_not_found" }, { status: 403 })
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
        siteId: owned?.id ?? null,
        siteSlug: owned?.siteSlug ?? null,
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
