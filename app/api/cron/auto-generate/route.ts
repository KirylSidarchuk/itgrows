import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinPosts, users } from "@/lib/db/schema"
import { eq, and, inArray, count, or, gt } from "drizzle-orm"
import { hasAccess } from "@/lib/access"
import { sendEmail } from "@/lib/email"
import { generateForUser } from "@/lib/linkedin-generate"

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all users with active subscription or active trial
    const now = new Date()
    const allCandidates = await db
      .select({ id: users.id, email: users.email, name: users.name, subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(
        or(
          eq(users.subscriptionStatus, "active"),
          gt(users.trialEndsAt, now)
        )
      )

    const eligibleUsers = allCandidates.filter((u) =>
      hasAccess({ subscriptionStatus: u.subscriptionStatus ?? null, subscriptionPlan: u.subscriptionPlan ?? null, trialEndsAt: u.trialEndsAt ?? null })
    )

    let generated = 0
    let skipped = 0
    let failed = 0

    for (const user of eligibleUsers) {
      // Count remaining scheduled posts for this user
      const [result] = await db
        .select({ cnt: count() })
        .from(linkedinPosts)
        .where(
          and(
            eq(linkedinPosts.userId, user.id),
            inArray(linkedinPosts.status, ["draft", "scheduled"])
          )
        )

      const scheduledCount = Number(result?.cnt ?? 0)

      if (scheduledCount > 0) {
        skipped++
        continue
      }

      // No scheduled posts left — auto-generate new batch
      console.log(`[auto-generate] Generating posts for user ${user.id}`)
      const result2 = await generateForUser(user.id)
      if (result2.success) {
        generated++
      } else {
        console.error(`[auto-generate] Failed for user ${user.id}: ${result2.error}`)
        failed++
        if (user.email) {
          try {
            await sendEmail({
              to: user.email,
              subject: "⚠️ We couldn't generate your LinkedIn posts",
              html: `<p>Hi ${user.name ?? "there"},</p><p>We had trouble generating your LinkedIn posts this week. Please log in to <a href="https://www.itgrows.ai/cabinet">your cabinet</a> and generate them manually.</p>`
            })
          } catch (emailErr) {
            console.error(`[auto-generate] Failed to send failure email to user ${user.id}:`, emailErr)
          }
        }
      }
    }

    return NextResponse.json({ generated, skipped, failed, total: eligibleUsers.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[auto-generate] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
