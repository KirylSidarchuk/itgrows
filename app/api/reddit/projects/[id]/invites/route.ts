import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/db"
import { and, desc, eq, gt } from "drizzle-orm"
import { redditInvites } from "@/lib/reddit/db"
import { getProjectAccess, getRedditUser } from "@/lib/reddit/access"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

const BASE = "https://www.itgrows.ai"
const DAYS = 7

async function ownerOnly(id: string) {
  const user = await getRedditUser()
  if (!user?.beta) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const access = await getProjectAccess(user, id)
  if (!access) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  if (access.role !== "owner") return { error: NextResponse.json({ error: "Only the project owner can invite" }, { status: 403 }) }
  return { user }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const gate = await ownerOnly(id)
  if ("error" in gate) return gate.error
  const invites = await db
    .select()
    .from(redditInvites)
    .where(and(eq(redditInvites.projectId, id), eq(redditInvites.revoked, false), gt(redditInvites.expiresAt, new Date())))
    .orderBy(desc(redditInvites.createdAt))
  return NextResponse.json({ invites: invites.map((i) => ({ ...i, url: `${BASE}/reddit/join/${i.token}` })) })
}

// One link for the whole team: the owner sends it, each person signs in with their own email and
// fills in their own Reddit account. It expires on its own and can be revoked at any time.
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const gate = await ownerOnly(id)
  if ("error" in gate) return gate.error
  const token = randomBytes(18).toString("base64url")
  const [invite] = await db
    .insert(redditInvites)
    .values({ token, projectId: id, createdBy: gate.user.email, expiresAt: new Date(Date.now() + DAYS * 86400_000) })
    .returning()
  return NextResponse.json({ invite: { ...invite, url: `${BASE}/reddit/join/${token}` } })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const gate = await ownerOnly(id)
  if ("error" in gate) return gate.error
  const token = new URL(req.url).searchParams.get("token") ?? ""
  await db.update(redditInvites).set({ revoked: true }).where(and(eq(redditInvites.projectId, id), eq(redditInvites.token, token)))
  return NextResponse.json({ ok: true })
}
