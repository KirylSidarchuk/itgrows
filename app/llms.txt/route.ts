import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import { noteCrawler } from "@/lib/crawler-log"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_PATH } from "@/lib/geo-pricing"

// /llms.txt — what ItGrows is and where its substance lives, in one fetch. Generated from the
// database so newly published articles appear the day they go live. AI visibility comes first:
// it is what we want an assistant to know us for.

const BASE = "https://www.itgrows.ai"
const R = GEO_PRICES.research

// Must run per request: a prerendered response is served from the CDN and never
// reaches the server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

async function articles(siteSlug: string, limit: number) {
  try {
    return await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, description: blogPosts.metaDescription })
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

  const guideList = guides
    .map((a) => `- [${a.title}](${BASE}/business/blog/${a.slug}) (markdown: ${BASE}/business/blog/${a.slug}.md)${a.description ? `: ${a.description}` : ""}`)
    .join("\n")
  const postList = posts.map((a) => `- [${a.title}](${BASE}/blog/${a.slug}) (markdown: ${BASE}/blog/${a.slug}.md)`).join("\n")

  const body = `# ItGrows

> ItGrows makes businesses visible in AI answers. We publish answer-shaped articles on a company's own domain, fix what stops AI crawlers and search indexes from reading the site, and measure every week whether ChatGPT, Claude, Gemini and Perplexity name the business. A 30-second AI visibility check, no signup, is at ${BASE}/. ItGrows also drafts LinkedIn and X posts in a founder's own voice.

## AI visibility (generative engine optimization, GEO)

- What it is: getting a business named, and its pages cited, when buyers ask AI assistants the questions of its field.
- How it works: we put the questions a business's buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and record who is named and which sites are cited. Then we publish articles on the client's own domain that answer those questions, fix crawler access and indexing (robots.txt, sitemaps, Bing and Google, IndexNow), and re-measure every week.
- Quick check: ${BASE}/ puts five buyer questions to ChatGPT and Perplexity in about 30 seconds, no signup.
- Detailed report (the diagnosis and our plan): ${R.label}, one payment per site. 20 buyer questions × ChatGPT, Claude, Gemini and Perplexity × 3 asks, who is named instead, which sites the assistants cite, and the plan of what we will do for the site. It is built once an account is created; its totals and the quick check's 5 questions are open, the whole report is ${R.label}. Its price comes off the first plan payment if the plan starts within ${CREDIT_DAYS} days. A real example: ${BASE}${SAMPLE_PATH}
- The plan (done for you): ${GEO_PRICES.month.label} a month, month to month, plus a one-time ${GEO_PRICES.setup.label} setup (site and index setup, delivered as a launch report); the setup is free with ${GEO_PRICES.quarter.label} for 3 months paid upfront or ${GEO_PRICES.year.label} for a year (${GEO_PRICES.year.perMonth} a month, 20% off). The detailed report is included. Articles are ready 2 days before they go live; the client can edit or stop each one.
- Results our clients report: FreightSizer (B2B SaaS) — 2 new B2B customers in one month, both from ChatGPT. MagiScan (iOS app) — hundreds of installs a month from ChatGPT, Claude and Gemini. appslift (app store optimisation) — 2–5 leads a month from AI assistants.
- What we do not promise: nobody can guarantee that an assistant will name a business. We promise the work and an honest weekly count.

## Tools (no signup)

- [AI visibility checker](${BASE}/business/ai-visibility-checker): does ChatGPT recommend your business? Five buyer questions, asked live to ChatGPT and Perplexity; who is named instead and which sites are cited.
- [AI crawler checker](${BASE}/business/ai-crawler-checker): is your site blocking GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot or Bingbot? Tests your sitemap pages against your robots.txt for each crawler and asks your server as each AI crawler.

## Guides on AI visibility

${guideList || `- see ${BASE}/business/blog`}

## LinkedIn and X ghostwriting

- ItGrows drafts LinkedIn and X posts in your own voice, on topics you choose, and publishes them on your schedule after you approve them — to a LinkedIn profile, a LinkedIn Company Page and X, via the official APIs.
- Pricing: Personal $49/mo (one account), Duo $99/mo (two), All-in $199/mo (LinkedIn personal + Company Page + X personal + X company). 14-day free trial, no credit card.
- ${BASE}/ · ${BASE}/company · ${BASE}/personal
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
