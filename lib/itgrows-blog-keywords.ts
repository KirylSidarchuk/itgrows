// Buyer-intent keyword queue + site context for the itgrows.ai OWN marketing blog
// (siteSlug="itgrows"). Consumed by /api/cron/itgrows-blog, which feeds each keyword
// through the existing /api/seo/generate engine and stores the result as a blog_posts row.
//
// Cluster A — "ghostwriter replacement": the closest-to-purchase pain, aligned with the
// landing's "$2,500/mo ghostwriter" anchor. Add more clusters (automation how-to,
// agencies) here later; the cron publishes the first not-yet-used keyword each run.

export const ITGROWS_SITE_CONTEXT = {
  niche: "AI-powered LinkedIn and X (Twitter) content automation for personal branding",
  targetAudience:
    "founders, executives, and B2B professionals who want to build authority on LinkedIn without hiring a ghostwriter",
  productName: "ItGrows",
  brandMentions:
    "Naturally position ItGrows as the AI alternative to a $2,500/month LinkedIn ghostwriter: it writes posts in your own voice and auto-publishes to LinkedIn and X through LinkedIn's official, approved API, while you approve every post. Mention ItGrows 2-3 times only where it fits contextually — never force it. End with a clear, low-friction call to action to try ItGrows free (see your own posts generated in 30 seconds, no signup required).",
}

// Cluster A — "ghostwriter replacement" (highest buying intent, closest to purchase).
export const CLUSTER_A_KEYWORDS: string[] = [
  "how much does a linkedin ghostwriter cost",
  "linkedin ghostwriter alternative",
  "linkedin ghostwriter cost",
  "ai linkedin ghostwriter",
  "is a linkedin ghostwriter worth it",
  "linkedin ghostwriter vs ai tool",
  "linkedin ghostwriting services pricing",
  "cheaper alternative to a linkedin ghostwriter",
  "linkedin ghostwriter for founders",
  "linkedin ghostwriter for executives",
  "linkedin ghostwriter for ceos",
  "do you need a linkedin ghostwriter",
  "how to build authority on linkedin without a ghostwriter",
  "linkedin content agency vs ai tool",
  "automate linkedin thought leadership posts",
  "hire a linkedin ghostwriter or use ai",
]

// Cluster B — "automation / how-to" (DIY audience actively looking for a tool; more volume).
export const CLUSTER_B_KEYWORDS: string[] = [
  "how to automate linkedin posts",
  "ai linkedin post generator",
  "best ai tool for linkedin content",
  "how to schedule linkedin and x posts",
  "automate linkedin content creation",
  "ai tools for personal branding on linkedin",
  "how to post consistently on linkedin",
  "how to write linkedin posts faster with ai",
  "auto publish posts to linkedin and x",
  "linkedin content calendar automation",
  "ai tool to write posts in your own voice",
  "how to grow on linkedin without spending hours writing",
]

// Cluster C — "agencies / scale / white-label" (higher LTV; narrower segment).
export const CLUSTER_C_KEYWORDS: string[] = [
  "white label linkedin content service",
  "linkedin content for agency clients",
  "how to manage multiple linkedin company pages",
  "linkedin ghostwriting for agencies",
  "scale linkedin content for multiple clients",
  "ai social media tools for agencies",
  "manage client linkedin accounts at scale",
  "linkedin automation for agencies",
]

// The cron publishes the first not-yet-used keyword from this ordered queue:
// A (buy intent) first, then B (volume), then C (agencies).
export const BLOG_KEYWORD_QUEUE: string[] = [
  ...CLUSTER_A_KEYWORDS,
  ...CLUSTER_B_KEYWORDS,
  ...CLUSTER_C_KEYWORDS,
]
