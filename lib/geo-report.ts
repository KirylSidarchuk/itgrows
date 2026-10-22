import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { CREDIT_DAYS, SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { clientOwnsSql } from "@/lib/geo-role"
import { isGeoInterval } from "@/lib/geo-business"

// Everything the AI-visibility page shows for one site: the latest finished report, the one in
// progress if any, the history of summaries for the trend, and the quick check (shown whole: it is
// the one free thing, asked on the site with no signup). Read by /api/geo/report for the signed-in
// user's sites and by /api/geo/sample for the public sample report.
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

export const PREVIEW_RIVALS = 3

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)
const strs = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
const DAY = 86_400_000

interface Report {
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

/** One site's report; `f` is a geo_sites row joined with the follow (or its stand-in for the sample). */
async function siteReport(f: Row, sample = false) {
  const client = !sample && f.client === true
  // Weekly runs belong to the plan: only client sites (and the sample) show them.
  const weekly = sample || client
  const runs = rows(
    await db.execute(sql`
      SELECT id, kind, status, engines, samples, jsonb_array_length(questions) AS n_questions,
             summary, error, progress, created_at, started_at, finished_at
      FROM geo_runs
      WHERE site_id = ${f.id as string} AND kind IN ('baseline', 'weekly') AND (${weekly}::boolean OR kind = 'baseline')
      ORDER BY created_at DESC LIMIT 60`)
  )
  const done = runs.filter((r) => r.status === "done")
  const pending = sample ? null : (runs.find((r) => r.status === "queued" || r.status === "running") ?? null)
  const latestId = done[0]?.id as string | undefined
  const latestRows = latestId
    ? rows(await db.execute(sql`SELECT results FROM geo_runs WHERE id = ${latestId}::uuid`))[0]
    : null
  // A weekly check can be five questions; the full picture stays the day-0 report.
  const base = done.find((r) => r.kind === "baseline")
  const baseRows =
    base && base.id !== latestId
      ? rows(await db.execute(sql`SELECT results FROM geo_runs WHERE id = ${base.id as string}::uuid`))[0]
      : null
  const teaser =
    rows(
      await db.execute(sql`
        SELECT engines, summary, results, finished_at FROM geo_runs
        WHERE site_id = ${f.id as string} AND kind = 'teaser' AND status = 'done'
        ORDER BY created_at DESC LIMIT 1`)
    )[0] ?? null

  const plan = String(f.plan)
  const paidAt = iso(f.research_paid_at)
  const access: "full" | "preview" = sample || client || paidAt ? "full" : "preview"
  const creditEnd = paidAt ? new Date(paidAt).getTime() + CREDIT_DAYS * DAY : 0
  const creditUntil =
    paidAt && !f.research_credited_at && plan !== "paid" && creditEnd > Date.now() ? new Date(creditEnd).toISOString() : null
  const asked = teaser?.results
  const teaserRows = Array.isArray(asked) && asked.length ? (asked as Row[]) : null
  const open = access === "full" ? new Set<string>() : teaserQuestions(f, teaserRows)
  const show = (r: Report) => (access === "full" ? r : preview(r, open))

  const latest: Report | null = done[0]
    ? {
        kind: done[0].kind,
        finishedAt: done[0].finished_at,
        engines: done[0].engines,
        samples: done[0].samples,
        summary: (done[0].summary as Report["summary"]) ?? null,
        rows: (latestRows?.results as Row[]) ?? [],
      }
    : null
  const baseline: Report | null =
    base && base.id !== latestId
      ? {
          kind: base.kind,
          finishedAt: base.finished_at,
          engines: base.engines,
          samples: base.samples,
          summary: (base.summary as Report["summary"]) ?? null,
          rows: (baseRows?.results as Row[]) ?? [],
        }
      : null

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
    history: done
      .slice()
      .reverse()
      .map((r) => {
        const s = (r.summary ?? {}) as { named?: number; of?: number }
        return { kind: r.kind, finishedAt: r.finished_at, samples: r.samples, questions: r.n_questions, named: s.named ?? 0, of: s.of ?? 0 }
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

/** The sites a user follows, oldest first, each cut to what they have paid for. Only the user's own
 *  follows; `client` is worked out for this user and each site (see the note at the top). */
export async function siteReportsFor(userId: string): Promise<SiteReportData[]> {
  const follows = rows(
    await db.execute(sql`
      SELECT s.id, s.domain, s.profile->>'business_name' AS business, s.profile->>'language' AS language,
             nullif(s.profile->>'local_city', '') AS city, s.profile->>'offering' AS offering,
             s.profile->'questions' AS profile_questions, s.profile->'teaser' AS teaser_picks,
             f.plan, f.created_at AS followed_at, f.research_paid_at, f.research_credited_at, f.plan_interval,
             (f.plan = 'paid' OR ${clientOwnsSql(sql.raw("f.user_id"), sql.raw("s.domain"))}) AS client
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId}
      ORDER BY f.created_at`)
  )
  const sites: SiteReportData[] = []
  for (const f of follows) sites.push(await siteReport(f))
  return sites
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
