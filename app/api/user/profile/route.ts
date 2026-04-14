import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, blogPosts, scheduledPosts } from "@/lib/db/schema"
import { eq, and, isNotNull, count } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    plan: users.plan,
    onboardingCompleted: users.onboardingCompleted,
    subscriptionStatus: users.subscriptionStatus,
  }).from(users).where(eq(users.id, session.user.id))

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Count articles for trial tracking
  const [blogCount] = await db
    .select({ value: count() })
    .from(blogPosts)
    .where(eq(blogPosts.userId, session.user.id))

  const [schedCount] = await db
    .select({ value: count() })
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.userId, session.user.id), isNotNull(scheduledPosts.articleData)))

  const articlesGenerated = (blogCount?.value ?? 0) + (schedCount?.value ?? 0)

  return NextResponse.json({ user: { ...user, articlesGenerated } })
}
