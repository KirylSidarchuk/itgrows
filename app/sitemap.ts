import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import type { MetadataRoute } from "next"

// Always reflect the DB so cron-published posts hit the sitemap immediately
// (without a revalidate this renders once at build and new posts never appear).
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only OUR marketing posts (siteSlug="itgrows") belong in itgrows.ai's sitemap —
  // client-site posts live under their own domains, not here.
  const posts = await db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(and(eq(blogPosts.siteSlug, "itgrows"), isNull(blogPosts.redirectTo)))
    .orderBy(desc(blogPosts.publishedAt))

  const businessPosts = await db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(and(eq(blogPosts.siteSlug, "itgrows-business"), isNull(blogPosts.redirectTo)))
    .orderBy(desc(blogPosts.publishedAt))

  // Every public marketing page belongs here. Only the home page and the blog index were
  // declared, so pages that exist and are perfectly crawlable — the company-page offer, the
  // per-audience landings, the case studies — were left for a crawler to stumble upon.
  // Deliberately absent: /aso (marked noindex in its own metadata), /b (an A/B redirect to /personal),
  // and the authenticated areas.
  const latestBlog = posts[0]?.updatedAt ?? posts[0]?.publishedAt ?? new Date("2026-10-22")
  const latestGuide = businessPosts.reduce<Date>((m, p) => {
    const d = p.updatedAt ?? p.publishedAt
    return d > m ? d : m
  }, new Date("2026-10-21"))
  const D = (s: string) => new Date(s)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://www.itgrows.ai", lastModified: D("2026-10-22"), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.itgrows.ai/personal", lastModified: D("2026-10-22"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/blog", lastModified: latestBlog, changeFrequency: "daily", priority: 0.9 },
    { url: "https://www.itgrows.ai/company", lastModified: D("2026-10-01"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/business/blog", lastModified: latestGuide, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.itgrows.ai/business/ai-visibility-checker", lastModified: D("2026-10-21"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/business/ai-crawler-checker", lastModified: D("2026-10-21"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/about", lastModified: D("2026-10-22"), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.itgrows.ai/reddit", lastModified: D("2026-10-14"), changeFrequency: "weekly", priority: 0.8 },
    ...businessPosts.map((post) => ({
      url: `https://www.itgrows.ai/business/blog/${post.slug}`,
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: "https://www.itgrows.ai/privacy", lastModified: D("2026-07-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.itgrows.ai/terms", lastModified: D("2026-07-01"), changeFrequency: "yearly", priority: 0.3 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://www.itgrows.ai/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
