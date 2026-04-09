import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  if (body.keyword !== undefined) allowed.keyword = body.keyword
  if (body.language !== undefined) allowed.language = body.language
  if (body.tone !== undefined) allowed.tone = body.tone
  if (body.scheduledDate !== undefined) allowed.scheduledDate = body.scheduledDate
  if (body.articleData !== undefined) allowed.articleData = body.articleData
  if (body.status !== undefined) allowed.status = body.status
  if (body.blogPostSlug !== undefined) allowed.blogPostSlug = body.blogPostSlug
  if (body.coverImageUrl !== undefined) allowed.coverImageUrl = body.coverImageUrl

  const [post] = await db.update(scheduledPosts)
    .set(allowed)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, session.user.id)))
    .returning()

  return NextResponse.json({ post })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json() as { tone?: string; keyword?: string }

  const allowed: { tone?: string; keyword?: string } = {}
  if (body.tone !== undefined) allowed.tone = body.tone
  if (body.keyword !== undefined) allowed.keyword = body.keyword

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const [post] = await db.update(scheduledPosts)
    .set(allowed)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, session.user.id)))
    .returning()

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ post })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await db.delete(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
