import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redditProjectMembers } from "@/lib/reddit/db"
import { cleanCommunities, cleanUsername, findInvite } from "@/lib/reddit/invite"
import { notifyOwner } from "@/lib/telegram"

export const dynamic = "force-dynamic"

// Joining through an invite link. The person is signed in, so their email comes from the session;
// everything else about their account they fill in themselves.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!u) return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  const email = u.email.toLowerCase()

  const { token } = await params
  const found = await findInvite(token)
  if (!found) return NextResponse.json({ error: "This invite link has expired or was revoked. Ask for a new one." }, { status: 410 })
  const projectId = found.project.id

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const redditUsername = cleanUsername(body.redditUsername)
  if (!redditUsername) return NextResponse.json({ error: "Enter your Reddit username" }, { status: 400 })
  const communities = cleanCommunities(body.communities)
  const accountNote = String(body.accountNote ?? "").trim().slice(0, 300) || null

  const team = await db.select({ email: redditProjectMembers.email }).from(redditProjectMembers).where(eq(redditProjectMembers.projectId, projectId))
  if (!team.some((m) => m.email === email) && team.length >= 5) {
    return NextResponse.json({ error: "This team is full (5 people in the beta)" }, { status: 429 })
  }

  await db
    .insert(redditProjectMembers)
    .values({ projectId, email, redditUsername, communities, accountNote })
    .onConflictDoUpdate({ target: [redditProjectMembers.projectId, redditProjectMembers.email], set: { redditUsername, communities, accountNote } })
  const name = (found.project.profile as { product_name?: string } | null)?.product_name ?? found.project.siteUrl
  notifyOwner(`Reddit · ${name}: в команду вошёл u/${redditUsername} (${email}), сообщества: ${communities.join(", ") || "любые"}`)
  return NextResponse.json({ projectId })
}
