import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// One page that answers "how are the two sites doing" without opening a database client.
// Written to be read by someone who did not build it: every block says what question it answers,
// and every number is phrased as the thing a person did rather than the name of an event.
export const dynamic = "force-dynamic"

const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

// Domains checked while building and testing the audit. They are real rows and deleting them
// would be dishonest, but counting them as interest would be worse.
const TEST_DOMAINS = new Set([
  "hbr.org", "stripe.com", "notion.so", "mckinsey.com", "bcg.com", "shopify.com",
  "itgrows.ai", "www.itgrows.ai", "example.com", "blog.w-v.co.uk",
  // Our own properties and clients. Checking these is us looking at our own work, not demand.
  "appslift.com", "magiscan.app", "blog.magiscan.app", "pickaclass.com", "www.pickaclass.com",
  "learnflat.com", "walkself.com", "amazon.com",
])

function table(caption: string, question: string, cols: string[], data: Row[], keys: string[]) {
  const body = data.length
    ? data.map((r) => `<tr>${keys.map((k, i) => `<td${i ? ' class="n"' : ""}>${esc(r[k])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}" class="empty">nothing yet</td></tr>`
  return `<h2>${esc(caption)}</h2><p class="q">${question}</p><table><thead><tr>${cols
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

  const auditRows = rows(await db.execute(sql`
    SELECT props->>'site' AS site, count(*)::int AS checks,
           to_char(max(created_at),'MM-DD HH24:MI') AS last
    FROM analytics_events WHERE event='geo_audit' AND created_at > ${since}
    GROUP BY 1 ORDER BY 3 DESC LIMIT 40`))

  const realAudits = auditRows.filter((r) => !TEST_DOMAINS.has(String(r.site ?? "").toLowerCase()))
  const testCount = auditRows
    .filter((r) => TEST_DOMAINS.has(String(r.site ?? "").toLowerCase()))
    .reduce((a, r) => a + Number(r.checks ?? 0), 0)
  const realCount = realAudits.reduce((a, r) => a + Number(r.checks ?? 0), 0)

  const [leads, onboards, reportReqs, views, signups] = await Promise.all([
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='business_lead' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='onboard_sent' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='audit_report_request' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='page_view' AND created_at > ${since}`),
    one(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event='signup' AND created_at > ${since}`),
  ])

  const leadRows = rows(await db.execute(sql`
    SELECT to_char(created_at,'MM-DD HH24:MI') AS at,
           CASE WHEN event='business_lead' THEN 'wants to buy' ELSE 'wants the report' END AS kind,
           props->>'website' AS site, props->>'email' AS email
    FROM analytics_events WHERE event IN ('business_lead','audit_report_request')
    ORDER BY created_at DESC LIMIT 15`))

  const crawlers = rows(await db.execute(sql`
    SELECT props->>'bot' AS bot,
           count(*)::int AS hits,
           count(*) FILTER (WHERE props->>'live'='true')::int AS live,
           CASE WHEN props->>'source'='nginx' THEN 'client blog' ELSE 'our pages' END AS where_,
           to_char(max(created_at),'MM-DD HH24:MI') AS last
    FROM analytics_events WHERE event='crawler_hit' AND created_at > ${since}
    GROUP BY 1,4 ORDER BY 2 DESC LIMIT 25`))

  const hosts = rows(await db.execute(sql`
    SELECT props->>'host' AS host, coalesce(props->>'site','not a client') AS client,
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

  const step = (v: number, l: string, hot = false) =>
    `<div class="step${hot && v > 0 ? " hot" : ""}"><div class="v">${v}</div><div class="l">${l}</div></div>`

  const html = `<!doctype html><meta charset="utf-8"><title>ItGrows status</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<style>
 body{font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;max-width:900px;margin:26px auto;padding:0 16px;color:#1b1916}
 h1{font-size:21px;margin:0 0 4px}
 h2{font-size:15px;margin:32px 0 2px;font-weight:800}
 .q{color:#888;font-size:12.5px;margin:0 0 10px}
 .sub{color:#777;font-size:13px;margin-bottom:20px}
 .funnel{display:flex;align-items:stretch;gap:0;flex-wrap:wrap;margin-bottom:6px}
 .step{flex:1;min-width:118px;background:#f6f5f4;border-radius:12px;padding:14px 10px;text-align:center;position:relative}
 .step.hot{background:#f5f3ff;border:1px solid #ddd6fe}
 .step .v{font-size:28px;font-weight:800;letter-spacing:-.5px}
 .step .l{font-size:11.5px;color:#666;margin-top:3px;line-height:1.35}
 .arrow{display:flex;align-items:center;color:#c4b5fd;font-size:20px;padding:0 6px}
 table{border-collapse:collapse;width:100%;font-size:14px}
 th,td{padding:7px 9px;border-bottom:1px solid #eee;text-align:left}
 th{color:#999;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
 td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
 td:first-child{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
 .empty{color:#aaa;font-style:italic;text-align:center}
 .days a{margin-right:9px;color:#7c3aed;text-decoration:none;font-weight:600}
 .foot{color:#888;font-size:12px;margin-top:8px}
 @media(prefers-color-scheme:dark){body{background:#15141a;color:#eee}
  th{color:#888}th,td{border-color:#2a2833}.sub,.empty,.q,.foot{color:#888}
  .step{background:#1e1d25}.step.hot{background:#241f3a;border-color:#4c1d95}}
</style>
<h1>ItGrows status</h1>
<div class="sub">last ${days} days · <span class="days">${[1, 7, 30, 90]
    .map((d) => `<a href="?token=${TOKEN}&days=${d}">${d}d</a>`)
    .join("")}</span></div>

<h2>The $499 product — /business</h2>
<p class="q">Left to right is the funnel. Each number is what a stranger did, in order.</p>
<div class="funnel">
 ${step(realCount, "put their domain in the free check")}
 <div class="arrow">→</div>
 ${step(reportReqs, "asked us to email the report", true)}
 <div class="arrow">→</div>
 ${step(leads, "asked for access — a real lead", true)}
 <div class="arrow">→</div>
 ${step(onboards, "got the automatic proposal back")}
</div>
<p class="foot">${testCount > 0 ? `${testCount} more checks were ours while testing and are excluded from the first number.` : ""}</p>

${table("Whose sites were checked", "Somebody typed these domains into the free check. Strangers only — our own test runs are filtered out.",
  ["Domain", "Times", "Last"], realAudits, ["site", "checks", "last"])}

${table("Who wrote in", "Everyone who left an email address. All time, newest first.",
  ["When", "What they wanted", "Site", "Email"], leadRows, ["at", "kind", "site", "email"])}

<h2>The subscription product — itgrows.ai</h2>
<p class="q">The original site: LinkedIn and X posting.</p>
<div class="funnel">
 ${step(views, "page views")}
 <div class="arrow">→</div>
 ${step(signups, "signed up", true)}
</div>

<h2>Answer engines</h2>
<p class="q"><b>Fetches</b> is any visit by an AI crawler. <b>Live</b> is the number that matters: an assistant grabbing a page <i>while answering a real person</i>, not while indexing. <b>Where</b> separates a paying client's blog from our own pages.</p>
<div class="funnel">
 ${step(crawlTotal, "crawler fetches")}
 <div class="arrow">→</div>
 ${step(liveTotal, "fetched to answer someone", true)}
</div>

${table("By engine", "Which assistants came, and how many of those visits were live.",
  ["Crawler", "Fetches", "Live", "Where", "Last"], crawlers, ["bot", "hits", "live", "where_", "last"])}

${table("By domain", "Which site they went to. \"Client\" is filled in when the domain belongs to a connected customer.",
  ["Host", "Client", "Fetches", "Live"], hosts, ["host", "client", "hits", "live"])}

${table("Articles published", "All time, ignoring the date filter above.",
  ["Blog", "Articles", "Latest"], blogs, ["site", "articles", "latest"])}

<p class="foot">Client-blog crawler data arrives via the nginx ingest every 10 minutes. Emails and leads are
stored before any send is attempted, so nothing here is missing because a delivery failed.</p>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })
}
