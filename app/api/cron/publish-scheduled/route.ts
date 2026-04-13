import { NextRequest, NextResponse } from "next/server"
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

  // Cache site data per userId to avoid repeated DB queries
  const siteCache: Record<string, typeof connectedSites.$inferSelect | null> = {}
  const siteProfileCache: Record<string, { niche?: string; targetAudience?: string } | null> = {}

  function generateSlug(t: string): string {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 8)
  }

  for (const post of duePosts) {
    try {
      // Mark as generating
      await db
        .update(scheduledPosts)
        .set({ status: "generating" })
        .where(eq(scheduledPosts.id, post.id))

      // Fetch site data for this user (cached)
      if (!(post.userId in siteCache)) {
        const userSites = await db
          .select()
          .from(connectedSites)
          .where(eq(connectedSites.userId, post.userId))
        const defaultSite = userSites.find((s) => s.isDefault) ?? userSites[0] ?? null
        siteCache[post.userId] = defaultSite
        const rawProfile = defaultSite?.siteProfile as { niche?: string; targetAudience?: string } | null | undefined
        siteProfileCache[post.userId] = rawProfile ?? null
      }

      const site = siteCache[post.userId]
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
        coverImageUrl?: string
      }

      // Publish to connected site (WordPress, etc.)
      // NOTE: itgrows_blog platform is for the itgrows.ai internal blog only — skip external API publish for it.
      if (site && site.platform !== "itgrows_blog") {
        let normalUrl = site.url.trim().replace(/\/$/, "")
        if (!normalUrl.startsWith("http")) normalUrl = "https://" + normalUrl

        let endpoint: string
        if (site.platform === "wordpress") {
          endpoint = `${normalUrl}/wp-json/itgrows/v1/publish`
        } else if (site.platform === "octobercms" || site.platform === "php") {
          endpoint = site.webhookUrl?.trim() || `${normalUrl}/itgrows-webhook.php`
        } else {
          endpoint = `${normalUrl}/api/itgrows-publish`
        }

        const wpPayload = site.platform === "octobercms" || site.platform === "php"
          ? { token: site.siteToken, title: article.title, content: article.content, metaDescription: article.metaDescription, slug: generateSlug(article.title), keywords: article.keywords ?? [], coverImageUrl: article.coverImageUrl ?? null }
          : { token: site.siteToken, title: article.title, content: article.content, metaDescription: article.metaDescription, keywords: article.keywords ?? [], coverImageUrl: article.coverImageUrl ?? null }

        let publishedUrl: string | null = null
        let externalPublishError: string | null = null
        try {
          const wpRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(wpPayload),
            signal: AbortSignal.timeout(20000),
          })
          if (wpRes.ok) {
            const wpData = (await wpRes.json()) as { url?: string }
            publishedUrl = wpData.url ?? null
          } else {
            const errText = await wpRes.text().catch(() => "")
            externalPublishError = `Remote returned ${wpRes.status}: ${errText}`.slice(0, 500)
          }
        } catch (fetchErr) {
          externalPublishError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        }

        if (externalPublishError) {
          // External publish failed — mark as failed and record error
          await db
            .update(scheduledPosts)
            .set({
              status: "failed",
              publishError: externalPublishError,
              publishAttempts: (post.publishAttempts ?? 0) + 1,
              articleData: article,
              ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
            })
            .where(eq(scheduledPosts.id, post.id))

          console.error(`[SEO Autopilot] External publish failed for post ${post.id}: ${externalPublishError}`)
          errors.push({ id: post.id, keyword: post.keyword, error: externalPublishError })
          processed.push({ id: post.id, keyword: post.keyword, status: "failed", error: externalPublishError })
          continue
        }

        // TODO: ping Google Indexing API after publishing
        // Requires a Google Service Account with the Indexing API enabled.
        // Set GOOGLE_INDEXING_SA_KEY env var (JSON string of service account credentials).
        // Endpoint: POST https://indexing.googleapis.com/v3/urlNotifications:publish
        // Body: { "url": publishedUrl, "type": "URL_UPDATED" }
        // For now, log the published URL so it's visible in Vercel logs.
        if (publishedUrl) {
          console.log(`[SEO Autopilot] Published: ${publishedUrl}`)
        }
      }

      // NOTE: Client articles must NOT be saved to blog_posts (itgrows.ai hosted blog).
      // blog_posts is only for itgrows.ai own content (platform === "itgrows_blog").

      // Save articleData and mark as published
      await db
        .update(scheduledPosts)
        .set({
          status: "published",
          articleData: article,
          publishedAt: new Date(),
          publishAttempts: (post.publishAttempts ?? 0) + 1,
          ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
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
            headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
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
