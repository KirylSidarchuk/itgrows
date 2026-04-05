import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      passwordHash,
      plan: "starter",
    }).returning()

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Signup error:", msg)
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 })
  }
}
