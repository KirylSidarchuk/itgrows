import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const posts = await db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.userId, session.user.id))
    .orderBy(desc(scheduledPosts.scheduledDate))

  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const [post] = await db.insert(scheduledPosts).values({
    userId: session.user.id,
    keyword: body.keyword,
    language: body.language || "en",
    tone: body.tone || "Professional",
    scheduledDate: body.scheduledDate,
    status: body.status || "scheduled",
    articleData: body.articleData || null,
    coverImageUrl: body.coverImageUrl || null,
  }).returning()

  return NextResponse.json({ post })
}
