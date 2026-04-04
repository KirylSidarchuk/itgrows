import { NextRequest, NextResponse } from "next/server"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-pro"
const LLM_API_KEY = "any-key"

interface GenerateRequest {
  keyword: string
  language?: string
  tone?: string
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

function buildPrompt(keyword: string, language: string, tone: string): string {
  const langLabel: Record<string, string> = {
    en: "English",
    ru: "Russian",
    uk: "Ukrainian",
  }
  const lang = langLabel[language] ?? "English"

  return `You are an expert SEO content writer. Write a comprehensive SEO-optimized article in ${lang}.

Topic/Keyword: "${keyword}"
Tone: ${tone}
Length: 1500-2000 words

Requirements:
1. Start with an H1 title (use # for H1)
2. Include an engaging introduction paragraph
3. Use H2 sections (## heading) for main topics — at least 4 H2 sections
4. Use H3 subsections (### heading) where relevant
5. Include a conclusion section
6. Naturally incorporate the main keyword and related terms throughout
7. Write in ${lang}

After the article, on a new line write exactly:
META_DESCRIPTION: [a compelling meta description of 150-160 characters that includes the main keyword]
KEYWORDS: [comma-separated list of 5-8 SEO keywords used in the article]

Write the full article now:`
}

function parseArticle(raw: string): {
  title: string
  content: string
  metaDescription: string
  keywords: string[]
} {
  const metaMatch = raw.match(/META_DESCRIPTION:\s*(.+?)(?:\n|$)/i)
  const keywordsMatch = raw.match(/KEYWORDS:\s*(.+?)(?:\n|$)/i)

  const metaDescription = metaMatch ? metaMatch[1].trim() : ""
  const keywordsRaw = keywordsMatch ? keywordsMatch[1].trim() : ""
  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
    : []

  // Remove meta/keywords lines from body
  const bodyRaw = raw
    .replace(/META_DESCRIPTION:.*$/im, "")
    .replace(/KEYWORDS:.*$/im, "")
    .trim()

  // Extract title from first H1
  const titleMatch = bodyRaw.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : ""

  // Convert simple markdown to HTML
  const content = markdownToHtml(bodyRaw)

  return { title, content, metaDescription, keywords }
}

function markdownToHtml(md: string): string {
  let html = md
    // H3
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    // H2
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    // H1
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered list items
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Paragraphs: wrap lines that aren't already HTML tags
  const lines = html.split("\n")
  const result: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      result.push("")
    } else if (/^<(h[123]|ul|ol|li|p)/.test(trimmed)) {
      result.push(trimmed)
    } else {
      result.push(`<p>${trimmed}</p>`)
    }
  }

  return result.join("\n")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateRequest
    const { keyword, language = "en", tone = "Professional" } = body

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 })
    }

    const prompt = buildPrompt(keyword, language, tone)

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: prompt,
      },
    ]

    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM API error ${llmResponse.status}: ${errText}`)
    }

    const llmData = await llmResponse.json() as ChatCompletionResponse
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    if (!rawContent) {
      throw new Error("LLM returned empty response")
    }

    const parsed = parseArticle(rawContent)

    return NextResponse.json({
      keyword,
      title: parsed.title,
      content: parsed.content,
      metaDescription: parsed.metaDescription,
      keywords: parsed.keywords,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
