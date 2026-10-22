import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { sendOwner } from "@/lib/telegram"
import { and, eq } from "drizzle-orm"
import { STOP_NOTE, isDraftSite, ownArticle, preparedData, publishSiteFor, utcToday } from "../../_shared"

// "Stop": the client's written article will not go out. The row is marked skipped with the reason,
// so the publisher and the writer leave it alone; until its date the client can take it back
// (POST /api/geo/articles/<id>/resume). Only the row's owner, only an article still waiting.

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const own = await ownArticle(id)
    if ("status" in own) return NextResponse.json({ error: own.status === 401 ? "unauthorized" : "not_found" }, { status: own.status })
    const { userId, row } = own
    const site = await publishSiteFor(userId)
    const prepared = preparedData(row.articleData)
    if (isDraftSite(site)) return NextResponse.json({ error: "draft_site" }, { status: 409 })
    if (row.status !== "scheduled" || !prepared) return NextResponse.json({ error: "not_stoppable" }, { status: 409 })

    const today = utcToday()
    const stopped = await db
      .update(scheduledPosts)
      .set({ status: "skipped", publishError: `${STOP_NOTE} on ${today}` })
      .where(and(eq(scheduledPosts.id, row.id), eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "scheduled")))
      .returning({ id: scheduledPosts.id })
    // The publisher picked it up a moment ago.
    if (stopped.length === 0) return NextResponse.json({ error: "busy" }, { status: 409 })

    await sendOwner(`⏹ Клиент остановил статью: ${site?.name ?? "?"} · «${prepared.title}» (дата ${row.scheduledDate})`)
    return NextResponse.json({ ok: true, canUndo: row.scheduledDate > today })
  } catch (e) {
    console.error("[geo/articles/stop]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
