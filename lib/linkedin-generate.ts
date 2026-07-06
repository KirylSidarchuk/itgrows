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
    .replace(/(^|\s)#(?![A-Za-z0-9])\S*/g, "$1") // drop malformed hashtags like "#/" (from niches with slashes)
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

// Fallback hashtags derived from a SPECIFIC post's content (so they vary per post):
// pick the most frequent meaningful keywords (= the topic), topped up from the niche.
// Only used when the model omitted hashtags.
const HASHTAG_STOPWORDS = new Set(
  "the a an and or but for with your you our we is are be been being this that these those it as at by from into about over after before how why what when who which while their there here have has had will would can could should more most just like also only what they them then than some much many very really thing things make made making take takes does done yours ours still even ever never always often sometimes today years year people world work working time".split(/\s+/)
)
export function buildPostHashtags(content: string, niche?: string | null): string {
  const counts = new Map<string, { n: number; disp: string }>()
  for (const w of content.replace(/[#*_`]/g, " ").match(/[A-Za-z][A-Za-z0-9]{3,19}/g) ?? []) {
    const lw = w.toLowerCase()
    if (HASHTAG_STOPWORDS.has(lw)) continue
    const e = counts.get(lw)
    if (e) e.n++
    else counts.set(lw, { n: 1, disp: w })
  }
  const seen = new Set<string>()
  const tags: string[] = []
  for (const [lw, o] of [...counts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].disp.length - a[1].disp.length)) {
    if (tags.length >= 3) break
    seen.add(lw)
    tags.push(`#${o.disp.charAt(0).toUpperCase() + o.disp.slice(1)}`)
  }
  for (const w of (niche ?? "").split(/[\s,/|]+/)) {
    if (tags.length >= 3) break
    const c = w.replace(/[^A-Za-z0-9]/g, "")
    const lw = c.toLowerCase()
    if (c.length < 3 || HASHTAG_STOPWORDS.has(lw) || seen.has(lw)) continue
    seen.add(lw)
    tags.push(`#${c.charAt(0).toUpperCase() + c.slice(1)}`)
  }
  if (tags.length === 0) tags.push("#Business")
  return tags.slice(0, 3).join(" ")
}

export function buildLinkedInPrompt(brief: {
  niche?: string | null
  tone?: string | null
  goals?: string | null
  companyName?: string | null
  targetAudience?: string | null
  avoidTopics?: string | null
}, count: number = 14, isCompany: boolean = false): string {
  const currentYear = new Date().getFullYear()
  const tone = brief.tone ?? "professional"
  const niche = brief.niche ?? "business"
  const goals = brief.goals ?? "build authority and engage audience"
  const audience = brief.targetAudience ? `Target audience: ${brief.targetAudience}. ` : ""

  // Angles are THEMES, not requests for a specific true event. Any angle that would
  // normally invite a made-up backstory (a success story, a milestone, a past failure,
  // behind-the-scenes) is phrased as a principle/observation so the model has nothing to fabricate.
  const companyAngles = [
    "industry observation",
    "contrarian take",
    "a trend we're watching",
    "a lesson framed as a principle",
    "a common myth debunked",
    "a practical tip for our audience",
    "a future prediction",
    "a value or standard we hold",
    "how we think about a relevant problem (as a principle, not an invented behind-the-scenes story)",
    "a question we keep asking ourselves",
    "an unpopular industry opinion",
    "a common challenge in our field and how to approach it",
    "what actually drives results in our field (principles, no invented case study)",
    "a genuine appreciation for our audience or community",
  ]

  const personalAngles = [
    "a personal lesson framed as a principle",
    "industry observation",
    "contrarian take",
    '"what I wish I knew" — as general advice',
    "a common mistake in the field and how to avoid it",
    "a trend I'm watching",
    "a question I keep asking myself",
    "an unpopular opinion",
    "what actually drives success in this field (principles, no invented case study)",
    "a common myth debunked",
    "a practical tip",
    "why a common approach falls short (as a pattern, not a personal failure story)",
    "a future prediction",
    "a genuine reflection or appreciation about the work",
  ]

  const angles = (isCompany ? companyAngles : personalAngles).slice(0, count).join(" | ")

  const avoidTopicsLine = brief.avoidTopics?.trim()
    ? `\nIMPORTANT: Do NOT mention or promote the following topics: ${brief.avoidTopics.trim()}`
    : ""

  if (isCompany) {
    return `You are a LinkedIn content expert writing for a company page in the ${niche} space. The voice represents the company, not an individual.
${audience}Goals: ${goals}. Current year: ${currentYear}.${avoidTopicsLine}

VOICE RULE — this is a company page:
- ALWAYS write in first person plural: "We", "Our", "Us", "We've", "We're".
- NEVER use "I", "My", "I've", "I'm" — the author is the company, not an individual.

STRICT RULES — violations make the post unusable:
1. NEVER invent case studies, e.g. "Company X increased sales by Y%" — these are fabricated and damage credibility.
2. NEVER make up statistics, percentages, or numeric claims you cannot know to be true.
3. NEVER fabricate client names, testimonials, or quotes.
4. NEVER use "Contact us today" or any hard sales-pitch language.
5. NEVER write generic marketing copy — every post must feel like a genuine company reflection.
6. NEVER use "I" or "My" — always "We" or "Our".

WHAT EACH POST MUST DO:
- Share a company perspective: "We've noticed…", "In our experience…", "What we've learned…"
- Offer an industry observation, trend, or lesson from real professional experience.
- Represent the company's voice authentically without fabricating names, numbers, or outcomes.
- End with a thought-provoking question or call to reflection that invites the reader to share their view.

FORMAT for each post:
- Hook in the first line: a bold statement or genuine question that stops the scroll.
- 3–5 short paragraphs (each 2–4 sentences).
- Final line: an open question to the reader (e.g. "What's your experience with this?").
- MANDATORY: End every post with 3–5 hashtags on the very last line, SPECIFIC to that individual post's topic. Each post in the set MUST use a different mix of hashtags — never repeat the same hashtag set across posts. Combine one or two broad tags with post-specific ones (e.g. #Innovation #AITechnology #BusinessGrowth). Posts without hashtags are rejected.
- Total length: 150–300 words.

Cover ${count} different angles across the set. Treat each angle as a THEME to explore through insight, opinion, and principle — NEVER as a request for a specific true event. If a concrete detail (a story, client, number, date, past company) wasn't provided above, do not invent one to fit the angle; write from general observation instead:
${angles}

Return ONLY a valid JSON array with exactly ${count} objects. Each object must have:
- "content": string (the full post text, must end with hashtags)
- "hook": string (first sentence only, for preview)

Write the ${count} posts now, return only the JSON array:`
  }

  return `You are a LinkedIn thought leadership expert writing in the first person for a ${tone} professional in the ${niche} space.
${audience}Goals: ${goals}. Current year: ${currentYear}.${avoidTopicsLine}

STRICT RULES — violations make the post unusable:
1. NEVER invent case studies, e.g. "Company X increased sales by Y%" — these are fabricated and damage credibility.
2. NEVER make up statistics, percentages, or numeric claims you cannot know to be true.
3. NEVER fabricate client names, testimonials, or quotes.
4. NEVER use "Contact us today", "DM me", or any sales-pitch language.
5. NEVER refer to "our company" or describe the author's company in the third person.
6. NEVER write generic marketing copy — every post must feel like a real person's genuine reflection.
7. NEVER invent specific personal events, dates, past companies/jobs, or anecdotes that were not provided (no "back in 2021, my second startup…", "last week a client…"). If a concrete backstory wasn't given, do not fabricate one — write from principle and observation instead.

WHAT EACH POST MUST DO:
- Share a personal perspective as a general reflection: "I've noticed…", "In my experience…", "What I've learned…" (without inventing a specific fabricated event).
- Offer an industry observation, trend, or lesson.
- Frame insight as a principle or pattern, not a made-up specific anecdote with invented details.
- End with a thought-provoking question or call to reflection that invites the reader to share their view.

FORMAT for each post:
- Hook in the first line: a bold statement or genuine question that stops the scroll.
- 3–5 short paragraphs (each 2–4 sentences).
- Final line: an open question to the reader (e.g. "What's your experience with this?").
- MANDATORY: End every post with 3–5 hashtags on the very last line, SPECIFIC to that individual post's topic. Each post in the set MUST use a different mix of hashtags — never repeat the same hashtag set across posts. Combine one or two broad tags with post-specific ones (e.g. #Innovation #Leadership #GrowthMindset). Posts without hashtags are rejected.
- Total length: 150–300 words.

Cover ${count} different angles across the set. Treat each angle as a THEME to explore through insight, opinion, and principle — NEVER as a request for a specific true event. If a concrete detail (a story, client, number, date, past company) wasn't provided above, do not invent one to fit the angle; write from general observation instead:
${angles}

Return ONLY a valid JSON array with exactly ${count} objects. Each object must have:
- "content": string (the full post text, must end with hashtags)
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

    const isCompany = account.pageType === "company" || account.pageType === "organization"
    const prompt = buildLinkedInPrompt(brief, maxPosts, isCompany)

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

      const body = stripMarkdown(postData.content)
      const withHashtags = /#\w+/.test(body) ? body : `${body}\n\n${buildPostHashtags(body, brief.niche)}`

      await db.insert(linkedinPosts).values({
        userId,
        linkedinAccountId: account.id,
        content: withHashtags,
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
