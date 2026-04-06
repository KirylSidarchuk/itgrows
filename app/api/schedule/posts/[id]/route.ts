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

  const [post] = await db.update(scheduledPosts)
    .set(body)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, session.user.id)))
    .returning()

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
