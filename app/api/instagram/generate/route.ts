import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { instagramAccounts, instagramPosts, instagramBriefs, users } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { checkGenerateRateLimit } from "@/lib/rate-limit"
import { hasAccess } from "@/lib/access"
import { generatePostImage } from "@/lib/linkedin-image"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.5-flash-lite"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

interface GenerateInstagramRequest {
  brief?: {
    niche?: string
    tone?: string
    goals?: string
    targetAudience?: string
  }
}

function buildInstagramPrompt(brief: {
  niche?: string | null
  tone?: string | null
  goals?: string | null
  targetAudience?: string | null
}): string {
  const currentYear = new Date().getFullYear()
  const tone = brief.tone ?? "casual"
  const niche = brief.niche ?? "lifestyle"
  const goals = brief.goals ?? "grow audience and build personal brand"
  const audience = brief.targetAudience ? `Target audience: ${brief.targetAudience}. ` : ""

  return `You are an Instagram personal brand expert writing in the first person for a ${tone} creator in the ${niche} space.
${audience}Goals: ${goals}. Current year: ${currentYear}.

STRICT RULES — violations make the post unusable:
1. NEVER invent case studies or fabricated stats like "I gained 10k followers in 30 days".
2. NEVER make up statistics, percentages, or numeric claims you cannot know to be true.
3. NEVER fabricate client names, testimonials, or quotes.
4. NEVER use spammy language like "follow for more" or "link in bio 👇" as the only CTA.
5. NEVER write generic motivational fluff — every post must feel like a real person sharing something genuine.

INSTAGRAM STYLE RULES:
- Use short paragraphs (1–3 sentences each) — Instagram readers scroll fast.
- Use line breaks generously to create visual breathing room.
- Emojis are welcome — use 2–5 per post to add energy, not as filler.
- Strong, specific CTAs: "Save this post 🔖", "Drop your answer below 👇", "Tag someone who needs this".
- Visual storytelling: write as if painting a picture the reader can see.
- Captions should feel conversational, warm, and authentic.

FORMAT for each post:
- Hook in the first line: a bold statement, question, or mini-story opener that stops the scroll.
- 3–5 short paragraphs (each 1–3 sentences).
- Final line: a specific CTA (save, comment, tag, share).
- 5–10 relevant hashtags on the last line (mix niche-specific and broad discovery tags).
- Total caption length: 150–300 words (excluding hashtags).

Cover 7 different angles across the set:
personal lesson | behind the scenes moment | contrarian take | "what I wish I knew" | a mistake and what it taught me | a trend I'm watching | an honest question to my audience

Return ONLY a valid JSON array with exactly 7 objects. Each object must have:
- "content": string (the full caption text including hashtags). Use \\n for line breaks. NEVER use unescaped double quotes inside strings — use single quotes or rephrase instead.
- "hook": string (first sentence only, for preview). No double quotes inside.

Example of the CORRECT style:
[
  {
    "content": "Nobody tells you this when you start in ${niche} 👀\\n\\nYou don't need to be perfect.\\nYou need to be consistent.\\n\\nI spent months trying to get everything exactly right before posting.\\nThat was my biggest mistake.\\n\\nThe people growing fastest aren't the most talented — they're the most persistent.\\n\\nWhat's one thing you're waiting to be 'ready' for? Drop it below 👇\\n\\n#${niche.replace(/\s+/g, "")} #PersonalBrand #ContentCreator #GrowthMindset #InstagramTips",
    "hook": "Nobody tells you this when you start in ${niche} 👀"
  }
]

Write the 7 posts now, return only the JSON array:`
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Check subscription or trial
    const [user] = await db.select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt })
      .from(users).where(eq(users.id, userId)).limit(1)
    if (!user || !hasAccess({ subscriptionStatus: user.subscriptionStatus ?? null, subscriptionPlan: user.subscriptionPlan ?? null, trialEndsAt: user.trialEndsAt ?? null })) {
      return NextResponse.json({ error: "subscription_required", message: "Active Personal subscription or active trial required" }, { status: 403 })
    }

    // Check rate limit
    const rateLimit = await checkGenerateRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "rate_limit_exceeded", message: "You can generate once every 3 hours. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter ?? 3600) }
        }
      )
    }

    const body = await req.json() as GenerateInstagramRequest

    // Get user's Instagram account
    const [account] = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "No Instagram account connected" }, { status: 400 })
    }

    // Get brief from DB or request body
    let brief: {
      niche?: string | null
      tone?: string | null
      goals?: string | null
      targetAudience?: string | null
    } = {}

    if (body.brief) {
      brief = body.brief
    } else {
      const [dbBrief] = await db
        .select()
        .from(instagramBriefs)
        .where(eq(instagramBriefs.userId, userId))
        .limit(1)
      if (dbBrief) brief = dbBrief
    }

    const briefFilled = !!(brief.niche?.trim() || brief.goals?.trim() || brief.targetAudience?.trim())
    if (!briefFilled) {
      return NextResponse.json({ error: "brief_required", message: "Please fill your Instagram brief before generating posts." }, { status: 400 })
    }

    const prompt = buildInstagramPrompt(brief)

    const FALLBACK_MODELS = [LLM_MODEL, "gemini-2.5-flash", "gemini-2.5-pro"]
    let llmResponse: Response | null = null
    let lastStatus = 0

    for (let attempt = 0; attempt < 3; attempt++) {
      const modelToUse = FALLBACK_MODELS[Math.min(attempt, FALLBACK_MODELS.length - 1)]
      llmResponse = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
          temperature: 0.8,
        }),
      })

      if (llmResponse.ok) break

      lastStatus = llmResponse.status
      if (lastStatus === 429) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
          continue
        }
        return NextResponse.json(
          { error: "ai_busy", message: "Our AI is busy right now. Please try again in a few minutes." },
          { status: 503 }
        )
      }

      const errText = await llmResponse.text()
      throw new Error(`LLM API error ${lastStatus}: ${errText}`)
    }

    if (!llmResponse || !llmResponse.ok) {
      const errText = await llmResponse?.text() ?? ""
      throw new Error(`LLM API error ${lastStatus}: ${errText}`)
    }

    const llmData = await llmResponse.json() as { choices: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    if (!rawContent) {
      throw new Error("LLM returned empty response")
    }

    // Parse JSON from response — robust against LLM quirks
    const cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not parse JSON array from LLM response")
    }

    let postsData: Array<{ content: string; hook: string }>
    const tryParse = (str: string) => {
      try { return JSON.parse(str) } catch { return null }
    }

    // Attempt 1: direct parse
    postsData = tryParse(jsonMatch[0])

    // Attempt 2: fix unescaped control chars
    if (!postsData) {
      const fixed = jsonMatch[0].replace(/("(?:[^"\\]|\\.)*")/g, (m) =>
        m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      )
      postsData = tryParse(fixed)
    }

    // Attempt 3: extract each object individually
    if (!postsData) {
      const objects = [...cleaned.matchAll(/\{\s*"content"\s*:\s*"([\s\S]*?)"\s*,\s*"hook"\s*:\s*"([\s\S]*?)"\s*\}/g)]
      if (objects.length > 0) {
        postsData = objects.map(m => ({ content: m[1].replace(/\\n/g, "\n"), hook: m[2] }))
      }
    }

    if (!postsData || !Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    // Delete existing draft/scheduled posts before generating new ones
    await db.delete(instagramPosts).where(
      and(
        eq(instagramPosts.userId, userId),
        inArray(instagramPosts.status, ["draft", "scheduled"])
      )
    )

    // Schedule posts: one per day at 10:00 UTC starting tomorrow
    const now = new Date()
    const slice = postsData.slice(0, 7)

    // Generate all images in parallel (1080x1080 square format for Instagram)
    const imageUrls = await Promise.all(
      slice.map((postData) => generatePostImage(postData.content, brief.niche ?? "lifestyle"))
    )

    // Insert all posts
    const insertedPosts = []
    for (let i = 0; i < slice.length; i++) {
      const postData = slice[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + i + 1)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      const [inserted] = await db
        .insert(instagramPosts)
        .values({
          userId,
          instagramAccountId: account.id,
          content: postData.content,
          status: "scheduled",
          scheduledFor,
          imageUrl: imageUrls[i],
        })
        .returning()

      insertedPosts.push(inserted)
    }

    return NextResponse.json({ posts: insertedPosts, count: insertedPosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
