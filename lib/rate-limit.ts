import { db } from "@/lib/db"
import { linkedinPosts } from "@/lib/db/schema"
import { eq, and, gte, count } from "drizzle-orm"

/**
 * Check if user has generated posts too recently.
 * Limit: max 3 generation requests per hour per user.
 * We check by counting posts created in the last hour.
 */
export async function checkGenerateRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Count posts created in the last hour for this user
    const result = await db
      .select({ count: count() })
      .from(linkedinPosts)
      .where(
        and(
          eq(linkedinPosts.userId, userId),
          gte(linkedinPosts.createdAt, oneHourAgo)
        )
      )

    const recentCount = result[0]?.count ?? 0

    // Allow up to 21 posts per hour (3 generations of 7 posts each)
    if (recentCount >= 21) {
      return { allowed: false, retryAfter: 60 * 60 }
    }

    return { allowed: true }
  } catch {
    // If rate limit check fails, allow the request (fail open)
    return { allowed: true }
  }
}
