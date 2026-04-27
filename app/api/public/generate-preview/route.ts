import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ghostModeLogs } from "@/lib/db/schema"
import { checkIPRateLimit, getClientIP } from "@/lib/rate-limit"

export const maxDuration = 120

// Allow max 3 requests per IP per hour for this unauthenticated LLM endpoint
const IP_RATE_LIMIT_MAX = 3
const IP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const LLM_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const LLM_BASE = "http://34.60.133.229:4000"

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-pro",
  
]

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])
}

async function generateImageForPost(postContent: string): Promise<string | null> {
  // Get a short image prompt
  let imagePrompt = "Professional LinkedIn post cover, business professional, modern office"
  try {
    const promptRes = await withTimeout(fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [{
          role: "user",
          content: `Write a 30-word image prompt for a LinkedIn post cover image. Post: "${postContent.slice(0, 200)}". Photorealistic, professional, no text in image. Return ONLY the prompt.`,
        }],
        max_tokens: 80,
        temperature: 0.7,
      }),
    }), 10000)
    if (promptRes.ok) {
      const d = await promptRes.json() as { choices?: Array<{ message?: { content?: string } }> }
      const p = d.choices?.[0]?.message?.content?.trim()
      if (p) imagePrompt = p
    }
  } catch { /* use default */ }

  // Try each image model once
  for (const model of IMAGE_MODELS) {
    try {
      const imgRes = await withTimeout(fetch(`${LLM_BASE}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
        body: JSON.stringify({ model, prompt: imagePrompt }),
      }), 45000)
      if (!imgRes.ok) continue
      const imgData = await imgRes.json() as {
        candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
      }
      const parts = imgData?.candidates?.[0]?.content?.parts ?? []
      const inlineData = parts.find((p) => p?.inlineData)?.inlineData
      if (inlineData?.data) {
        const mime = inlineData.mimeType ?? "image/jpeg"
        return `data:${mime};base64,${inlineData.data}`
      }
    } catch { /* try next model */ }
  }
  return null
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  // IP-based rate limiting: max 3 requests per hour per IP
  const clientIP = getClientIP(req)
  const ipLimit = checkIPRateLimit(clientIP, IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_MS)
  if (!ipLimit.allowed) {
    db.insert(ghostModeLogs).values({ success: false, error: "ip_rate_limited", durationMs: Date.now() - startTime }).catch(() => {})
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfter ?? 3600) },
      }
    )
  }

  const body = await req.json() as { thoughts?: string }
  const thoughts = (body.thoughts ?? "").trim().slice(0, 1000)

  if (!thoughts || thoughts.length < 10) {
    db.insert(ghostModeLogs).values({ success: false, error: "Too short", durationMs: Date.now() - startTime }).catch(() => {})
    return NextResponse.json({ error: "Too short" }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()

  const prompt = `You are a top LinkedIn ghostwriter. A user shared thoughts about themselves:

"${thoughts}"

Write 3 distinct LinkedIn posts. Each post: 100-150 words max, strong hook, real human tone, ends with a question. Year: ${currentYear}. No clichés.

Post 1: Personal story or lesson
Post 2: Bold/contrarian opinion
Post 3: Practical insight

Return ONLY a valid JSON array of exactly 3 strings. No markdown, no code blocks, no extra text.
["post1 here","post2 here","post3 here"]`

  try {
    // Generate posts text
    const res = await fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 4096,
      }),
    })

    if (res.status === 429) {
      db.insert(ghostModeLogs).values({ success: false, error: "rate_limited", durationMs: Date.now() - startTime }).catch(() => {})
      return NextResponse.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 })
    }
    if (!res.ok) {
      db.insert(ghostModeLogs).values({ success: false, error: "llm_error", durationMs: Date.now() - startTime }).catch(() => {})
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content ?? ""

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) {
      db.insert(ghostModeLogs).values({ success: false, error: "parse_failed", durationMs: Date.now() - startTime }).catch(() => {})
      return NextResponse.json({ error: "Parse failed" }, { status: 500 })
    }

    const tryParse = (s: string) => { try { return JSON.parse(s) } catch { return null } }
    let posts: string[] | null = tryParse(match[0])
    if (!posts) {
      // Fix unescaped newlines/tabs inside JSON strings
      const fixed = match[0].replace(/("(?:[^"\\]|\\.)*")/g, (m) =>
        m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      )
      posts = tryParse(fixed)
    }
    if (!Array.isArray(posts) || posts.length === 0) {
      db.insert(ghostModeLogs).values({ success: false, error: "invalid_response", durationMs: Date.now() - startTime }).catch(() => {})
      return NextResponse.json({ error: "Invalid response" }, { status: 500 })
    }

    const finalPosts = posts.slice(0, 3)

    // Generate images in parallel for all posts — non-blocking: if any image fails, return null for that slot
    const images = await Promise.all(
      finalPosts.map((p) =>
        generateImageForPost(p).catch(() => null)
      )
    )

    db.insert(ghostModeLogs).values({ success: true, durationMs: Date.now() - startTime }).catch(() => {})
    return NextResponse.json({ posts: finalPosts, images })
  } catch {
    db.insert(ghostModeLogs).values({ success: false, error: "server_error", durationMs: Date.now() - startTime }).catch(() => {})
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
