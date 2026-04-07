import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { topic, language = "en" } = body as { topic: string; language?: string }

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "topic is required" }, { status: 400 })
    }

    const langMap: Record<string, string> = {
      en: "en",
      ru: "ru",
      uk: "uk",
    }
    const lang = langMap[language] ?? "en"

    const encodedTopic = encodeURIComponent(topic)
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodedTopic}&hl=${lang}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; itgrows-seo/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Google Autocomplete returned ${response.status}`)
    }

    const data = await response.json() as [string, string[]]
    const suggestions: string[] = data[1] ?? []

    // Also generate long-tail variants
    const longTailPrefixes = ["how to", "best", "top", "what is", "why", "guide to"]
    const longTailVariants: string[] = []
    for (const prefix of longTailPrefixes) {
      if (!topic.toLowerCase().startsWith(prefix)) {
        longTailVariants.push(`${prefix} ${topic}`)
      }
    }

    const allKeywords = [...new Set([topic, ...suggestions, ...longTailVariants])]

    return NextResponse.json({
      topic,
      keywords: allKeywords,
      suggestions,
      longTail: longTailVariants,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
