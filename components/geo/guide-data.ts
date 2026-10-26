import { unstable_cache } from "next/cache"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { MAIN_GUIDES, type GuideLang } from "@/lib/geo-guides"

export type GuideLink = { slug: string; title: string }

/** Titles of these guides that are live (not merged into another), in the order of `slugs`. */
export async function liveGuides(slugs: readonly string[]): Promise<GuideLink[]> {
  if (slugs.length === 0) return []
  const rows = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(and(eq(blogPosts.siteSlug, "itgrows-business"), isNull(blogPosts.redirectTo), inArray(blogPosts.slug, [...slugs])))
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  return slugs.flatMap((s) => bySlug.get(s) ?? [])
}

// An hour, as the home page's guides were cached before. The language is part of the cache key.
const cachedMain = unstable_cache(async (lang: GuideLang) => liveGuides(MAIN_GUIDES[lang]), ["geo-main-guides"], {
  revalidate: 3600,
})

/** The main guides of a language with their titles. A failed query gives none (and is not cached:
 *  it throws inside), so a database hiccup never breaks the page around them. */
export async function mainGuides(lang: GuideLang): Promise<GuideLink[]> {
  try {
    return await cachedMain(lang)
  } catch {
    return []
  }
}
