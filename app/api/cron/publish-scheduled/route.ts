import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { scheduledPosts, connectedSites } from "@/lib/db/schema"
import { eq, lte, and } from "drizzle-orm"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  // Verify authorization — CRON_SECRET must be set and header must match
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 })
  }
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const today = new Date().toISOString().split("T")[0]

  // Get all scheduled posts where scheduledDate <= today and status = 'scheduled'
  // We need to query across all users, so no userId filter here
  const duePosts = await db
    .select()
    .from(scheduledPosts)
    .where(and(lte(scheduledPosts.scheduledDate, today), eq(scheduledPosts.status, "scheduled")))

  const processed: Array<{ id: string; keyword: string; status: string; error?: string }> = []
  const errors: Array<{ id: string; keyword: string; error: string }> = []

  // Track which users had posts published this run (to check if we need to re-schedule)
  const userPublishedCounts: Record<string, number> = {}

  // Cache site profiles per userId to avoid repeated DB queries
  const siteProfileCache: Record<string, { niche?: string; targetAudience?: string } | null> = {}

  for (const post of duePosts) {
    try {
      // Mark as generating
      await db
        .update(scheduledPosts)
        .set({ status: "generating" })
        .where(eq(scheduledPosts.id, post.id))

      // Fetch site profile for this user (cached)
      if (!(post.userId in siteProfileCache)) {
        const userSites = await db
          .select()
          .from(connectedSites)
          .where(eq(connectedSites.userId, post.userId))
        const defaultSite = userSites.find((s) => s.isDefault) ?? userSites[0]
        const rawProfile = defaultSite?.siteProfile as { niche?: string; targetAudience?: string } | null | undefined
        siteProfileCache[post.userId] = rawProfile ?? null
      }

      const siteProfile = siteProfileCache[post.userId]
      const siteContext = siteProfile?.niche
        ? { niche: siteProfile.niche, targetAudience: siteProfile.targetAudience }
        : undefined

      // Generate article (internal call — pass secret to bypass user session check)
      const genRes = await fetch(`${baseUrl}/api/seo/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": cronSecret,
        },
        body: JSON.stringify({ keyword: post.keyword, language: post.language, tone: post.tone, siteContext }),
      })

      if (!genRes.ok) {
        const err = (await genRes.json()) as { error?: string }
        throw new Error(err.error ?? "Failed to generate article")
      }

      const article = (await genRes.json()) as {
        keyword: string
        title: string
        content: string
        metaDescription: string
        keywords: string[]
      }

      // Save articleData and mark as published
      await db
        .update(scheduledPosts)
        .set({
          status: "published",
          articleData: article,
          publishedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id))

      processed.push({ id: post.id, keyword: post.keyword, status: "published" })

      // Track published count per user
      userPublishedCounts[post.userId] = (userPublishedCounts[post.userId] ?? 0) + 1
    } catch (err) {
      // Mark as failed
      await db
        .update(scheduledPosts)
        .set({ status: "failed" })
        .where(eq(scheduledPosts.id, post.id))

      const errMsg = err instanceof Error ? err.message : String(err)
      errors.push({ id: post.id, keyword: post.keyword, error: errMsg })
      processed.push({ id: post.id, keyword: post.keyword, status: "failed", error: errMsg })
    }
  }

  // After processing, check if any user has completed a 15-day cycle → reschedule next batch
  for (const userId of Object.keys(userPublishedCounts)) {
    try {
      const allPublished = await db
        .select({ id: scheduledPosts.id })
        .from(scheduledPosts)
        .where(and(eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "published")))

      const totalPublished = allPublished.length

      // If count is a multiple of 15 → schedule next 15 days
      if (totalPublished > 0 && totalPublished % 15 === 0) {
        // Find user's default connected site
        const sites = await db
          .select()
          .from(connectedSites)
          .where(eq(connectedSites.userId, userId))

        const defaultSite = sites.find((s) => s.isDefault) ?? sites[0]
        if (defaultSite) {
          // Call batch scheduling endpoint
          await fetch(`${baseUrl}/api/schedule/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteUrl: defaultSite.url }),
          })
        }
      }
    } catch {
      // Non-fatal: don't block the response if auto-reschedule fails
    }
  }

  return NextResponse.json({
    date: today,
    processed: processed.length,
    results: processed,
    errors,
  })
}
