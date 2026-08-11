import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"

// Clean markdown alternates for every article, at /blog/{slug}.md
// An assistant fetching the HTML page has to carry a navigation bar, a cookie banner and a
// pricing footer through its context window before it reaches the argument. This serves the
// article and nothing else — the same technique our sister site uses, where the answer-engine
// crawlers now outnumber Googlebot by two orders of magnitude.

// Must run per request: a prerendered response is served from the CDN and never
// reaches the server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  void noteCrawler(`/blog/${slug}.md`)

  const [post] = await db
    .select({
      title: blogPosts.title,
      content: blogPosts.content,
      metaDescription: blogPosts.metaDescription,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.siteSlug, "itgrows")))
    .limit(1)

  if (!post) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const published = post.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 10)
    : ""

  const body = [
    `# ${post.title}`,
    post.metaDescription ? `\n> ${post.metaDescription}` : "",
    published ? `\nPublished: ${published}` : "",
    `Source: https://www.itgrows.ai/blog/${slug}`,
    "\n---\n",
    post.content,
  ]
    .filter(Boolean)
    .join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
