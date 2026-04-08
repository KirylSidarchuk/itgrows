import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"
const LLM_API_KEY = "any-key"

interface AnalyzeRequest {
  url: string
  usedKeywords?: string[]
}

interface TopicSuggestion {
  title: string
  description: string
  keyword: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

function extractText(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.slice(0, 2000)
}

function extractMeta(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)`, "i"))
  return match ? match[1].trim() : ""
}

function extractMetaContent(html: string, name: string): string {
  const match = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i")
  )
  return match ? match[1].trim() : ""
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as AnalyzeRequest
    const { url, usedKeywords = [] } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 })
    }

    // Normalize URL
    let fetchUrl = url.trim()
    if (!/^https?:\/\//i.test(fetchUrl)) {
      fetchUrl = "https://" + fetchUrl
    }

    // Fetch the webpage
    let html = ""
    try {
      const res = await fetch(fetchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; GrowthEngineBot/1.0; +https://itgrows.com)",
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
    const mainText = extractText(html)

    const siteInfo = { title, metaDescription, h1, mainText }

    // Ask LLM for topic suggestions
    const currentYear = new Date().getFullYear()
    const prompt = `Based on this website:
Title: ${title}
Description: ${metaDescription}
H1: ${h1}
Main content: ${mainText}

Suggest 3 NEW SEO article topics that would drive traffic to this site.
Return ONLY a JSON array (no markdown, no extra text): [{"title": "...", "description": "...", "keyword": "..."}]
Topics should be specific, relevant, and have good search volume potential.
Each description should be 1-2 sentences.
Current year: ${currentYear}${usedKeywords.length > 0 ? `\n\nIMPORTANT: Do NOT suggest topics similar to these already-published articles:\n${usedKeywords.map(k => `- ${k}`).join("\n")}\nSuggest completely different topics.` : ""}`

    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM API error ${llmResponse.status}: ${errText}`)
    }

    const llmData = (await llmResponse.json()) as ChatCompletionResponse
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    // Parse JSON from LLM response
    let topics: TopicSuggestion[] = []
    let parseError = ""
    try {
      // Strip markdown code fences if present
      const stripped = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim()
      // Find first [ and last ] to extract the JSON array
      const start = stripped.indexOf("[")
      const end = stripped.lastIndexOf("]")
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = stripped.slice(start, end + 1)
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed)) {
          topics = parsed as TopicSuggestion[]
        }
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e)
      console.error("[seo/analyze] Failed to parse LLM response:", parseError, rawContent.slice(0, 500))
    }

    return NextResponse.json({ siteInfo, topics })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
