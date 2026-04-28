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

function trialWelcomeEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to your 7-day trial 🚀</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">Your free trial of ItGrows.ai just started. Here's how to get the most out of your 7 days:</p>
        <ul style="color: #374151; font-size: 14px; line-height: 2;">
          <li><strong>Connect your LinkedIn account</strong> — takes 30 seconds</li>
          <li><strong>Fill your Professional DNA</strong> — tell the AI your niche, audience, and goals</li>
          <li><strong>Generate 7 posts</strong> — AI-written, with custom images, auto-scheduled for the week</li>
          <li><strong>Watch them publish automatically</strong> — no manual posting needed</li>
        </ul>
        <p style="color: #374151; font-size: 14px;">The whole setup takes about 5 minutes. After that, your LinkedIn content runs on autopilot.</p>
        <a href="https://www.itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; font-size: 15px;">Open Cabinet →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · You're receiving this because you started a free trial.</p>
      </div>
    </div>
  `
}

function trialTwoDaysLeftEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">2 days left in your trial ⏳</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">Your ItGrows.ai trial ends in <strong>2 days</strong>. Don't lose momentum — subscribe now to keep your LinkedIn content engine running.</p>
        <p style="color: #374151; font-size: 14px;">With a Personal subscription you get:</p>
        <ul style="color: #374151; font-size: 14px; line-height: 2;">
          <li>7 AI-written posts per week, every week</li>
          <li>Custom branded images for each post</li>
          <li>Auto-scheduling and auto-publishing to LinkedIn</li>
          <li>Professional DNA that improves over time</li>
        </ul>
        <p style="color: #374151; font-size: 14px;">Just <strong>$29/month</strong> — less than a single freelance post.</p>
        <a href="https://www.itgrows.ai/cabinet" style="display: inline-block; background: #d97706; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; font-size: 15px;">Subscribe Now →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://www.itgrows.ai/cabinet" style="color: #9ca3af;">Manage your account</a></p>
      </div>
    </div>
  `
}

function trialEndstodayEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your trial ends today 🔔</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">Your free trial of ItGrows.ai <strong>ends today</strong>. Subscribe to keep publishing and never go dark on LinkedIn.</p>
        <p style="color: #374151; font-size: 14px;">Without a subscription, your scheduled posts will stop publishing and you won't be able to generate new content.</p>
        <p style="color: #374151; font-size: 14px;">Stay consistent. Consistent LinkedIn presence is what drives inbound leads, speaking opportunities, and career growth.</p>
        <a href="https://www.itgrows.ai/cabinet" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; font-size: 15px;">Subscribe to Keep Access →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://www.itgrows.ai/cabinet" style="color: #9ca3af;">View pricing</a></p>
      </div>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Fetch all users who have trialEndsAt set
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

    let sent = 0
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

      const daysUntilTrialEnd = Math.ceil(
        (user.trialEndsAt.getTime() - now.getTime()) / 86400000
      )

      const displayName = user.name ?? user.email.split("@")[0] ?? "there"

      if (daysUntilTrialEnd === 6) {
        await sendEmail({
          to: user.email,
          subject: "Welcome — here's how to get the most from your 7-day trial",
          html: trialWelcomeEmail(displayName),
        })
        sent++
      } else if (daysUntilTrialEnd === 2) {
        await sendEmail({
          to: user.email,
          subject: "2 days left in your ItGrows trial",
          html: trialTwoDaysLeftEmail(displayName),
        })
        sent++
      } else if (daysUntilTrialEnd === 0) {
        await sendEmail({
          to: user.email,
          subject: "Your ItGrows trial ends today",
          html: trialEndstodayEmail(displayName),
        })
        sent++
      } else {
        skipped++
      }
    }

    return NextResponse.json({ sent, skipped, total: trialUsers.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[trial-emails] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
