import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, linkedinBriefs, users } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { checkGenerateRateLimit } from "@/lib/rate-limit"
import { hasAccess } from "@/lib/access"
import { buildLinkedInPrompt } from "@/lib/linkedin-generate"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.5-flash-lite"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const PROXY_URL = "http://34.60.133.229:4000"

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
  brief?: {
    niche?: string
    tone?: string
    goals?: string
    companyName?: string
    targetAudience?: string
  }
}

async function generatePostImage(postContent: string, niche: string): Promise<string | null> {
  try {
    // Build image prompt directly — no LLM call needed (avoids rate-limit on the proxy)
    const hook = postContent.split("\n")[0]?.slice(0, 120) || ""
    const imagePrompt = `Professional LinkedIn post cover image, photorealistic, no text, wide aspect ratio 1200x627. ` +
      `Topic: ${niche}. Mood inspired by: "${hook}". Clean composition, modern business aesthetic.`

    // Generate image via proxy
    const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
      body: JSON.stringify({
        model: "gemini-3-pro-image-preview",
        prompt: imagePrompt,
      }),
    })

    if (!imgRes.ok) {
      const errText = await imgRes.text()
      console.warn("[generatePostImage] Image generation failed:", imgRes.status, errText.slice(0, 200))
      return null
    }

    const imgData = await imgRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
    }
    const parts = imgData?.candidates?.[0]?.content?.parts || []
    const inlineData = parts.find((p) => p?.inlineData)?.inlineData

    if (!inlineData?.data) {
      console.warn("[generatePostImage] No inlineData in response:", JSON.stringify(imgData).slice(0, 300))
      return null
    }

    const mimeType = inlineData.mimeType || "image/jpeg"
    return `data:${mimeType};base64,${inlineData.data}`
  } catch (err) {
    console.warn("[generatePostImage] Error:", err instanceof Error ? err.message : String(err))
    return null
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

    const body = await req.json() as GenerateLinkedInRequest

    // Get user's LinkedIn account
    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.userId, userId))
      .limit(1)

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
    } = {}

    if (body.brief) {
      brief = body.brief
    } else {
      const [dbBrief] = await db
        .select()
        .from(linkedinBriefs)
        .where(eq(linkedinBriefs.userId, userId))
        .limit(1)
      if (dbBrief) brief = dbBrief
    }

    const briefFilled = !!(brief.niche?.trim() || brief.goals?.trim() || brief.targetAudience?.trim())
    if (!briefFilled) {
      return NextResponse.json({ error: "brief_required", message: "Please fill your Professional DNA before generating posts." }, { status: 400 })
    }

    const prompt = buildLinkedInPrompt(brief)

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
        // All retries exhausted — return friendly error
        return NextResponse.json(
          { error: "ai_busy", message: "Our AI is busy right now. Please try again in a few minutes." },
          { status: 503 }
        )
      }

      // Non-429 error — fail immediately
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

    // Delete existing draft/scheduled posts before generating new ones
    await db.delete(linkedinPosts).where(
      and(
        eq(linkedinPosts.userId, userId),
        inArray(linkedinPosts.status, ["draft", "scheduled"])
      )
    )

    // Schedule posts: one per day at 10:00 UTC starting tomorrow
    const now = new Date()
    const slice = postsData.slice(0, 7)

    // Generate all images in parallel
    const imageUrls = await Promise.all(
      slice.map((postData) => generatePostImage(postData.content, brief.niche ?? "business"))
    )

    // Insert all posts (sequential DB writes are fine — fast)
    const insertedPosts = []
    for (let i = 0; i < slice.length; i++) {
      const postData = slice[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + i + 1)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      const [inserted] = await db
        .insert(linkedinPosts)
        .values({
          userId,
          linkedinAccountId: account.id,
          content: stripMarkdown(postData.content),
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
