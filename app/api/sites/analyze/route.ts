import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const runtime = "nodejs"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"
const LLM_API_KEY = "any-key"

interface SiteProfile {
  niche: string
  products: string[]
  targetAudience: string
  topics: string[]
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
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

function extractH1s(html: string): string[] {
  const matches = [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi)]
  return matches.map((m) => m[1].trim()).filter(Boolean)
}

function extractBodyText(html: string): string {
  // Remove scripts, styles, nav, footer
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned.slice(0, 3000)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as { siteUrl?: string; siteId?: string }
    const { siteUrl, siteId } = body

    if (!siteUrl || !siteId) {
      return NextResponse.json({ error: "siteUrl and siteId are required" }, { status: 400 })
    }

    // Normalize URL
    let fetchUrl = siteUrl.trim()
    if (!/^https?:\/\//i.test(fetchUrl)) {
      fetchUrl = "https://" + fetchUrl
    }

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

    // Extract site context
    const title = extractMeta(html, "title")
    const metaDescription = extractMetaContent(html, "description")
    const h1s = extractH1s(html)
    const bodyText = extractBodyText(html)

    const siteContext = `
Title: ${title}
Meta Description: ${metaDescription}
H1s: ${h1s.join(", ")}
Body excerpt: ${bodyText}
    `.trim()

    // Call LLM to generate site profile
    const prompt = `Analyze this website and extract: 1) main niche/industry, 2) key products or services, 3) target audience, 4) main topics to write about. Website data: ${siteContext}. Return JSON: { "niche": "string", "products": ["string"], "targetAudience": "string", "topics": ["string"] }. Return ONLY valid JSON, no markdown.`

    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM API error ${llmResponse.status}: ${errText}`)
    }

    const llmData = (await llmResponse.json()) as ChatCompletionResponse
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    // Parse JSON from LLM response
    const stripped = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()
    const start = stripped.indexOf("{")
    const end = stripped.lastIndexOf("}")

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("LLM returned invalid JSON for site profile")
    }

    const profile = JSON.parse(stripped.slice(start, end + 1)) as SiteProfile

    // Save profile to connected_sites — scoped to this user's site only
    await db
      .update(connectedSites)
      .set({ siteProfile: profile })
      .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))

    console.log("[sites/analyze] Profile saved for siteId:", siteId, profile)

    return NextResponse.json({ profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[sites/analyze] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
