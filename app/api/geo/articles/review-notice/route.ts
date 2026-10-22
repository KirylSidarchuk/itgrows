import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts, users } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { articlesReadyEmail } from "@/lib/email-templates"
import { sendOwner } from "@/lib/telegram"
import { and, asc, eq, gt, sql } from "drizzle-orm"
import { isDraftSite, publishSiteFor, utcToday } from "../_shared"

// Daily (vercel.json, after the VM writer's 03:00 UTC run): tells each client which articles became
// ready for review — written, waiting for their date. One email per client per run; each article is
// announced once (article_data.reviewNoticeAt is set before the email goes, so a rerun never repeats
// it). In the language of the client's site. WordPress draft sites are left out: they approve in
// WordPress and get the draft email from the publisher. An article due today is left out too: it
// goes out at 08:00 UTC, too soon for an email to be any use (it is still in "Your articles").

export const runtime = "nodejs"
export const maxDuration = 60

const APP_URL = "https://www.itgrows.ai"

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 })
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = utcToday()
  const ready = await db
    .select({
      id: scheduledPosts.id,
      userId: scheduledPosts.userId,
      scheduledDate: scheduledPosts.scheduledDate,
      language: scheduledPosts.language,
      title: sql<string>`${scheduledPosts.articleData}->>'title'`,
      description: sql<string | null>`${scheduledPosts.articleData}->>'metaDescription'`,
    })
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.status, "scheduled"),
      gt(scheduledPosts.scheduledDate, today),
      sql`${scheduledPosts.articleData}->>'preparedBy' = 'vm-writer'`,
      sql`coalesce(${scheduledPosts.articleData}->>'title', '') <> ''`,
      sql`coalesce(${scheduledPosts.articleData}->>'content', '') <> ''`,
      sql`${scheduledPosts.articleData}->>'reviewNoticeAt' IS NULL`,
    ))
    .orderBy(asc(scheduledPosts.scheduledDate))

  const byUser = new Map<string, typeof ready>()
  for (const r of ready) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r])

  const sent: string[] = []
  for (const [userId, rows] of byUser) {
    try {
      const site = await publishSiteFor(userId)
      if (!site || isDraftSite(site)) continue
      const [owner] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1)
      if (!owner?.email) continue

      // Claimed one by one, so an article is announced once even if two runs overlap.
      const noticeAt = new Date().toISOString()
      const claimed: typeof rows = []
      for (const r of rows) {
        const done = await db
          .update(scheduledPosts)
          .set({ articleData: sql`jsonb_set(${scheduledPosts.articleData}, '{reviewNoticeAt}', to_jsonb(${noticeAt}::text))` })
          .where(and(
            eq(scheduledPosts.id, r.id),
            eq(scheduledPosts.status, "scheduled"),
            sql`${scheduledPosts.articleData}->>'reviewNoticeAt' IS NULL`,
          ))
          .returning({ id: scheduledPosts.id })
        if (done.length) claimed.push(r)
      }
      if (claimed.length === 0) continue

      const profile = site.siteProfile as { language?: string } | null
      const language = profile?.language || claimed[0].language || "en"
      const de = language.toLowerCase().startsWith("de")
      const items = claimed.map((r) => ({
        title: r.title,
        description: r.description,
        liveDate: r.scheduledDate,
        url: `${APP_URL}/business/dashboard/articles?article=${r.id}`,
      }))
      const subject =
        claimed.length > 1
          ? de ? `${claimed.length} Artikel zur Durchsicht bereit` : `${claimed.length} articles ready for your review`
          : de ? `Zur Durchsicht bereit: ${claimed[0].title}` : `Ready for your review: ${claimed[0].title}`
      await sendEmail({ to: owner.email, subject, html: articlesReadyEmail(owner.name, site.name, items, language) })
      sent.push(`${site.name}: ${claimed.map((r) => `«${r.title.slice(0, 60)}» (${r.scheduledDate})`).join(", ")}`)
    } catch (e) {
      console.error("[geo/articles/review-notice]", userId, e instanceof Error ? e.message : e)
    }
  }

  if (sent.length) await sendOwner(`📬 Клиентам ушло письмо «статья готова, можно править до выхода»:\n${sent.join("\n")}`.slice(0, 3500))
  return NextResponse.json({ date: today, emails: sent.length, sent })
}
