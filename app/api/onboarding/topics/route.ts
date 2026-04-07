import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"

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
  const prompt = `You are an SEO expert. The current year is ${currentYear}. Given the website URL '${siteUrl}', suggest 3 blog article topics that would drive organic traffic in ${currentYear}. Use only current, up-to-date information. Do NOT reference years before ${currentYear}. Return ONLY a JSON array: [{"title": "...", "description": "..."}]`

  const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return NextResponse.json({ error: `LLM error: ${errText}` }, { status: 500 })
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices[0]?.message?.content ?? ""

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
