import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { CREDIT_DAYS, SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { clientOwnsSql } from "@/lib/geo-role"
import { geoPlanBeforeSql, isGeoInterval } from "@/lib/geo-business"

// Everything the AI-visibility page shows for one site: the latest finished report, the one in
// progress if any, the history of summaries for the trend, and the quick check (shown whole: it is
// the one free thing, asked on the site with no signup). Read by /api/geo/report for the signed-in
// user's sites and by /api/geo/sample for the public sample report. A past report opens from the
// history through /api/geo/report/run (siteRunFor), cut by the same viewOf as the page.
//
// Each site carries `client`: the viewer pays for the plan for it (a paid follow), or is a client we
// set up by hand with that site listed as theirs in geo_client_sites (lib/geo-role.ts clientOwnsSql;
// connected_sites is not read). A client
// site, a bought report and the sample are shown whole ("full"); anything else is a preview of the
// $49.90 report: the totals stay, the questions of the quick check keep their answers (the teaser
// run's questions, or the profile's teaser picks when the site has no quick check yet), every other
// question is shown as the question alone; the first PREVIEW_RIVALS of the names given instead; no
// cited sources, only how many there are. The cut happens here, so the hidden answers never reach the
// browser, and no question is answered in one part of the page and locked in another.
//
// The weekly re-measurement is part of the plan (geo_check/weekly.py runs it only for client sites):
// a site that is not a client site shows its day-0 report alone, with no weekly runs in the report,
// the history or the progress, whatever was measured before.
//
// A client site also carries `work` (planWork), for the statuses of "Your plan": the viewer's own
// articles linked to one of the site's day-0 questions, the site's launch items and the steps we set
// by hand (status and date only, never our notes), and per question how many assistants named the
// site in the latest weekly check and on day 0. Anyone else gets null.

export const PREVIEW_RIVALS = 3

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)
const strs = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
const DAY = 86_400_000

interface Report {
  id: unknown
  kind: unknown
  finishedAt: unknown
  engines: unknown
  samples: unknown
  summary: Record<string, unknown> | null
  rows: Row[]
}

/** The questions the quick check asks, open in the preview: the latest teaser run's, else the
 *  profile's teaser picks (1-based, out of its questions), as geo_check/service.py picks them. */
function teaserQuestions(f: Row, teaserRows: Row[] | null): Set<string> {
  if (teaserRows) return new Set(teaserRows.map((r) => String(r.q)))
  const profile = strs(f.profile_questions)
  const picks = strs(f.teaser_picks).map(Number)
  return new Set(picks.filter((i) => i >= 1 && i <= profile.length).map((i) => profile[i - 1]))
}

/** The paid part of a report taken out; see the note at the top. */
function preview(r: Report, open: Set<string>): Report {
  const s = r.summary
  const rivals = Array.isArray(s?.named_instead) ? s.named_instead : []
  const sources = Array.isArray(s?.sources) ? s.sources : []
  return {
    ...r,
    summary: s && {
      ...s,
      named_instead: rivals.slice(0, PREVIEW_RIVALS),
      rivalsMore: Math.max(0, rivals.length - PREVIEW_RIVALS),
      sources: [],
      sourcesMore: sources.length,
    },
    rows: r.rows.map((row) => (open.has(String(row.q)) ? row : { q: row.q, locked: true })),
  }
}

/** What the viewer may see of a site: whether its weekly runs are theirs (they belong to the plan),
 *  the full report or a preview, and `show`, which cuts a report to that. The page (siteReport) and a
 *  past report opened from the history (siteRunFor) both go through here, so they cannot be cut
 *  differently. `f` is a geo_sites row joined with the follow (or its stand-in for the sample). */
async function viewOf(f: Row, sample = false) {
  const client = !sample && f.client === true
  const teaser =
    rows(
      await db.execute(sql`
        SELECT engines, summary, results, finished_at FROM geo_runs
        WHERE site_id = ${f.id as string} AND kind = 'teaser' AND status = 'done'
        ORDER BY created_at DESC LIMIT 1`)
    )[0] ?? null
  const paidAt = iso(f.research_paid_at)
  const access: "full" | "preview" = sample || client || paidAt ? "full" : "preview"
  const asked = teaser?.results
  const teaserRows = Array.isArray(asked) && asked.length ? (asked as Row[]) : null
  const open = access === "full" ? new Set<string>() : teaserQuestions(f, teaserRows)
  return {
    client,
    // Weekly runs belong to the plan: only client sites (and the sample) show them.
    weekly: sample || client,
    access,
    paidAt,
    teaser,
    show: (r: Report): Report => (access === "full" ? r : preview(r, open)),
  }
}

