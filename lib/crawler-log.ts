import { headers } from "next/headers"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Crawler telemetry.
//
// On the sister site nginx logs answer this for free, and the answer was startling: ClaudeBot
// 489k requests against Googlebot's 1.1k. itgrows runs on Vercel, where we have no access to
// request logs at all, so we genuinely could not tell whether a single AI crawler had ever
// visited — which makes any GEO work unmeasurable, and unmeasurable work is how the last month
// was spent. This records bot visits into the events table we already query.
//
// Deliberately fire-and-forget and never awaited by the caller's render path: telemetry must
// not be able to slow down or break a page a crawler is trying to read.

const BOTS: [RegExp, string][] = [
  [/GPTBot/i, "GPTBot"],
  [/OAI-SearchBot/i, "OAI-SearchBot"],
  [/ChatGPT-User/i, "ChatGPT-User"],
  [/ClaudeBot/i, "ClaudeBot"],
  [/Claude-Web/i, "Claude-Web"],
  [/anthropic-ai/i, "anthropic-ai"],
  [/PerplexityBot/i, "PerplexityBot"],
  [/Perplexity-User/i, "Perplexity-User"],
  [/Google-Extended/i, "Google-Extended"],
  [/Googlebot/i, "Googlebot"],
  [/Bingbot/i, "Bingbot"],
  [/Applebot-Extended/i, "Applebot-Extended"],
  [/Applebot/i, "Applebot"],
  [/Amazonbot/i, "Amazonbot"],
  [/Bytespider/i, "Bytespider"],
  [/CCBot/i, "CCBot"],
  [/cohere-ai/i, "cohere-ai"],
  [/Meta-ExternalAgent/i, "Meta-ExternalAgent"],
  [/DuckAssistBot/i, "DuckAssistBot"],
  [/YouBot/i, "YouBot"],
  [/SemrushBot|AhrefsBot|MJ12bot|DotBot/i, "seo-tool"],
]

function identify(ua: string): string | null {
  for (const [re, name] of BOTS) if (re.test(ua)) return name
  return null
}

export async function noteCrawler(path: string): Promise<void> {
  try {
    const h = await headers()
    const ua = h.get("user-agent") ?? ""
    const bot = identify(ua)
    if (!bot) return

    void db
      .execute(sql`
        INSERT INTO analytics_events (event, path, props)
        VALUES ('crawler_hit', ${path.slice(0, 300)}, ${JSON.stringify({
          bot,
          ua: ua.slice(0, 200),
        })}::jsonb)`)
      .catch(() => {})
  } catch {
    // Never let telemetry surface as an error on a page a crawler is reading.
  }
}
