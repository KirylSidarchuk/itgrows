import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { callLLM } from "@/lib/llm-client"

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
  try {
    text = await callLLM([{ role: "user", content: prompt }], { caller: "onboarding/topics", temperature: 0.7 })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `LLM error: ${errMsg}` }, { status: 500 })
  }
  if (!text) return NextResponse.json({ error: "LLM returned empty response" }, { status: 500 })

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
