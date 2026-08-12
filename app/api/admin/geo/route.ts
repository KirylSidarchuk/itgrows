import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// One page that answers "how are the two sites doing" without opening a database client.
// Token-gated, read-only, no dependencies, renders in a phone browser.
export const dynamic = "force-dynamic"

const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

function table(caption: string, cols: string[], data: Row[], keys: string[], note?: string) {
  const body = data.length
    ? data.map((r) => `<tr>${keys.map((k, i) => `<td${i ? ' class="n"' : ""}>${esc(r[k])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}" class="empty">nothing yet</td></tr>`
  return `<h2>${esc(caption)}</h2>${note ? `<p class="note">${note}</p>` : ""}<table><thead><tr>${cols
    .map((c, i) => `<th${i ? ' class="n"' : ""}>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${body}</tbody></table>`
}

const num = (r: Row[], k = "n") => Number(r[0]?.[k] ?? 0)

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return new Response("forbidden", { status: 403 })
  const days = Math.min(Math.max(Number(p.get("days") || 7), 1), 90)
  const since = sql`now() - interval '1 day' * ${days}`

  const one = async (q: ReturnType<typeof sql>) => num(rows(await db.execute(q)))

  const [audits, leads, onboards, reportReqs, views, signups] = await Promise.all([
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='geo_audit' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='business_lead' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='onboard_sent' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='audit_report_request' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='page_view' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='signup' AND created_at > ${since}`),
  ])

  const auditedSites = rows(await db.execute(sql`
    SELECT props->>'site' AS site,
           count(*)::int AS checks,
           to_char(max(created_at),'MM-DD HH24:MI') AS last
    FROM analytics_events WHERE event='geo_audit' AND created_at > ${since}
    GROUP BY 1 ORDER BY 2 DESC, 3 DESC LIMIT 25`))

  const leadRows = rows(await db.execute(sql`
    SELECT to_char(created_at,'MM-DD HH24:MI') AS at,
           props->>'website' AS site, props->>'email' AS email
    FROM analytics_events WHERE event IN ('business_lead','audit_report_request')
    ORDER BY created_at DESC LIMIT 15`))

  // Two sources now: noteCrawler() on itgrows.ai pages, and the nginx ingest for hosted blogs.
  // Worth separating — one is our own marketing surface, the other is what a customer pays for.
  const crawlers = rows(await db.execute(sql`
    SELECT props->>'bot' AS bot,
           count(*)::int AS hits,
           count(*) FILTER (WHERE props->>'live'='true')::int AS live,
           coalesce(props->>'source','vercel') AS src,
           to_char(max(created_at),'MM-DD HH24:MI') AS last
    FROM analytics_events WHERE event='crawler_hit' AND created_at > ${since}
    GROUP BY 1,4 ORDER BY 2 DESC LIMIT 25`))

  const hosts = rows(await db.execute(sql`
    SELECT props->>'host' AS host, coalesce(props->>'site','—') AS client,
           count(*)::int AS hits,
           count(*) FILTER (WHERE props->>'live'='true')::int AS live
    FROM analytics_events
    WHERE event='crawler_hit' AND props->>'host' IS NOT NULL AND created_at > ${since}
    GROUP BY 1,2 ORDER BY 3 DESC LIMIT 15`))

  const blogs = rows(await db.execute(sql`
    SELECT site_slug AS site, count(*)::int AS articles,
           to_char(max(published_at),'MM-DD') AS latest
    FROM blog_posts GROUP BY 1 ORDER BY 2 DESC LIMIT 10`))

  const liveTotal = crawlers.reduce((a, r) => a + Number(r.live ?? 0), 0)
  const crawlTotal = crawlers.reduce((a, r) => a + Number(r.hits ?? 0), 0)

  const card = (v: string | number, l: string, hot = false) =>
    `<div class="card${hot ? " hot" : ""}"><div class="v">${v}</div><div class="l">${l}</div></div>`

  const html = `<!doctype html><meta charset="utf-8"><title>ItGrows status</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<style>
 body{font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;max-width:900px;margin:28px auto;padding:0 16px;color:#1b1916}
 h1{font-size:21px;margin:0 0 4px} h2{font-size:14px;margin:30px 0 6px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
 .sub{color:#777;font-size:13px;margin-bottom:18px}
 .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:8px}
 .card{background:#f6f5f4;border-radius:12px;padding:14px 12px;text-align:center}
 .card.hot{background:#f5f3ff;border:1px solid #ddd6fe}
 .card .v{font-size:26px;font-weight:800;letter-spacing:-.5px}
 .card .l{font-size:11px;color:#777;margin-top:2px;line-height:1.3}
 table{border-collapse:collapse;width:100%;font-size:14px}
 th,td{padding:7px 9px;border-bottom:1px solid #eee;text-align:left}
 th{color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
 td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
 td:first-child{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
 .empty{color:#aaa;font-style:italic;text-align:center}
 .note{color:#888;font-size:12px;margin:0 0 6px}
 .days a{margin-right:9px;color:#7c3aed;text-decoration:none;font-weight:600}
 @media(prefers-color-scheme:dark){body{background:#15141a;color:#eee}
  th{color:#888}th,td{border-color:#2a2833}.sub,.empty,.note{color:#888}h2{color:#aaa}
  .card{background:#1e1d25}.card.hot{background:#241f3a;border-color:#4c1d95}}
</style>
<h1>ItGrows status</h1>
<div class="sub">last ${days} days · <span class="days">${[1, 7, 30, 90]
    .map((d) => `<a href="?token=${TOKEN}&days=${d}">${d}d</a>`)
    .join("")}</span></div>

<h2>itgrows.ai/business</h2>
<div class="cards">
 ${card(audits, "free audits run", true)}
 ${card(reportReqs, "report requests")}
 ${card(leads, "access requests", true)}
 ${card(onboards, "proposals emailed")}
</div>

${table("Sites people checked", ["Domain", "Checks", "Last"], auditedSites, ["site", "checks", "last"])}
${table("Requests received", ["When", "Site", "Email"], leadRows, ["at", "site", "email"],
  "Both access requests and report requests, newest first.")}

<h2>itgrows.ai</h2>
<div class="cards">
 ${card(views, "page views")}
 ${card(signups, "signups")}
 ${card(crawlTotal, "crawler fetches")}
 ${card(liveTotal, "live retrievals", true)}
</div>

${table("Answer engines", ["Crawler", "Fetches", "Live", "Source", "Last"], crawlers,
  ["bot", "hits", "live", "src", "last"],
  "<b>Live</b> means an assistant fetched a page while answering somebody, not indexing. <b>Source</b>: nginx = a hosted blog, vercel = our own pages.")}
${table("By domain", ["Host", "Client", "Fetches", "Live"], hosts, ["host", "client", "hits", "live"])}
${table("Articles published", ["Blog", "Articles", "Latest"], blogs, ["site", "articles", "latest"],
  "All time, not the selected window.")}

<p class="note" style="margin-top:24px">Crawler data on hosted blogs comes from the nginx ingest, which runs every 10 minutes.
Requests are stored before any email is attempted, so this list is complete even if a send failed.</p>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })
}
