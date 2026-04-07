import { NextRequest, NextResponse } from "next/server"

// This endpoint receives articles from itgrows.ai publishing system
// It forwards them to the internal blog
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
    }

    const { token, title, content, metaDescription, keywords, keyword, siteId, siteSlug } = body

    // Validate token against environment variable
    const expectedToken = process.env.ITGROWS_SITE_TOKEN
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Forward to internal blog API
    const baseUrl = req.nextUrl.origin
    const blogRes = await fetch(`${baseUrl}/api/blog/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, metaDescription, keywords, keyword, siteId, siteSlug }),
    })

    const blogData = await blogRes.json()

    if (!blogRes.ok) {
      return NextResponse.json({ error: "Failed to publish to blog" }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: blogData.post })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
