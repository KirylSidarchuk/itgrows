import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { and, eq, lt, gt, or, isNotNull, inArray, sql } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
`

function linkedinReminderEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Connect LinkedIn to start publishing</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hey ${name},</p>
        <p style="color: #374151;">You signed up for ItGrows.ai yesterday — great to have you on board!</p>
        <p style="color: #374151;">To start publishing AI-generated posts to LinkedIn, you just need to connect your LinkedIn account. It only takes a minute.</p>
        <p style="color: #374151; font-size: 14px;">Connect now and your first posts will be ready to go:</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; font-size: 15px;">Connect LinkedIn →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Go to your cabinet</a></p>
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
    const windowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000)

    const candidates = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        subscriptionStatus: users.subscriptionStatus,
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)
      .where(
        and(
          gt(users.createdAt, windowStart),
          lt(users.createdAt, windowEnd),
          eq(users.linkedinReminderSent, false),
          or(
            inArray(users.subscriptionStatus, ["active", "trialing", "past_due"]),
            and(isNotNull(users.trialEndsAt), gt(users.trialEndsAt, now))
          ),
          // linkedin_accounts.user_id is TEXT in prod (schema drift) -> cast to avoid text=uuid error
          sql`NOT EXISTS (SELECT 1 FROM linkedin_accounts la WHERE la.user_id = ${users.id}::text)`
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
        subject: "Connect LinkedIn to start publishing",
        html: linkedinReminderEmail(displayName),
      })

      await db
        .update(users)
        .set({ linkedinReminderSent: true })
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
    console.error("[linkedin-reminder] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
