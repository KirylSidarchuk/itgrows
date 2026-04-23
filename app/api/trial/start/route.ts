import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const [user] = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlan: users.subscriptionPlan,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Already has an active subscription
  if (
    user.subscriptionStatus === "active" &&
    (user.subscriptionPlan === "personal" || user.subscriptionPlan === "personal_annual")
  ) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 400 })
  }

  // Already used free trial
  if (user.trialEndsAt !== null) {
    return NextResponse.json({ error: "trial_already_used" }, { status: 400 })
  }

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db
    .update(users)
    .set({ trialEndsAt })
    .where(eq(users.id, userId))

  // Fire-and-forget: generate initial LinkedIn posts immediately for new trial user
  const baseUrl = process.env.NEXTAUTH_URL || "https://itgrows.ai"
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    fetch(`${baseUrl}/api/internal/generate-initial-posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": cronSecret,
      },
      body: JSON.stringify({ userId }),
    }).catch((err) => {
      console.error("[trial/start] Failed to trigger initial post generation:", err)
    })
  }

  return NextResponse.json({ trialEndsAt })
}
