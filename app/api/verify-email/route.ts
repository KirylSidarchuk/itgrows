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

    // Auto-start 7-day trial for the newly verified user
    const [user] = await db
      .select({ id: users.id, trialEndsAt: users.trialEndsAt, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (user && user.trialEndsAt === null) {
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db
        .update(users)
        .set({ trialEndsAt })
        .where(eq(users.id, user.id))

      // Send welcome email
      const userName = user.name || user.email.split("@")[0]
      sendEmail({
        to: user.email,
        subject: "Welcome to ItGrows.ai \u2014 your 7-day trial has started \uD83D\uDE80",
        html: `<p>Hi ${userName},</p>
<p>Your 7-day free trial has started. Connect your LinkedIn and we'll start generating posts for you today.</p>
<p><a href="https://www.itgrows.ai/cabinet">Go to cabinet</a></p>`,
      }).catch(() => {})

      // Fire-and-forget: generate initial LinkedIn posts
      const baseUrl = process.env.NEXTAUTH_URL || "https://itgrows.ai"
      const cronSecret = process.env.CRON_SECRET
      if (cronSecret) {
        fetch(`${baseUrl}/api/internal/generate-initial-posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": cronSecret,
          },
          body: JSON.stringify({ userId: user.id }),
        }).catch((err) => {
          console.error("[verify-email] Failed to trigger initial post generation:", err)
        })
      }
    }

    return NextResponse.redirect(new URL("/login?verified=1&callbackUrl=/cabinet", req.url))
  } catch (err) {
    console.error("Verify email error:", err)
    return NextResponse.redirect(new URL("/login?error=server-error", req.url))
  }
}
