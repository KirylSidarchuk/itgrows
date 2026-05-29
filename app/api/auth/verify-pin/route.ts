import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, emailPins } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { signIn } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json()

    if (!email || !pin) {
      return NextResponse.json({ error: "Email and PIN required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find a valid, unused PIN
    const [pinRecord] = await db
      .select()
      .from(emailPins)
      .where(
        and(
          eq(emailPins.email, normalizedEmail),
          eq(emailPins.pin, pin),
          eq(emailPins.used, false),
          gt(emailPins.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!pinRecord) {
      return NextResponse.json({ error: "Invalid or expired PIN" }, { status: 401 })
    }

    // Mark PIN as used
    await db
      .update(emailPins)
      .set({ used: true })
      .where(eq(emailPins.id, pinRecord.id))

    // Check if user exists, create if not
    let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))

    if (!user) {
      ;[user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          emailVerified: new Date(),
          plan: "starter",
        })
        .returning()

      // Notify owner about new user
      fetch(
        `https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: 372194458,
            text: `\u{1F195} New user (PIN auth): ${normalizedEmail}`,
          }),
        }
      ).catch(() => {})
    } else if (!user.emailVerified) {
      // Mark existing user's email as verified if not already
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id))
    }

    return NextResponse.json({ success: true, userId: user.id, email: user.email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("verify-pin error:", msg)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