/** A finished run whole, every answer included. */
async function runReport(id: string): Promise<Report | null> {
  const [r] = rows(
    await db.execute(sql`SELECT id, kind, finished_at, engines, samples, summary, results FROM geo_runs WHERE id = ${id}::uuid`)
  )
  if (!r) return null
  return {
    id: r.id,
    kind: r.kind,
    finishedAt: r.finished_at,
    engines: r.engines,
    samples: r.samples,
    summary: (r.summary as Report["summary"]) ?? null,
    rows: (r.results as Row[]) ?? [],
  }
}

// ── where the plan's work stands (client sites only) ──────────────────────────────────────────

/** A question as an article or a weekly check may spell it, matched to the day-0 question only when
 *  it is the same question: case, extra spaces and the closing "?" aside. Never a similar one. */
const questionKey = (q: unknown) =>
  String(q ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[?.!]+$/, "")

/** geo_check/launch.py ITEMS with the titles "Your website" shows, for the "Done" list under the plan;
 *  a "you" item goes by the title of its ask there, so it does here. */
const LAUNCH_TITLES: Record<string, string> = {
  access: "Access to your website for us",
  dns: "One DNS record for your blog",
  menu_link: "A link to the blog in your site's menu",
  firewall: "Our address allowed in your firewall",
  crawlers: "AI and search crawlers can open your site",
  certificates: "A valid certificate on every address of the site",
  redirects: "Permanent redirects only (301/308)",
  sitemap: "robots.txt points crawlers to your sitemap",
  gsc_access: "Access to your Google Search Console",
  posts_sitemap: "New articles are in the sitemap",
  bing: "Registered in Bing Webmaster Tools, sitemaps submitted",
  gsc: "Registered in Google Search Console, sitemaps submitted",
  indexnow: "Every new page submitted to Bing automatically (IndexNow)",
  blog: "Your blog is live on your domain and linked from your site",
  one_address: "Every article has one address",
  profile: "Your business profile: what you sell, the facts, your rules",
  questions: "The 20 questions your buyers ask, agreed",
  baseline: "Day-0 measurement: 240 answers from four assistants",
  structured_data: "Your business described in structured data on the homepage",
  llms_txt: "An llms.txt file for AI assistants",
}
/** Always the client's (launch.py YOU_KEYS), for a row stored before `who` was. */
const LAUNCH_YOU = new Set(["access", "dns", "menu_link", "firewall", "gsc_access"])

type ArticleState = "scheduled" | "written" | "approval" | "published" | "stopped"
// Two articles on one question: the one furthest along speaks for it.
const ARTICLE_RANK: Record<ArticleState, number> = { stopped: 0, scheduled: 1, written: 2, approval: 3, published: 4 }
/** The publish-post stop note (app/api/geo/articles/_shared.ts STOP_NOTE). */
const STOP_NOTE = "stopped by client"

/** As app/api/geo/articles/route.ts: only a web address is ever linked, and a WordPress draft keeps
 *  the plain "?p=123" address until it is approved. */
