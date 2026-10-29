import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import type { MetadataRoute } from "next"
import { localizedSitemapEntries } from "@/lib/i18n/metadata"
import { guideAlternates } from "@/lib/geo-guides"

// Always reflect the DB so cron-published posts hit the sitemap immediately
// (without a revalidate this renders once at build and new posts never appear).
export const revalidate = 0

// The day each fixed page last changed, in one place: whoever changes a page moves its date here.
// lastmod is what search engines and /root/indexnow_submit.py (it sends the pages whose lastmod
// changed) go by, so a page edited without a new date here is not fetched again for the edit.
// One date covers all five languages of a localized page.
const PAGE_LASTMOD = {
  "/": "2026-10-26",
  "/personal": "2026-10-22",
  "/company": "2026-10-01",
  "/business/ai-visibility-checker": "2026-10-26",
  "/business/ai-crawler-checker": "2026-10-26",
  "/business/sample-report": "2026-10-26",
  "/about": "2026-10-26",
  "/reddit": "2026-10-14",
  "/privacy": "2026-10-29",
  "/terms": "2026-10-29",
} as const
// The day the page around every guide and /blog post last changed (26.10: the "AI visibility
// guides" block, "Keep reading" by topic, the "About ItGrows" box): a post is listed as modified on
// the later of that day and its own date, so the pages are fetched again with their new links.
const TEMPLATE_LASTMOD = "2026-10-26"

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
  const latestBlogPost = posts.reduce<Date>((m, p) => {
    const d = p.updatedAt ?? p.publishedAt
    return d > m ? d : m
  }, new Date("2026-10-22"))
  const latestGuide = businessPosts.reduce<Date>((m, p) => {
    const d = p.updatedAt ?? p.publishedAt
    return d > m ? d : m
  }, new Date("2026-10-21"))
  const D = (page: keyof typeof PAGE_LASTMOD) => new Date(PAGE_LASTMOD[page])
  const TEMPLATE = new Date(TEMPLATE_LASTMOD)
  const later = (d: Date) => (d > TEMPLATE ? d : TEMPLATE)
  // The public AI-visibility pages exist in five languages (lib/i18n): each language's address is
  // listed, and every entry carries the hreflang alternates of all five plus x-default (English).
  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedSitemapEntries("/", { lastModified: D("/"), changeFrequency: "weekly", priority: 1 }),
    { url: "https://www.itgrows.ai/personal", lastModified: D("/personal"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/blog", lastModified: later(latestBlogPost), changeFrequency: "daily", priority: 0.9 },
    { url: "https://www.itgrows.ai/company", lastModified: D("/company"), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.itgrows.ai/business/blog", lastModified: latestGuide, changeFrequency: "weekly", priority: 0.8 },
    ...localizedSitemapEntries("/business/ai-visibility-checker", { lastModified: D("/business/ai-visibility-checker"), changeFrequency: "weekly", priority: 0.9 }),
    ...localizedSitemapEntries("/business/ai-crawler-checker", { lastModified: D("/business/ai-crawler-checker"), changeFrequency: "weekly", priority: 0.9 }),
    ...localizedSitemapEntries("/business/sample-report", { lastModified: D("/business/sample-report"), changeFrequency: "monthly", priority: 0.6 }),
    ...localizedSitemapEntries("/about", { lastModified: D("/about"), changeFrequency: "monthly", priority: 0.6 }),
    { url: "https://www.itgrows.ai/reddit", lastModified: D("/reddit"), changeFrequency: "weekly", priority: 0.8 },
    ...businessPosts.map((post) => {
      // English <-> German versions of the same guide (lib/geo-guides.ts), as in the page's metadata.
      const languages = guideAlternates(post.slug)
      return {
        url: `https://www.itgrows.ai/business/blog/${post.slug}`,
        lastModified: later(post.updatedAt ?? post.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...(languages ? { alternates: { languages } } : {}),
      }
    }),
    { url: "https://www.itgrows.ai/privacy", lastModified: D("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.itgrows.ai/terms", lastModified: D("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://www.itgrows.ai/blog/${post.slug}`,
    lastModified: later(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
