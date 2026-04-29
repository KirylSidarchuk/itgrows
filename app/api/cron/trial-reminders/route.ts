import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isNotNull } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
`

function trialOneDayLeftEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your free trial ends tomorrow ⏳</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hey ${name},</p>
        <p style="color: #374151;">Your 7-day free trial ends <strong>tomorrow</strong>.</p>
        <p style="color: #374151;">Your LinkedIn posts are already scheduled and ready to publish — don't lose access before they go live.</p>
        <p style="color: #374151; font-size: 14px;">Subscribe now to keep them going:</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #d97706; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; font-size: 15px;">Keep My Posts Going → $29/month</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Prefer annual? Get <strong>$203/year</strong> and save 30%. No credit card surprises, cancel anytime.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Manage your account</a></p>
      </div>
    </div>
  `
}

function trialLastDayEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your trial ends today 🔔</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hey ${name},</p>
        <p style="color: #374151;">Your trial ends <strong>today</strong>.</p>
        <p style="color: #374151;">Your scheduled posts will stop publishing after today. Subscribe now to keep your LinkedIn presence active.</p>
        <p style="color: #374151; font-size: 14px;">Your posts are ready — don't let them go to waste.</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; font-size: 15px;">Subscribe Now → $29/month</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">View pricing</a></p>
      </div>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Window for "1 day before": trial ends between now+23h and now+25h
    const oneDayWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const oneDayWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Window for "last day": trial ends between now-1h and now+23h (and still in the future)
    const lastDayWindowStart = new Date(now.getTime() - 1 * 60 * 60 * 1000)
    const lastDayWindowEnd = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    // Fetch all users who have a trial set and are not yet subscribed
    const trialUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        trialEndsAt: users.trialEndsAt,
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(users)
      .where(isNotNull(users.trialEndsAt))

    let sentOneDayLeft = 0
    let sentLastDay = 0
    let skipped = 0

    for (const user of trialUsers) {
      if (!user.trialEndsAt || !user.email) {
        skipped++
        continue
      }

      // Skip users who already have an active subscription
      if (user.subscriptionStatus === "active") {
        skipped++
        continue
      }

      const trialEnd = user.trialEndsAt.getTime()
      const displayName = user.name ?? user.email.split("@")[0] ?? "there"

      if (trialEnd >= oneDayWindowStart.getTime() && trialEnd < oneDayWindowEnd.getTime()) {
        // Trial ends tomorrow (in the 23h–25h window)
        await sendEmail({
          to: user.email,
          subject: "Your free trial ends tomorrow",
          html: trialOneDayLeftEmail(displayName),
        })
        sentOneDayLeft++
      } else if (trialEnd >= lastDayWindowStart.getTime() && trialEnd < lastDayWindowEnd.getTime()) {
        // Trial ends today (in the -1h to +23h window, i.e. still active)
        await sendEmail({
          to: user.email,
          subject: "Your trial ends today — don't lose your posts",
          html: trialLastDayEmail(displayName),
        })
        sentLastDay++
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      sentOneDayLeft,
      sentLastDay,
      skipped,
      total: trialUsers.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[trial-reminders] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
