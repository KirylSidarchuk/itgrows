import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userTasks = await db.select().from(tasks)
    .where(eq(tasks.userId, session.user.id))
    .orderBy(desc(tasks.createdAt))

  return NextResponse.json({ tasks: userTasks })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const [task] = await db.insert(tasks).values({
    userId: session.user.id,
    title: body.title,
    description: body.description || null,
    type: body.type || "seo_article",
    status: body.status || "done",
    articleData: body.articleData || null,
  }).returning()

  return NextResponse.json({ task })
}
