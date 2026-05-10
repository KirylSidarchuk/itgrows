import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
  }

  try {
    const [vToken] = await db.select().from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), eq(verificationTokens.identifier, email)))

    if (!vToken) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    if (new Date() > vToken.expires) {
      return NextResponse.redirect(new URL("/login?error=token-expired", req.url))
    }

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))

    // Delete used token
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    // Send welcome email
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (user?.email) {
      const userName = user.name || user.email.split("@")[0]
      const welcomeHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0 0 8px; font-size: 26px; font-weight: 700;">Welcome to ItGrows.ai</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Your LinkedIn & X autopilot</p>
          </div>
          <div style="padding: 36px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Hi ${userName},</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Your email is confirmed. Start your <strong>14-day free trial</strong> to get AI-written posts published automatically to LinkedIn and X.</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0 0 8px;">Once you pick a plan:</p>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0 0 28px; padding-left: 20px;">
              <li>Connect your LinkedIn and/or X account</li>
              <li>Fill your Professional DNA brief (2 minutes)</li>
              <li>We generate posts for your first week</li>
              <li>Posts publish automatically at 10am UTC daily</li>
            </ul>
            <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Start 14-Day Free Trial →</a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 36px; border-top: 1px solid #f3f4f6; padding-top: 20px;">ItGrows.ai · <a href="https://itgrows.ai" style="color: #9ca3af; text-decoration: none;">itgrows.ai</a></p>
          </div>
        </div>
      `
      sendEmail({
        to: user.email,
        subject: "Welcome to ItGrows.ai — confirm your plan to start 🚀",
        html: welcomeHtml,
      }).catch(() => {})
    }

    return NextResponse.redirect(new URL("/login?verified=1&callbackUrl=/cabinet", req.url))
  } catch (err) {
    console.error("Verify email error:", err)
    return NextResponse.redirect(new URL("/login?error=server-error", req.url))
  }
}
