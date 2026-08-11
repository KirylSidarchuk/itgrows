// Keyword series + site context for the ItGrows for Business blog (siteSlug="itgrows-business",
// served at /business/blog). Consumed by /api/cron/business-blog, which feeds one keyword per run
// through the existing /api/seo/generate engine.
//
// The target is a single question — "how do I get ChatGPT to talk about my business" — and every
// cluster below is a different way somebody phrases it on the way to asking it. Three runs a week
// for three months is roughly forty articles, which is the point: on our own logs the binding
// constraint on whether answer engines come back is how much there is to read, not how the markup
// is arranged. Forty interlinked pages is a body of work. Four is a brochure.

export const BUSINESS_SITE_CONTEXT = {
  niche: "generative engine optimisation (GEO) — making a company's website visible to AI assistants like ChatGPT, Claude, Perplexity and Gemini",
  targetAudience:
    "founders, marketing leads and website owners who have noticed that buyers now ask an AI assistant before they open a search engine, and want their business to be the one it names",
  productName: "ItGrows for Business",
  brandMentions:
    "Position ItGrows for Business as the service that writes and publishes research-grade articles to the customer's own domain, structured so answer engines can quote them, and then shows which engines actually crawled and retrieved them from the server log. Be concrete and never over-claim: nobody can guarantee a citation, no assistant sells placement, and we say so. Where it fits, point to the free check at https://www.itgrows.ai/business — a visitor enters their domain and sees whether the AI crawlers are even allowed in. Mention it 2-3 times only where it genuinely helps the reader.",
}

// Cluster 1 — the question itself, asked the way a business owner actually asks it.
// Highest intent, and the exact phrasing we want to own.
export const CLUSTER_CORE: string[] = [
  "how to get chatgpt to recommend your business",
  "how to make your website visible to ai assistants",
  "why doesn't chatgpt mention my company",
  "how to get your business cited by ai",
  "does chatgpt know about my business",
  "how to appear in ai search results",
  "how to get mentioned by perplexity",
  "how to show up in ai answers",
]

// Cluster 2 — mechanics. The reader has accepted the problem and wants to know how it works.
export const CLUSTER_MECHANICS: string[] = [
  "what is generative engine optimization",
  "geo vs seo what is the difference",
  "how do ai crawlers find your website",
  "what is llms.txt and do you need one",
  "how to allow gptbot in robots.txt",
  "how ai assistants choose which sources to cite",
  "schema markup for ai search",
  "does chatgpt read javascript websites",
  "how often do ai crawlers visit a website",
  "what is answer engine optimization",
]

// Cluster 3 — diagnosis. Somebody suspects they are invisible and is looking for a check.
// This is the cluster the free audit on /business answers directly.
export const CLUSTER_DIAGNOSIS: string[] = [
  "how to check if chatgpt can see your website",
  "is my website blocking ai crawlers",
  "how to tell if ai crawlers visit your site",
  "gptbot blocked by cloudflare how to fix",
  "why is my website invisible to ai search",
  "how to find ai crawlers in server logs",
  "should you block ai crawlers from your website",
  "chatgpt user agent list",
]

// Cluster 4 — decision. Comparing options, budgets and whether to buy at all.
export const CLUSTER_DECISION: string[] = [
  "how much does generative engine optimization cost",
  "geo agency vs seo agency",
  "are ai visibility services worth it",
  "can you pay to be recommended by chatgpt",
  "best way to get your brand mentioned by ai",
  "how long does it take to get cited by ai",
  "geo tools comparison",
]

// Cluster 5 — by audience. Long tail, and the cheapest way to widen crawlable surface.
export const CLUSTER_AUDIENCE: string[] = [
  "ai visibility for saas companies",
  "how consultants get cited by chatgpt",
  "generative engine optimization for professional services",
  "how law firms appear in ai answers",
  "ai visibility for ecommerce brands",
  "geo for b2b companies",
  "how agencies can offer ai visibility to clients",
  "ai search optimization for local business",
]

// Publication order. Deliberately not one cluster at a time: the core questions go out first so
// the cluster has something to point at, then each week mixes a mechanics or diagnosis piece with
// a long-tail one, so the site never looks like it is grinding through a keyword list.
export const BUSINESS_BLOG_QUEUE: string[] = [
  ...CLUSTER_CORE.slice(0, 3),
  ...CLUSTER_MECHANICS.slice(0, 2),
  ...CLUSTER_CORE.slice(3, 6),
  ...CLUSTER_DIAGNOSIS.slice(0, 3),
  ...CLUSTER_MECHANICS.slice(2, 5),
  ...CLUSTER_CORE.slice(6),
  ...CLUSTER_DECISION.slice(0, 3),
  ...CLUSTER_DIAGNOSIS.slice(3, 6),
  ...CLUSTER_AUDIENCE.slice(0, 3),
  ...CLUSTER_MECHANICS.slice(5, 8),
  ...CLUSTER_DECISION.slice(3, 5),
  ...CLUSTER_AUDIENCE.slice(3, 6),
  ...CLUSTER_DIAGNOSIS.slice(6),
  ...CLUSTER_MECHANICS.slice(8),
  ...CLUSTER_DECISION.slice(5),
  ...CLUSTER_AUDIENCE.slice(6),
]
