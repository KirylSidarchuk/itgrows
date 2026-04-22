import { db } from "@/lib/db"
import { linkedinPosts } from "@/lib/db/schema"
import { eq, and, gte, count } from "drizzle-orm"

/**
 * Check if user has generated posts too recently.
 * Limit: max 1 generation per 3 hours per user.
 * We check by counting posts created in the last 3 hours.
 */
const BYPASS_USER_IDS = ["00f2505f-dd6c-4d0f-89f4-a1388dfbfabc"]

export async function checkGenerateRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (BYPASS_USER_IDS.includes(userId)) return { allowed: true }

  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)

    // Count posts created in the last 3 hours for this user
    const result = await db
      .select({ count: count() })
      .from(linkedinPosts)
      .where(
        and(
          eq(linkedinPosts.userId, userId),
          gte(linkedinPosts.createdAt, threeHoursAgo)
        )
      )

    const recentCount = result[0]?.count ?? 0

    // Allow up to 7 posts per 3 hours (1 generation of 7 posts)
    if (recentCount >= 7) {
      return { allowed: false, retryAfter: 3 * 60 * 60 }
    }

    return { allowed: true }
  } catch {
    // If rate limit check fails, allow the request (fail open)
    return { allowed: true }
  }
}
