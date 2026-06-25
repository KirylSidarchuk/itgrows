import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinBriefs } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const linkedinAccountId = searchParams.get("linkedinAccountId")

    let brief
    if (linkedinAccountId) {
      // Per-account brief
      ;[brief] = await db
        .select()
        .from(linkedinBriefs)
        .where(and(eq(linkedinBriefs.userId, userId), eq(linkedinBriefs.linkedinAccountId, linkedinAccountId)))
        .limit(1)
    } else {
      // Personal brief (no account id) — backward compat: also check for NULL
      ;[brief] = await db
        .select()
        .from(linkedinBriefs)
        .where(and(eq(linkedinBriefs.userId, userId), isNull(linkedinBriefs.linkedinAccountId)))
        .limit(1)
    }

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
  profileUrl?: string
  postingFrequency?: string
  avoidTopics?: string
  imageStyle?: string
  linkedinAccountId?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json() as BriefRequest
    const { niche, tone, goals, companyName, targetAudience, profileUrl, postingFrequency, avoidTopics, imageStyle, linkedinAccountId } = body
    const validFrequency = postingFrequency === "every_other_day" ? "every_other_day" : "daily"
    const validImageStyle = ["ai_art", "minimalist", "photorealistic", "infographic", "no_image"].includes(imageStyle ?? "") ? imageStyle! : "ai_art"

    if (linkedinAccountId) {
      // Per-account brief — check for existing and upsert manually
      const [existing] = await db
        .select({ id: linkedinBriefs.id })
        .from(linkedinBriefs)
        .where(and(eq(linkedinBriefs.userId, userId), eq(linkedinBriefs.linkedinAccountId, linkedinAccountId)))
        .limit(1)

      let brief
      if (existing) {
        ;[brief] = await db
          .update(linkedinBriefs)
          .set({
            niche: niche ?? null,
            tone: tone ?? "professional",
            goals: goals ?? null,
            companyName: companyName ?? null,
            targetAudience: targetAudience ?? null,
            profileUrl: profileUrl ?? null,
            isAutoFilled: false,
            postingFrequency: validFrequency,
            avoidTopics: avoidTopics ?? null,
            imageStyle: validImageStyle,
            updatedAt: new Date(),
          })
          .where(eq(linkedinBriefs.id, existing.id))
          .returning()
      } else {
        ;[brief] = await db
          .insert(linkedinBriefs)
          .values({
            userId,
            linkedinAccountId,
            niche: niche ?? null,
            tone: tone ?? "professional",
            goals: goals ?? null,
            companyName: companyName ?? null,
            targetAudience: targetAudience ?? null,
            profileUrl: profileUrl ?? null,
            isAutoFilled: false,
            postingFrequency: validFrequency,
            avoidTopics: avoidTopics ?? null,
            imageStyle: validImageStyle,
            updatedAt: new Date(),
          })
          .returning()
      }

      return NextResponse.json({ brief })
    }

    // Personal brief — upsert by userId (no linkedinAccountId)
    const [existingPersonal] = await db
      .select({ id: linkedinBriefs.id })
      .from(linkedinBriefs)
      .where(and(eq(linkedinBriefs.userId, userId), isNull(linkedinBriefs.linkedinAccountId)))
      .limit(1)

    let brief
    if (existingPersonal) {
      ;[brief] = await db
        .update(linkedinBriefs)
        .set({
          niche: niche ?? null,
          tone: tone ?? "professional",
          goals: goals ?? null,
          companyName: companyName ?? null,
          targetAudience: targetAudience ?? null,
          profileUrl: profileUrl ?? null,
          isAutoFilled: false,
          postingFrequency: validFrequency,
          avoidTopics: avoidTopics ?? null,
          imageStyle: validImageStyle,
          updatedAt: new Date(),
        })
        .where(eq(linkedinBriefs.id, existingPersonal.id))
        .returning()
    } else {
      ;[brief] = await db
        .insert(linkedinBriefs)
        .values({
          userId,
          linkedinAccountId: null,
          niche: niche ?? null,
          tone: tone ?? "professional",
          goals: goals ?? null,
          companyName: companyName ?? null,
          targetAudience: targetAudience ?? null,
          profileUrl: profileUrl ?? null,
          isAutoFilled: false,
          postingFrequency: validFrequency,
          avoidTopics: avoidTopics ?? null,
          imageStyle: validImageStyle,
          updatedAt: new Date(),
        })
        .returning()
    }

    return NextResponse.json({ brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
