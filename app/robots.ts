import type { MetadataRoute } from "next"

// Private areas — kept in one place so every crawler rule below stays in step.
const PRIVATE = [
  "/api/",
  "/dashboard/",
  "/cabinet/",
  "/business/dashboard/",
  "/personal/cabinet/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/welcome",
  "/personal/welcome",
  "/subscribe-discount",
  "/aso",
  // Not "/b": robots rules are prefixes, and "/b" also closed /blog, /business and every
  // /business/blog article to every crawler from 11 Aug to 21 Oct 2026. /b only redirects to /.
  "/b$",
]

// The assistants people now ask instead of searching. A wildcard rule already permits them,
// but naming each one removes any ambiguity about consent — several of these crawlers look for
// their own user-agent before deciding, and being explicit is the difference between "not
// forbidden" and "invited". Measured on our sister site: ClaudeBot 489k requests, GPTBot 89k,
// Googlebot 1.1k — the answer engines are now the hungrier audience by two orders of magnitude.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "YouBot",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/blog/", "/blog/*"], disallow: PRIVATE },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/", "/blog/", "/blog/*"],
        disallow: PRIVATE,
      })),
    ],
    sitemap: "https://www.itgrows.ai/sitemap.xml",
    host: "https://www.itgrows.ai",
  }
}
