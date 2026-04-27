import { db } from "@/lib/db"
import { linkedinPosts, linkedinBriefs, linkedinAccounts } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { callLLM } from "@/lib/llm-client"
import { generatePostImage } from "@/lib/linkedin-image"

interface PostData {
  content: string
  hook: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")  // bold
    .replace(/\*(.*?)\*/g, "$1")       // italic
    .replace(/__(.*?)__/g, "$1")       // bold underscore
    .replace(/_(.*?)_/g, "$1")         // italic underscore
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
    .replace(/^#{1,6}\s+/gm, "")       // headings
    .replace(/^\s*[-*+]\s+/gm, "")     // bullet points
    .trim()
}

export function buildLinkedInPrompt(brief: {
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

export async function generateForUser(userId: string): Promise<{ success: boolean; error?: string }> {
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

    let rawContent = ""
    try {
      rawContent = await callLLM(
        [{ role: "user", content: prompt }],
        { caller: "auto-generate/linkedin", max_tokens: 4096, temperature: 0.8 }
      )
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }

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
        content: stripMarkdown(postData.content),
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
