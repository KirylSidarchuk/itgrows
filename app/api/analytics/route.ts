import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, linkedinPosts, twitterPosts, postMetrics } from "@/lib/db/schema"
import { eq, and, desc, gte, sql } from "drizzle-orm"
import { hasAccess } from "@/lib/access"

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Check access
    const [user] = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlan: users.subscriptionPlan,
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const hasSubscription =
      !!user &&
      hasAccess({
        subscriptionStatus: user.subscriptionStatus ?? null,
        subscriptionPlan: user.subscriptionPlan ?? null,
        trialEndsAt: user.trialEndsAt ?? null,
      })

    // Fetch published LinkedIn posts
    const liPublished = await db
      .select({
        id: linkedinPosts.id,
        content: linkedinPosts.content,
        publishedAt: linkedinPosts.publishedAt,
      })
      .from(linkedinPosts)
      .where(and(eq(linkedinPosts.userId, userId), eq(linkedinPosts.status, "published")))
      .orderBy(desc(linkedinPosts.publishedAt))

    // Fetch published Twitter posts
    const twPublished = await db
      .select({
        id: twitterPosts.id,
        content: twitterPosts.content,
        publishedAt: twitterPosts.publishedAt,
      })
      .from(twitterPosts)
      .where(and(eq(twitterPosts.userId, userId), eq(twitterPosts.status, "published")))
      .orderBy(desc(twitterPosts.publishedAt))

    const totalPosts = liPublished.length + twPublished.length

    // Fetch all metrics for this user
    const liPostIds = liPublished.map((p) => p.id)
    const twPostIds = twPublished.map((p) => p.id)

    const allMetrics: Array<{
      postId: string | null
      twitterPostIdLocal: string | null
      platform: string
      impressions: number
      likes: number
      comments: number
      shares: number
      fetchedAt: Date
    }> = []

    if (liPostIds.length > 0) {
      const liMetrics = await db
        .select()
        .from(postMetrics)
        .where(
          and(
            eq(postMetrics.platform, "linkedin"),
            sql`${postMetrics.postId} = ANY(${sql.raw(`ARRAY[${liPostIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
          ),
        )
      allMetrics.push(...liMetrics)
    }

    if (twPostIds.length > 0) {
      const twMetrics = await db
        .select()
        .from(postMetrics)
        .where(
          and(
            eq(postMetrics.platform, "twitter"),
            sql`${postMetrics.twitterPostIdLocal} = ANY(${sql.raw(`ARRAY[${twPostIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
          ),
        )
      allMetrics.push(...twMetrics)
    }

    // Total impressions & engagement
    let totalImpressions = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    for (const m of allMetrics) {
      totalImpressions += m.impressions
      totalLikes += m.likes
      totalComments += m.comments
      totalShares += m.shares
    }
    const avgEngagement =
      totalImpressions > 0
        ? Math.round(((totalLikes + totalComments + totalShares) / totalImpressions) * 1000) / 10
        : 0

    // Publishing streak — count consecutive days with at least 1 post (going back from today)
    const allPublished = [
      ...liPublished.map((p) => ({ publishedAt: p.publishedAt })),
      ...twPublished.map((p) => ({ publishedAt: p.publishedAt })),
    ]
      .filter((p) => p.publishedAt !== null)
      .map((p) => {
        const d = new Date(p.publishedAt!)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })

    const publishedDaySet = new Set(allPublished)
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let checkDay = today.getTime()

    // Check if there's a post today or yesterday to start the streak
    const dayMs = 24 * 60 * 60 * 1000
    if (!publishedDaySet.has(checkDay)) {
      checkDay -= dayMs
    }
    while (publishedDaySet.has(checkDay)) {
      streak++
      checkDay -= dayMs
    }

    // Weekly impressions — last 4 weeks
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

    const weeklyMap = new Map<number, number>()
    for (let w = 0; w < 4; w++) {
      const weekDate = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)
      const ws = getWeekStart(weekDate)
      weeklyMap.set(ws.getTime(), 0)
    }

    // Map metrics to posts and their published dates
    const liPostMap = new Map(liPublished.map((p) => [p.id, p]))
    const twPostMap = new Map(twPublished.map((p) => [p.id, p]))

    for (const m of allMetrics) {
      let post: { publishedAt: Date | null } | undefined
      if (m.platform === "linkedin" && m.postId) {
        post = liPostMap.get(m.postId) as { publishedAt: Date | null } | undefined
      } else if (m.platform === "twitter" && m.twitterPostIdLocal) {
        post = twPostMap.get(m.twitterPostIdLocal) as { publishedAt: Date | null } | undefined
      }

      if (!post?.publishedAt) continue
      const publishedAt = new Date(post.publishedAt)
      if (publishedAt < fourWeeksAgo) continue

      const ws = getWeekStart(publishedAt)
      if (weeklyMap.has(ws.getTime())) {
        weeklyMap.set(ws.getTime(), (weeklyMap.get(ws.getTime()) ?? 0) + m.impressions)
      }
    }

    const weeklyImpressions = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, impressions]) => ({
        week: formatWeekLabel(new Date(ts)),
        impressions,
      }))

    // Top 5 posts by impressions
    const postMetricsWithContent: Array<{
      postId: string
      content: string
      impressions: number
      likes: number
      comments: number
      shares: number
      platform: string
    }> = []

    for (const m of allMetrics) {
      if (m.platform === "linkedin" && m.postId) {
        const post = liPostMap.get(m.postId)
        if (post) {
          postMetricsWithContent.push({
            postId: m.postId,
            content: (post as unknown as { content: string }).content,
            impressions: m.impressions,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            platform: "linkedin",
          })
        }
      } else if (m.platform === "twitter" && m.twitterPostIdLocal) {
        const post = twPostMap.get(m.twitterPostIdLocal)
        if (post) {
          postMetricsWithContent.push({
            postId: m.twitterPostIdLocal,
            content: (post as unknown as { content: string }).content,
            impressions: m.impressions,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            platform: "twitter",
          })
        }
      }
    }

    const topPosts = postMetricsWithContent
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map((p) => ({
        content: p.content.length > 120 ? p.content.slice(0, 120) + "..." : p.content,
        impressions: p.impressions,
        likes: p.likes,
        platform: p.platform,
      }))

    return NextResponse.json({
      hasSubscription,
      totalPosts,
      totalImpressions,
      avgEngagement,
      streak,
      weeklyImpressions,
      topPosts,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
