import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true })

    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expires,
    })

    const baseUrl = process.env.NEXTAUTH_URL || "https://itgrows.ai"
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: email,
      subject: "Reset your ItGrows.ai password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #f3f2f1;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.1);">
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ItGrows.ai</h1>
            <p style="color: #475569; margin: 0 0 32px;">Password Reset</p>
            <p style="color: #1b1916; margin: 0 0 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Reset Password</a>
            <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">If you didn't request this, ignore this email. Your password won't change.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
