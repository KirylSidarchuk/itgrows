import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"

// /llms.txt — the emerging convention for telling an assistant what a site is and where its
// substance lives, in one fetch, without it having to infer any of that from marketing pages.
// Generated from the database so newly published articles appear the day they go live.

const BASE = "https://www.itgrows.ai"

// Must run per request: a prerendered response is served from the CDN and never
// reaches the server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

export async function GET() {
  void noteCrawler("/llms.txt")
  let articles: { slug: string; title: string | null }[] = []
  try {
    articles = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.siteSlug, "itgrows"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(100)
  } catch {
    // A database hiccup must not turn this into a 500 — serve the static part.
  }

  const list = articles
    .map((a) => `- [${a.title ?? a.slug}](${BASE}/blog/${a.slug}) — also as markdown: ${BASE}/blog/${a.slug}.md`)
    .join("\n")

  const body = `# itgrows.ai

> ItGrows writes and publishes LinkedIn and X posts in your own voice, on topics you choose. Built for founders, executives and consultants who are building their own authority while running everything else themselves.

## What it does

- You set the topics; the system drafts each post in your voice and publishes on your schedule.
- You approve or edit anything before it goes out — nothing publishes without you.
- Publishes to a LinkedIn personal profile, a LinkedIn Company Page, and X, via the official APIs.
- Generates an original image for every post.

## Pricing

- **Personal — $49/mo:** one platform account (LinkedIn or X).
- **Duo — $99/mo:** any two accounts.
- **All-in — $199/mo:** LinkedIn personal + Company Page + X personal + X company.
- 14-day free trial, no credit card required. Cancel any time.

## Discoverable content

- [${BASE}/sitemap.xml](${BASE}/sitemap.xml) — full URL list
- [${BASE}/blog](${BASE}/blog) — articles on LinkedIn authority, ghostwriting alternatives and thought-leadership content
- [${BASE}/company](${BASE}/company) — LinkedIn Company Page publishing
- [${BASE}/case-studies](${BASE}/case-studies) — customer outcomes

## Markdown alternates

Every article has a clean markdown version for LLM context at:
\`${BASE}/blog/{slug}.md\` — title, summary and body without navigation or markup.

## Articles

${list || `- see ${BASE}/blog`}

## Do not crawl (private)

- /cabinet/, /dashboard/, /personal/cabinet/, /business/dashboard/ — authenticated areas
- /login, /signup, /reset-password — auth flows
- /api/ — internal API

## Contact

kiryl@itgrows.ai
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
