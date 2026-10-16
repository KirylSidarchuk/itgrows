import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { desc, eq, inArray, or } from "drizzle-orm"
import { redditProjectMembers, redditProjects } from "@/lib/reddit/db"
import { getRedditUser } from "@/lib/reddit/access"
import { notifyOwner } from "@/lib/telegram"

export const dynamic = "force-dynamic"

// Every active project costs a day's worth of searches and a planning call, so a beta user
// gets a handful, not an open tap.
const MAX_PROJECTS = 3

export async function GET() {
  const user = await getRedditUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!user.beta) return NextResponse.json({ error: "Not in the beta" }, { status: 403 })
  const memberOf = await db
    .select({ projectId: redditProjectMembers.projectId })
    .from(redditProjectMembers)
    .where(eq(redditProjectMembers.email, user.email))
  const ids = memberOf.map((m) => m.projectId)
  const rows = await db
    .select({
      id: redditProjects.id,
      userId: redditProjects.userId,
      siteUrl: redditProjects.siteUrl,
      goal: redditProjects.goal,
      status: redditProjects.status,
      profile: redditProjects.profile,
      lastRunAt: redditProjects.lastRunAt,
      createdAt: redditProjects.createdAt,
    })
    .from(redditProjects)
    .where(ids.length ? or(eq(redditProjects.userId, user.id), inArray(redditProjects.id, ids)) : eq(redditProjects.userId, user.id))
    .orderBy(desc(redditProjects.createdAt))
  return NextResponse.json({
    canCreate: user.canCreate,
    projects: rows.map(({ userId, ...p }) => ({ ...p, role: userId === user.id ? "owner" : "member" })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getRedditUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!user.canCreate) return NextResponse.json({ error: "Your access covers the projects you were added to" }, { status: 403 })

  let body: { siteUrl?: unknown; goal?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  let siteUrl = String(body.siteUrl ?? "").trim().slice(0, 300)
  const goal = String(body.goal ?? "").trim().slice(0, 1000)
  if (!/^https?:\/\//i.test(siteUrl)) siteUrl = "https://" + siteUrl
  try {
    const u = new URL(siteUrl)
    if (!u.hostname.includes(".")) throw new Error("no host")
  } catch {
    return NextResponse.json({ error: "Enter the address of your website" }, { status: 400 })
  }
  if (goal.length < 5) return NextResponse.json({ error: "Say what you want Reddit to bring you" }, { status: 400 })

  const existing = await db.select({ id: redditProjects.id }).from(redditProjects).where(eq(redditProjects.userId, user.id))
  if (existing.length >= MAX_PROJECTS) {
    return NextResponse.json({ error: `The beta allows ${MAX_PROJECTS} projects per account` }, { status: 429 })
  }

  // The worker on the VM picks up status "analyzing" within ten minutes and reads the site.
  const [p] = await db.insert(redditProjects).values({ userId: user.id, siteUrl, goal }).returning({ id: redditProjects.id })
  notifyOwner(`Reddit · new project from ${user.email}: ${siteUrl}\nGoal: ${goal}`)
  return NextResponse.json({ id: p.id })
}
