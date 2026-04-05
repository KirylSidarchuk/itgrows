import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  if (body.isDefault) {
    await db.update(connectedSites).set({ isDefault: false }).where(eq(connectedSites.userId, session.user.id))
  }

  const [site] = await db.update(connectedSites)
    .set(body)
    .where(and(eq(connectedSites.id, id), eq(connectedSites.userId, session.user.id)))
    .returning()

  return NextResponse.json({ site })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await db.delete(connectedSites)
    .where(and(eq(connectedSites.id, id), eq(connectedSites.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
