import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { and, eq } from "drizzle-orm"
import { redditProjectMembers } from "@/lib/reddit/db"
import { getProjectAccess, getRedditUser } from "@/lib/reddit/access"
import { cleanCommunities, cleanUsername } from "@/lib/reddit/invite"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

// The team of a project. Only the owner changes it. Communities are how the planner keeps two
// people from the same company out of the same thread: each person gets tasks in their own.
async function ownerOnly(id: string) {
  const user = await getRedditUser()
  if (!user?.beta) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const access = await getProjectAccess(user, id)
  if (!access) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  if (access.role !== "owner") return { error: NextResponse.json({ error: "Only the project owner can change the team" }, { status: 403 }) }
  return { user, access }
}

const cleanSub = (s: string) => {
  const name = s.trim().replace(/^\/?r\//i, "").replace(/[^A-Za-z0-9_]/g, "")
  return name ? `r/${name}` : ""
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const gate = await ownerOnly(id)
  if ("error" in gate) return gate.error

  let body: { email?: unknown; redditUsername?: unknown; communities?: unknown; accountNote?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter their email" }, { status: 400 })
  const redditUsername = String(body.redditUsername ?? "").trim().replace(/^\/?u\//i, "").slice(0, 40) || null
  const raw = Array.isArray(body.communities) ? body.communities.map(String) : String(body.communities ?? "").split(/[,\s]+/)
  const communities = Array.from(new Set(raw.map(cleanSub).filter(Boolean))).slice(0, 20)
  const accountNote = String(body.accountNote ?? "").trim().slice(0, 300) || null

  const existing = await db
    .select({ email: redditProjectMembers.email })
    .from(redditProjectMembers)
    .where(eq(redditProjectMembers.projectId, id))
  if (!existing.some((m) => m.email === email) && existing.length >= 5) {
    return NextResponse.json({ error: "The beta allows 5 people per project" }, { status: 429 })
  }

  const [member] = await db
    .insert(redditProjectMembers)
    .values({ projectId: id, email, redditUsername, communities, accountNote })
    .onConflictDoUpdate({
      target: [redditProjectMembers.projectId, redditProjectMembers.email],
      set: { redditUsername, communities, accountNote },
    })
    .returning()
  return NextResponse.json({ member })
}

// A member keeps their own details current (username, communities, account state); the owner
// can still edit anyone through POST.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await getProjectAccess(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 })
  let body: { redditUsername?: unknown; communities?: unknown; accountNote?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const [member] = await db
    .update(redditProjectMembers)
    .set({
      redditUsername: cleanUsername(body.redditUsername),
      communities: cleanCommunities(body.communities),
      accountNote: String(body.accountNote ?? "").trim().slice(0, 300) || null,
    })
    .where(and(eq(redditProjectMembers.projectId, id), eq(redditProjectMembers.email, user.email)))
    .returning()
  if (!member) return NextResponse.json({ error: "You are not on this team" }, { status: 404 })
  return NextResponse.json({ member })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const gate = await ownerOnly(id)
  if ("error" in gate) return gate.error
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  await db
    .delete(redditProjectMembers)
    .where(and(eq(redditProjectMembers.projectId, id), eq(redditProjectMembers.email, email)))
  return NextResponse.json({ ok: true })
}
