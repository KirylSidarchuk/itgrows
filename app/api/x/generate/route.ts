import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts, linkedinBriefs, twitterBriefs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "claude-sonnet-4-6"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

interface GenerateXRequest {
  topic?: string
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

    const body = await req.json() as GenerateXRequest

    // Get user's Twitter account (just to verify it's connected)
    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.userId, userId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "No Twitter/X account connected" }, { status: 400 })
    }

    // Get brief — from request body, then twitterBriefs, then linkedinBriefs
    let briefContent: string | null = null
    let structuredBrief: {
      niche?: string | null
      tone?: string | null
      goals?: string | null
      targetAudience?: string | null
    } = {}

    if (body.brief) {
      structuredBrief = body.brief
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

    let promptContext: string
    if (briefContent) {
      promptContext = `Use this user brief to tailor the tweets:\n${briefContent}`
    } else {
      const tone = structuredBrief.tone ?? "professional"
      const niche = structuredBrief.niche ?? "business"
      const goals = structuredBrief.goals ?? "build authority and engage audience"
      const audience = structuredBrief.targetAudience ? `Target audience: ${structuredBrief.targetAudience}.` : ""
      promptContext = `Writing for a ${tone} professional in the ${niche} space. ${audience} Goals: ${goals}.`
    }

    const prompt = `You are a Twitter/X thought leadership expert writing in the first person.
${promptContext} Current year: ${currentYear}. ${topicHint}

Generate 5 engaging tweets that feel authentic and personal.

RULES:
1. Each tweet must be under 280 characters (including hashtags).
2. Never invent statistics, case studies, or fabricated claims.
3. Write in the first person — real opinions and observations.
4. Include 2-3 relevant hashtags per tweet.
5. Mix formats: insight/tip, personal take, question to audience, mini-story, bold statement.
6. No generic marketing language or sales pitches.

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- "content": string (the full tweet text, max 280 chars, including hashtags)

Return only the JSON array, no markdown, no extra text.`

    const llmRes = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
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
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not parse JSON array from LLM response")
    }

    let postsData: Array<{ content: string }>
    try {
      postsData = JSON.parse(jsonMatch[0]) as Array<{ content: string }>
    } catch {
      throw new Error("Failed to parse LLM JSON response")
    }

    if (!Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    // Insert posts as drafts
    const insertedPosts = []
    for (const postData of postsData.slice(0, 5)) {
      const content = (postData.content ?? "").slice(0, 280)
      const [inserted] = await db
        .insert(twitterPosts)
        .values({
          userId,
          content,
          isThread: false,
          status: "draft",
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
