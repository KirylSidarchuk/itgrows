import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"
import { htmlToMarkdown } from "@/lib/html-to-markdown"

// Markdown alternates for the AI-visibility guides, at /business/blog/{slug}.md — the article and
// nothing else, so an assistant spends its context on the argument instead of our navigation.

export const dynamic = "force-dynamic"

const BASE = "https://www.itgrows.ai"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  void noteCrawler(`/business/blog/${slug}.md`)

  const [post] = await db
    .select({
      title: blogPosts.title,
      content: blogPosts.content,
      metaDescription: blogPosts.metaDescription,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      redirectTo: blogPosts.redirectTo,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.siteSlug, "itgrows-business")))
    .limit(1)

  if (!post) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }
  if (post.redirectTo) {
    return Response.redirect(`${BASE}${post.redirectTo}.md`, 301)
  }

  const day = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "")
  const body = [
    `# ${post.title}`,
    post.metaDescription ? `\n> ${post.metaDescription}` : "",
    `\nPublished: ${day(post.publishedAt)}${post.updatedAt ? ` · Updated: ${day(post.updatedAt)}` : ""}`,
    `Source: ${BASE}/business/blog/${slug}`,
    "Publisher: ItGrows (https://www.itgrows.ai/business) — AI visibility for businesses",
    "\n---\n",
    htmlToMarkdown(post.content.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i, "")),
  ]
    .filter(Boolean)
    .join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  })
}
