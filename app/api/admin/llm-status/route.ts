import { NextResponse } from "next/server"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro-image-preview"]

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")
  if (token !== process.env.ITGROWS_SITE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, { status: number | string; ms: number; error?: string }> = {}

  for (const model of MODELS) {
    const start = Date.now()
    try {
      const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000),
      })
      const ms = Date.now() - start
      const text = await res.text()
      results[model] = { status: res.status, ms, error: res.ok ? undefined : text.slice(0, 200) }
    } catch (e) {
      results[model] = { status: "timeout/error", ms: Date.now() - start, error: String(e) }
    }
  }

  return NextResponse.json({ ts: new Date().toISOString(), results })
}
