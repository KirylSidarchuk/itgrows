import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getUserSubscription(userId: string) {
  const [user] = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlan: users.subscriptionPlan,
      subscriptionEndDate: users.subscriptionEndDate,
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) return null

  return {
    status: user.subscriptionStatus ?? "inactive",
    plan: user.subscriptionPlan ?? null,
    endDate: user.subscriptionEndDate ?? null,
    isActive: user.subscriptionStatus === "active",
  }
}

/**
 * Check if user has an active subscription.
 * Use this in server components / API routes to gate paid features.
 */
export async function requireSubscription(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId)
  return sub?.isActive === true
}
