import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterBriefs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const QUESTIONS = [
  "What topics do you post about on X? (your niche)",
  "How would you describe your Twitter voice? (e.g., direct, witty, thought-provoking, controversial)",
  "Who is your target audience on X?",
  "What's your goal on X? (build following, drive traffic, establish thought leadership, etc.)",
  "What type of content performs best for you? (hot takes, threads, insights, questions, stories)",
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [brief] = await db
      .select()
      .from(twitterBriefs)
      .where(eq(twitterBriefs.userId, userId))
      .limit(1)

    if (!brief) {
      return NextResponse.json({ brief: null })
    }

    return NextResponse.json({ brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as { answers: Record<string, string>; avoidTopics?: string }
    const { answers, avoidTopics } = body

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "answers is required" }, { status: 400 })
    }

    // Format answers as readable text
    const lines: string[] = QUESTIONS.map((q, i) => {
      const key = `q${i + 1}`
      const answer = (answers[key] ?? "").trim()
      return `${q}\n${answer || "(not provided)"}`
    })
    const content = lines.join("\n\n")

    await db
      .insert(twitterBriefs)
      .values({ userId, content, avoidTopics: avoidTopics ?? null })
      .onConflictDoUpdate({
        target: twitterBriefs.userId,
        set: { content, avoidTopics: avoidTopics ?? null, updatedAt: new Date() },
      })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
