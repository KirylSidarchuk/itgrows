import { headers } from "next/headers"
import { after } from "next/server"
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

// First match wins. Claude-User and Claude-SearchBot are Anthropic's live-answer and search
// agents (ClaudeBot is its training crawler); without them a live read by Claude went unrecorded.
const BOTS: [RegExp, string][] = [
  [/GPTBot/i, "GPTBot"],
  [/OAI-SearchBot/i, "OAI-SearchBot"],
  [/ChatGPT-User/i, "ChatGPT-User"],
  [/Claude-User/i, "Claude-User"],
  [/Claude-SearchBot/i, "Claude-SearchBot"],
  [/ClaudeBot/i, "ClaudeBot"],
  [/Claude-Web/i, "Claude-Web"],
  [/anthropic-ai/i, "anthropic-ai"],
  [/PerplexityBot/i, "PerplexityBot"],
  [/Perplexity-User/i, "Perplexity-User"],
  [/Google-Extended/i, "Google-Extended"],
  [/Googlebot/i, "Googlebot"],
  [/GoogleOther/i, "GoogleOther"],
  [/Bingbot/i, "Bingbot"],
  [/Applebot-Extended/i, "Applebot-Extended"],
  [/Applebot/i, "Applebot"],
  [/Amazonbot/i, "Amazonbot"],
  [/Bytespider/i, "Bytespider"],
  [/CCBot/i, "CCBot"],
  [/cohere-ai/i, "cohere-ai"],
  [/Meta-ExternalAgent/i, "Meta-ExternalAgent"],
  [/Meta-ExternalFetcher/i, "Meta-ExternalFetcher"],
  [/MistralAI-User/i, "MistralAI-User"],
  [/DuckAssistBot/i, "DuckAssistBot"],
  [/YouBot/i, "YouBot"],
  [/SemrushBot|AhrefsBot|MJ12bot|DotBot/i, "seo-tool"],
]

function identify(ua: string): string | null {
  for (const [re, name] of BOTS) if (re.test(ua)) return name
  return null
}

// Our own visits (props.self): the VM that runs our checks, and our checker's agent string.
const SELF_IP = "136.114.136.34"
const SELF_UA = /ItGrowsCheck/i

// A crawler_hit that counts as an assistant's visit, for every count of them (app/api/admin/*): not a
// developer's coding agent (Claude Code says "claude-code" in its Claude-User agent string; it made 47
// of the 92 Claude-User visits from 27 Oct to 13 Nov 2026) and not our own checks (props.self, recorded
// since 13 Nov 2026).
export const COUNTED_VISIT = sql`coalesce(props->>'ua', '') NOT ILIKE '%claude-code%' AND coalesce(props->>'self', '') <> 'true'`

export async function noteCrawler(path: string, extra?: Record<string, string | boolean>): Promise<void> {
  try {
    const h = await headers()
    const ua = h.get("user-agent") ?? ""
    const bot = identify(ua)
    if (!bot) return
    // What it asked for (an agent that wants markdown says so in Accept) and whether it was us.
    const accept = (h.get("accept") ?? "").slice(0, 200)
    const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? ""
    const self = ip === SELF_IP || SELF_UA.test(ua)

    // after() is the documented way to do post-response work. A bare fire-and-forget promise is
    // killed the moment the serverless function returns its response, which is why the first
    // attempt at this recorded nothing at all.
    after(async () => {
      try {
        await db.execute(sql`
          INSERT INTO analytics_events (event, path, props)
          VALUES ('crawler_hit', ${path.slice(0, 300)}, ${JSON.stringify({
            bot,
            ua: ua.slice(0, 200),
            accept,
            ...(self ? { self: true } : {}),
            ...extra,
          })}::jsonb)`)
      } catch {}
    })
  } catch {
    // Never let telemetry surface as an error on a page a crawler is reading.
  }
}