const webUrl = (u: unknown) => (typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u.trim() : null)
const draftPostId = (u: string | null) => (u ? (/[?&]p=(\d+)(?:&|#|$)/.exec(u)?.[1] ?? null) : null)

export interface PlanArticle {
  state: ArticleState
  /** scheduled / written: the day it goes live (YYYY-MM-DD, as the publisher counts, in UTC);
   *  approval / published: when it was sent. */
  date: string | null
  url: string | null
  title: string
}

/** Per question of a run: how many assistants named the site, out of those that could be checked
 *  (one that could not is left out, never counted as not naming it). Keyed by the day-0 question. */
function namedByQuestion(r: Report, toDay0: (q: unknown) => string | undefined) {
  const out: Record<string, { named: number; of: number }> = {}
  for (const row of r.rows) {
    const q = toDay0(row.q)
    const engines = row.engines as Record<string, { named?: number; samples?: number }> | undefined
    if (!q || !engines) continue
    const checked = Object.values(engines).filter((a) => (a.samples ?? 0) > 0)
    out[q] = { named: checked.filter((a) => (a.named ?? 0) > 0).length, of: checked.length }
  }
  return out
}

/** Where the plan's work stands for a client's own site (see the note at the top). Only rows of this
 *  follower (`f.user_id`, already the signed-in user) linked to this very site, and the site's own
 *  launch rows. Everything is keyed by the day-0 report's question as asked. */
async function planWork(f: Row, day0: Report, week: Report | null) {
  const userId = String(f.user_id)
  const domain = String(f.domain)
  const asked = new Map(day0.rows.map((r) => [questionKey(r.q), String(r.q)]))
  const toDay0 = (q: unknown) => asked.get(questionKey(q))
  const today = new Date().toISOString().slice(0, 10)

  // Which site an article goes to, as the articles list works it out: the one its blog copy names,
  // else the publisher's pick (lib/publish-post.ts pickPublishSite: the oldest default, else the
  // oldest; not imported, it brings the mailer with it). A WordPress site that takes drafts has its
  // owner approve each article there.
  const sites = rows(
    await db.execute(sql`
      SELECT id::text AS id, is_default, created_at, blog_domain,
             (platform = 'wordpress' AND site_profile->>'publishStatus' = 'draft') AS draft
      FROM connected_sites WHERE user_id::text = ${userId}`)
  ).sort((a, b) => Date.parse(String(a.created_at)) - Date.parse(String(b.created_at)) || String(a.id).localeCompare(String(b.id)))
  const siteById = new Map(sites.map((x) => [String(x.id), x]))
  const publishSite = sites.find((x) => x.is_default === true) ?? sites[0]

  const articles: Record<string, PlanArticle> = {}
  const keep = (q: unknown, a: PlanArticle) => {
    const k = toDay0(q)
    if (k && (!articles[k] || ARTICLE_RANK[a.state] > ARTICLE_RANK[articles[k].state])) articles[k] = a
  }
  const queued = rows(
    await db.execute(sql`
      SELECT p.geo_question AS q, p.status, p.scheduled_date, p.published_at, p.published_url, p.publish_error,
             coalesce(nullif(btrim(p.article_data->>'title'), ''), p.keyword) AS title,
             (p.article_data->>'preparedBy' = 'vm-writer' AND coalesce(p.article_data->>'title', '') <> ''
              AND coalesce(p.article_data->>'content', '') <> '') AS prepared,
             b.site_id
      FROM scheduled_posts p
      LEFT JOIN blog_posts b ON b.slug = p.blog_post_slug AND b.user_id = p.user_id
      WHERE p.user_id::text = ${userId} AND p.geo_domain = ${domain} AND p.geo_question IS NOT NULL`)
  )
  for (const p of queued) {
    const site = (p.site_id ? siteById.get(String(p.site_id)) : undefined) ?? publishSite
    const draft = site?.draft === true
    const title = String(p.title ?? "")
    const due = String(p.scheduled_date)
    if (p.status === "published") {
      const url = webUrl(p.published_url)
      const waiting = draft && (!url || draftPostId(url) !== null)
      keep(p.q, { state: waiting ? "approval" : "published", date: iso(p.published_at), url: waiting ? null : url, title })
    } else if (p.status === "scheduled" || p.status === "generating") {
      // Written and in its review window; a draft site's owner reviews in WordPress instead.
      keep(p.q, { state: p.prepared === true && !draft ? "written" : "scheduled", date: due > today ? due : today, url: null, title })
    } else if (p.status === "skipped" && String(p.publish_error ?? "").startsWith(STOP_NOTE)) {
      keep(p.q, { state: "stopped", date: null, url: null, title })
    }
    // Skipped as a duplicate, or failed: no article for the question yet, and the reason stays ours.
  }
  // Written straight onto a blog we serve (our own sites); a page merged into another is not one.
  const direct = rows(
    await db.execute(sql`
      SELECT b.geo_question AS q, b.slug, b.title, b.site_slug, b.published_at, c.blog_domain
      FROM blog_posts b
      LEFT JOIN connected_sites c ON c.id::text = b.site_id AND c.user_id = b.user_id
      WHERE b.user_id::text = ${userId} AND b.geo_domain = ${domain} AND b.geo_question IS NOT NULL
        AND b.redirect_to IS NULL`)
  )
  for (const b of direct) {
    const host = b.blog_domain ? String(b.blog_domain).replace(/^https?:\/\//, "").replace(/\/$/, "") : ""
    const url =
      b.site_slug === "itgrows-business" ? `https://www.itgrows.ai/business/blog/${b.slug}`
      : b.site_slug === "itgrows" ? `https://www.itgrows.ai/blog/${b.slug}`
      : host ? `https://${host}/${b.slug}`
      : null
    keep(b.q, { state: "published", date: iso(b.published_at), url, title: String(b.title ?? "") })
  }

  // The launch items and the steps we set by hand (key "step:<step id>", launch.py set): status, who
  // and when it last changed. Never the note, never the clicks, never whether a check or a person
  // confirmed it: an item we set in order by hand is sent as "fixed", the same as one the check saw fixed,
  // and `done` says it belongs in the "Done" list.
  const launch: Record<string, { status: string; who: "you" | "us"; updatedAt: string | null; done: boolean; title: string | null }> = {}
  const items = rows(
    await db.execute(sql`
      SELECT key, status, who, source, updated_at, ask->'en'->>'title' AS ask_title
      FROM geo_launch WHERE site_id = ${f.id as string} AND status <> 'na'`)
  )
  for (const r of items) {
    const key = String(r.key)
    const who = r.who === "you" || r.who === "us" ? r.who : LAUNCH_YOU.has(key) ? "you" : "us"
    launch[key] = {
      status: r.status === "ok" && r.source === "manual" ? "fixed" : String(r.status),
      who,
      updatedAt: iso(r.updated_at),
      // Fixed, or set in order by us by hand; an item the daily check finds ok was never broken.
      done: r.status === "fixed" || (r.status === "ok" && r.source === "manual"),
      title: key.startsWith("step:") ? null : who === "you" && r.ask_title ? String(r.ask_title) : (LAUNCH_TITLES[key] ?? null),
    }
  }

  return {
    articles,
    launch,
    week: week && { finishedAt: iso(week.finishedAt), samples: Number(week.samples), named: namedByQuestion(week, toDay0) },
    day0: { samples: Number(day0.samples), named: namedByQuestion(day0, toDay0) },
  }
}

/** One site's report; `f` is a geo_sites row joined with the follow (or its stand-in for the sample). */
async function siteReport(f: Row, sample = false) {
  const { client, weekly, access, paidAt, teaser, show } = await viewOf(f, sample)
  const runs = rows(
    await db.execute(sql`
      SELECT id, kind, status, engines, samples, jsonb_array_length(questions) AS n_questions,
             progress, created_at, started_at
      FROM geo_runs
      WHERE site_id = ${f.id as string} AND kind IN ('baseline', 'weekly') AND (${weekly}::boolean OR kind = 'baseline')
      ORDER BY created_at DESC LIMIT 60`)
  )
  const pending = sample ? null : (runs.find((r) => r.status === "queued" || r.status === "running") ?? null)
  // Every finished report, oldest first, without its answers: the history and the trend. A year of
  // weekly checks is a few kB this way; the answers of a past week load when it is opened.
  const done = rows(
    await db.execute(sql`
      SELECT id, kind, samples, jsonb_array_length(questions) AS n_questions, md5(questions::text) AS questions_key,
             summary->'named' AS named, summary->'of' AS of, summary->'engines' AS per_engine,
             summary->'previous' AS previous, finished_at
      FROM geo_runs
      WHERE site_id = ${f.id as string} AND status = 'done' AND kind IN ('baseline', 'weekly')
        AND (${weekly}::boolean OR kind = 'baseline')
      ORDER BY created_at`)
  )
  const last = done[done.length - 1]
  // A weekly check can be five questions; the full picture stays the day-0 report.
  const base = done.filter((r) => r.kind === "baseline").pop()
  const latest = last ? await runReport(last.id as string) : null
  const baseline = base && base.id !== last?.id ? await runReport(base.id as string) : null
  const day0 = baseline ?? (latest?.kind === "baseline" ? latest : null)

  const plan = String(f.plan)
  const creditEnd = paidAt ? new Date(paidAt).getTime() + CREDIT_DAYS * DAY : 0
  const creditUntil =
    paidAt && !f.research_credited_at && plan !== "paid" && creditEnd > Date.now() ? new Date(creditEnd).toISOString() : null

  return {
    domain: f.domain as string,
    business: f.business,
    language: f.language,
    city: f.city,
    offering: f.offering,
    plan,
    followedAt: f.followed_at,
    client,
    access,
    research: { paidAt, creditUntil },
    // Whatever the plan was bought for: month, quarter or year (geo_follows.plan_interval).
    planInterval: isGeoInterval(f.plan_interval) ? f.plan_interval : null,
    // The site had a paid plan before, by anyone (lib/geo-business.ts geoPlanBeforeSql), so its one-time
    // setup is paid: /api/geo/checkout starts the month-to-month plan without it, and its first payment
    // is GEO_PRICES.month alone (less a credit). False here can still turn out true in Stripe: the plan
    // page asks /api/geo/launch/setup, which decides as checkout does.
    setupPaid: f.setup_paid === true,
    pending: pending && {
      kind: pending.kind,
      status: pending.status,
      createdAt: pending.created_at,
      startedAt: pending.started_at,
      questions: pending.n_questions,
      engines: pending.engines,
      samples: pending.samples,
      progress: pending.progress ?? null,
    },
    failed: !done.length && !pending && runs[0]?.status === "failed",
    latest: latest && show(latest),
    baseline: baseline && show(baseline),
    work: client && day0 ? await planWork(f, day0, latest?.kind === "weekly" ? latest : null) : null,
    // Oldest first, counts only. Two runs compare only on the same basis, the same questions asked the
    // same number of times: an answer counts as named in at least 1 of N asks, so 3 asks read higher.
    history: done.map((r) => {
      const p = r.previous as { kind?: string; finished_at?: string; named?: number; of?: number } | null
      return {
        id: r.id,
        kind: r.kind,
        finishedAt: r.finished_at,
        samples: r.samples,
        questions: r.n_questions,
        basis: `${r.questions_key}x${r.samples}`,
        named: Number(r.named ?? 0),
        of: Number(r.of ?? 0),
        engines: (r.per_engine as Record<string, { named: number; of: number }> | null) ?? {},
        // What the VM compared a weekly check with (geo_check/service.py previous_basis); for the first
        // week of a shorter check, day 0 read on that week's basis.
        previous: p?.kind ? { kind: p.kind, finishedAt: p.finished_at ?? null, named: p.named ?? 0, of: p.of ?? 0 } : null,
      }
    }),
    teaser: teaser && {
      engines: teaser.engines,
      summary: teaser.summary,
      rows: teaser.results,
      finishedAt: teaser.finished_at,
    },
  }
}

export type SiteReportData = Awaited<ReturnType<typeof siteReport>>

/** The sites a user follows, oldest first (only `siteId` when given), as siteReport and viewOf read
 *  them. Only the user's own follows; `client` is worked out for this user and each site (see the
 *  note at the top). */
async function followsOf(userId: string, siteId?: string) {
  return rows(
    await db.execute(sql`
      SELECT s.id, s.domain, s.profile->>'business_name' AS business, s.profile->>'language' AS language,
             nullif(s.profile->>'local_city', '') AS city, s.profile->>'offering' AS offering,
             s.profile->'questions' AS profile_questions, s.profile->'teaser' AS teaser_picks,
             f.user_id, f.plan, f.created_at AS followed_at, f.research_paid_at, f.research_credited_at, f.plan_interval,
             (f.plan = 'paid' OR ${clientOwnsSql(sql.raw("f.user_id"), sql.raw("s.domain"))}) AS client,
             ${geoPlanBeforeSql(sql.raw("s.domain"))} AS setup_paid
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId}${siteId ? sql` AND s.id = ${siteId}::uuid` : sql``}
      ORDER BY f.created_at`)
  )
}

/** The sites a user follows, oldest first, each cut to what they have paid for. */
export async function siteReportsFor(userId: string): Promise<SiteReportData[]> {
  const sites: SiteReportData[] = []
  for (const f of await followsOf(userId)) sites.push(await siteReport(f))
  return sites
}

/** One finished report from a site's history, cut exactly as the page cuts it, for
 *  /api/geo/report/run. Null for anything the page would not show this user: a site they do not
 *  follow, a run not finished, a quick check, a weekly run of a site that is not theirs as a client. */
export async function siteRunFor(userId: string, runId: string): Promise<Report | null> {
  const [run] = rows(
    await db.execute(sql`
      SELECT site_id, kind FROM geo_runs
      WHERE id = ${runId}::uuid AND status = 'done' AND kind IN ('baseline', 'weekly')`)
  )
  if (!run) return null
  const [f] = await followsOf(userId, run.site_id as string)
  if (!f) return null
  const view = await viewOf(f)
  if (run.kind === "weekly" && !view.weekly) return null
  const report = await runReport(runId)
  return report && view.show(report)
}

/** The public sample: the whole report for SAMPLE_DOMAIN (our own appslift.com), whoever follows it.
 *  Null until it has a finished day-0 report. */
export async function sampleSiteReport(): Promise<SiteReportData | null> {
  const [site] = rows(
    await db.execute(sql`
      SELECT s.id, s.domain, s.profile->>'business_name' AS business, s.profile->>'language' AS language,
             nullif(s.profile->>'local_city', '') AS city, s.profile->>'offering' AS offering,
             'sample' AS plan, s.created_at AS followed_at, NULL AS plan_interval
      FROM geo_sites s WHERE s.domain = ${SAMPLE_DOMAIN}`)
  )
  if (!site) return null
  const report = await siteReport(site, true)
  if (report.latest?.kind !== "baseline" && !report.baseline) return null
  return report
}
