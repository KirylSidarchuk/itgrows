import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinPosts, linkedinBriefs } from "@/lib/db/schema"
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

    // Find scheduled posts due within 3 hours that have no image
    const posts = await db
      .select()
      .from(linkedinPosts)
      .where(
        and(
          eq(linkedinPosts.status, "scheduled"),
          lte(linkedinPosts.scheduledFor, windowEnd),
          or(
            isNull(linkedinPosts.imageUrl),
            eq(linkedinPosts.imageUrl, "")
          )
        )
      )

    let fixed = 0
    let failed = 0

    for (const post of posts) {
      const [brief] = await db
        .select({ niche: linkedinBriefs.niche })
        .from(linkedinBriefs)
        .where(eq(linkedinBriefs.userId, post.userId))
        .limit(1)

      const niche = brief?.niche ?? "business"

      console.log(`[preflight-images] Generating image for post ${post.id} (user ${post.userId}, niche: ${niche})`)

      const imageUrl = await generatePostImage(post.content, niche)

      if (imageUrl) {
        await db
          .update(linkedinPosts)
          .set({ imageUrl })
          .where(eq(linkedinPosts.id, post.id))
        console.log(`[preflight-images] Image generated and saved for post ${post.id}`)
        fixed++
      } else {
        console.warn(`[preflight-images] Image generation failed for post ${post.id} — publish cron will handle`)
        failed++
      }
    }

    return NextResponse.json({ fixed, failed, total: posts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[preflight-images] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
