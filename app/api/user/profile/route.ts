import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    plan: users.plan,
    onboardingCompleted: users.onboardingCompleted,
  }).from(users).where(eq(users.id, session.user.id))

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({ user })
}
