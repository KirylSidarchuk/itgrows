import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts, linkedinBriefs, twitterBriefs, twitterCompanyBriefs, users } from "@/lib/db/schema"
import { eq, and, or, desc } from "drizzle-orm"
import { hasAccess } from "@/lib/access"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "claude-sonnet-4-6"
const LLM_API_KEY = process.env.LLM_API_KEY ?? ""

interface GenerateXRequest {
  topic?: string
  accountType?: string
  brief?: {
    niche?: string
    tone?: string
    goals?: string
    targetAudience?: string
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
    const [user] = await db
      .select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt, cancelAtPeriodEnd: users.cancelAtPeriodEnd, subscriptionEndDate: users.subscriptionEndDate })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const userAccess = { subscriptionStatus: user?.subscriptionStatus ?? null, subscriptionPlan: user?.subscriptionPlan ?? null, trialEndsAt: user?.trialEndsAt ?? null }
    if (!user || !hasAccess(userAccess)) {
      return NextResponse.json({ error: "subscription_required", message: "Active subscription or active trial required" }, { status: 403 })
    }
    let maxPosts = 14
    if (user?.cancelAtPeriodEnd && user?.subscriptionEndDate) {
      const daysLeft = Math.ceil((user.subscriptionEndDate.getTime() - Date.now()) / 86400000)
      if (daysLeft < 14) maxPosts = Math.max(daysLeft, 1)
    }

    const body = await req.json() as GenerateXRequest
    const accountType = body.accountType === "company" ? "company" : "personal"

    // Get user's Twitter account filtered by accountType
    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(and(eq(twitterAccounts.userId, userId), eq(twitterAccounts.accountType, accountType)))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: `No Twitter/X ${accountType} account connected` }, { status: 400 })
    }

    // Get brief — from request body, then appropriate brief table, then linkedinBriefs
    let briefContent: string | null = null
    let structuredBrief: {
      niche?: string | null
      tone?: string | null
      goals?: string | null
      targetAudience?: string | null
    } = {}

    if (body.brief) {
      structuredBrief = body.brief
    } else if (accountType === "company") {
      // Use company brief
      const [companyBrief] = await db
        .select()
        .from(twitterCompanyBriefs)
        .where(eq(twitterCompanyBriefs.userId, userId))
        .limit(1)
      if (companyBrief) {
        briefContent = companyBrief.content
      }
    } else {
      // Try twitter brief first
      const [twitterBrief] = await db
        .select()
        .from(twitterBriefs)
        .where(eq(twitterBriefs.userId, userId))
        .limit(1)
      if (twitterBrief) {
        briefContent = twitterBrief.content
      } else {
        // Fall back to linkedin brief
        const [dbBrief] = await db
          .select()
          .from(linkedinBriefs)
          .where(eq(linkedinBriefs.userId, userId))
          .limit(1)
        if (dbBrief) structuredBrief = dbBrief
      }
    }

    const currentYear = new Date().getFullYear()
    const topicHint = body.topic ? `Focus on topic: ${body.topic}.` : ""

    // Sanitize briefContent for safe embedding in prompt
    const safeBriefContent = briefContent
      ? briefContent.replace(/`/g, "'").slice(0, 1000)
      : null

    let promptContext: string
    if (safeBriefContent) {
      promptContext = `Use this user brief to tailor the tweets:\n${safeBriefContent}`
    } else {
      const tone = structuredBrief.tone ?? "professional"
      const niche = structuredBrief.niche ?? "business"
      const goals = structuredBrief.goals ?? "build authority and engage audience"
      const audience = structuredBrief.targetAudience ? `Target audience: ${structuredBrief.targetAudience}.` : ""
      promptContext = `Writing for a ${tone} professional in the ${niche} space. ${audience} Goals: ${goals}.`
    }

    const jsonInstruction = "IMPORTANT: Your response must be ONLY a valid JSON array. No markdown, no code blocks, no explanations. Start with [ and end with ]."

    const prompt = `${jsonInstruction}

You are a Twitter/X thought leadership expert writing in the first person.
${promptContext} Current year: ${currentYear}. ${topicHint}

Generate ${maxPosts} engaging tweets that feel authentic and personal.

RULES:
1. Each tweet must be under 280 characters (including hashtags).
2. Never invent statistics, case studies, or fabricated claims.
3. Write in the first person — real opinions and observations.
4. Include 2-3 relevant hashtags per tweet.
5. Mix formats: insight/tip, personal take, question to audience, mini-story, bold statement.
6. No generic marketing language or sales pitches.
7. NEVER include any website URLs or domain names (like itgrows.ai or any other site) in the tweet text.

Return ONLY a valid JSON array with exactly ${maxPosts} objects. Each object must have:
- "content": string (the full tweet text, max 280 chars, including hashtags)

${jsonInstruction}`

    const llmRes = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: "You are a JSON API. Always respond with valid JSON only. Never use markdown code blocks." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.8,
      }),
    })

    if (!llmRes.ok) {
      const errText = await llmRes.text()
      throw new Error(`LLM API error ${llmRes.status}: ${errText}`)
    }

    const llmData = await llmRes.json() as { choices: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    if (!rawContent) {
      throw new Error("LLM returned empty response")
    }

    const cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()

    let postsData: Array<{ content: string }> | null = null

    // Strategy 1: direct parse
    try {
      postsData = JSON.parse(cleaned) as Array<{ content: string }>
    } catch {
      // continue to next strategy
    }

    // Strategy 2: extract [...] with regex
    if (!postsData) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          postsData = JSON.parse(arrayMatch[0]) as Array<{ content: string }>
        } catch {
          // continue to next strategy
        }
      }
    }

    // Strategy 3: extract first { to last } and wrap in array
    if (!postsData) {
      const firstBrace = cleaned.indexOf("{")
      const lastBrace = cleaned.lastIndexOf("}")
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          postsData = JSON.parse(`[${cleaned.slice(firstBrace, lastBrace + 1)}]`) as Array<{ content: string }>
        } catch {
          // all strategies failed
        }
      }
    }

    if (!postsData) {
      throw new Error("Could not parse JSON array from LLM response")
    }

    if (!Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    // Delete all existing draft/scheduled posts for this user+accountType before generating new ones
    await db.delete(twitterPosts).where(
      and(
        eq(twitterPosts.userId, userId),
        eq(twitterPosts.accountType, accountType),
        or(eq(twitterPosts.status, "draft"), eq(twitterPosts.status, "scheduled"))
      )
    )

    // Find the latest scheduledAt among existing scheduled posts for this user+accountType
    const [latestScheduled] = await db
      .select({ scheduledAt: twitterPosts.scheduledAt })
      .from(twitterPosts)
      .where(and(eq(twitterPosts.userId, userId), eq(twitterPosts.accountType, accountType), eq(twitterPosts.status, "scheduled")))
      .orderBy(desc(twitterPosts.scheduledAt))
      .limit(1)

    // Start from tomorrow at 10:00 UTC, or day after last scheduled post, whichever is later
    const now = new Date()
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 10, 0, 0, 0))
    let nextDate = tomorrow
    if (latestScheduled?.scheduledAt) {
      const dayAfterLast = new Date(latestScheduled.scheduledAt)
      dayAfterLast.setUTCDate(dayAfterLast.getUTCDate() + 1)
      dayAfterLast.setUTCHours(10, 0, 0, 0)
      if (dayAfterLast > tomorrow) {
        nextDate = dayAfterLast
      }
    }

    // Insert posts as scheduled, 1 day apart at 10:00 UTC
    const insertedPosts = []
    for (const postData of postsData.slice(0, maxPosts)) {
      const content = (postData.content ?? "").slice(0, 280)
      const scheduledAt = new Date(nextDate)
      const [inserted] = await db
        .insert(twitterPosts)
        .values({
          userId,
          content,
          isThread: false,
          accountType,
          status: "scheduled",
          scheduledAt,
        })
        .returning()
      insertedPosts.push(inserted)
      nextDate = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth(), nextDate.getUTCDate() + 1, 10, 0, 0, 0))
    }

    return NextResponse.json({ posts: insertedPosts, count: insertedPosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
