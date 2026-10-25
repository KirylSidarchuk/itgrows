import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { parseRobots, rulesFor, sitemapsIn, verdict } from "@/lib/robots"
import { sendOwner } from "@/lib/telegram"

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

// Robots.txt, sitemaps and a content page are read as ourselves first: some hosts' bot filters
// (SiteGround) drop a browser user agent coming from a data centre but let an honest named one through.
// If the site refuses that, the browser one is tried, so a site that only serves browsers still counts.
const SITE_UA = "ItGrowsCheck/1.0 (+https://www.itgrows.ai/business)"
async function grabFile(url: string, ms = 9000) {
  const first = await grab(url, SITE_UA, ms)
  return first.status === 200 ? first : await grab(url, HUMAN_UA, ms)
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

// Children of a sitemap index, content first. An index lists product, category and blog
// sitemaps in whatever order it likes, and reading the first three off the top is how a site with
// thousands of articles gets reported as having none.
const CONTENT_SITEMAP = /(blog|post|article|guide|resource|learn|help|news|insight|knowledge|faq)/i

function pickChildren(children: string[], limit: number): string[] {
  const content = children.filter((c) => CONTENT_SITEMAP.test(c))
  const rest = children.filter((c) => !CONTENT_SITEMAP.test(c))
  return [...content, ...rest].slice(0, limit)
}

// A page that answers a question is the unit an assistant quotes. Recognised from the slug: a
// leading question word, a comparison, or an explicit guide. Opaque URLs will not match, so this
// floors rather than estimates — the same rule the page count follows.
const ANSWER_SLUG =
  /(^|\/)((how|what|why|when|where|which|who|can|does|do|is|are|should)[-_]|.*[-_]vs[-_]|.*[-_](guide|checklist|faq|explained|examples?)(\/|$|\.))/i

function countAnswers(locs: string[]): number {
  return locs.filter((u) => {
    try {
      const p = new URL(u).pathname
      return p !== "/" && ANSWER_SLUG.test(p)
    } catch {
      return false
    }
  }).length
}

// How often the site actually publishes, from <lastmod>. A site that rebuilds its whole sitemap
// on every deploy stamps every URL with today's date; reporting that as a publishing rate would
// be inventing a number, so it returns null instead.
function cadencePerMonth(xml: string): number | null {
  const dates = [...xml.matchAll(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/g)]
    .map((m) => Date.parse(m[1]))
    .filter((t) => !Number.isNaN(t))
  if (dates.length < 8) return null

  const now = Date.now()
  const DAY = 86400000
  const sameWeek = dates.filter((t) => now - t < 7 * DAY).length
  if (sameWeek / dates.length > 0.8) return null

  const inWindow = dates.filter((t) => now - t < 180 * DAY).length
  return Math.round((inWindow / 6) * 10) / 10
}

// One fetch, the sitemap only — enough to say how much a competitor has and how fast it grows.
async function rivalSurface(raw: string) {
  const target = normalise(raw)
  if (!target) return null
  const origin = `${target.protocol}//${target.hostname}`

  const first = await grabFile(`${origin}/sitemap.xml`, 10000)
  if (first.status !== 200 || !/<loc>/.test(first.text)) return null

  let xml = first.text
  let locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
  let urlCount = locs.length

  let partial = false
  if (/<sitemapindex/i.test(xml)) {
    const children = pickChildren(locs, 6)
    partial = children.length < locs.length
    const bodies = await Promise.all(children.map(async (c) => (await grabFile(c, 8000)).text))
    xml = bodies.join("\n")
    locs = bodies.flatMap((b) => [...b.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]))
    urlCount = locs.length
  }

  return {
    site: target.hostname,
    urlCount,
    answerPages: countAnswers(locs),
    perMonth: cadencePerMonth(xml),
    partial,
  }
}

// /business runs this audit beside the AI check, which already pings the owner; the crawler
// checker page runs only this one, so only its runs are reported.
const fromCrawlerChecker = (req: NextRequest) => (req.headers.get("referer") ?? "").includes("/ai-crawler-checker")

