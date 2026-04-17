import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinBriefs } from "@/lib/db/schema"
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
      .from(linkedinBriefs)
      .where(eq(linkedinBriefs.userId, userId))
      .limit(1)

    if (brief) {
      return NextResponse.json({
        brief: {
          ...brief,
          isAutoFilled: brief.isAutoFilled ?? false,
        },
      })
    }
    return NextResponse.json({ brief: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface BriefRequest {
  niche?: string
  tone?: string
  goals?: string
  companyName?: string
  targetAudience?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as BriefRequest
    const { niche, tone, goals, companyName, targetAudience } = body

    const [brief] = await db
      .insert(linkedinBriefs)
      .values({
        userId,
        niche: niche ?? null,
        tone: tone ?? "professional",
        goals: goals ?? null,
        companyName: companyName ?? null,
        targetAudience: targetAudience ?? null,
        isAutoFilled: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: linkedinBriefs.userId,
        set: {
          niche: niche ?? null,
          tone: tone ?? "professional",
          goals: goals ?? null,
          companyName: companyName ?? null,
          targetAudience: targetAudience ?? null,
          isAutoFilled: false,
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
