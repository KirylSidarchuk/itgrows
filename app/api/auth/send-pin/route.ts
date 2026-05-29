import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailPins } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: check if there's a recent unexpired PIN (created in last 60 seconds)
    const recentPin = await db
      .select()
      .from(emailPins)
      .where(
        and(
          eq(emailPins.email, normalizedEmail),
          gt(emailPins.expiresAt, new Date()),
          eq(emailPins.used, false)
        )
      )
      .limit(1)

    if (recentPin.length > 0) {
      const createdAt = recentPin[0].createdAt
      const secondsAgo = (Date.now() - createdAt.getTime()) / 1000
      if (secondsAgo < 60) {
        return NextResponse.json({ error: "Please wait before requesting another PIN" }, { status: 429 })
      }
    }

    const pin = generatePin()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await db.insert(emailPins).values({
      email: normalizedEmail,
      pin,
      expiresAt,
      name: name ? String(name).trim().slice(0, 100) : null,
    })

    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: email,
      subject: `Your ItGrows.ai sign-in code: ${pin}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f3f2f1; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.08);">
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ItGrows.ai</h1>
            <p style="color: #475569; margin: 0 0 28px; font-size: 15px;">Your sign-in code</p>
            <div style="background: #f3f2f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1b1916; font-family: monospace;">${pin}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Enter this code on the ItGrows.ai sign-in page.</p>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">This code expires in <strong>15 minutes</strong>. If you didn&apos;t request this, you can ignore this email.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("send-pin error:", msg)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
