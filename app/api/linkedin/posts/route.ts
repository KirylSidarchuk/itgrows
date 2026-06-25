import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinPosts, linkedinAccounts } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const linkedinAccountId = searchParams.get("linkedinAccountId")

    let accountId = linkedinAccountId
    if (!accountId) {
      // Find the personal account
      const [personalAccount] = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
        .limit(1)
      if (personalAccount) accountId = personalAccount.id
    }

    let posts
    if (accountId) {
      posts = await db
        .select()
        .from(linkedinPosts)
        .where(and(eq(linkedinPosts.userId, userId), eq(linkedinPosts.linkedinAccountId, accountId)))
        .orderBy(desc(linkedinPosts.scheduledFor))
    } else {
      posts = await db
        .select()
        .from(linkedinPosts)
        .where(eq(linkedinPosts.userId, userId))
        .orderBy(desc(linkedinPosts.scheduledFor))
    }

    return NextResponse.json({ posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface PatchRequest {
  postId: string
  content?: string
  scheduledFor?: string
  status?: string
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as PatchRequest
    const { postId, content, scheduledFor, status } = body

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }

    const updates: Partial<{
      content: string
      scheduledFor: Date
      status: string
    }> = {}

    if (content !== undefined) updates.content = content
    if (scheduledFor !== undefined) updates.scheduledFor = new Date(scheduledFor)
    if (status !== undefined) updates.status = status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const [updated] = await db
      .update(linkedinPosts)
      .set(updates)
      .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await db
      .delete(linkedinPosts)
      .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
