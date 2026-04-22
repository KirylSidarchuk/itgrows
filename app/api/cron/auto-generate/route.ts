import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinPosts, linkedinBriefs, linkedinAccounts, users } from "@/lib/db/schema"
import { eq, and, inArray, count } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash-lite"
const LLM_API_KEY = "any-key"
const PROXY_URL = "http://34.60.133.229:4000"

interface PostData {
  content: string
  hook: string
}

async function generatePostImage(postContent: string, niche: string): Promise<string | null> {
  try {
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

Write the 7 posts now, return only the JSON array:`
}

async function generateForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get LinkedIn account
    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.userId, userId))
      .limit(1)

    if (!account) {
      return { success: false, error: "No LinkedIn account" }
    }

    // Get brief
    const [dbBrief] = await db
      .select()
      .from(linkedinBriefs)
      .where(eq(linkedinBriefs.userId, userId))
      .limit(1)

    const brief = dbBrief ?? {}

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
      return { success: false, error: `LLM error ${llmResponse.status}` }
    }

    const llmData = await llmResponse.json() as { choices: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""

    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return { success: false, error: "Could not parse LLM response" }
    }

    const postsData = JSON.parse(jsonMatch[0]) as PostData[]

    if (!Array.isArray(postsData) || postsData.length === 0) {
      return { success: false, error: "Invalid posts data" }
    }

    // Delete existing draft/scheduled posts before generating new ones
    await db.delete(linkedinPosts).where(
      and(
        eq(linkedinPosts.userId, userId),
        inArray(linkedinPosts.status, ["draft", "scheduled"])
      )
    )

    const now = new Date()
    const slice = postsData.slice(0, 7)

    const imageUrls = await Promise.all(
      slice.map((postData) => generatePostImage(postData.content, brief.niche ?? "business"))
    )

    for (let i = 0; i < slice.length; i++) {
      const postData = slice[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + i + 1)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      await db.insert(linkedinPosts).values({
        userId,
        linkedinAccountId: account.id,
        content: postData.content,
        status: "scheduled",
        scheduledFor,
        imageUrl: imageUrls[i],
      })
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all paid active (non-trialing) subscribers with a personal plan
    const allActiveUsers = await db
      .select({ id: users.id, subscriptionPlan: users.subscriptionPlan })
      .from(users)
      .where(eq(users.subscriptionStatus, "active"))

    const eligibleUsers = allActiveUsers.filter(
      (u) => u.subscriptionPlan === "personal" || u.subscriptionPlan === "personal_annual"
    )

    let generated = 0
    let skipped = 0
    let failed = 0

    for (const user of eligibleUsers) {
      // Count remaining scheduled posts for this user
      const [result] = await db
        .select({ cnt: count() })
        .from(linkedinPosts)
        .where(
          and(
            eq(linkedinPosts.userId, user.id),
            inArray(linkedinPosts.status, ["draft", "scheduled"])
          )
        )

      const scheduledCount = Number(result?.cnt ?? 0)

      if (scheduledCount > 0) {
        skipped++
        continue
      }

      // No scheduled posts left — auto-generate new batch
      console.log(`[auto-generate] Generating posts for user ${user.id}`)
      const result2 = await generateForUser(user.id)
      if (result2.success) {
        generated++
      } else {
        console.error(`[auto-generate] Failed for user ${user.id}: ${result2.error}`)
        failed++
      }
    }

    return NextResponse.json({ generated, skipped, failed, total: eligibleUsers.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[auto-generate] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
