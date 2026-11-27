import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { createHmac } from "crypto"
import { vmAuthorized } from "@/lib/geo-check"

// Agent Analytics (ALG step 07, Kiryl 27 Nov 2026): what AI agents do on a site, counted on one basis for our own
// projects and, later, for clients. Four kinds of event, all in analytics_events with event "aa_<kind>" and the
// site in props.site:
//   bot      — an AI crawler or an assistant fetching a page live (user agent; server-side only: they run no JS);
//   referral — a person arriving from an assistant (referrer chatgpt.com, perplexity.ai, … or utm_source=<assistant>);
//   mcp      — a call to the site's MCP server or agent API;
//   checkout — a payment page opened from an agent's link (the Stripe session carries ai_source in its metadata).
// Browsers report referrals through /aa.js → POST /api/aa/collect (no key; the Origin must be the site). Servers
// report bots, MCP calls and checkouts through the same endpoint with the VM token. /api/aa/report sums a week.
// itgrows itself also has its older crawler_hit rows (lib/crawler-log.ts): the report counts both.

export const AA_SITES = ["itgrows.ai", "youmoir.com", "magiscan.app", "tarot.coffee", "sustain-impact.de", "pickaclass.com"] as const

// Other hosts of the same site, counted under its main host (sustain-impact.ai answers too; its main host is .de).
const AA_ALIASES: Record<string, string> = { "sustain-impact.ai": "sustain-impact.de" }

/** A host (or a subdomain of it) as the site it belongs to, aliases resolved: "www.sustain-impact.ai" -> "sustain-impact.de". */
export function aaHostSite(host: string): string {
  let h = host.toLowerCase().replace(/^www\./, "")
  for (const [alias, main] of Object.entries(AA_ALIASES)) if (h === alias || h.endsWith("." + alias)) h = h.slice(0, h.length - alias.length) + main
  return h
}

export function aaSite(v: unknown): string | null {
  const s = String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/:].*$/, "")
  const main = aaHostSite(s)
  return (AA_SITES as readonly string[]).includes(main) ? main : null
}

export type AaKind = "bot" | "referral" | "mcp" | "checkout"

// Assistants a person can arrive from: by referrer host, then by utm_source (ChatGPT adds utm_source=chatgpt.com).
const ASSISTANT_HOSTS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)claude\.ai$|(^|\.)anthropic\.com$/, "claude"],
  [/^gemini\.google\.com$|^bard\.google\.com$/, "gemini"],
  [/^copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, "copilot"],
  [/(^|\.)meta\.ai$/, "meta-ai"],
  [/(^|\.)grok\.com$|^x\.ai$/, "grok"],
  [/(^|\.)deepseek\.com$/, "deepseek"],
  [/(^|\.)you\.com$/, "you"],
  [/(^|\.)phind\.com$/, "phind"],
  [/(^|\.)mistral\.ai$/, "mistral"],
]
const ASSISTANT_UTM: [RegExp, string][] = [
  [/chatgpt|openai/i, "chatgpt"],
  [/perplexity/i, "perplexity"],
  [/claude|anthropic/i, "claude"],
  [/gemini|bard/i, "gemini"],
  [/copilot/i, "copilot"],
  [/meta-?ai/i, "meta-ai"],
  [/grok/i, "grok"],
  [/deepseek/i, "deepseek"],
]

export function assistantFrom(refHost: string, utmSource: string): string | null {
  const h = refHost.toLowerCase()
  for (const [re, name] of ASSISTANT_HOSTS) if (re.test(h)) return name
  for (const [re, name] of ASSISTANT_UTM) if (re.test(utmSource)) return name
  return null
}

const clip = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)

/** Store one event. Best-effort: telemetry never breaks the caller. */
export async function aaRecord(site: string, kind: AaKind, path: string, props: Record<string, unknown>, at?: Date): Promise<void> {
  try {
    const p = JSON.stringify({ site, ...props })
    if (at && !Number.isNaN(at.getTime())) {
      await db.execute(sql`INSERT INTO analytics_events (event, path, props, created_at) VALUES (${"aa_" + kind}, ${clip(path, 300)}, ${p}::jsonb, ${at.toISOString()}::timestamptz)`)
    } else {
      await db.execute(sql`INSERT INTO analytics_events (event, path, props) VALUES (${"aa_" + kind}, ${clip(path, 300)}, ${p}::jsonb)`)
    }
  } catch (e) {
    console.warn("[aa] record failed:", e instanceof Error ? e.message : e)
  }
}

