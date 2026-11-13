import type { MetadataRoute } from "next"
import { PREFIXED } from "@/lib/i18n/config"

// robots.txt of www.itgrows.ai, served by app/robots.txt/route.ts. Until 13 Nov 2026 this was
// app/robots.ts, whose text Next writes itself and cannot give a Content-Signal line; the rules
// moved here unchanged, and robotsTxt() below writes them as Next did, plus that one line.

// Private areas — kept in one place so every crawler rule below stays in step.
const PRIVATE = [
  "/api/",
  "/dashboard/",
  "/cabinet/",
  "/business/dashboard/",
  "/personal/cabinet/",
  "/login",
  "/signup",
  // The same sign-in pages in the other languages (lib/i18n): robots rules are prefixes, and
  // "/login" does not cover "/de/login".
  ...PREFIXED.flatMap((l) => [`/${l}/login`, `/${l}/signup`]),
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
  "Claude-User",
  "Claude-SearchBot",
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
  "Meta-ExternalFetcher",
  "MistralAI-User",
  "DuckAssistBot",
  "YouBot",
]

// The article images (cover, og:image, the image in each Article's JSON-LD) are served from
// /api/blog/image/…, under the closed /api/. The longer Allow wins over "Disallow: /api/" (RFC 9309),
// in every group, so crawlers may fetch the images and nothing else under /api/.
const ALLOW = ["/", "/blog/", "/blog/*", "/api/blog/image/"]

export function robotsRules(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: PRIVATE },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: PRIVATE,
      })),
    ],
    sitemap: "https://www.itgrows.ai/sitemap.xml",
    // No "host": it is a Yandex directive that Bing's robots.txt tester reports as an error.
  }
}

// Content Signals (contentsignals.org): what the site's content may be used for. Yes to search
// results, to answers built from a page (ai-input) and to training (ai-train). Kiryl, 13 Nov 2026.
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes"

const list = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v])

// The text Next writes for robotsRules() (resolveRobots in next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js; scripts/i18n-check.ts compares the two), with Content-Signal right after
// "User-Agent: *". A crawler reads only the group that names it, so the line speaks to the crawlers
// not named in a group of their own.
export function robotsTxt(): string {
  const data = robotsRules()
  let out = ""
  for (const rule of list(data.rules)) {
    const agents = list(rule.userAgent || "*")
    for (const agent of agents) out += `User-Agent: ${agent}\n`
    if (agents.includes("*")) out += `Content-Signal: ${CONTENT_SIGNAL}\n`
    if (rule.allow) for (const item of list(rule.allow)) out += `Allow: ${item}\n`
    if (rule.disallow) for (const item of list(rule.disallow)) out += `Disallow: ${item}\n`
    if (rule.crawlDelay) out += `Crawl-delay: ${rule.crawlDelay}\n`
    out += "\n"
  }
  if (data.host) out += `Host: ${data.host}\n`
  if (data.sitemap) for (const item of list(data.sitemap)) out += `Sitemap: ${item}\n`
  return out
}
