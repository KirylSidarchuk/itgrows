import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// The audit that runs from nothing but a URL.
//
// We cannot see another site's server logs, so "did crawlers visit you" is unanswerable from
// outside and we do not pretend otherwise. What IS answerable is whether the answer engines are
// even allowed in, and whether there is enough there for them to come back for — which is the
// binding constraint far more often than markup is.
export const dynamic = "force-dynamic"
export const maxDuration = 30

const HUMAN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const BOT_UAS: Record<string, string> = {
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) PerplexityBot/1.0; +https://perplexity.ai/perplexitybot",
}

// This endpoint fetches a URL the caller chose, so it is an SSRF vector unless the target is
// constrained to public hosts. Reject anything that could reach our own network.
const PRIVATE_HOST =
  /^(localhost$|.*\.local$|.*\.internal$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i

function normalise(raw: string): URL | null {
  let s = (raw || "").trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = "https://" + s
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return null
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null
  if (PRIVATE_HOST.test(u.hostname)) return null
  if (!u.hostname.includes(".")) return null
  return u
}

async function grab(url: string, ua: string, ms = 9000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": ua, Accept: "*/*" },
    })
    // Cap the body: some sitemaps are enormous and we only need to count and sniff.
    const text = (await res.text()).slice(0, 400_000)
    return { status: res.status, text }
  } catch {
    return { status: 0, text: "" }
  } finally {
    clearTimeout(timer)
  }
}

async function statusOnly(url: string, ua: string, ms = 9000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": ua } })
    return res.status
  } catch {
    return 0
  } finally {
    clearTimeout(timer)
  }
}

// robots.txt is a sequence of groups: one or more User-agent lines, then rules that apply to them.
// A naive "grep the next 5 lines" reading gets multi-agent groups wrong, so parse the groups.
function robotsVerdict(robots: string, bot: string): "blocked" | "allowed" | "wildcard" | "none" {
  if (!robots.trim()) return "none"
  const lines = robots.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim())

  const groups: { agents: string[]; disallows: string[] }[] = []
  let current: { agents: string[]; disallows: string[] } | null = null
  let lastWasAgent = false

  for (const line of lines) {
    const m = line.match(/^(user-agent|disallow|allow)\s*:\s*(.*)$/i)
    if (!m) continue
    const field = m[1].toLowerCase()
    const value = m[2].trim()

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallows: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else {
      if (!current) continue
      lastWasAgent = false
      if (field === "disallow" && value) current.disallows.push(value)
    }
  }

  const named = groups.find((g) => g.agents.includes(bot.toLowerCase()))
  if (named) return named.disallows.some((d) => d === "/") ? "blocked" : "allowed"

  const star = groups.find((g) => g.agents.includes("*"))
  if (star && star.disallows.some((d) => d === "/")) return "blocked"
  return star ? "wildcard" : "none"
}

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try {
    body = (await req.json()) as { url?: string }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const target = normalise(body.url ?? "")
  if (!target) {
    return NextResponse.json({ error: "That does not look like a public website address." }, { status: 400 })
  }

  const origin = `${target.protocol}//${target.host}`

  // Everything that does not depend on another response goes out at once — this runs inside a
  // serverless function with a hard ceiling, and sequential probes blow through it.
  const [robotsRes, homeHuman, sitemapRes, llmsStatus, ...botStatusValues] = await Promise.all([
    grab(`${origin}/robots.txt`, HUMAN_UA, 7000),
    grab(origin, HUMAN_UA, 9000),
    grab(`${origin}/sitemap.xml`, HUMAN_UA, 12000),
    statusOnly(`${origin}/llms.txt`, HUMAN_UA, 6000),
    // What the server actually does when the caller says it is a crawler. robots.txt is only a
    // request; a 403 here is a refusal, and plenty of sites refuse without their owner knowing.
    ...Object.values(BOT_UAS).map((ua) => statusOnly(origin, ua, 9000)),
  ])

  const botStatuses = Object.keys(BOT_UAS).map((name, i) => [name, botStatusValues[i] as number] as const)

  // A site that answers nothing at all is not a typo — it is usually bot protection refusing
  // anything that is not a residential browser. Telling the owner to "check the address" when the
  // address is right is both wrong and insulting, and it hides the most useful finding we have:
  // whatever refuses us refuses the answer engines the same way.
  const nothingAnswered =
    homeHuman.status === 0 &&
    robotsRes.status === 0 &&
    sitemapRes.status === 0 &&
    botStatuses.every(([, s]) => s === 0)

  if (nothingAnswered) {
    await db
      .execute(sql`
        INSERT INTO analytics_events (event, path, props)
        VALUES ('geo_audit', '/business', ${JSON.stringify({ site: target.hostname, unreachable: true })}::jsonb)`)
      .catch(() => {})
    return NextResponse.json({ site: target.hostname, unreachable: true })
  }

  // Count URLs. A sitemap index points at more sitemaps, so follow one level to avoid reporting
  // "3 pages" for a site that has thirty thousand.
  let urlCount = (sitemapRes.text.match(/<loc>/g) ?? []).length
  let sitemapKind: "none" | "urlset" | "index" = "none"
  if (sitemapRes.status === 200 && urlCount > 0) {
    sitemapKind = /<sitemapindex/i.test(sitemapRes.text) ? "index" : "urlset"
    if (sitemapKind === "index") {
      const children = [...sitemapRes.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]).slice(0, 3)
      const counts = await Promise.all(
        children.map(async (c) => ((await grab(c, HUMAN_UA, 8000)).text.match(/<loc>/g) ?? []).length)
      )
      // Only the sitemaps we opened are counted, so this is a floor, never an estimate. The UI
      // renders it with a "≥" for exactly that reason.
      urlCount = counts.reduce((a, b) => a + b, 0)
    }
  }

  // JSON-LD on the homepage is a weak signal — marketing homepages often have none while every
  // article has plenty. Sample a real content URL from the sitemap too.
  const contentUrl = [...sitemapRes.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => m[1])
    .find((u) => !/\.xml($|\?)/i.test(u) && u.replace(origin, "").split("/").filter(Boolean).length >= 1)

  const contentPage = contentUrl ? await grab(contentUrl, HUMAN_UA, 9000) : null
  const sample = contentPage?.text || homeHuman.text

  const jsonLdTypes = [...sample.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)].map((m) => m[1])
  const uniqueTypes = [...new Set(jsonLdTypes)].slice(0, 8)

  // How much of the page survives without JavaScript. Crawlers are poor at running it, so a page
  // whose body arrives nearly empty is one they cannot read whatever else it does right.
  const textOnly = sample
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const result = {
    site: target.hostname,
    unreachable: false,
    checkedUrl: contentUrl ?? origin,
    robots: {
      found: robotsRes.status === 200,
      bots: Object.keys(BOT_UAS).map((b) => ({ bot: b, verdict: robotsVerdict(robotsRes.text, b) })),
    },
    liveFetch: botStatuses.map(([bot, status]) => ({ bot, status, blocked: status === 403 || status === 401 })),
    humanStatus: homeHuman.status,
    surface: { urlCount, sitemapKind, isFloor: sitemapKind === "index" },
    llmsTxt: llmsStatus === 200,
    structuredData: { count: jsonLdTypes.length, types: uniqueTypes },
    serverRenderedWords: textOnly.split(" ").filter(Boolean).length,
  }

  await db
    .execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('geo_audit', '/business', ${JSON.stringify({
        site: result.site,
        urlCount: result.surface.urlCount,
        llmsTxt: result.llmsTxt,
        blocked: result.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
      })}::jsonb)`)
    .catch(() => {})

  return NextResponse.json(result)
}
