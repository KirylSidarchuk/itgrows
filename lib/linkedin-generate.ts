import { db } from "@/lib/db"
import { linkedinPosts, linkedinBriefs, linkedinAccounts, users } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { callLLM } from "@/lib/llm-client"
import { generatePostImage } from "@/lib/linkedin-image"
import { sendEmail } from "@/lib/email"

interface PostData {
  content: string
  hook: string
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
`

function linkedinPostsReadyEmail(name: string, firstDate: Date): string {
  const dateStr = firstDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your first LinkedIn posts are ready 🚀</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">We generated your first LinkedIn posts, starting <strong>${dateStr}</strong>. Posts will publish automatically at 10am UTC, one per day.</p>
        <p style="color: #6b7280; font-size: 14px;">Visit your cabinet to preview or edit them before they go live.</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">View Your Posts →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Manage posts</a></p>
      </div>
    </div>
  `
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
  avoidTopics?: string | null
}, count: number = 14): string {
  const currentYear = new Date().getFullYear()
  const tone = brief.tone ?? "professional"
  const niche = brief.niche ?? "business"
  const goals = brief.goals ?? "build authority and engage audience"
  const audience = brief.targetAudience ? `Target audience: ${brief.targetAudience}. ` : ""

  const angles = [
    "personal lesson",
    "industry observation",
    "contrarian take",
    '"what I wish I knew"',
    "a mistake and what it taught me",
    "a trend I'm watching",
    "a question I keep asking myself",
    "an unpopular opinion",
    "a success story without fabrication",
    "a common myth debunked",
    "a practical tip",
    "a reflection on failure",
    "a future prediction",
    "a gratitude or appreciation moment",
  ].slice(0, count).join(" | ")

  const avoidTopicsLine = brief.avoidTopics?.trim()
    ? `\nIMPORTANT: Do NOT mention or promote the following topics: ${brief.avoidTopics.trim()}`
    : ""

  return `You are a LinkedIn thought leadership expert writing in the first person for a ${tone} professional in the ${niche} space.
${audience}Goals: ${goals}. Current year: ${currentYear}.${avoidTopicsLine}

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

Cover ${count} different angles across the set:
${angles}

Return ONLY a valid JSON array with exactly ${count} objects. Each object must have:
- "content": string (the full post text including hashtags)
- "hook": string (first sentence only, for preview)

Write the ${count} posts now, return only the JSON array:`
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

    // Skip if user already has scheduled/draft posts (avoid duplicates)
    const existingPosts = await db
      .select({ id: linkedinPosts.id })
      .from(linkedinPosts)
      .where(and(
        eq(linkedinPosts.userId, userId),
        inArray(linkedinPosts.status, ["scheduled", "draft"])
      ))
      .limit(1)

    if (existingPosts.length > 0) {
      return { success: true }
    }

    // Get brief
    const [dbBrief] = await db
      .select()
      .from(linkedinBriefs)
      .where(eq(linkedinBriefs.userId, userId))
      .limit(1)

    const brief = dbBrief ?? {}

    const [userRecord] = await db
      .select({ subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt, cancelAtPeriodEnd: users.cancelAtPeriodEnd, subscriptionEndDate: users.subscriptionEndDate })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    let maxPosts = 14
    if (userRecord?.cancelAtPeriodEnd && userRecord?.subscriptionEndDate) {
      const daysLeft = Math.ceil((userRecord.subscriptionEndDate.getTime() - Date.now()) / 86400000)
      if (daysLeft < 14) maxPosts = Math.max(daysLeft, 1)
    }

    const prompt = buildLinkedInPrompt(brief, maxPosts)

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
    const slice = postsData.slice(0, maxPosts)

    const imageUrls = await Promise.all(
      slice.map((postData) => generatePostImage(postData.content, brief.niche ?? "business"))
    )

    // Users with custom posting frequency (every N days)
    const POSTING_FREQUENCY: Record<string, number> = {
      "7cd0011c-fadd-4ff5-bd1e-6445fea70b22": 3, // kiryl@itgrows.ai — every 3 days
    }
    const freqDays = POSTING_FREQUENCY[userId] ?? 1

    for (let i = 0; i < slice.length; i++) {
      const postData = slice[i]
      const scheduledFor = new Date(now)
      scheduledFor.setUTCDate(scheduledFor.getUTCDate() + (i + 1) * freqDays)
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

    // Send "posts ready" notification email — fire-and-forget
    const firstDate = new Date(now)
    firstDate.setUTCDate(firstDate.getUTCDate() + 1)
    firstDate.setUTCHours(10, 0, 0, 0)
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: "Your first LinkedIn posts are ready 🚀",
        html: linkedinPostsReadyEmail(user.name ?? "there", firstDate),
      }).catch(() => {})
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
