import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, linkedinBriefs } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"

export const maxDuration = 300

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash-lite"
const LLM_API_KEY = "any-key"
const PROXY_URL = "http://34.60.133.229:4000"

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
    // Build image prompt using LLM
    const promptRes = await fetch(`${PROXY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{
          role: "user",
          content: `Create a concise image generation prompt (max 50 words) for a LinkedIn post cover image.
Post niche: "${niche}"
Post content preview: "${postContent.slice(0, 200)}"
The image should be: professional, photorealistic, suitable for a LinkedIn post (1200x627px), no text in image.
Return ONLY the image prompt, nothing else.`,
        }],
        temperature: 0.7,
      }),
    })
    if (!promptRes.ok) return null
    const promptData = await promptRes.json() as { choices?: Array<{ message: { content: string } }> }
    const imagePrompt = promptData.choices?.[0]?.message?.content?.trim() || `Professional LinkedIn post cover for ${niche}`

    // Generate image
    const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-3-pro-image-preview",
        prompt: imagePrompt,
      }),
    })
    if (!imgRes.ok) return null

    const imgData = await imgRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
    }
    const parts = imgData?.candidates?.[0]?.content?.parts || []
    const inlineData = parts.find((p) => p?.inlineData)?.inlineData
    if (!inlineData?.data) return null

    const mimeType = inlineData.mimeType || "image/jpeg"
    return `data:${mimeType};base64,${inlineData.data}`
  } catch {
    return null
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
  const audience = brief.targetAudience ? `Target audience: ${brief.targetAudience}. ` : ""

  return `You are a LinkedIn thought leadership expert writing in the first person for a ${tone} professional in the ${niche} space.
${audience}Goals: ${goals}. Current year: ${currentYear}.

STRICT RULES — violations make the post unusable:
1. NEVER invent case studies, e.g. "Company X increased sales by Y%" — these are fabricated and damage credibility.
2. NEVER make up statistics, percentages, or numeric claims you cannot know to be true.
3. NEVER fabricate client names, testimonials, or quotes.
4. NEVER use "Contact us today", "DM me", or any sales-pitch language.
5. NEVER refer to "our company" or describe the author's company in the third person.
6. NEVER write generic marketing copy — every post must feel like a real person's genuine reflection.

WHAT EACH POST MUST DO:
- Share a personal perspective: "I've noticed…", "In my experience…", "What I've learned…"
- Offer an industry observation, trend, or lesson learned from real professional life.
- Tell a story from professional experience without fabricating names, numbers, or outcomes.
- End with a thought-provoking question or call to reflection that invites the reader to share their view.

FORMAT for each post:
- Hook in the first line: a bold statement or genuine question that stops the scroll.
- 3–5 short paragraphs (each 2–4 sentences).
- Final line: an open question to the reader (e.g. "What's your experience with this?").
- 3–5 relevant hashtags on the last line.
- Total length: 150–300 words.

Cover 7 different angles across the set:
personal lesson | industry observation | contrarian take | "what I wish I knew" | a mistake and what it taught me | a trend I'm watching | a question I keep asking myself

Return ONLY a valid JSON array with exactly 7 objects. Each object must have:
- "content": string (the full post text including hashtags)
- "hook": string (first sentence only, for preview)

Example of the CORRECT style:
[
  {
    "content": "What's the biggest mistake I see in ${niche}?\\n\\nMost people focus on [insight about the niche] when the real leverage is somewhere else entirely.\\n\\nI spent years optimizing the wrong thing. Not because I lacked information — because I was asking the wrong question.\\n\\nThe shift that changed my approach: [genuine lesson without fake numbers].\\n\\nWhat's your experience with this?\\n\\n#${niche.replace(/\s+/g, "")} #Lessons #Growth",
    "hook": "What's the biggest mistake I see in ${niche}?"
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

    const llmResponse = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
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
