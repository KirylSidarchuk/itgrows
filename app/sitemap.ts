import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .orderBy(desc(blogPosts.publishedAt))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://www.itgrows.ai", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.itgrows.ai/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://www.itgrows.ai/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
