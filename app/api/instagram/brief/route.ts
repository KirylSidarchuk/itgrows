import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { instagramBriefs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [brief] = await db
      .select()
      .from(instagramBriefs)
      .where(eq(instagramBriefs.userId, userId))
      .limit(1)

    if (brief) {
      return NextResponse.json({ brief })
    }
    return NextResponse.json({ brief: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface InstagramBriefRequest {
  niche?: string
  tone?: string
  goals?: string
  targetAudience?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as InstagramBriefRequest
    const { niche, tone, goals, targetAudience } = body

    const [brief] = await db
      .insert(instagramBriefs)
      .values({
        userId,
        niche: niche ?? null,
        tone: tone ?? "casual",
        goals: goals ?? null,
        targetAudience: targetAudience ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: instagramBriefs.userId,
        set: {
          niche: niche ?? null,
          tone: tone ?? "casual",
          goals: goals ?? null,
          targetAudience: targetAudience ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    return NextResponse.json({ brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
