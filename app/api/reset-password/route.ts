import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token))

    if (!resetToken) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    if (new Date() > resetToken.expires) return NextResponse.json({ error: "Token expired" }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 12)
    await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId))
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Reset password error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
