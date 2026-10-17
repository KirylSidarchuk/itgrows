import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { images, linkedinPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { imagesOwnedBy } from "@/lib/image-library"

// Attaches an image the customer already has to a post. The URL is looked up in
// the library rather than taken on trust, so a post can only ever point at an
// image this account owns.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { postId, imageUrl } = (await req.json()) as { postId?: string; imageUrl?: string }
  if (!postId || !imageUrl) {
    return NextResponse.json({ error: "postId and imageUrl are required" }, { status: 400 })
  }

  const [image] = await db
    .select({ id: images.id })
    .from(images)
    .where(
      and(eq(images.url, imageUrl), imagesOwnedBy(session.user.id))
    )
    .limit(1)

  if (!image) {
    return NextResponse.json({ error: "That image is not in your library." }, { status: 404 })
  }

  const [post] = await db
    .select({ id: linkedinPosts.id, status: linkedinPosts.status })
    .from(linkedinPosts)
    .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, session.user.id)))
    .limit(1)

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  if (post.status === "published") {
    return NextResponse.json(
      { error: "This post is already published, so its image can no longer be changed." },
      { status: 409 })
  }

  await db.update(linkedinPosts).set({ imageUrl }).where(eq(linkedinPosts.id, postId))
  return NextResponse.json({ ok: true })
}
