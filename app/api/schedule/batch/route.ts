import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { scheduledPosts, connectedSites } from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"
import { callLLM } from "@/lib/llm-client"

export const runtime = "nodejs"

interface TopicSuggestion {
  title: string
  keyword: string
  description: string
}

function extractMeta(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)`, "i"))
  return match ? match[1].trim() : ""
}

function extractMetaContent(html: string, name: string): string {
  const match =
    html.match(
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
    ) ??
    html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i")
    )
  return match ? match[1].trim() : ""
}

export async function POST(req: NextRequest) {
  // Allow internal cron calls via x-cron-secret header
  const cronSecret = process.env.CRON_SECRET
  const cronHeader = req.headers.get("x-cron-secret")
  const isInternalCron = cronSecret && cronHeader === cronSecret

  let body: { siteUrl?: string; language?: string; tone?: string; userId?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  let userId: string

  if (isInternalCron) {
    // Internal call from cron — resolve userId from the siteUrl's owner
    if (!body.siteUrl) {
      return NextResponse.json({ error: "siteUrl required for internal cron calls" }, { status: 400 })
    }
    const matchingSite = await db
      .select()
      .from(connectedSites)
      .where(eq(connectedSites.url, body.siteUrl))
      .limit(1)
    if (!matchingSite[0]) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    userId = matchingSite[0].userId
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    userId = session.user.id
  }

  let siteUrl = body.siteUrl
  const language = body.language || "en"
  const tone = body.tone || "Professional"

  // Look up default connected site to get siteProfile
  const sites = await db
    .select()
    .from(connectedSites)
    .where(eq(connectedSites.userId, userId))
  const defaultSite = sites.find((s) => s.isDefault) ?? sites[0]

  // If no siteUrl provided, use default site URL
  if (!siteUrl) {
    if (!defaultSite) {
      return NextResponse.json(
        { error: "No connected site found. Connect a site in Settings first." },
        { status: 422 }
      )
    }
    siteUrl = defaultSite.url
  }

  // Bug 8: Guard against duplicate scheduled posts — if >= 5 already scheduled, skip
  const [scheduledCountRow] = await db
    .select({ value: count() })
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "scheduled")))
  const scheduledCount = scheduledCountRow?.value ?? 0
  if (scheduledCount >= 5) {
    return NextResponse.json(
      { success: false, message: "Calendar is already populated" },
      { status: 200 }
    )
  }

  // Extract site profile if available
  const siteProfile = defaultSite?.siteProfile as {
    niche?: string
    products?: string[]
    targetAudience?: string
    topics?: string[]
  } | null | undefined

  // Normalize URL
  let fetchUrl = siteUrl.trim()
  if (!/^https?:\/\//i.test(fetchUrl)) {
    fetchUrl = "https://" + fetchUrl
  }

  // Get user's existing scheduled posts to extract usedKeywords
  const existingPosts = await db
    .select({ keyword: scheduledPosts.keyword })
    .from(scheduledPosts)
    .where(eq(scheduledPosts.userId, userId))

  const usedKeywords = existingPosts.map((p) => p.keyword).filter(Boolean)

  // Fetch the website
  let html = ""
  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GrowthEngineBot/1.0; +https://itgrows.com)",
      },
      signal: AbortSignal.timeout(10000),
    })
    html = await res.text()
  } catch {
    return NextResponse.json(
      { error: "Could not fetch the website. Please check the URL." },
      { status: 422 }
    )
  }

  // Extract site info
  const title = extractMeta(html, "title")
  const metaDescription = extractMetaContent(html, "description")
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i)
  const h1 = h1Match ? h1Match[1].trim() : ""

  // Build site profile context for the prompt
  const siteProfileContext = siteProfile?.niche
    ? `\nSite niche: ${siteProfile.niche}\nSite products/services: ${siteProfile.products?.join(", ") || "N/A"}\nTarget audience: ${siteProfile.targetAudience || "N/A"}\nGenerate 15 unique article topics SPECIFICALLY for this niche. Topics must be directly relevant to: ${siteProfile.niche}.`
    : `\nSite URL: ${siteUrl}`

  // Call LLM once asking for 15 unique topic suggestions
  const prompt = `Analyze this website and suggest 15 unique SEO article topics.
Site: ${title}, ${metaDescription}, ${h1}${siteProfileContext}
Already used keywords (avoid these): ${usedKeywords.join(", ") || "none"}
Return JSON array: [{"title": "...", "keyword": "...", "description": "..."}]
Return ONLY valid JSON, no markdown.`

  let topics: TopicSuggestion[] = []
  try {
    const rawContent = await callLLM(
      [{ role: "user", content: prompt }],
      { caller: "schedule/batch", max_tokens: 4096, temperature: 0.8 }
    )

    // Parse JSON from LLM response
    const stripped = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()
    const start = stripped.indexOf("[")
    const end = stripped.lastIndexOf("]")
    if (start !== -1 && end !== -1 && end > start) {
      const parsed = JSON.parse(stripped.slice(start, end + 1))
      if (Array.isArray(parsed)) {
        topics = parsed as TopicSuggestion[]
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to get topic suggestions: ${String(err)}` },
      { status: 500 }
    )
  }

  // Ensure we have exactly 15 topics (trim or use what we got)
  topics = topics.slice(0, 15)
  if (topics.length === 0) {
    return NextResponse.json({ error: "LLM returned no topics" }, { status: 500 })
  }

  // Schedule 15 posts: today + N days (N = 1..15)
  const today = new Date()
  const insertedPosts = []

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    const scheduledDate = new Date(today)
    scheduledDate.setDate(today.getDate() + i + 1)
    const dateStr = scheduledDate.toISOString().split("T")[0]

    const [post] = await db
      .insert(scheduledPosts)
      .values({
        userId,
        keyword: topic.keyword,
        language,
        tone,
        scheduledDate: dateStr,
        status: "scheduled",
      })
      .returning()

    insertedPosts.push(post)
  }

  return NextResponse.json({
    success: true,
    scheduled: insertedPosts.length,
    posts: insertedPosts,
  })
}
