import { db } from "@/lib/db"
import { twitterPosts, twitterBriefs, twitterCompanyBriefs, linkedinBriefs, users } from "@/lib/db/schema"
import { eq, and, or, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "claude-sonnet-4-6"
const LLM_API_KEY = process.env.LLM_API_KEY ?? ""

function xPostsReadyEmail(name: string, firstDate: Date): string {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 560px;
    margin: 0 auto;
    background: #ffffff;
  `
  const dateStr = firstDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your X posts are ready 🚀</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">We've generated 5 posts for your X (Twitter) account, starting <strong>${dateStr}</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">Posts will publish automatically at 10am UTC, one per day. Visit your cabinet to preview or edit them.</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">View Your Posts →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Manage posts</a></p>
      </div>
    </div>
  `
}

export async function generateInitialXPosts(userId: string, accountType: string): Promise<void> {
  try {
    // Check if user already has X posts (any status)
    const existing = await db
      .select({ id: twitterPosts.id })
      .from(twitterPosts)
      .where(and(
        eq(twitterPosts.userId, userId),
        eq(twitterPosts.accountType, accountType)
      ))
      .limit(1)

    if (existing.length > 0) return

    // Get brief
    let briefContent: string | null = null
    let structuredBrief: {
      niche?: string | null
      tone?: string | null
      goals?: string | null
      targetAudience?: string | null
    } = {}

    if (accountType === "company") {
      const [companyBrief] = await db
        .select()
        .from(twitterCompanyBriefs)
        .where(eq(twitterCompanyBriefs.userId, userId))
        .limit(1)
      if (companyBrief) briefContent = companyBrief.content
    } else {
      const [twitterBrief] = await db
        .select()
        .from(twitterBriefs)
        .where(eq(twitterBriefs.userId, userId))
        .limit(1)
      if (twitterBrief) {
        briefContent = twitterBrief.content
      } else {
        const [dbBrief] = await db
          .select()
          .from(linkedinBriefs)
          .where(eq(linkedinBriefs.userId, userId))
          .limit(1)
        if (dbBrief) structuredBrief = dbBrief
      }
    }

    const currentYear = new Date().getFullYear()

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

    const [userRecord] = await db
      .select({ cancelAtPeriodEnd: users.cancelAtPeriodEnd, subscriptionEndDate: users.subscriptionEndDate })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    let maxPosts = 14
    if (userRecord?.cancelAtPeriodEnd && userRecord?.subscriptionEndDate) {
      const daysLeft = Math.ceil((userRecord.subscriptionEndDate.getTime() - Date.now()) / 86400000)
      if (daysLeft < 14) maxPosts = Math.max(daysLeft, 1)
    }

    const jsonInstruction = "IMPORTANT: Your response must be ONLY a valid JSON array. No markdown, no code blocks, no explanations. Start with [ and end with ]."

    const prompt = `${jsonInstruction}

You are a Twitter/X thought leadership expert writing in the first person.
${promptContext} Current year: ${currentYear}.

Generate ${maxPosts} engaging tweets that feel authentic and personal.

RULES:
1. Each tweet must be under 280 characters (including hashtags).
2. Never invent statistics, case studies, or fabricated claims.
3. Write in the first person — real opinions and observations.
4. Include 2-3 relevant hashtags per tweet.
5. Mix formats: insight/tip, personal take, question to audience, mini-story, bold statement.
6. No generic marketing language or sales pitches.

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

    if (!llmRes.ok) return

    const llmData = await llmRes.json() as { choices: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content ?? ""
    if (!rawContent) return

    const cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()

    let postsData: Array<{ content: string }> | null = null

    try {
      postsData = JSON.parse(cleaned) as Array<{ content: string }>
    } catch {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          postsData = JSON.parse(arrayMatch[0]) as Array<{ content: string }>
        } catch {
          // continue
        }
      }
    }

    if (!postsData || !Array.isArray(postsData) || postsData.length === 0) return

    // Find latest scheduled post for this user+accountType
    const [latestScheduled] = await db
      .select({ scheduledAt: twitterPosts.scheduledAt })
      .from(twitterPosts)
      .where(and(
        eq(twitterPosts.userId, userId),
        eq(twitterPosts.accountType, accountType),
        eq(twitterPosts.status, "scheduled")
      ))
      .orderBy(desc(twitterPosts.scheduledAt))
      .limit(1)

    const now = new Date()
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 10, 0, 0, 0))
    let nextDate = tomorrow
    if (latestScheduled?.scheduledAt) {
      const dayAfterLast = new Date(latestScheduled.scheduledAt)
      dayAfterLast.setUTCDate(dayAfterLast.getUTCDate() + 1)
      dayAfterLast.setUTCHours(10, 0, 0, 0)
      if (dayAfterLast > tomorrow) nextDate = dayAfterLast
    }

    const firstPostDate = new Date(nextDate)

    for (const postData of postsData.slice(0, maxPosts)) {
      const content = (postData.content ?? "").slice(0, 280)
      const scheduledAt = new Date(nextDate)
      await db.insert(twitterPosts).values({
        userId,
        content,
        isThread: false,
        accountType,
        status: "scheduled",
        scheduledAt,
      })
      nextDate = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth(), nextDate.getUTCDate() + 1, 10, 0, 0, 0))
    }

    // Send "posts ready" email — fire-and-forget
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: "Your X posts are ready 🚀",
        html: xPostsReadyEmail(user.name ?? "there", firstPostDate),
      }).catch(() => {})
    }
  } catch {
    // Fire-and-forget: swallow all errors
  }
}
