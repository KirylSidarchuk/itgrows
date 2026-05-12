import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, linkedinAccounts, linkedinPosts, twitterAccounts, twitterPosts, postMetrics } from "@/lib/db/schema"
import { eq, and, isNotNull, inArray } from "drizzle-orm"
import { hasAccess } from "@/lib/access"

interface LinkedInStatisticsResponse {
  elements?: Array<{
    totalShareStatistics?: {
      impressionCount?: number
      likeCount?: number
      commentCount?: number
      shareCount?: number
    }
  }>
}

interface TwitterMetricsResponse {
  data?: Array<{
    id: string
    public_metrics?: {
      impression_count?: number
      like_count?: number
      reply_count?: number
      retweet_count?: number
    }
  }>
}

async function fetchLinkedInMetrics(
  accessToken: string,
  linkedinPostId: string,
): Promise<{ impressions: number; likes: number; comments: number; shares: number } | null> {
  try {
    // Use the ugcPosts socialActions statistics endpoint
    const url = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(linkedinPostId)}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    })

    if (!res.ok) {
      console.warn(`[analytics/sync] LinkedIn socialActions fetch failed for ${linkedinPostId}: ${res.status}`)
      // Try the share statistics endpoint as fallback
      const shareRes = await fetch(
        `https://api.linkedin.com/v2/shares/${encodeURIComponent(linkedinPostId)}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )
      if (!shareRes.ok) return null
      const shareData = await shareRes.json() as { totalShareStatistics?: { impressionCount?: number; likeCount?: number; commentCount?: number; shareCount?: number } }
      const s = shareData.totalShareStatistics ?? {}
      return {
        impressions: s.impressionCount ?? 0,
        likes: s.likeCount ?? 0,
        comments: s.commentCount ?? 0,
        shares: s.shareCount ?? 0,
      }
    }

    const data = await res.json() as { likesSummary?: { totalLikes?: number }; commentsSummary?: { totalFirstLevelComments?: number } }
    return {
      impressions: 0, // socialActions endpoint doesn't include impressions
      likes: data.likesSummary?.totalLikes ?? 0,
      comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
      shares: 0,
    }
  } catch (err) {
    console.warn(`[analytics/sync] fetchLinkedInMetrics error:`, err)
    return null
  }
}

async function fetchLinkedInPostStatistics(
  accessToken: string,
  linkedinPostId: string,
): Promise<{ impressions: number; likes: number; comments: number; shares: number } | null> {
  try {
    // Use the organizationalEntityShareStatistics or shareStatistics endpoint
    const encodedUrn = encodeURIComponent(linkedinPostId)
    const statsUrl = `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=shares&shares[0]=${encodedUrn}`
    const res = await fetch(statsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    })

    if (!res.ok) {
      // Try personal share statistics
      const personalRes = await fetch(
        `https://api.linkedin.com/v2/shareStatistics?q=shares&shares[0]=${encodedUrn}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )
      if (!personalRes.ok) {
        return await fetchLinkedInMetrics(accessToken, linkedinPostId)
      }
      const personalData = await personalRes.json() as LinkedInStatisticsResponse
      const el = personalData.elements?.[0]?.totalShareStatistics ?? {}
      return {
        impressions: el.impressionCount ?? 0,
        likes: el.likeCount ?? 0,
        comments: el.commentCount ?? 0,
        shares: el.shareCount ?? 0,
      }
    }

    const data = await res.json() as LinkedInStatisticsResponse
    const el = data.elements?.[0]?.totalShareStatistics ?? {}
    return {
      impressions: el.impressionCount ?? 0,
      likes: el.likeCount ?? 0,
      comments: el.commentCount ?? 0,
      shares: el.shareCount ?? 0,
    }
  } catch (err) {
    console.warn(`[analytics/sync] fetchLinkedInPostStatistics error:`, err)
    return null
  }
}

async function fetchTwitterMetricsBatch(
  accessToken: string,
  tweetIds: string[],
): Promise<Map<string, { impressions: number; likes: number; comments: number; shares: number }>> {
  const result = new Map<string, { impressions: number; likes: number; comments: number; shares: number }>()
  if (tweetIds.length === 0) return result

  try {
    // Twitter v2 allows up to 100 IDs per request
    const ids = tweetIds.slice(0, 100).join(",")
    const url = `https://api.twitter.com/2/tweets?ids=${ids}&tweet.fields=public_metrics`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      console.warn(`[analytics/sync] Twitter metrics fetch failed: ${res.status}`)
      return result
    }

    const data = await res.json() as TwitterMetricsResponse
    for (const tweet of data.data ?? []) {
      const m = tweet.public_metrics ?? {}
      result.set(tweet.id, {
        impressions: m.impression_count ?? 0,
        likes: m.like_count ?? 0,
        comments: m.reply_count ?? 0,
        shares: m.retweet_count ?? 0,
      })
    }
  } catch (err) {
    console.warn(`[analytics/sync] fetchTwitterMetricsBatch error:`, err)
  }

  return result
}

