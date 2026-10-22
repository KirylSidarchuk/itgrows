import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { eq, lte, and } from "drizzle-orm"
import { publishContext, publishScheduledPost, scheduleNextBatchIfEmpty, type ProcessedPost } from "@/lib/publish-post"
import { sendOwner } from "@/lib/telegram"

export const runtime = "nodejs"
export const maxDuration = 300

// Publishes every article whose day has come. Publishing one post lives in lib/publish-post.ts,
// shared with "Publish now" in the client's "Your articles", so both take exactly the same path.

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

  const today = new Date().toISOString().split("T")[0]

  const processed: ProcessedPost[] = []
  const errors: Array<{ id: string; keyword: string; error: string }> = []

  // Reset recently failed posts that haven't exceeded max attempts
  const failedPosts = await db
    .select()
    .from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.status, "failed"),
      lte(scheduledPosts.scheduledDate, today),
    ))

  for (const fp of failedPosts) {
    if ((fp.publishAttempts ?? 0) < 3) {
      await db.update(scheduledPosts)
        .set({ status: "scheduled", publishError: null })
        .where(eq(scheduledPosts.id, fp.id))
    }
  }

  // Get all scheduled posts where scheduledDate <= today and status = 'scheduled'
  // We need to query across all users, so no userId filter here
  // Query after reset so just-reset posts are included
  const duePosts = await db
    .select()
    .from(scheduledPosts)
    .where(and(lte(scheduledPosts.scheduledDate, today), eq(scheduledPosts.status, "scheduled")))

  // Track which users had posts published this run (to check if we need to re-schedule)
  const userPublishedCounts: Record<string, number> = {}

  // Site data is cached per userId inside the context, for the whole run.
  const ctx = publishContext(cronSecret)

  for (const post of duePosts) {
    const r = await publishScheduledPost(post, ctx)
    // Published or stopped by the client since the query above: not ours any more.
    if (!r.claimed) continue
    if (r.error) errors.push(r.error)
    processed.push(r.processed)
    // Track published count per user
    if (r.counted) userPublishedCounts[post.userId] = (userPublishedCounts[post.userId] ?? 0) + 1
  }

  // After processing, check if any user has no remaining scheduled posts → reschedule next batch
  for (const userId of Object.keys(userPublishedCounts)) {
    await scheduleNextBatchIfEmpty(userId, ctx)
  }

  if (errors.length > 0) {
    const errorList = errors.map(e => `• ${e.keyword}: ${e.error?.slice(0, 100)}`).join("\n")
    await sendOwner(`⚠️ SEO Blog publish-scheduled failed (${today}):\n${errorList}\n\nPublished: ${processed.length - errors.length}, Failed: ${errors.length}`)
  }

  return NextResponse.json({
    date: today,
    processed: processed.length,
    results: processed,
    errors,
  })
}
