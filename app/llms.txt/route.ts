import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"
import { SAMPLE_PATH } from "@/lib/geo-pricing"
import { ENTITY_ONE_LINER } from "@/lib/entity"
import { llmsOrder } from "@/lib/geo-guides"

// /llms.txt — what ItGrows is and where its substance lives, in one fetch. Generated from the
// database so newly published articles appear the day they go live. AI visibility comes first:
// it is what we want an assistant to know us for.

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

  const body = `# ItGrows

> ${ENTITY_ONE_LINER} The quick check at ${BASE}/ is free and takes about 30 seconds.

## AI visibility (generative engine optimization, GEO)

- What it is: getting a business named, and its pages cited, when buyers ask AI assistants the questions of its field.
- How it works: we put the questions a business's buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and record who is named and which sites are cited. Then we publish articles on the client's own domain that answer those questions, fix what keeps AI crawlers and search indexes from reading the site, and re-measure every two weeks.
- Quick check (free): ${BASE}/ puts five buyer questions to ChatGPT and Perplexity in about 30 seconds, without an account; two answers show in full right away, all five once the visitor creates an account.
- Detailed report (the diagnosis and our plan): free once an account is created, one site per account. 20 buyer questions × ChatGPT, Claude, Gemini and Perplexity × 3 asks, every answer, who is named instead, which sites the assistants cite, and the plan of what we will do for the site; all of it is open. A real example: ${BASE}${SAMPLE_PATH}
- The plan (done for you): billed by the month, month to month, plus a one-time setup (site and index setup, delivered as a launch report); the setup is free with 3 months paid upfront or a year (20% off). The price is shown in the client's account after the free report, before any payment. The detailed report is included. Articles are ready 2 days before they go live; the client can edit or stop each one.
- What clients report: FreightSizer (B2B SaaS) — 2 new B2B customers in one month, both from ChatGPT. MagiScan (iOS app) — hundreds of installs a month from ChatGPT, Claude and Gemini.
- On our own products: appslift, our own app store optimisation agency — 2–5 leads a month from AI assistants. pickaclass.com, our own course marketplace — 1,918 fetches of its pages by the answer and search agents of ChatGPT and Perplexity in two weeks (its server log, 28 July – 11 August 2026).
- What we do not promise: nobody can guarantee that an assistant will name a business. We promise the work and an honest count every two weeks.

## Tools

- [AI visibility checker](${BASE}/business/ai-visibility-checker): does ChatGPT recommend your business? Five buyer questions, asked live to ChatGPT and Perplexity; who is named instead and which sites are cited. Free: two answers show in full right away, all five once you create an account.
- [AI crawler checker](${BASE}/business/ai-crawler-checker): is your site blocking GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot or Bingbot? Tests your sitemap pages against your robots.txt for each crawler and asks your server as each AI crawler. No account needed: the full result shows at once.

## Guides on AI visibility

${guideList || `- see ${BASE}/business/blog`}

## A separate product: LinkedIn and X ghostwriting

- ItGrows drafts LinkedIn and X posts in your own voice, on topics you choose, and publishes them on your schedule after you approve them — to a LinkedIn profile, a LinkedIn Company Page and X, via the official APIs.
- Pricing: Personal $49/mo (one account), Duo $99/mo (two), All-in $199/mo (LinkedIn personal + Company Page + X personal + X company). 14-day free trial, no credit card.
- ${BASE}/personal · ${BASE}/company
- Reddit planner (closed beta): ${BASE}/reddit

## Articles on LinkedIn, X and Reddit

${postList || `- see ${BASE}/blog`}

## Full URL list

- ${BASE}/sitemap.xml

## Do not crawl (private)

- /cabinet/, /dashboard/, /personal/cabinet/, /business/dashboard/, /reddit/app/ — authenticated areas
- /login, /signup, /reset-password — auth flows
- /api/ — internal API

## Contact

kiryl@itgrows.ai
`

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  })
}
