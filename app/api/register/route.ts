import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Create verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.insert(verificationTokens).values({
      identifier: email.toLowerCase(),
      token,
      expires,
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || "https://itgrows.ai"
    const verifyUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`

    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: email,
      subject: "Confirm your ItGrows.ai account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #f3f2f1;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.1);">
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ItGrows.ai</h1>
            <p style="color: #475569; margin: 0 0 32px;">Welcome aboard, ${name || email.split("@")[0]}!</p>
            <p style="color: #1b1916; margin: 0 0 24px;">Click the button below to confirm your email address and activate your account.</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Confirm Email</a>
            <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, userId: user.id, emailSent: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Signup error:", msg)
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 })
  }
}