export { clip as aaClip }

/** Who may send server events and read reports: the VM token, or the narrower ingest key derived from it
 *  (HMAC of "aa-ingest"), which is what the servers of our other projects hold (/root/secrets/aa_ingest_token).
 *  The key can only add and read agent counts; it opens nothing else. */
export function aaAuthorized(header: string | null): boolean {
  if (vmAuthorized(header)) return true
  const token = process.env.IMAGE_STORE_TOKEN ?? ""
  if (!token || !header?.startsWith("Bearer ")) return false
  const want = createHmac("sha256", token).update("aa-ingest").digest("hex")
  const given = header.slice(7).trim()
  if (given.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i)
  return diff === 0
}

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** A week (or `days`) of agent activity on one site, against the same number of days before. */
export async function aaReport(site: string, days = 7) {
  const d = Math.max(1, Math.min(90, Math.floor(days)))
  const q = async (s: ReturnType<typeof sql>) => rows(await db.execute(s))
  const window = (offset: number) => sql`created_at >= now() - make_interval(days => ${d * (offset + 1)}::int) AND created_at < now() - make_interval(days => ${d * offset}::int)`

  const byKey = async (kind: AaKind, key: string, offset: number) =>
    q(sql`SELECT coalesce(props->>${key}, '?') AS k, sum(coalesce((props->>'n')::int, 1))::int AS n
          FROM analytics_events WHERE event = ${"aa_" + kind} AND props->>'site' = ${site} AND ${window(offset)}
          GROUP BY 1 ORDER BY 2 DESC LIMIT 30`)

  // itgrows: its crawler_hit rows (recorded since Oct 2026 by lib/crawler-log.ts) count as bot visits too.
  const legacyBots = async (offset: number) =>
    site === "itgrows.ai"
      ? q(sql`SELECT coalesce(props->>'bot', '?') AS k, count(*)::int AS n FROM analytics_events
              WHERE event = 'crawler_hit' AND coalesce(props->>'ua', '') NOT ILIKE '%claude-code%' AND coalesce(props->>'self', '') <> 'true'
                AND ${window(offset)} GROUP BY 1 ORDER BY 2 DESC LIMIT 30`)
      : []

  const merge = (...lists: Row[][]) => {
    const m = new Map<string, number>()
    for (const l of lists) for (const r of l) m.set(String(r.k), (m.get(String(r.k)) ?? 0) + Number(r.n))
    return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]))
  }
  const total = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

  const [bots, botsPrev, lb, lbPrev, refs, refsPrev, mcp, mcpPrev, co, coPrev, pages] = await Promise.all([
    byKey("bot", "bot", 0),
    byKey("bot", "bot", 1),
    legacyBots(0),
    legacyBots(1),
    byKey("referral", "assistant", 0),
    byKey("referral", "assistant", 1),
    byKey("mcp", "tool", 0),
    byKey("mcp", "tool", 1),
    byKey("checkout", "assistant", 0),
    byKey("checkout", "assistant", 1),
    q(sql`SELECT path AS k, count(*)::int AS n FROM analytics_events WHERE event = 'aa_referral' AND props->>'site' = ${site} AND ${window(0)}
          GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
  ])
  const b = merge(bots, lb)
  const bp = merge(botsPrev, lbPrev)
  const r = merge(refs)
  const rp = merge(refsPrev)
  const m = merge(mcp)
  const mp = merge(mcpPrev)
  const c = merge(co)
  const cp = merge(coPrev)
  return {
    site,
    days: d,
    generated_at: new Date().toISOString(),
    bots: { total: total(b), previous: total(bp), by_bot: b },
    referrals: { total: total(r), previous: total(rp), by_assistant: r, top_pages: merge(pages) },
    mcp_calls: { total: total(m), previous: total(mp), by_tool: m },
    checkouts: { total: total(c), previous: total(cp), by_assistant: c },
    note: "Counts are events in the period against the same number of days before. Small numbers move a lot by chance: read a change as real only when it repeats.",
  }
}
