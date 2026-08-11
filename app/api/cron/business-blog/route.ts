import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts, users } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { BUSINESS_BLOG_QUEUE, BUSINESS_SITE_CONTEXT } from "@/lib/business-blog-keywords"

export const maxDuration = 300

const OWNER_FALLBACK_EMAIL = "kiryl.sidarchuk@gmail.com"
const SITE_SLUG = "itgrows-business"

// Same reason as the itgrows-blog cron: call the public alias, not req.nextUrl.origin. The cron
// runs on the *.vercel.app deployment URL, which is behind Deployment Protection and answers
// server-to-server calls with an HTML interstitial.
const SITE_URL = process.env.ITGROWS_PUBLIC_URL ?? "https://www.itgrows.ai"

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

// Generates ONE article per run for the /business blog, storing it under siteSlug="itgrows-business".
// Reuses /api/seo/generate so no generation logic is duplicated.
//
// The difference from the itgrows-blog cron is corpus awareness: each run passes the articles
// already published in this cluster to the generator, which links to a few of them from the body.
// A series whose pieces do not reference each other is a list, not a cluster, and a crawler has
// no reason to walk from one to the next.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("Authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let stage = "start"
  try {
    stage = "resolve-owner"
    let ownerId: string | null = null
    const [existing] = await db
      .select({ userId: blogPosts.userId })
      .from(blogPosts)
      .where(eq(blogPosts.siteSlug, SITE_SLUG))
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
        { error: `No owner found for the business blog (no siteSlug='${SITE_SLUG}' post and no ${OWNER_FALLBACK_EMAIL} user).` },
        { status: 500 }
      )
    }

    stage = "pick-keyword"
    const override = req.nextUrl.searchParams.get("keyword")?.trim()
    const published = await db
      .select({ keyword: blogPosts.keyword, title: blogPosts.title, slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.siteSlug, SITE_SLUG))
      .orderBy(desc(blogPosts.publishedAt))

    const usedSet = new Set(published.map((u) => (u.keyword ?? "").toLowerCase().trim()))
    const keyword = override || BUSINESS_BLOG_QUEUE.find((k) => !usedSet.has(k.toLowerCase()))
    if (!keyword) {
      return NextResponse.json({ done: true, message: "Every queued keyword is published. Add more to BUSINESS_BLOG_QUEUE." })
    }

    // Hand the generator the most recent siblings. Capped at 12: a longer list buys nothing and
    // eats prompt budget that the article itself needs.
    const internalLinks = published.slice(0, 12).map((p) => ({
      title: p.title,
      url: `${SITE_URL}/business/blog/${p.slug}`,
    }))

    stage = "generate"
    console.log(`[business-blog] generating "${keyword}" with ${internalLinks.length} internal links (owner=${ownerId})`)
    const genRes = await fetch(`${SITE_URL}/api/seo/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": cronSecret },
      body: JSON.stringify({
        keyword,
        language: "en",
        tone: "Professional",
        siteContext: BUSINESS_SITE_CONTEXT,
        internalLinks,
      }),
    })
    if (!genRes.ok) {
      const errText = await genRes.text()
      console.error(`[business-blog] generation failed ${genRes.status}: ${errText.slice(0, 300)}`)
      return NextResponse.json({ error: "Generation failed", status: genRes.status, keyword, detail: errText.slice(0, 500) }, { status: 502 })
    }
    if (!(genRes.headers.get("content-type") ?? "").includes("application/json")) {
      const body = await genRes.text()
      console.error(`[business-blog] non-JSON 200 from seo/generate: ${body.slice(0, 200)}`)
      return NextResponse.json({ error: "seo/generate returned non-JSON (protection interstitial?)", keyword, detail: body.slice(0, 300) }, { status: 502 })
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
        siteSlug: SITE_SLUG,
        slug,
        title: data.title,
        content: data.content,
        metaDescription: data.metaDescription ?? "",
        keyword,
        keywords: data.keywords ?? [],
        coverImageUrl: data.coverImageUrl ?? null,
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug })

    // How many of the offered links the model actually used — the only way to know the cluster is
    // really knitting together rather than the instruction being quietly ignored.
    const linksUsed = internalLinks.filter((l) => data.content!.includes(l.url)).length

    return NextResponse.json({
      success: true,
      keyword,
      seoScore: data.seoScore ?? null,
      hasCover: !!data.coverImageUrl,
      internalLinksOffered: internalLinks.length,
      internalLinksUsed: linksUsed,
      post: inserted,
      url: `${SITE_URL}/business/blog/${slug}`,
      remaining: BUSINESS_BLOG_QUEUE.filter((k) => !usedSet.has(k.toLowerCase()) && k !== keyword).length,
    })
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
    console.error(`[business-blog] FAILED at stage="${stage}":`, message)
    return NextResponse.json({ error: message.slice(0, 800), stage }, { status: 500 })
  }
}
