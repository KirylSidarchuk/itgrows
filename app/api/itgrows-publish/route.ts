import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts, connectedSites } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"

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

// This endpoint receives articles from itgrows.ai publishing system
// It forwards them to the internal blog, scoped to the correct userId
// resolved from the connected site's siteId or siteSlug.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      token: string
      title: string
      content: string
      metaDescription?: string
      keywords?: string[]
      keyword?: string
      siteId?: string
      siteSlug?: string
      coverImageUrl?: string | null
    }

    const { token, title, content, metaDescription, keywords, keyword, siteId, siteSlug, coverImageUrl } = body

    // Validate token against environment variable
    const expectedToken = process.env.ITGROWS_SITE_TOKEN
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 })
    }

    // Resolve userId from the connected site — required for multi-tenant isolation
    let userId: string | null = null
    if (siteId || siteSlug) {
      const conditions = []
      if (siteId) conditions.push(eq(connectedSites.id, siteId))
      if (siteSlug) conditions.push(eq(connectedSites.siteSlug, siteSlug))

      const [site] = await db
        .select({ userId: connectedSites.userId })
        .from(connectedSites)
        .where(conditions.length === 1 ? conditions[0] : or(...conditions))
        .limit(1)

      userId = site?.userId ?? null
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Could not resolve site owner. Provide a valid siteId or siteSlug." },
        { status: 422 }
      )
    }

    const slug = slugify(title)

    const [inserted] = await db
      .insert(blogPosts)
      .values({
        userId,
        slug,
        title,
        content,
        metaDescription: metaDescription ?? "",
        keywords: keywords ?? [],
        siteId: siteId ?? null,
        siteSlug: siteSlug ?? null,
        coverImageUrl: coverImageUrl ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, post: inserted })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
