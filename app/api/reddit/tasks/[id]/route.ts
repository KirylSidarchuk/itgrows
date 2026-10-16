import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { and, eq } from "drizzle-orm"
import { redditProjectMembers, redditTasks } from "@/lib/reddit/db"
import { getProjectAccess, getRedditUser } from "@/lib/reddit/access"

export const dynamic = "force-dynamic"

// "Done" needs the link to what was posted: that link is what the worker opens the next day to
// see whether the comment is still up and whether anyone answered. Without it, done is a claim.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [task] = await db.select().from(redditTasks).where(eq(redditTasks.id, id)).limit(1)
  // Anyone on the project may mark a task; the check the next day is done against the Reddit
  // account of whoever marked it.
  if (!task || !(await getProjectAccess(user, task.projectId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: { action?: unknown; url?: unknown; reason?: unknown; to?: unknown }
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
        doneByEmail: user.email,
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

  // Handing a task to a teammate who is free. Only undone tasks move, and only to someone on
  // the team with a Reddit account; the page warns before a move into someone else's community.
  if (body.action === "handoff") {
    const to = String(body.to ?? "").trim().toLowerCase()
    if (task.status !== "todo") return NextResponse.json({ error: "Only tasks not done yet can be handed over" }, { status: 409 })
    const [m] = await db
      .select({ email: redditProjectMembers.email, redditUsername: redditProjectMembers.redditUsername })
      .from(redditProjectMembers)
      .where(and(eq(redditProjectMembers.projectId, task.projectId), eq(redditProjectMembers.email, to)))
      .limit(1)
    if (!m?.redditUsername) return NextResponse.json({ error: "That person is not on the team or has no Reddit account yet" }, { status: 400 })
    const [t] = await db.update(redditTasks).set({ assigneeEmail: m.email }).where(eq(redditTasks.id, id)).returning()
    return NextResponse.json({ task: t })
  }

  if (body.action === "undo") {
    const [t] = await db
      .update(redditTasks)
      .set({ status: "todo", doneByEmail: null, doneUrl: null, doneAt: null, skipReason: null, verifyStatus: null, verifiedAt: null, result: null })
      .where(eq(redditTasks.id, id))
      .returning()
    return NextResponse.json({ task: t })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
