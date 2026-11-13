import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"
import { llmsText } from "@/lib/llms-text"
import { llmsOrder } from "@/lib/geo-guides"

// /llms.txt — what ItGrows is and where its substance lives, in one fetch. Generated from the
// database so newly published articles appear the day they go live. AI visibility comes first:
// it is what we want an assistant to know us for. The text, and the owner's decisions about it, are in
// lib/llms-text.ts (since 13 Nov 2026 the home page asked for as markdown says the same, app/home-md).

const BASE = "https://www.itgrows.ai"

// Must run per request: a prerendered response is served from the CDN and never
// reaches the server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

async function articles(siteSlug: string, limit: number) {
  try {
    return await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, description: blogPosts.metaDescription, lang: blogPosts.lang })
      .from(blogPosts)
      .where(and(eq(blogPosts.siteSlug, siteSlug), isNull(blogPosts.redirectTo)))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
  } catch {
    return [] // a database hiccup must not turn this into a 500 — serve the static part
  }
}

export async function GET() {
  void noteCrawler("/llms.txt")
  const [guides, posts] = await Promise.all([articles("itgrows-business", 200), articles("itgrows", 100)])

  // The main English guides first, then the other English ones, then the German ones (lib/geo-guides.ts).
  const guideLine = (a: (typeof guides)[number]) =>
    `- [${a.title}](${BASE}/business/blog/${a.slug}) (markdown: ${BASE}/business/blog/${a.slug}.md)${a.description ? `: ${a.description}` : ""}`
  const ordered = llmsOrder(guides)
  const enGuides = ordered.filter((a) => a.lang !== "de").map(guideLine).join("\n")
  const deGuides = ordered.filter((a) => a.lang === "de").map(guideLine).join("\n")
  const guideList = [enGuides, deGuides && `### In German (auf Deutsch)\n\n${deGuides}`].filter(Boolean).join("\n\n")
  const postList = posts.map((a) => `- [${a.title}](${BASE}/blog/${a.slug}) (markdown: ${BASE}/blog/${a.slug}.md)`).join("\n")

  const body = llmsText({ guides: guideList, posts: postList })

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  })
}