// GET — called by cron (requires CRON_SECRET)
// POST — called by user manually (requires session)
async function syncMetrics(userId: string): Promise<{ linkedin: number; twitter: number }> {
  let linkedinSynced = 0
  let twitterSynced = 0

  // --- LinkedIn ---
  const liAccounts = await db
    .select()
    .from(linkedinAccounts)
    .where(eq(linkedinAccounts.userId, userId))

  for (const account of liAccounts) {
    if (!account.accessToken) continue
    // Skip expired tokens
    if (account.expiresAt && account.expiresAt <= new Date()) continue

    const publishedPosts = await db
      .select({ id: linkedinPosts.id, linkedinPostId: linkedinPosts.linkedinPostId })
      .from(linkedinPosts)
      .where(
        and(
          eq(linkedinPosts.userId, userId),
          eq(linkedinPosts.status, "published"),
          isNotNull(linkedinPosts.linkedinPostId),
        ),
      )

    for (const post of publishedPosts) {
      if (!post.linkedinPostId) continue
      const metrics = await fetchLinkedInPostStatistics(account.accessToken, post.linkedinPostId)
      if (!metrics) continue

      // Upsert: delete existing and insert new
      await db.delete(postMetrics).where(
        and(eq(postMetrics.postId, post.id), eq(postMetrics.platform, "linkedin")),
      )
      await db.insert(postMetrics).values({
        postId: post.id,
        platform: "linkedin",
        impressions: metrics.impressions,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        fetchedAt: new Date(),
      })
      linkedinSynced++
    }
  }

  // --- Twitter ---
  const twAccounts = await db
    .select()
    .from(twitterAccounts)
    .where(eq(twitterAccounts.userId, userId))

  for (const account of twAccounts) {
    if (!account.accessToken) continue

    const publishedPosts = await db
      .select({ id: twitterPosts.id, twitterPostId: twitterPosts.twitterPostId })
      .from(twitterPosts)
      .where(
        and(
          eq(twitterPosts.userId, userId),
          eq(twitterPosts.status, "published"),
          isNotNull(twitterPosts.twitterPostId),
        ),
      )

    const tweetIds = publishedPosts
      .map((p) => p.twitterPostId)
      .filter((id): id is string => id !== null)

    if (tweetIds.length === 0) continue

    const metricsMap = await fetchTwitterMetricsBatch(account.accessToken, tweetIds)

    for (const post of publishedPosts) {
      if (!post.twitterPostId) continue
      const metrics = metricsMap.get(post.twitterPostId)
      if (!metrics) continue

      await db.delete(postMetrics).where(
        and(eq(postMetrics.twitterPostIdLocal, post.id), eq(postMetrics.platform, "twitter")),
      )
      await db.insert(postMetrics).values({
        twitterPostIdLocal: post.id,
        platform: "twitter",
        impressions: metrics.impressions,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        fetchedAt: new Date(),
      })
      twitterSynced++
    }
  }

  return { linkedin: linkedinSynced, twitter: twitterSynced }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all users with active subscription or trial
    const allUsers = await db
      .select({
        id: users.id,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlan: users.subscriptionPlan,
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)

    const eligibleUsers = allUsers.filter((u) =>
      hasAccess({
        subscriptionStatus: u.subscriptionStatus ?? null,
        subscriptionPlan: u.subscriptionPlan ?? null,
        trialEndsAt: u.trialEndsAt ?? null,
      }),
    )

    let totalLinkedin = 0
    let totalTwitter = 0

    for (const user of eligibleUsers) {
      const { linkedin, twitter } = await syncMetrics(user.id)
      totalLinkedin += linkedin
      totalTwitter += twitter
    }

    return NextResponse.json({
      success: true,
      usersProcessed: eligibleUsers.length,
      linkedinSynced: totalLinkedin,
      twitterSynced: totalTwitter,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
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

    if (
      !user ||
      !hasAccess({
        subscriptionStatus: user.subscriptionStatus ?? null,
        subscriptionPlan: user.subscriptionPlan ?? null,
        trialEndsAt: user.trialEndsAt ?? null,
      })
    ) {
      return NextResponse.json({ error: "subscription_required" }, { status: 403 })
    }

    const { linkedin, twitter } = await syncMetrics(userId)

    return NextResponse.json({ success: true, linkedinSynced: linkedin, twitterSynced: twitter })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
