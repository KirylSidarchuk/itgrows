import { NextRequest, NextResponse } from "next/server"

export type DetectedPlatform =
  | "wordpress"
  | "shopify"
  | "webflow"
  | "nextjs"
  | "custom"

export interface DetectPlatformResult {
  platform: DetectedPlatform
  confidence: "high" | "low"
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let url: string
  try {
    const body = await req.json()
    url = body.url as string
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // Normalise URL
  let targetUrl = url.trim()
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let headers: Record<string, string> = {}
    let html = ""

    try {
      // Try HEAD first to get headers cheaply
      const headRes = await fetch(targetUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      })
      headRes.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value.toLowerCase()
      })
    } catch {
      // HEAD failed, continue to GET
    }

    // GET the page for HTML analysis
    const getRes = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; itgrows-bot/1.0; +https://itgrows.ai)",
      },
    })
    clearTimeout(timeoutId)

    getRes.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase()
    })

    // Only read first 50 KB for performance
    const buffer = await getRes.arrayBuffer()
    const decoder = new TextDecoder("utf-8", { fatal: false })
    const fullText = decoder.decode(buffer)
    html = fullText.slice(0, 50000).toLowerCase()

    // --- WordPress ---
    if (
      (headers["x-powered-by"] && headers["x-powered-by"].includes("wordpress")) ||
      html.includes("/wp-content/") ||
      html.includes("/wp-includes/")
    ) {
      return NextResponse.json<DetectPlatformResult>({
        platform: "wordpress",
        confidence: "high",
      })
    }

    // --- Shopify ---
    if (
      headers["x-shopify-stage"] !== undefined ||
      headers["x-shopid"] !== undefined ||
      html.includes("cdn.shopify.com") ||
      html.includes("shopify.theme")
    ) {
      return NextResponse.json<DetectPlatformResult>({
        platform: "shopify",
        confidence: "high",
      })
    }

    // --- Webflow ---
    if (html.includes("webflow.com") || html.includes("data-wf-page")) {
      return NextResponse.json<DetectPlatformResult>({
        platform: "webflow",
        confidence: "high",
      })
    }

    // --- Next.js / React ---
    if (
      html.includes("__next") ||
      html.includes("__next_data__") ||
      html.includes("_next/static") ||
      html.includes('"next"') ||
      html.includes("react")
    ) {
      return NextResponse.json<DetectPlatformResult>({
        platform: "nextjs",
        confidence: "high",
      })
    }

    return NextResponse.json<DetectPlatformResult>({
      platform: "custom",
      confidence: "low",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fetch failed"
    return NextResponse.json(
      { platform: "custom", confidence: "low", error: message },
      { status: 200 }
    )
  }
}
