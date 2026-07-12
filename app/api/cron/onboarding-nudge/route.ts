import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, twitterAccounts } from "@/lib/db/schema"
import { and, lt, isNull, or, eq, notExists, sql } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

function onboardingNudgeEmail(name: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f3f2f1; padding: 40px 20px;">
  <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.08);">
    <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ItGrows.ai</h1>
    <p style="color: #1b1916; font-size: 18px; font-weight: 700; margin: 24px 0 12px;">Hey ${name}, you're one step away</p>
    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">You created your account but haven't connected LinkedIn or X yet.</p>
    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Here's what happens when you do:<br>
    ✦ ItGrows learns your voice and niche<br>
    ✦ Generates 14 posts tailored to you<br>
    ✦ Publishes automatically on your schedule</p>
    <a href="https://itgrows.ai/cabinet" style="display: block; background: #7c3aed; color: white; text-align: center; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 20px;">Connect your account →</a>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">Most users connect and see their first posts in under 5 minutes. Your 14-day trial starts when you pick a plan.</p>
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
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const candidates = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(
        and(
          lt(users.createdAt, cutoff),
          isNull(users.onboardingEmailSentAt),
          or(
            isNull(users.subscriptionStatus),
            eq(users.subscriptionStatus, "inactive")
          ),
          // linkedin_accounts.user_id is TEXT in prod (schema drift) -> cast to avoid text=uuid error
          sql`NOT EXISTS (SELECT 1 FROM linkedin_accounts la WHERE la.user_id = ${users.id}::text)`,
          notExists(
            db
              .select({ id: twitterAccounts.id })
              .from(twitterAccounts)
              .where(eq(twitterAccounts.userId, users.id))
          )
        )
      )

    let sent = 0
    let skipped = 0

    for (const user of candidates) {
      if (!user.email) {
        skipped++
        continue
      }

      const displayName = user.name ?? user.email.split("@")[0] ?? "there"

      await sendEmail({
        to: user.email,
        subject: "You're one step away — connect your account",
        html: onboardingNudgeEmail(displayName),
      })

      await db
        .update(users)
        .set({ onboardingEmailSentAt: now })
        .where(eq(users.id, user.id))

      sent++
    }

    return NextResponse.json({
      sent,
      skipped,
      total: candidates.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[onboarding-nudge] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
