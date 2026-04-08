import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const allowed: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) allowed.title = body.title
  if (body.description !== undefined) allowed.description = body.description
  if (body.status !== undefined) allowed.status = body.status
  if (body.priority !== undefined) allowed.priority = body.priority
  if (body.dueDate !== undefined) allowed.dueDate = body.dueDate
  if (body.result !== undefined) allowed.result = body.result

  const [task] = await db.update(tasks)
    .set(allowed)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning()

  return NextResponse.json({ task })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
  return NextResponse.json({ success: true })
}
