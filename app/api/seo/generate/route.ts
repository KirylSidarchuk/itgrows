import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, blogPosts, scheduledPosts } from "@/lib/db/schema"
import { eq, and, isNotNull, count } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"
const LLM_API_KEY = "any-key"

interface SiteContext {
  niche: string
  targetAudience?: string
}

interface GenerateRequest {
  keyword: string
  language?: string
  tone?: string
  siteContext?: SiteContext
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

interface SeoBreakdown {
  wordCount: number
  headings: number
  keywords: number
  meta: number
  faq: number
  keyTakeaways: number
}

function buildPrompt(keyword: string, language: string, tone: string, siteContext?: SiteContext): string {
  const langLabel: Record<string, string> = {
    en: "English",
    ru: "Russian",
    uk: "Ukrainian",
  }
  const lang = langLabel[language] ?? "English"
  const currentYear = new Date().getFullYear()

  const nicheInstruction = siteContext?.niche
    ? `\nThis article is for a website in the ${siteContext.niche} niche${siteContext.targetAudience ? `, targeting ${siteContext.targetAudience}` : ""}. Keep content specific to this niche.`
    : ""

  return `You are a world-class SEO content strategist and writer. Write a comprehensive, authoritative article in ${lang} that ranks well in Google, Bing, ChatGPT, and Perplexity.${nicheInstruction}

Topic/Keyword: "${keyword}"
Tone: ${tone}
Target length: 1800-2200 words
Current year: ${currentYear}

=== CONTENT STRUCTURE (follow exactly) ===

1. H1 TITLE — compelling, includes main keyword, mentions ${currentYear} if relevant
2. INTRODUCTION (first ~150 words):
   - Open with a clear, direct answer to what the reader wants to know (search intent answer)
   - This is critical for AI search engines (ChatGPT, Perplexity) — give the core answer immediately
   - Include a hook with a relevant statistic or compelling fact

3. KEY TAKEAWAYS section (bullet list, 4-6 bullets):
   - Add a ## Key Takeaways heading right after the intro
   - Summarize the most important points readers will learn
   - This helps both readers and AI engines quickly grasp value

4. MAIN BODY — minimum 4 H2 sections, use H3 subsections where appropriate:
   - Each H2 covers a distinct, valuable subtopic
   - Use H3s to break down complex H2 sections
   - Include real statistics, examples, case studies
   - Provide actionable, practical advice readers can implement
   - Naturally weave in semantic/LSI keywords related to the main topic
   - Demonstrate Experience, Expertise, Authoritativeness, Trustworthiness (E-E-A-T):
     * Cite specific data points, years, percentages
     * Mention well-known tools, platforms, or industry standards
     * Use authoritative language that signals deep expertise
     * Include nuanced insights that generic articles miss

5. FAQ SECTION — add at the very end of the article body:
   - Use ## Frequently Asked Questions as the heading
   - Include exactly 5 questions and detailed answers
   - Questions should match what people ask in Google/ChatGPT searches
   - Answers should be 2-4 sentences each, clear and direct

6. CONCLUSION:
   - Brief wrap-up with a clear call to action

=== AFTER THE ARTICLE ===
On new lines after the article, write exactly these two lines:
META_DESCRIPTION: [a compelling meta description of 120-160 characters including the main keyword]
KEYWORDS: [comma-separated list of 10-15 short SEO keyword phrases (2-5 words each, NO full sentences)]

=== IMPORTANT RULES ===
- Use # for H1, ## for H2, ### for H3
- All information must reflect ${currentYear} — no outdated stats or old versions
- Write in ${lang}
- Do NOT add any commentary before or after the article
- Hit the 1800-2200 word target — longer articles rank better

Write the full article now:`
}

function computeSeoScore(
  content: string,
  keywords: string[],
  metaDescription: string,
): { score: number; breakdown: SeoBreakdown } {
  // Word count score (0-25)
  const wordCount = content
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length
  let wordCountScore = 10
  if (wordCount >= 1800) wordCountScore = 25
  else if (wordCount >= 1500) wordCountScore = 20

  // Heading structure score (0-20)
  const hasH1 = /<h1[\s>]/i.test(content)
  const h2Matches = content.match(/<h2[\s>]/gi) ?? []
  const h3Matches = content.match(/<h3[\s>]/gi) ?? []
  let headingsScore = 0
  if (hasH1) headingsScore += 5
  if (h2Matches.length >= 3) headingsScore += 10
  else if (h2Matches.length >= 1) headingsScore += 5
  if (h3Matches.length >= 2) headingsScore += 5

  // Keywords score (0-20)
  let keywordsScore = 5
  if (keywords.length >= 10) keywordsScore = 20
  else if (keywords.length >= 5) keywordsScore = 15

  // Meta description score (0-15)
  let metaScore = 0
  if (metaDescription) {
    const len = metaDescription.length
    if (len >= 120 && len <= 160) metaScore = 15
    else metaScore = 8
  }

  // FAQ section score (0-10)
  const hasFaq =
    /frequently asked questions/i.test(content) ||
    /faq/i.test(content)
  const faqScore = hasFaq ? 10 : 0

  // Key Takeaways score (0-10)
  const hasKeyTakeaways = /key takeaways/i.test(content)
  const keyTakeawaysScore = hasKeyTakeaways ? 10 : 0

  const total = wordCountScore + headingsScore + keywordsScore + metaScore + faqScore + keyTakeawaysScore

  return {
    score: Math.min(100, total),
    breakdown: {
      wordCount: wordCountScore,
      headings: headingsScore,
      keywords: keywordsScore,
      meta: metaScore,
      faq: faqScore,
      keyTakeaways: keyTakeawaysScore,
    },
  }
}

function parseArticle(raw: string): {
  title: string
  content: string
  metaDescription: string
  keywords: string[]
} {
  // More flexible regex: handles bold (**META_DESCRIPTION:**), colons, line breaks
  const metaMatch = raw.match(/\*{0,2}META[_\s]?DESCRIPTION\*{0,2}:?\*{0,2}\s*([^\n]+)/i)
  const keywordsMatch = raw.match(/\*{0,2}KEYWORDS\*{0,2}:?\*{0,2}\s*([^\n]+)/i)

  const metaDescription = metaMatch ? metaMatch[1].replace(/^\*+|\*+$/g, "").trim() : ""
  const keywordsRaw = keywordsMatch ? keywordsMatch[1].replace(/^\*+|\*+$/g, "").trim() : ""
  const keywords = keywordsRaw
    ? keywordsRaw.split(/[,;]/).map((k) => k.trim()).filter((k) => k.length > 0 && k.length <= 60 && k.split(" ").length <= 6)
    : []

  // Remove meta/keywords lines from body
  const bodyRaw = raw
    .replace(/\*{0,2}META[_\s]?DESCRIPTION\*{0,2}:?\*{0,2}.*$/im, "")
    .replace(/\*{0,2}KEYWORDS\*{0,2}:?\*{0,2}.*$/im, "")
    .trim()

  // Extract title from first H1
  const titleMatch = bodyRaw.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : ""

  // Convert simple markdown to HTML
  const content = markdownToHtml(bodyRaw)

  // Fallback: extract meta description from first paragraph if not found
  const finalMeta = metaDescription || (() => {
    const firstPara = bodyRaw
      .replace(/^#{1,3}\s+.+$/gm, "") // remove headings
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 40)[0] || ""
    return firstPara.slice(0, 160)
  })()

  // Fallback: extract keywords from H2 headings if not found
  const finalKeywords = keywords.length > 0 ? keywords : (() => {
    return bodyRaw.match(/^##\s+(.+)$/gm)
      ?.map(h => h.replace(/^##\s+/, "").trim())
      .slice(0, 6) ?? []
  })()

  return { title, content, metaDescription: finalMeta, keywords: finalKeywords }
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
    // Allow internal server-to-server calls (from cron) via secret header
    const internalSecret = process.env.CRON_SECRET
    const internalHeader = req.headers.get("x-internal-secret")
    const isInternalCall = internalSecret && internalHeader === internalSecret

    let userId: string | null = null
    if (!isInternalCall) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userId = session.user.id

      // Paywall: check subscription status and trial usage
      const [user] = await db
        .select({ subscriptionStatus: users.subscriptionStatus })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user || user.subscriptionStatus !== "active") {
        // Count articles generated: published blog posts + scheduled posts with article data
        const [blogCount] = await db
          .select({ value: count() })
          .from(blogPosts)
          .where(eq(blogPosts.userId, userId))

        const [schedCount] = await db
          .select({ value: count() })
          .from(scheduledPosts)
          .where(and(eq(scheduledPosts.userId, userId), isNotNull(scheduledPosts.articleData)))

        const totalArticles = (blogCount?.value ?? 0) + (schedCount?.value ?? 0)
        const TRIAL_LIMIT = 3

        if (totalArticles >= TRIAL_LIMIT) {
          return NextResponse.json(
            { error: "Subscribe to continue", trialUsed: totalArticles, trialLimit: TRIAL_LIMIT },
            { status: 402 }
          )
        }
      }
    }

    const body = await req.json() as GenerateRequest
    const { keyword, language = "en", tone = "Professional", siteContext } = body

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 })
    }

    const prompt = buildPrompt(keyword, language, tone, siteContext)

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
        max_tokens: 8192,
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
    const { score: seoScore, breakdown: seoBreakdown } = computeSeoScore(
      parsed.content,
      parsed.keywords,
      parsed.metaDescription,
    )

    // Generate cover image
    let coverImageUrl: string | null = null
    try {
      const internalHeader = req.headers.get("x-internal-secret")
      const imgRes = await fetch(`${req.nextUrl.origin}/api/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(internalHeader ? { "x-internal-secret": internalHeader } : { "Cookie": req.headers.get("cookie") || "" }),
        },
        body: JSON.stringify({ title: parsed.title, keywords: parsed.keywords }),
      })
      if (imgRes.ok) {
        const imgData = await imgRes.json()
        coverImageUrl = imgData.url ?? null
      } else {
        console.warn("[seo/generate] Image generation failed:", await imgRes.text())
      }
    } catch (imgErr) {
      console.warn("[seo/generate] Image generation error:", imgErr)
    }

    return NextResponse.json({
      keyword,
      title: parsed.title,
      content: parsed.content,
      metaDescription: parsed.metaDescription,
      keywords: parsed.keywords,
      seoScore,
      seoBreakdown,
      coverImageUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
