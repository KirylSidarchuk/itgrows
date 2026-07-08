import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, siteVisits, dailyStats, linkedinAccounts, twitterAccounts, linkedinPosts } from "@/lib/db/schema"
import { gt, sql, desc } from "drizzle-orm"

export const maxDuration = 60

// Owner notification bot (same as auth.ts new-user pings).
const TG_BOT = process.env.TELEGRAM_BOT_TOKEN ?? "8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g"
const TG_CHAT = 372194458

// Daily digest → Telegram: visits, signups, connects, posts, and paying/trialing totals
// with day-over-day deltas (from the daily_stats snapshot). Triggered by Vercel cron.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const since = new Date(Date.now() - 86_400_000)
    const today = new Date().toISOString().slice(0, 10)

    const [vis] = await db
      .select({
        visits: sql<number>`count(*)::int`,
        uniques: sql<number>`count(distinct ${siteVisits.visitorHash})::int`,
      })
      .from(siteVisits)
      .where(gt(siteVisits.createdAt, since))

    const newUsers = await db.select({ email: users.email }).from(users).where(gt(users.createdAt, since))

    const [li] = await db.select({ c: sql<number>`count(*)::int` }).from(linkedinAccounts).where(gt(linkedinAccounts.createdAt, since))
    const [x] = await db.select({ c: sql<number>`count(*)::int` }).from(twitterAccounts).where(gt(twitterAccounts.createdAt, since))
    const [posts] = await db.select({ c: sql<number>`count(*)::int` }).from(linkedinPosts).where(gt(linkedinPosts.createdAt, since))

    const [tot] = await db
      .select({
        total: sql<number>`count(*)::int`,
        paying: sql<number>`count(*) filter (where subscription_status in ('active','past_due'))::int`,
        trialing: sql<number>`count(*) filter (where subscription_status = 'trialing')::int`,
      })
      .from(users)

    const [prev] = await db.select().from(dailyStats).orderBy(desc(dailyStats.day)).limit(1)
    const payDelta = prev ? tot.paying - prev.paying : 0
    const trialDelta = prev ? tot.trialing - prev.trialing : 0

    await db
      .insert(dailyStats)
      .values({ day: today, totalUsers: tot.total, paying: tot.paying, trialing: tot.trialing })
      .onConflictDoUpdate({ target: dailyStats.day, set: { totalUsers: tot.total, paying: tot.paying, trialing: tot.trialing } })

    const d = (n: number) => (n > 0 ? ` (+${n})` : n < 0 ? ` (${n})` : "")
    const emails = newUsers.length ? "\n  " + newUsers.slice(0, 12).map((u) => u.email).join("\n  ") : ""

    const msg =
      `📊 ItGrows · за 24ч (${today})\n` +
      `👀 Визиты: ${vis?.visits ?? 0} (уник ${vis?.uniques ?? 0})\n` +
      `🆕 Регистрации: ${newUsers.length}${emails}\n` +
      `🔗 LinkedIn: +${li?.c ?? 0} · X: +${x?.c ?? 0}\n` +
      `📝 Постов сгенерено: ${posts?.c ?? 0}\n` +
      `——\n` +
      `Всего: ${tot.total} юзеров · ${tot.paying} платящих${d(payDelta)} · ${tot.trialing} в триале${d(trialDelta)}`

    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, sent: msg })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    // Best-effort failure alert so a broken digest doesn't fail silently.
    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text: `⚠️ daily-report failed: ${message.slice(0, 300)}` }),
    }).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
