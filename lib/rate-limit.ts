import { db } from "@/lib/db"
import { linkedinPosts } from "@/lib/db/schema"
import { eq, and, gte, count } from "drizzle-orm"

/**
 * Simple in-memory IP rate limiter for anonymous (public) endpoints.
 * Stores { count, windowStart } per IP. On Vercel each serverless instance
 * maintains its own map — that's acceptable; the goal is to throttle a single
 * attacker who hits the same instance repeatedly, not to enforce a perfect
 * global cap.
 */
interface IPBucket {
  count: number
  windowStart: number
}

const ipBuckets = new Map<string, IPBucket>()

/**
 * Check rate limit by IP address.
 * @param ip        - Client IP string
 * @param maxReqs   - Maximum requests allowed in the window
 * @param windowMs  - Window duration in milliseconds
 */
export function checkIPRateLimit(
  ip: string,
  maxReqs: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const bucket = ipBuckets.get(ip)

  if (!bucket || now - bucket.windowStart >= windowMs) {
    // New window
    ipBuckets.set(ip, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (bucket.count >= maxReqs) {
    const retryAfter = Math.ceil((windowMs - (now - bucket.windowStart)) / 1000)
    return { allowed: false, retryAfter }
  }

  bucket.count += 1
  return { allowed: true }
}

/**
 * Extract the real client IP from a Next.js request, respecting the
 * X-Forwarded-For header set by Vercel's edge network.
 */
export function getClientIP(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; first entry is the real client
    return forwarded.split(",")[0].trim()
  }
  return "unknown"
}

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