export async function POST(req: NextRequest) {
  let body: { url?: string; competitor?: string }
  try {
    body = (await req.json()) as { url?: string; competitor?: string }
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
  // Kicked off here so the competitor's sitemaps are fetched alongside ours rather than after
  // them. A competitor that fails to resolve must not take the caller's own result down with it.
  const rivalPromise = body.competitor
    ? rivalSurface(String(body.competitor)).catch(() => null)
    : Promise.resolve(null)

  const [robotsRes, homeHuman, sitemapRes, llmsStatus, ...botStatusValues] = await Promise.all([
    grabFile(`${origin}/robots.txt`, 7000),
    grab(origin, HUMAN_UA, 9000),
    grabFile(`${origin}/sitemap.xml`, 12000),
    statusOnly(`${origin}/llms.txt`, SITE_UA, 6000).then((st) => (st === 200 ? st : statusOnly(`${origin}/llms.txt`, HUMAN_UA, 6000))),
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
    if (fromCrawlerChecker(req)) void sendOwner(`🕷 Проверка AI-краулеров: ${target.hostname} — сайт не ответил`)
    return NextResponse.json({ site: target.hostname, unreachable: true })
  }

  // Count URLs. A sitemap index points at more sitemaps, so follow one level to avoid reporting
  // "3 pages" for a site that has thirty thousand.
  let urlCount = (sitemapRes.text.match(/<loc>/g) ?? []).length
  let sitemapKind: "none" | "urlset" | "index" = "none"
  let partial = false
  let locs = [...sitemapRes.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
  // Every sitemap already accounted for, so one named again in robots.txt is not read twice.
  const openedMaps = [`${origin}/sitemap.xml`]
  if (sitemapRes.status === 200 && urlCount > 0) {
    sitemapKind = /<sitemapindex/i.test(sitemapRes.text) ? "index" : "urlset"
    if (sitemapKind === "index") {
      openedMaps.push(...locs)
      const children = pickChildren(locs, 6)
      partial = children.length < locs.length
      const bodies = await Promise.all(children.map(async (c) => (await grabFile(c, 8000)).text))
      // Only the sitemaps we opened are counted, so this is a floor, never an estimate. The UI
      // renders it with a "≥" for exactly that reason.
      urlCount = bodies.reduce((a, b) => a + (b.match(/<loc>/g) ?? []).length, 0)
      locs = bodies.flatMap((b) => [...b.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]))
    }
  }

  // Sitemaps declared in robots.txt besides /sitemap.xml. WordPress plugins name them page-sitemap.xml,
  // post-sitemap.xml and so on, and many sites keep their articles in a second one (magiscan.app: the
  // site in /sitemap.xml, the blog in /blog-sitemap.xml). Read them as well, not only when /sitemap.xml
  // is missing, or the articles never count and the site reads as having nothing to quote.
  if (robotsRes.status === 200) {
    const key = (u: string) => u.trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "").toLowerCase()
    const opened = new Set(openedMaps.map(key))
    const declared = sitemapsIn(robotsRes.text).filter((u) => !opened.has(key(u))).slice(0, 6)
    if (declared.length) {
      const bodies = await Promise.all(declared.map(async (u) => (await grabFile(u, 8000)).text))
      const firstLevel = bodies.flatMap((b) => [...b.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]))
      const nested = firstLevel.filter((u) => /\.xml($|\?)/i.test(u) && !opened.has(key(u)))
      let found = firstLevel.filter((u) => !/\.xml($|\?)/i.test(u))
      if (nested.length) {
        const picked = pickChildren(nested, 6)
        if (picked.length < nested.length) partial = true
        const more = await Promise.all(picked.map(async (c) => (await grabFile(c, 8000)).text))
        found = [...found, ...more.flatMap((b) => [...b.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]))]
      }
      if (found.length) {
        // One address listed in two sitemaps is still one page.
        const before = new Set(locs.filter((u) => !/\.xml($|\?)/i.test(u)))
        const merged = [...new Set([...before, ...found])]
        // A partly opened index stays a floor and gains only the new pages; otherwise the merged list is the count.
        urlCount = partial ? urlCount + (merged.length - before.size) : merged.length
        locs = merged
        if (sitemapKind === "none") sitemapKind = nested.length ? "index" : "urlset"
      }
    }
  }

  const answerPages = countAnswers(locs)

  // Which of the site's own pages each crawler may fetch. A rule like "Disallow: /b" closes /blog
  // and /business too; this finds such rules by testing real URLs, not by reading the rules.
  const groups = robotsRes.status === 200 ? parseRobots(robotsRes.text) : []
  const sampleUrls = [origin + "/", ...locs.filter((u) => !/\.xml($|\?)/i.test(u)).slice(0, 400)]
  const PATH_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Googlebot", "Bingbot"]
  const pathBlocks = PATH_BOTS.map((bot) => {
    const rules = rulesFor(groups, bot)
    const blocked: { url: string; rule: string }[] = []
    for (const u of sampleUrls) {
      try {
        const p = new URL(u)
        const v = verdict(rules, p.pathname + p.search)
        if (!v.allowed) blocked.push({ url: u, rule: `Disallow: ${v.rule?.path ?? ""}` })
      } catch {
        // not a URL; skip
      }
    }
    const byRule = new Map<string, number>()
    for (const b of blocked) byRule.set(b.rule, (byRule.get(b.rule) ?? 0) + 1)
    return {
      bot,
      checked: sampleUrls.length,
      blocked: blocked.length,
      rules: [...byRule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([rule, count]) => ({ rule, count })),
      examples: blocked.slice(0, 3).map((b) => b.url),
    }
  })

  // JSON-LD on the homepage is a weak signal — marketing homepages often have none while every
  // article has plenty. Sample a real content URL from the sitemap too.
  const contentUrl = [...sitemapRes.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => m[1])
    .find((u) => !/\.xml($|\?)/i.test(u) && u.replace(origin, "").split("/").filter(Boolean).length >= 1)

  const contentPage = contentUrl ? await grabFile(contentUrl, 9000) : null
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

  const rival = await rivalPromise

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
    surface: { urlCount, sitemapKind, isFloor: partial, answerPages, partial },
    rival,
    llmsTxt: llmsStatus === 200,
    pathBlocks,
    structuredData: { count: jsonLdTypes.length, types: uniqueTypes },
    serverRenderedWords: textOnly.split(" ").filter(Boolean).length,
  }

  await db
    .execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('geo_audit', '/business', ${JSON.stringify({
        site: result.site,
        urlCount: result.surface.urlCount,
        answerPages: result.surface.answerPages,
        llmsTxt: result.llmsTxt,
        blocked: result.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
      })}::jsonb)`)
    .catch(() => {})

  if (fromCrawlerChecker(req)) {
    const shut = [
      ...new Set([
        ...result.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
        ...result.liveFetch.filter((f) => f.blocked).map((f) => f.bot),
      ]),
    ]
    void sendOwner(`🕷 Проверка AI-краулеров: ${result.site} — ${shut.length ? `закрыт для ${shut.join(", ")}` : "краулеров пускает"}`)
  }

  return NextResponse.json(result)
}
