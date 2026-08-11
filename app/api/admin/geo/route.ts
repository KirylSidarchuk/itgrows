import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// A readable page instead of raw JSON: the owner needs to check "are the answer engines
// visiting yet?" repeatedly and without help. Token-gated, read-only, no dependencies.
export const dynamic = "force-dynamic"

const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

function table(caption: string, cols: string[], data: Row[], keys: string[]) {
  const body = data.length
    ? data
        .map(
          (r) =>
            `<tr>${keys
              .map((k, i) => `<td${i ? ' class="n"' : ""}>${esc(r[k])}</td>`)
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${cols.length}" class="empty">nothing yet</td></tr>`
  return `<h2>${esc(caption)}</h2><table><thead><tr>${cols
    .map((c, i) => `<th${i ? ' class="n"' : ""}>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${body}</tbody></table>`
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return new Response("forbidden", { status: 403 })
  const days = Math.min(Math.max(Number(p.get("days") || 7), 1), 90)

  const crawlers = rows(await db.execute(sql`
    SELECT props->>'bot' AS bot, count(*)::int AS hits, count(DISTINCT path)::int AS urls,
           to_char(max(created_at),'MM-DD HH24:MI') AS last_seen
    FROM analytics_events
    WHERE event='crawler_hit' AND created_at > now() - interval '1 day' * ${days}
    GROUP BY 1 ORDER BY hits DESC`))

  const paths = rows(await db.execute(sql`
    SELECT path, count(*)::int AS hits, count(DISTINCT props->>'bot')::int AS bots
    FROM analytics_events
    WHERE event='crawler_hit' AND created_at > now() - interval '1 day' * ${days}
    GROUP BY 1 ORDER BY hits DESC LIMIT 25`))

  const daily = rows(await db.execute(sql`
    SELECT to_char(date_trunc('day', created_at),'MM-DD') AS day, count(*)::int AS hits,
           count(DISTINCT props->>'bot')::int AS bots
    FROM analytics_events
    WHERE event='crawler_hit' AND created_at > now() - interval '1 day' * ${days}
    GROUP BY 1 ORDER BY 1 DESC`))

  const total = crawlers.reduce((a, r) => a + Number(r.hits ?? 0), 0)

  const html = `<!doctype html><meta charset="utf-8"><title>GEO — itgrows</title>
<meta name="robots" content="noindex">
<style>
 body{font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;max-width:860px;margin:32px auto;padding:0 18px;color:#1b1916}
 h1{font-size:22px;margin:0 0 4px} h2{font-size:15px;margin:28px 0 8px;color:#555;font-weight:600}
 .sub{color:#777;font-size:13px;margin-bottom:22px}
 .big{font-size:34px;font-weight:700;letter-spacing:-.5px}
 table{border-collapse:collapse;width:100%;font-size:14px}
 th,td{padding:7px 10px;border-bottom:1px solid #eee;text-align:left}
 th{color:#888;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
 td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
 td:first-child{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
 .empty{color:#aaa;font-style:italic;text-align:center}
 .days a{margin-right:10px;color:#7c3aed;text-decoration:none}
 @media(prefers-color-scheme:dark){body{background:#15141a;color:#eee}th{color:#999}
  th,td{border-color:#2a2833}.sub,.empty{color:#888}h2{color:#aaa}}
</style>
<h1>Answer engines on itgrows.ai</h1>
<div class="sub">last ${days} days · <span class="days">${[1, 7, 30, 90]
    .map((d) => `<a href="?token=${TOKEN}&days=${d}">${d}d</a>`)
    .join("")}</span></div>
<div class="big">${total}</div><div class="sub">crawler fetches recorded</div>
${table("By crawler", ["Crawler", "Fetches", "URLs", "Last seen"], crawlers, ["bot", "hits", "urls", "last_seen"])}
${table("What they fetched", ["Path", "Fetches", "Crawlers"], paths, ["path", "hits", "bots"])}
${table("By day", ["Day", "Fetches", "Crawlers"], daily, ["day", "hits", "bots"])}
<p class="sub" style="margin-top:26px">Recorded server-side on the blog index, each article, the
markdown alternates and /llms.txt. Vercel exposes no request logs, so this is the only view we have.
A page served from cache never reaches the server — those routes render per request on purpose.</p>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })
}
