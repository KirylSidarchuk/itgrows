import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

interface PublishRequest {
  siteUrl: string
  siteToken: string
  platform: "wordpress" | "custom" | "octobercms" | "php"
  title: string
  content: string
  metaDescription?: string
  siteId?: string
  siteSlug?: string
  keywords?: string[]
  keyword?: string
  coverImageUrl?: string | null
  webhookUrl?: string
}

interface PublishResult {
  success: boolean
  url?: string
  post_id?: number
  error?: string
}

// POST { siteUrl, siteToken, platform, title, content, metaDescription }
// Publishes an article to a connected site using the siteToken
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: PublishRequest
  try {
    body = (await req.json()) as PublishRequest
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { siteUrl, siteToken, platform, title, content, metaDescription, siteId, siteSlug, keywords, keyword, coverImageUrl, webhookUrl } = body

  if (!siteUrl || !siteToken || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Helper: generate a URL-friendly slug from the article title
  function generateSlug(t: string): string {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  let normalUrl = siteUrl.trim()
  if (!normalUrl.startsWith("http://") && !normalUrl.startsWith("https://")) {
    normalUrl = "https://" + normalUrl
  }
  // Remove trailing slash
  normalUrl = normalUrl.replace(/\/$/, "")

  const payload = {
    token: siteToken,
    title,
    content,
    metaDescription: metaDescription ?? "",
    keywords: keywords ?? [],
    coverImageUrl: coverImageUrl ?? null,
  }

  // Choose endpoint based on platform
  let endpoint: string
  if (platform === "wordpress") {
    endpoint = `${normalUrl}/wp-json/itgrows/v1/publish`
  } else if (platform === "octobercms" || platform === "php") {
    // Use the custom webhook URL if provided, otherwise fall back to a default path
    endpoint = webhookUrl?.trim() || `${normalUrl}/itgrows-webhook.php`
  } else {
    endpoint = `${normalUrl}/api/itgrows-publish`
  }

  // For octobercms/php, include the slug in the payload
  const finalPayload =
    platform === "octobercms" || platform === "php"
      ? { ...payload, slug: generateSlug(title) }
      : payload

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      return NextResponse.json(
        { success: false, error: `Remote returned ${res.status}: ${errText}` },
        { status: 502 }
      )
    }

    const data = (await res.json()) as PublishResult

    // If publish to external site succeeded and we have site context,
    // also mirror the article to the itgrows hosted blog.
    // Forward the session cookie so auth() resolves correctly in blog/posts.
    if (data.success && (siteId || siteSlug)) {
      try {
        const baseUrl = req.nextUrl.origin
        await fetch(`${baseUrl}/api/blog/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Forward the session cookie so the blog/posts route can authenticate
            ...(req.headers.get("cookie") ? { "Cookie": req.headers.get("cookie")! } : {}),
          },
          body: JSON.stringify({
            title,
            content,
            metaDescription: metaDescription ?? "",
            keywords: keywords ?? [],
            keyword: keyword ?? "",
            ...(siteId ? { siteId } : {}),
            ...(siteSlug ? { siteSlug } : {}),
          }),
        })
      } catch {
        // mirroring is best-effort — don't fail the main response
      }
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
