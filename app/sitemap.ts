import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import type { MetadataRoute } from "next"

// Always reflect the DB so cron-published posts hit the sitemap immediately
// (without a revalidate this renders once at build and new posts never appear).
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only OUR marketing posts (siteSlug="itgrows") belong in itgrows.ai's sitemap —
  // client-site posts live under their own domains, not here.
  const posts = await db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.siteSlug, "itgrows"))
    .orderBy(desc(blogPosts.publishedAt))

  // Every public marketing page belongs here. Only the home page and the blog index were
  // declared, so pages that exist and are perfectly crawlable — the company-page offer, the
  // per-audience landings, the case studies — were left for a crawler to stumble upon.
  // Deliberately absent: /aso (marked noindex in its own metadata), /b (an A/B redirect to /),
  // and the authenticated areas.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://www.itgrows.ai", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.itgrows.ai/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://www.itgrows.ai/company", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/personal", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.itgrows.ai/business", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.itgrows.ai/forcompanies", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.itgrows.ai/case-studies", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.itgrows.ai/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.itgrows.ai/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://www.itgrows.ai/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
