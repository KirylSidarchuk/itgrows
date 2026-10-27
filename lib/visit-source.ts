import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

// Where a visitor came from, for the owner's Telegram lines (Kiryl, 27.10: "сорс добавь"). No cookie
// and nothing new is stored, so it works before and without a cookie choice:
// 1. the page that made the request: a same-origin Referer keeps its query string, so a check started
//    on /business?gad_source=1&gad_campaignid=… names the ad that brought the visitor;
// 2. failing that (the cabinet, the sign-in callback), the visit's landing page in our own analytics:
//    the latest entry page_view from the same browser in the last 3 hours. Matched by user agent only,
//    so it is marked "≈": two visitors with one browser build can be mixed up.

const CAMPAIGNS: Record<string, string> = { "24383134719": "владельцы", "24383133498": "подрядчик" }
// Landings that are a step inside a visit, not where it came from.
const NOT_A_SOURCE = /^(internal|accounts\.google\.com|checkout\.stripe\.com|(www\.)?itgrows\.ai)$/
const WINDOW_MS = 1500

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// Meta fills utm_content={{ad.name}} encoded twice: "ITG%2B%257C%2Bc2…" reads "ITG | c2 lawfirm | 4x5".
function adName(v: string) {
  let s = v
  for (let i = 0; i < 2; i++) {
    try {
      s = decodeURIComponent(s.replace(/\+/g, " "))
    } catch {
      break
    }
  }
  return s.replace(/^ITG \| /, "").replace(/ \| 4x5$/, "").slice(0, 60)
}

function fromParams(q: URLSearchParams): string | null {
  const utm = q.get("utm_source") ?? ""
  if (utm.startsWith("qa")) return "наш тест"
  if (q.get("gad_source") || q.get("gad_campaignid") || q.get("gclid") || q.get("gbraid") || q.get("wbraid")) {
    const c = CAMPAIGNS[q.get("gad_campaignid") ?? ""]
    return `Google реклама${c ? ` · ${c}` : ""}`
  }
  if (utm === "meta" || q.get("fbclid")) {
    const ad = q.get("utm_content")
    return `Meta реклама${ad ? ` · ${adName(ad)}` : ""}`
  }
  return utm ? `метка ${utm.slice(0, 40)}` : null
}

function fromReferrer(ref: string) {
  if (!ref || ref === "direct") return "прямой заход"
  if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(ref)) return "LinkedIn"
  if (/(^|\.)t\.me$|telegram\.org$/.test(ref)) return "Telegram"
  if (/(^|\.)(facebook\.com|instagram\.com)$/.test(ref)) return `Facebook/Instagram без метки · ${ref}`
  if (/(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(ref)) {
    return `ИИ-ассистент · ${ref}`
  }
  if (/^mail\.|\.mail\.|outlook\.|^mail\.ru$/.test(ref)) return `из письма · ${ref}`
  if (/(^|\.)google\.[a-z.]+$|(^|\.)bing\.com$|duckduckgo\.com$|(^|\.)yandex\.[a-z]+$/.test(ref)) return `поиск · ${ref}`
  return `ссылка · ${ref.slice(0, 60)}`
}

async function landing(ua: string): Promise<string | null> {
  const found = rows(
    await db.execute(sql`
      SELECT path, props FROM analytics_events
      WHERE event = 'page_view' AND props->>'entry' = 'true' AND user_agent = ${ua.slice(0, 300)}
        AND created_at > now() - interval '3 hours'
      ORDER BY created_at DESC LIMIT 20`)
  )
  for (const r of found) {
    const p = (r.props ?? {}) as Record<string, unknown>
    const ref = String(p.referrer ?? "")
    if (NOT_A_SOURCE.test(ref)) continue
    let q = new URLSearchParams()
    try {
      q = new URL(String(r.path ?? "/"), "https://www.itgrows.ai").searchParams
    } catch {}
    return `≈ ${fromParams(q) ?? fromReferrer(ref)}`
  }
  return null
}

/** One short line for an owner alert: "Google реклама · владельцы", "≈ LinkedIn", "неизвестно".
 *  Never throws and never takes more than WINDOW_MS, so an alert is never held up by it. */
export async function visitSource(h: Headers): Promise<string> {
  try {
    const u = new URL(h.get("referer") ?? "")
    if (/(^|\.)itgrows\.ai$/.test(u.hostname)) {
      const s = fromParams(u.searchParams)
      if (s) return s
    }
  } catch {}
  const ua = h.get("user-agent")
  if (!ua) return "неизвестно"
  try {
    const s = await Promise.race([landing(ua), new Promise<null>((r) => setTimeout(() => r(null), WINDOW_MS))])
    return s ?? "неизвестно"
  } catch {
    return "неизвестно"
  }
}
