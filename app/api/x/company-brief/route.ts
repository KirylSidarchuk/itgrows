import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { twitterCompanyBriefs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [brief] = await db
      .select()
      .from(twitterCompanyBriefs)
      .where(eq(twitterCompanyBriefs.userId, session.user.id))
      .limit(1)

    return NextResponse.json({ brief: brief ?? null })
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

    const body = await req.json() as { answers?: {
      q1?: string // What does your company do?
      q2?: string // What's your brand voice/tone?
      q3?: string // Who is your target audience?
      q4?: string // What are your company's main topics/themes?
      q5?: string // What's your company's goal on X?
    } }

    const { answers } = body
    if (!answers) {
      return NextResponse.json({ error: "answers required" }, { status: 400 })
    }

    const questions = [
      "What does your company do?",
      "What's your brand voice/tone?",
      "Who is your target audience?",
      "What are your company's main topics/themes?",
      "What's your company's goal on X?",
    ]

    const content = [
      `${questions[0]}\n${answers.q1 || "(not provided)"}`,
      `${questions[1]}\n${answers.q2 || "(not provided)"}`,
      `${questions[2]}\n${answers.q3 || "(not provided)"}`,
      `${questions[3]}\n${answers.q4 || "(not provided)"}`,
      `${questions[4]}\n${answers.q5 || "(not provided)"}`,
    ].join("\n\n")

    const existing = await db
      .select({ id: twitterCompanyBriefs.id })
      .from(twitterCompanyBriefs)
      .where(eq(twitterCompanyBriefs.userId, session.user.id))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(twitterCompanyBriefs)
        .set({ content, updatedAt: new Date() })
        .where(eq(twitterCompanyBriefs.userId, session.user.id))
    } else {
      await db.insert(twitterCompanyBriefs).values({
        userId: session.user.id,
        content,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
