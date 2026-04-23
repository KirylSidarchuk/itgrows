import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramPosts, instagramBriefs } from "@/lib/db/schema"
import { eq, and, lte, or, isNull } from "drizzle-orm"
import { generatePostImage } from "@/lib/linkedin-image"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000) // now + 3 hours

    // Find scheduled Instagram posts due within 3 hours that have no image
    const posts = await db
      .select()
      .from(instagramPosts)
      .where(
        and(
          eq(instagramPosts.status, "scheduled"),
          lte(instagramPosts.scheduledFor, windowEnd),
          or(
            isNull(instagramPosts.imageUrl),
            eq(instagramPosts.imageUrl, "")
          )
        )
      )

    let fixed = 0
    let failed = 0

    for (const post of posts) {
      // Try to get niche from instagramBriefs (userId is text in that table)
      const [brief] = await db
        .select({ niche: instagramBriefs.niche })
        .from(instagramBriefs)
        .where(eq(instagramBriefs.userId, post.userId))
        .limit(1)

      const niche = brief?.niche ?? "lifestyle"

      console.log(
        `[preflight-instagram] Generating image for post ${post.id} (user ${post.userId}, niche: ${niche})`
      )

      const imageUrl = await generatePostImage(post.content, niche)

      if (imageUrl) {
        await db
          .update(instagramPosts)
          .set({ imageUrl })
          .where(eq(instagramPosts.id, post.id))
        console.log(`[preflight-instagram] Image generated and saved for post ${post.id}`)
        fixed++
      } else {
        console.warn(
          `[preflight-instagram] Image generation failed for post ${post.id} — publish cron will handle`
        )
        failed++
      }
    }

    return NextResponse.json({ fixed, failed, total: posts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[preflight-instagram] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
