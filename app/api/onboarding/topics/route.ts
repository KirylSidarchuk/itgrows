import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"]

interface TopicItem {
  title: string
  description: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { siteUrl } = await req.json() as { siteUrl: string }

  if (!siteUrl || typeof siteUrl !== "string") {
    return NextResponse.json({ error: "siteUrl is required" }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()

  // Fetch site content
  let siteContext = `Website URL: ${siteUrl}`
  try {
    const siteRes = await fetch(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ItGrows/1.0)" },
      signal: AbortSignal.timeout(5000),
    })
    const html = await siteRes.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ""

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    const metaDesc = metaMatch ? metaMatch[1].trim() : ""

    // Extract H1s
    const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].slice(0, 3).map(m => m[1].trim())

    // Extract some body text
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const bodyText = bodyMatch
      ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)
      : ""

    siteContext = `Website URL: ${siteUrl}
Title: ${title}
Meta description: ${metaDesc}
Headings: ${h1Matches.join(", ")}
Page content excerpt: ${bodyText}`
  } catch {
    // Use URL only as fallback
  }

  const prompt = `You are an SEO expert. The current year is ${currentYear}. Analyze this website and suggest 3 highly relevant blog article topics that match its niche and would drive organic traffic in ${currentYear}.

${siteContext}

Use only current, up-to-date information. Topics must match the website's actual niche/industry. Do NOT suggest generic business or marketing topics unless that is clearly the site's focus. Return ONLY a JSON array: [{"title": "...", "description": "..."}]`

  let text = ""
  let lastError = ""
  for (let attempt = 0; attempt < LLM_MODELS.length; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: LLM_MODELS[attempt],
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      })
      if (!res.ok) { lastError = await res.text(); continue }
      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      text = data.choices[0]?.message?.content ?? ""
      if (text) break
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }
  if (!text) return NextResponse.json({ error: `LLM error: ${lastError}` }, { status: 500 })

  let topics: TopicItem[] = []
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned) as TopicItem[]
    topics = parsed.slice(0, 3)
  } catch {
    return NextResponse.json({ error: "Failed to parse LLM response", raw: text }, { status: 500 })
  }

  return NextResponse.json({ topics })
}
