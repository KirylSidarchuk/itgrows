import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { publishContext, publishScheduledPost, scheduleNextBatchIfEmpty } from "@/lib/publish-post"
import { sendOwner } from "@/lib/telegram"
import { and, eq } from "drizzle-orm"
import { isDraftSite, ownArticle, preparedData, publishSiteFor, utcToday } from "../../_shared"

// "Publish now": the client's written article goes out today instead of on its date, through the
// same function the nightly publisher uses (lib/publish-post.ts), so every platform behaves exactly
// as it does at night. Only the row's owner, only an article that is written and still waiting.

export const runtime = "nodejs"
export const maxDuration = 120

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const own = await ownArticle(id)
    if ("status" in own) return NextResponse.json({ error: own.status === 401 ? "unauthorized" : "not_found" }, { status: own.status })
    const { userId, row } = own
    const site = await publishSiteFor(userId)
    const prepared = preparedData(row.articleData)
    if (!site) return NextResponse.json({ error: "no_site" }, { status: 409 })
    if (isDraftSite(site)) return NextResponse.json({ error: "draft_site" }, { status: 409 })
    if (row.status !== "scheduled" || !prepared) return NextResponse.json({ error: "not_ready" }, { status: 409 })

    const ctx = publishContext(process.env.CRON_SECRET ?? "")
    const r = await publishScheduledPost(row, ctx)
    // The nightly publisher, or another click, got to it first.
    if (!r.claimed) return NextResponse.json({ error: "busy" }, { status: 409 })

    if (r.processed.status === "published") {
      if (r.counted) await scheduleNextBatchIfEmpty(userId, ctx)
      const [after] = await db
        .select({ publishedUrl: scheduledPosts.publishedUrl })
        .from(scheduledPosts)
        .where(and(eq(scheduledPosts.id, row.id), eq(scheduledPosts.userId, userId)))
        .limit(1)
      const publishedUrl = after?.publishedUrl && /^https?:\/\//i.test(after.publishedUrl) ? after.publishedUrl : null
      await sendOwner(`🚀 Клиент опубликовал статью сразу, не дожидаясь ${row.scheduledDate}: ${site.name} · «${prepared.title}»${publishedUrl ? `\n${publishedUrl}` : ""}`)
      return NextResponse.json({ ok: true, publishedUrl })
    }

    // It did not go out. While its date is still ahead it goes back in the queue for that date,
    // as if nothing had been clicked; on or after its date the nightly retry takes it from here.
    let requeued = false
    if (row.scheduledDate > utcToday()) {
      const back = await db
        .update(scheduledPosts)
        .set({ status: "scheduled", publishError: null })
        .where(and(eq(scheduledPosts.id, row.id), eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "failed")))
        .returning({ id: scheduledPosts.id })
      requeued = back.length > 0
    }
    await sendOwner(
      `⚠️ «Опубликовать сейчас» не сработало: ${site.name} · «${prepared.title}»\n${(r.processed.error ?? "").slice(0, 300)}\n` +
        (requeued ? `Вернули в план на ${row.scheduledDate}.` : "Осталась в «failed», ночной повтор подхватит."),
    )
    return NextResponse.json({ error: "publish_failed", requeued, scheduledDate: row.scheduledDate }, { status: 502 })
  } catch (e) {
    console.error("[geo/articles/publish]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
