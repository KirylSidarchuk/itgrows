import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CLUSTER_A_KEYWORDS, ITGROWS_SITE_CONTEXT } from "@/lib/itgrows-blog-keywords"

export const maxDuration = 300

const OWNER_FALLBACK_EMAIL = "kiryl.sidarchuk@gmail.com"

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) +
    "-" +
    Date.now().toString(36)
  )
}

// Generates ONE itgrows.ai marketing article per run and stores it under siteSlug="itgrows"
// so it appears on /blog + the sitemap (Article/FAQ JSON-LD render automatically).
// Reuses the existing /api/seo/generate engine via the internal x-internal-secret path,
// so no generation logic is duplicated and the product flow is untouched.
//
// Triggered by Vercel cron (Authorization: Bearer CRON_SECRET). Also runnable manually with
// the same header; ?keyword=... overrides the queue for testing.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("Authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let stage = "start"
  try {
    // Resolve the owner for marketing posts: reuse an existing itgrows post's owner,
    // else fall back to the founder account. (blog_posts.userId is NOT NULL.)
    stage = "resolve-owner"
    let ownerId: string | null = null
    const [existing] = await db
      .select({ userId: blogPosts.userId })
      .from(blogPosts)
      .where(eq(blogPosts.siteSlug, "itgrows"))
      .limit(1)
    ownerId = existing?.userId ?? null
    if (!ownerId) {
      const [founder] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, OWNER_FALLBACK_EMAIL))
        .limit(1)
      ownerId = founder?.id ?? null
    }
    if (!ownerId) {
      return NextResponse.json(
        { error: `No owner found for marketing blog (no siteSlug='itgrows' post and no ${OWNER_FALLBACK_EMAIL} user).` },
        { status: 500 }
      )
    }

    // Pick the next keyword not yet published (dedup against existing itgrows posts).
    stage = "pick-keyword"
    const override = req.nextUrl.searchParams.get("keyword")?.trim()
    const used = await db
      .select({ keyword: blogPosts.keyword })
      .from(blogPosts)
      .where(eq(blogPosts.siteSlug, "itgrows"))
    const usedSet = new Set(used.map((u) => (u.keyword ?? "").toLowerCase().trim()))
    const keyword = override || CLUSTER_A_KEYWORDS.find((k) => !usedSet.has(k.toLowerCase()))
    if (!keyword) {
      return NextResponse.json({ done: true, message: "All cluster-A keywords already published. Add more keywords." })
    }

    // Generate the article + cover image via the existing engine (internal call = no auth/paywall).
    stage = "generate"
    console.log(`[itgrows-blog] generating "${keyword}" via ${req.nextUrl.origin}/api/seo/generate (owner=${ownerId})`)
    const genRes = await fetch(`${req.nextUrl.origin}/api/seo/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": cronSecret },
      body: JSON.stringify({
        keyword,
        language: "en",
        tone: "Professional",
        siteContext: ITGROWS_SITE_CONTEXT,
      }),
    })
    console.log(`[itgrows-blog] seo/generate responded ${genRes.status} ${genRes.headers.get("content-type") ?? ""}`)
    if (!genRes.ok) {
      const errText = await genRes.text()
      console.error(`[itgrows-blog] generation failed ${genRes.status}: ${errText.slice(0, 300)}`)
      return NextResponse.json({ error: "Generation failed", status: genRes.status, keyword, detail: errText.slice(0, 500) }, { status: 502 })
    }
    stage = "parse-response"
    const data = (await genRes.json()) as {
      title?: string
      content?: string
      metaDescription?: string
      keywords?: string[]
      coverImageUrl?: string | null
      seoScore?: number
    }

    if (!data.title || !data.content) {
      return NextResponse.json({ error: "Generator returned empty title/content", keyword }, { status: 502 })
    }

    stage = "insert"
    const slug = slugify(data.title)
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        userId: ownerId,
        siteSlug: "itgrows",
        slug,
        title: data.title,
        content: data.content,
        metaDescription: data.metaDescription ?? "",
        keyword,
        keywords: data.keywords ?? [],
        coverImageUrl: data.coverImageUrl ?? null,
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug })

    return NextResponse.json({
      success: true,
      keyword,
      seoScore: data.seoScore ?? null,
      hasCover: !!data.coverImageUrl,
      post: inserted,
      url: `https://www.itgrows.ai/blog/${slug}`,
      remaining: CLUSTER_A_KEYWORDS.filter((k) => !usedSet.has(k.toLowerCase()) && k !== keyword).length,
    })
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
    console.error(`[itgrows-blog] FAILED at stage="${stage}":`, message)
    return NextResponse.json({ error: message.slice(0, 800), stage }, { status: 500 })
  }
}
