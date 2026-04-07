import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const siteSlug = searchParams.get("siteSlug")
  if (!siteSlug) return NextResponse.json({ posts: [] })

  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.siteSlug, siteSlug))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(50)

  return NextResponse.json({ posts })
}
