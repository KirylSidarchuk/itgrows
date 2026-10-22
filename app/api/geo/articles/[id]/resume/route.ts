import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { sendOwner } from "@/lib/telegram"
import { and, eq, gt, like } from "drizzle-orm"
import { STOP_NOTE, isDraftSite, ownArticle, preparedData, publishSiteFor, utcToday } from "../../_shared"

// Undo "Stop": the article goes back in the queue for its date. Only before that date, only an
// article the client stopped (never one we dropped as a duplicate), only the row's owner.

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const own = await ownArticle(id)
    if ("status" in own) return NextResponse.json({ error: own.status === 401 ? "unauthorized" : "not_found" }, { status: own.status })
    const { userId, row } = own
    const site = await publishSiteFor(userId)
    if (isDraftSite(site)) return NextResponse.json({ error: "draft_site" }, { status: 409 })
    if (row.status !== "skipped" || !(row.publishError ?? "").startsWith(STOP_NOTE)) {
      return NextResponse.json({ error: "not_stopped" }, { status: 409 })
    }
    const today = utcToday()
    if (row.scheduledDate <= today) return NextResponse.json({ error: "too_late" }, { status: 409 })

    const back = await db
      .update(scheduledPosts)
      .set({ status: "scheduled", publishError: null })
      .where(and(
        eq(scheduledPosts.id, row.id),
        eq(scheduledPosts.userId, userId),
        eq(scheduledPosts.status, "skipped"),
        like(scheduledPosts.publishError, `${STOP_NOTE}%`),
        gt(scheduledPosts.scheduledDate, today),
      ))
      .returning({ id: scheduledPosts.id })
    if (back.length === 0) return NextResponse.json({ error: "not_stopped" }, { status: 409 })

    const title = preparedData(row.articleData)?.title ?? row.keyword
    await sendOwner(`▶️ Клиент вернул статью в план: ${site?.name ?? "?"} · «${title}» (дата ${row.scheduledDate})`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[geo/articles/resume]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
