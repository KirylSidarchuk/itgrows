import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinPosts, linkedinAccounts } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

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

    // Select everything EXCEPT the heavy base64 image_url (avg ~1MB/post). The list
    // returns a lightweight image URL; the image streams lazily from /api/linkedin/post-image.
    const cols = {
      id: linkedinPosts.id,
      userId: linkedinPosts.userId,
      linkedinAccountId: linkedinPosts.linkedinAccountId,
      content: linkedinPosts.content,
      status: linkedinPosts.status,
      scheduledFor: linkedinPosts.scheduledFor,
      publishedAt: linkedinPosts.publishedAt,
      linkedinPostId: linkedinPosts.linkedinPostId,
      publishError: linkedinPosts.publishError,
      createdAt: linkedinPosts.createdAt,
      hasImage: sql<boolean>`(${linkedinPosts.imageUrl} is not null)`,
    }

    let rows
    if (accountId) {
      rows = await db
        .select(cols)
        .from(linkedinPosts)
        .where(and(eq(linkedinPosts.userId, userId), eq(linkedinPosts.linkedinAccountId, accountId)))
        .orderBy(desc(linkedinPosts.scheduledFor))
    } else {
      rows = await db
        .select(cols)
        .from(linkedinPosts)
        .where(eq(linkedinPosts.userId, userId))
        .orderBy(desc(linkedinPosts.scheduledFor))
    }

    const posts = rows.map(({ hasImage, ...p }) => ({
      ...p,
      imageUrl: hasImage ? `/api/linkedin/post-image/${p.id}` : null,
    }))

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
  editKind?: string
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as PatchRequest
    const { postId, content, scheduledFor, status, editKind } = body

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }

    const updates: Partial<{
      content: string
      scheduledFor: Date
      status: string
      editKind: string
      source: string
      generatedContent: string
      editedAt: Date
    }> = {}

    if (content !== undefined) updates.content = content
    if (scheduledFor !== undefined) updates.scheduledFor = new Date(scheduledFor)
    if (status !== undefined) updates.status = status

    // An edit only counts when the words actually changed. Rescheduling a post is not authorship,
    // and marking it as edited would let machine text pass itself off as the author's later.
    if (content !== undefined) {
      const [before] = await db
        .select({ content: linkedinPosts.content, generatedContent: linkedinPosts.generatedContent })
        .from(linkedinPosts)
        .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, userId)))
        .limit(1)

      if (before && before.content.trim() !== content.trim()) {
        updates.source = "edited"
        updates.editedAt = new Date()

        // Only on the first edit, so the original survives repeated passes.
        if (!before.generatedContent) updates.generatedContent = before.content
      }
    }

    // Arrives on its own request, after the content was saved — so it cannot sit inside the
    // branch that handles new text, which is where it was and why every answer was discarded.
    if (editKind && ["wording", "refined", "position"].includes(editKind)) {
      updates.editKind = editKind
    }

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
