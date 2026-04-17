import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, linkedinBriefs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"
const LLM_API_KEY = "any-key"

interface GenerateLinkedInRequest {
  brief?: {
    niche?: string
    tone?: string
    goals?: string
    companyName?: string
    targetAudience?: string
  }
}

function buildLinkedInPrompt(brief: {
  niche?: string | null
  tone?: string | null
  goals?: string | null
  companyName?: string | null
  targetAudience?: string | null
}): string {
  const currentYear = new Date().getFullYear()
  const tone = brief.tone ?? "professional"
  const niche = brief.niche ?? "business"
  const goals = brief.goals ?? "build authority and engage audience"
  const company = brief.companyName ? `Company: ${brief.companyName}. ` : ""
  const audience = brief.targetAudience ? `Target audience: ${brief.targetAudience}. ` : ""

  return `You are a LinkedIn content expert. Generate exactly 7 LinkedIn posts for a ${tone} ${niche} brand.
${company}${audience}Goals: ${goals}. Current year: ${currentYear}.

Requirements for each post:
- 150-300 words
- Engaging hook in the first line (make people stop scrolling)
- Valuable insight, tip, story, or lesson related to ${niche}
- 3-5 relevant hashtags at the end
- Tone: ${tone}
- Each post should cover a different angle: e.g. personal story, industry insight, how-to tip, contrarian take, listicle, question/engagement, case study

Return ONLY a valid JSON array with exactly 7 objects. Each object must have:
- "content": string (the full post text including hashtags)
- "hook": string (first sentence only, for preview)

Example format:
[
  {
    "content": "Full post text here...\\n\\n#hashtag1 #hashtag2 #hashtag3",
    "hook": "First sentence of the post."
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

    const prompt = buildLinkedInPrompt(brief)

    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.8,
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM API error ${llmResponse.status}: ${errText}`)
    }

    const llmData = await llmResponse.json() as { choices: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    if (!rawContent) {
      throw new Error("LLM returned empty response")
    }

    // Parse JSON from response
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not parse JSON array from LLM response")
    }

    const postsData = JSON.parse(jsonMatch[0]) as Array<{ content: string; hook: string }>

    if (!Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Invalid posts data from LLM")
    }

    // Schedule posts: one per day at 10:00 UTC starting tomorrow
    const now = new Date()
    const insertedPosts = []

    for (let i = 0; i < Math.min(postsData.length, 7); i++) {
      const postData = postsData[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + i + 1)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      const [inserted] = await db
        .insert(linkedinPosts)
        .values({
          userId,
          linkedinAccountId: account.id,
          content: postData.content,
          status: "scheduled",
          scheduledFor,
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
