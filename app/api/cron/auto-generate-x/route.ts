import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts, twitterBriefs, twitterCompanyBriefs, linkedinBriefs, users } from "@/lib/db/schema"
import { eq, and, or, gt, count, desc, inArray } from "drizzle-orm"
import { hasAccess } from "@/lib/access"
import { callLLM } from "@/lib/llm-client"

export const maxDuration = 300

const LLM_MODEL = "claude-sonnet-4-6"

const MIN_SCHEDULED = 5

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

async function generateTweetsForUser(userId: string, accountType: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get brief based on accountType
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
    const safeBriefContent = briefContent ? briefContent.replace(/`/g, "'").slice(0, 1000) : null

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

    let maxPosts = 7
    if (userRecord?.cancelAtPeriodEnd && userRecord?.subscriptionEndDate) {
      const daysLeft = Math.ceil((userRecord.subscriptionEndDate.getTime() - Date.now()) / 86400000)
      if (daysLeft < 7) maxPosts = Math.max(daysLeft, 1)
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
7. NEVER include any website URLs or domain names in the tweet text.

Return ONLY a valid JSON array with exactly ${maxPosts} objects. Each object must have:
- "content": string (the full tweet text, max 280 chars, including hashtags)

${jsonInstruction}`

    const rawContent = await callLLM(
      [
        { role: "system", content: "You are a JSON API. Always respond with valid JSON only. Never use markdown code blocks." },
        { role: "user", content: prompt },
      ],
      { caller: "auto-generate-x", max_tokens: 2048, temperature: 0.8, models: [LLM_MODEL, "gemini-2.5-flash"] }
    )
    if (!rawContent) throw new Error("LLM returned empty response")

    const cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    let postsData: Array<{ content: string }> | null = null

    try { postsData = JSON.parse(cleaned) } catch { /* continue */ }
    if (!postsData) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) try { postsData = JSON.parse(arrayMatch[0]) } catch { /* continue */ }
    }
    if (!postsData) {
      const firstBrace = cleaned.indexOf("{")
      const lastBrace = cleaned.lastIndexOf("}")
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try { postsData = JSON.parse(`[${cleaned.slice(firstBrace, lastBrace + 1)}]`) } catch { /* failed */ }
      }
    }

    if (!postsData || !Array.isArray(postsData) || postsData.length === 0) {
      throw new Error("Could not parse JSON array from LLM response")
    }

    // Find the latest scheduledAt among existing scheduled posts for this user+accountType
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

    for (const postData of postsData.slice(0, maxPosts)) {
      const content = stripMarkdown(postData.content ?? "").slice(0, 280)
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

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all users with active subscription or active trial
    const allCandidates = await db
      .select({
        id: users.id,
        subscriptionPlan: users.subscriptionPlan,
        subscriptionStatus: users.subscriptionStatus,
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)
      .where(
        or(
          // Include trialing/past_due — card-required Stripe trials use status "trialing"
          // and never set trialEndsAt, so they'd otherwise get zero auto-generated tweets.
          inArray(users.subscriptionStatus, ["active", "trialing", "past_due"]),
          gt(users.trialEndsAt, now)
        )
      )

    const eligibleUsers = allCandidates.filter((u) =>
      hasAccess({
        subscriptionStatus: u.subscriptionStatus ?? null,
        subscriptionPlan: u.subscriptionPlan ?? null,
        trialEndsAt: u.trialEndsAt ?? null,
      })
    )

    let generated = 0
    let skipped = 0
    let failed = 0
    const total = eligibleUsers.length

    for (const user of eligibleUsers) {
      // Find all twitter accounts for this user
      const accounts = await db
        .select()
        .from(twitterAccounts)
        .where(eq(twitterAccounts.userId, user.id))

      if (accounts.length === 0) {
        skipped++
        continue
      }

      let userGenerated = false
      for (const account of accounts) {
        const accountType = account.accountType

        // Count future scheduled posts for this user+accountType
        const [result] = await db
          .select({ cnt: count() })
          .from(twitterPosts)
          .where(
            and(
              eq(twitterPosts.userId, user.id),
              eq(twitterPosts.accountType, accountType),
              eq(twitterPosts.status, "scheduled"),
              gt(twitterPosts.scheduledAt, now)
            )
          )

        const scheduledCount = Number(result?.cnt ?? 0)

        if (scheduledCount >= MIN_SCHEDULED) {
          continue
        }

        // Less than MIN_SCHEDULED future posts — generate new batch
        console.log(`[auto-generate-x] Generating posts for user ${user.id} accountType=${accountType}`)
        const genResult = await generateTweetsForUser(user.id, accountType)
        if (genResult.success) {
          userGenerated = true
        } else {
          console.error(`[auto-generate-x] Failed for user ${user.id} accountType=${accountType}: ${genResult.error}`)
          failed++
        }
      }

      if (userGenerated) {
        generated++
      } else if (!userGenerated && failed === 0) {
        skipped++
      }
    }

    return NextResponse.json({ generated, skipped, failed, total })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[auto-generate-x] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
