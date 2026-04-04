import { NextRequest, NextResponse } from "next/server"

interface PublishRequest {
  siteUrl: string
  siteToken: string
  platform: "wordpress" | "custom"
  title: string
  content: string
  metaDescription?: string
  siteId?: string
  siteSlug?: string
  keywords?: string[]
  keyword?: string
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
  let body: PublishRequest
  try {
    body = (await req.json()) as PublishRequest
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { siteUrl, siteToken, platform, title, content, metaDescription, siteId, siteSlug, keywords, keyword } = body

  if (!siteUrl || !siteToken || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  let normalUrl = siteUrl.trim()
  if (!normalUrl.startsWith("http://") && !normalUrl.startsWith("https://")) {
    normalUrl = "https://" + normalUrl
  }
  // Remove trailing slash
  normalUrl = normalUrl.replace(/\/$/, "")

  const payload = { token: siteToken, title, content, metaDescription: metaDescription ?? "" }

  // Choose endpoint based on platform
  const endpoint =
    platform === "wordpress"
      ? `${normalUrl}/wp-json/itgrows/v1/publish`
      : `${normalUrl}/api/itgrows-publish`

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    // also mirror the article to the itgrows hosted blog
    if (data.success && (siteId || siteSlug)) {
      try {
        const baseUrl = req.nextUrl.origin
        await fetch(`${baseUrl}/api/blog/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
