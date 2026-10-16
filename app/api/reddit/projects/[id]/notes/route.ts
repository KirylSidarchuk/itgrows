import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { and, desc, eq } from "drizzle-orm"
import { redditNotes } from "@/lib/reddit/db"
import { getProjectAccess, getRedditUser } from "@/lib/reddit/access"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

// What one person learns about a community (a removal and why, what a moderator allowed) is
// the thing the other most needs to know. Everyone on the project sees the notes, and the
// planner reads them before writing the next day's tasks.
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!(await getProjectAccess(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const notes = await db.select().from(redditNotes).where(eq(redditNotes.projectId, id)).orderBy(desc(redditNotes.createdAt)).limit(200)
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!(await getProjectAccess(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 })
  let b: { subreddit?: unknown; body?: unknown }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const text = String(b.body ?? "").trim().slice(0, 1000)
  if (text.length < 3) return NextResponse.json({ error: "Write the note" }, { status: 400 })
  const sub = String(b.subreddit ?? "").trim().replace(/^\/?r\//i, "").replace(/[^A-Za-z0-9_]/g, "")
  const [note] = await db
    .insert(redditNotes)
    .values({ projectId: id, subreddit: sub ? `r/${sub}` : null, body: text, authorEmail: user.email })
    .returning()
  return NextResponse.json({ note })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getRedditUser()
  if (!user?.beta) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const access = await getProjectAccess(user, id)
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const noteId = new URL(req.url).searchParams.get("note") ?? ""
  if (!/^[0-9a-f-]{36}$/i.test(noteId)) return NextResponse.json({ error: "note required" }, { status: 400 })
  // Authors remove their own notes; the owner can remove any.
  const where = access.role === "owner"
    ? and(eq(redditNotes.id, noteId), eq(redditNotes.projectId, id))
    : and(eq(redditNotes.id, noteId), eq(redditNotes.projectId, id), eq(redditNotes.authorEmail, user.email))
  await db.delete(redditNotes).where(where)
  return NextResponse.json({ ok: true })
}
