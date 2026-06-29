import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, linkedinBriefs, users } from "@/lib/db/schema"
import { eq, and, inArray, isNull } from "drizzle-orm"
import { checkGenerateRateLimit } from "@/lib/rate-limit"
import { hasAccess } from "@/lib/access"
import { buildLinkedInPrompt, buildPostHashtags } from "@/lib/linkedin-generate"
import { generatePostImage } from "@/lib/linkedin-image"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.5-flash-lite"
const LLM_API_KEY = process.env.LLM_API_KEY ?? "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .trim()
}

interface GenerateLinkedInRequest {
  linkedinAccountId?: string
  brief?: {
    niche?: string
    tone?: string
    goals?: string
    companyName?: string
    targetAudience?: string
    avoidTopics?: string
    imageStyle?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Check subscription or trial
    const [user] = await db.select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt, cancelAtPeriodEnd: users.cancelAtPeriodEnd, subscriptionEndDate: users.subscriptionEndDate })
      .from(users).where(eq(users.id, userId)).limit(1)
    const userAccess = { subscriptionStatus: user?.subscriptionStatus ?? null, subscriptionPlan: user?.subscriptionPlan ?? null, trialEndsAt: user?.trialEndsAt ?? null }
    if (!user || !hasAccess(userAccess)) {
      return NextResponse.json({ error: "subscription_required", message: "Active subscription or active trial required" }, { status: 403 })
    }
    let maxPosts = 14
    if (user?.cancelAtPeriodEnd && user?.subscriptionEndDate) {
      const daysLeft = Math.ceil((user.subscriptionEndDate.getTime() - Date.now()) / 86400000)
      if (daysLeft < 14) maxPosts = Math.max(daysLeft, 1)
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

    const body = await req.json() as GenerateLinkedInRequest
    const { linkedinAccountId } = body

    // Get user's LinkedIn account (specific or first personal)
    let account
    if (linkedinAccountId) {
      ;[account] = await db
        .select()
        .from(linkedinAccounts)
        .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.id, linkedinAccountId)))
        .limit(1)
    } else {
      ;[account] = await db
        .select()
        .from(linkedinAccounts)
        .where(eq(linkedinAccounts.userId, userId))
        .limit(1)
    }

    if (!account) {
      return NextResponse.json({ error: "No LinkedIn account connected" }, { status: 400 })
    }

    // Get brief from DB or request body
    let brief: {
      niche?: string | null
      tone?: string | null
      goals?: string | null
      companyName?: string | null
      targetAudience?: string | null
      postingFrequency?: string | null
      avoidTopics?: string | null
      imageStyle?: string | null
    } = {}

    if (body.brief) {
      brief = body.brief
    } else {
      const [dbBrief] = await db
        .select()
        .from(linkedinBriefs)
        .where(linkedinAccountId
          ? and(eq(linkedinBriefs.userId, userId), eq(linkedinBriefs.linkedinAccountId, linkedinAccountId))
          : eq(linkedinBriefs.userId, userId))
        .limit(1)
      if (dbBrief) brief = dbBrief
    }

    const briefFilled = !!(brief.niche?.trim() || brief.goals?.trim() || brief.targetAudience?.trim())
    if (!briefFilled) {
      return NextResponse.json({ error: "brief_required", message: "Please fill your Professional DNA before generating posts." }, { status: 400 })
    }

    const isCompany = account.pageType === "company" || account.pageType === "organization"
    const prompt = buildLinkedInPrompt(brief, maxPosts, isCompany)

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
      if (lastStatus === 429 || lastStatus === 503) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          continue
        }
        // All retries exhausted — return friendly error
        return NextResponse.json(
          { error: "ai_busy", message: "Our AI is busy right now. Please try again in a few minutes.", retryAfter: 30 },
          { status: 503 }
        )
      }

      // Non-429/503 error — fail immediately
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

    // Attempt 2: fix unescaped control chars (newlines, tabs)
    if (!postsData) {
      const fixed = jsonMatch[0].replace(/("(?:[^"\\]|\\.)*")/g, (m) =>
        m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      )
      postsData = tryParse(fixed)
    }

    // Attempt 3: extract each object individually using a looser regex
    if (!postsData) {
      const objects = [...cleaned.matchAll(/\{\s*"content"\s*:\s*"([\s\S]*?)"\s*,\s*"hook"\s*:\s*"([\s\S]*?)"\s*\}/g)]
      if (objects.length > 0) {
        postsData = objects.map(m => ({ content: m[1].replace(/\\n/g, "\n"), hook: m[2] }))
      }
    }

    if (!postsData || !Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    if (!Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    // Delete existing draft/scheduled posts before generating new ones (scoped to specific account)
    await db.delete(linkedinPosts).where(
      linkedinAccountId
        ? and(
            eq(linkedinPosts.userId, userId),
            eq(linkedinPosts.linkedinAccountId, linkedinAccountId),
            inArray(linkedinPosts.status, ["draft", "scheduled"])
          )
        : and(
            eq(linkedinPosts.userId, userId),
            isNull(linkedinPosts.linkedinAccountId),
            inArray(linkedinPosts.status, ["draft", "scheduled"])
          )
    )

    // Schedule posts at 10:00 UTC, gap depends on postingFrequency
    const gap = brief.postingFrequency === "every_other_day" ? 2 : 1
    const now = new Date()
    const slice = postsData.slice(0, maxPosts)

    // Generate all images in parallel
    const imageUrls = await Promise.all(
      slice.map((postData) => generatePostImage(postData.content, brief.niche ?? "business", brief.imageStyle))
    )

    function ensureHashtags(content: string): string {
      // Drop malformed hashtags like "#/" or a lone "#" (a "#" not followed by an alphanumeric).
      const cleaned = content
        .replace(/(^|\s)#(?![A-Za-z0-9])\S*/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trimEnd()
      if (/#\w+/.test(cleaned)) return cleaned
      // Fallback: derive post-specific tags from THIS post's content (varies per post).
      return cleaned + "\n\n" + buildPostHashtags(cleaned, brief.niche)
    }

    // Insert all posts (sequential DB writes are fine — fast)
    const insertedPosts = []
    for (let i = 0; i < slice.length; i++) {
      const postData = slice[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + (i + 1) * gap)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      const [inserted] = await db
        .insert(linkedinPosts)
        .values({
          userId,
          linkedinAccountId: account.id,
          content: ensureHashtags(stripMarkdown(postData.content)),
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
