import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { redditTasks } from "@/lib/reddit/db"
import { getOwnedProject, getRedditUser } from "@/lib/reddit/access"

export const dynamic = "force-dynamic"

// "Done" needs the link to what was posted: that link is what the worker opens the next day to
// see whether the comment is still up and whether anyone answered. Without it, done is a claim.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [task] = await db.select().from(redditTasks).where(eq(redditTasks.id, id)).limit(1)
  if (!task || !(await getOwnedProject(user.id, task.projectId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: { action?: unknown; url?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  if (body.action === "done") {
    const url = String(body.url ?? "").trim()
    if (!/^https:\/\/(www\.|old\.|new\.)?reddit\.com\/r\/[A-Za-z0-9_]+\/comments\//.test(url)) {
      return NextResponse.json(
        { error: "Paste the link to your comment or post on Reddit (Share → Copy link)." },
        { status: 400 },
      )
    }
    const [t] = await db
      .update(redditTasks)
      .set({
        status: "done",
        doneUrl: url.slice(0, 500),
        doneAt: new Date(),
        skipReason: null,
        verifyStatus: "pending",
        verifiedAt: null,
        verifyAttempts: 0,
        result: null,
      })
      .where(eq(redditTasks.id, id))
      .returning()
    return NextResponse.json({ task: t })
  }

  if (body.action === "skip") {
    const [t] = await db
      .update(redditTasks)
      .set({ status: "skipped", skipReason: String(body.reason ?? "").trim().slice(0, 500) || null })
      .where(eq(redditTasks.id, id))
      .returning()
    return NextResponse.json({ task: t })
  }

  if (body.action === "undo") {
    const [t] = await db
      .update(redditTasks)
      .set({ status: "todo", doneUrl: null, doneAt: null, skipReason: null, verifyStatus: null, verifiedAt: null, result: null })
      .where(eq(redditTasks.id, id))
      .returning()
    return NextResponse.json({ task: t })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
