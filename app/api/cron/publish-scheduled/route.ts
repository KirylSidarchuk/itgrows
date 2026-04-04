import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface ScheduledPost {
  id: string
  keyword: string
  language: string
  tone: string
  scheduledDate: string
  status: "scheduled" | "generating" | "published" | "failed"
  taskId?: string
  blogPostSlug?: string
}

interface GeneratedArticle {
  keyword: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
}

async function generateArticle(
  keyword: string,
  language: string,
  tone: string
): Promise<GeneratedArticle> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/seo/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, language, tone }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error?: string }
    throw new Error(err.error ?? "Failed to generate article")
  }
  return (await res.json()) as GeneratedArticle
}

async function publishArticle(article: GeneratedArticle): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/blog/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error?: string }
    throw new Error(err.error ?? "Failed to publish article")
  }
  const data = (await res.json()) as { post?: { slug?: string } }
  return data.post?.slug ?? ""
}

async function updatePostStatus(
  baseUrl: string,
  id: string,
  status: ScheduledPost["status"],
  extra?: { blogPostSlug?: string; taskId?: string }
) {
  await fetch(`${baseUrl}/api/schedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, ...extra }),
  })
}

export async function GET(req: NextRequest) {
  // Verify authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const today = new Date().toISOString().split("T")[0]

  // Fetch scheduled posts
  let posts: ScheduledPost[] = []
  try {
    const res = await fetch(`${baseUrl}/api/schedule`)
    const data = (await res.json()) as { posts: ScheduledPost[] }
    posts = data.posts
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch schedule: ${String(err)}` }, { status: 500 })
  }

  // Filter posts that are scheduled for today or earlier and still in 'scheduled' status
  const todayPosts = posts.filter(
    (p) => p.status === "scheduled" && p.scheduledDate <= today
  )

  const results: Array<{ id: string; keyword: string; status: string; error?: string }> = []

  for (const post of todayPosts) {
    try {
      // Mark as generating
      await updatePostStatus(baseUrl, post.id, "generating")

      // Generate article
      const article = await generateArticle(post.keyword, post.language, post.tone)

      // Save as task
      const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      // Publish to blog
      const slug = await publishArticle(article)

      // Mark as published
      await updatePostStatus(baseUrl, post.id, "published", {
        taskId,
        blogPostSlug: slug,
      })

      results.push({ id: post.id, keyword: post.keyword, status: "published" })
    } catch (err) {
      // Mark as failed
      await updatePostStatus(baseUrl, post.id, "failed")
      results.push({ id: post.id, keyword: post.keyword, status: "failed", error: String(err) })
    }
  }

  return NextResponse.json({
    date: today,
    processed: todayPosts.length,
    results,
  })
}
