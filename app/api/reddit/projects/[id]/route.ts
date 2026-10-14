import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { and, desc, eq, gte } from "drizzle-orm"
import { redditPlans, redditProjects, redditTasks } from "@/lib/reddit/db"
import { getOwnedProject, getRedditUser } from "@/lib/reddit/access"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await getOwnedProject(user.id, id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)
  const [plans, tasks] = await Promise.all([
    db.select().from(redditPlans).where(eq(redditPlans.projectId, id)).orderBy(desc(redditPlans.day)).limit(30),
    db
      .select()
      .from(redditTasks)
      .where(and(eq(redditTasks.projectId, id), gte(redditTasks.day, since)))
      .orderBy(desc(redditTasks.day), redditTasks.priority),
  ])
  return NextResponse.json({ project, plans, tasks })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await getOwnedProject(user.id, id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const set: Partial<typeof redditProjects.$inferInsert> = { updatedAt: new Date() }

  if (body.answers && typeof body.answers === "object") {
    const answers: Record<string, string> = {}
    for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (/^[a-z0-9_]{1,40}$/.test(k)) answers[k] = String(v ?? "").slice(0, 2000)
    }
    set.answers = answers
  }
  if (typeof body.redditUsername === "string") {
    set.redditUsername = body.redditUsername.trim().replace(/^\/?u\//, "").slice(0, 40) || null
  }
  if (typeof body.goal === "string" && body.goal.trim().length >= 5) set.goal = body.goal.trim().slice(0, 1000)

  // Allowed moves: start once the questions are answered, pause and resume, and retry a site
  // read that failed. Everything else belongs to the worker.
  const action = body.action
  if (action === "activate" && ["questions", "paused", "active"].includes(project.status)) set.status = "active"
  else if (action === "pause" && project.status === "active") set.status = "paused"
  else if (action === "retry" && project.status === "error") {
    set.status = project.profile ? "questions" : "analyzing"
    set.error = null
  } else if (action !== undefined) {
    return NextResponse.json({ error: "That change is not possible right now" }, { status: 409 })
  }

  const [updated] = await db.update(redditProjects).set(set).where(eq(redditProjects.id, id)).returning()
  return NextResponse.json({ project: updated })
}
