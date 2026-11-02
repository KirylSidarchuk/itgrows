import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { geoCheck, clientIp, type PublicRun, type ResultRow } from "@/lib/geo-check"
import { sendOwner } from "@/lib/telegram"
import { visitSource } from "@/lib/visit-source"

// The instant check on /business: five questions a buyer of this business would ask, put to ChatGPT
// and Perplexity. POST starts it (or returns a result under a day old at once); GET ?id= follows it,
// stage by stage, so the page can show the questions as soon as they exist.
//
// A stranger gets one answer in full and the first of the businesses named instead. For the other four
// answers only the question leaves the server (with the names of the assistants that answered it), and of the
// other businesses only how many, so the blur on the page hides nothing devtools could lift. (02.11: of 22
// outside checks, the 10 with a count of 0 gave no sign-up. The screen had already answered what the ad asks: the
// count and who is named instead.) The rest, and the other two assistants, are what the report is for.

export const dynamic = "force-dynamic"
export const maxDuration = 30

const OPEN_ROWS = 1
const RUN_ID = /^[0-9a-f-]{36}$/i

const anyNamed = (r: ResultRow) => Object.values(r.engines).some((a) => a.named > 0)
const anyRivals = (r: ResultRow) => Object.values(r.engines).some((a) => a.named_instead.length > 0)

/** Which answer to show: one where the site is missing and somebody else is named, if there is one;
 * otherwise one that names somebody, which says more than general advice. */
function pickOpen(rows: ResultRow[]): number[] {
  const idx = rows.map((_, i) => i)
  const answered = (r: ResultRow) => Object.values(r.engines).some((a) => a.samples > 0)
  const order = [
    ...idx.filter((i) => !anyNamed(rows[i]) && anyRivals(rows[i])),
    ...idx.filter((i) => anyRivals(rows[i])),
    ...idx.filter((i) => answered(rows[i])),
    ...idx,
  ]
  return order.slice(0, OPEN_ROWS)
}

function openRow(r: ResultRow, domain: string) {
  const own = (d: string) => d === domain || d.endsWith("." + domain)
  const engines: Record<string, unknown> = {}
  for (const [e, a] of Object.entries(r.engines)) {
    engines[e] = {
      named: a.named > 0,
      cited: a.cited > 0,
      failed: a.samples === 0,
      namedInstead: a.named_instead.slice(0, 1),
      namedInsteadMore: Math.max(0, a.named_instead.length - 1),
      // Which sites are quoted is in the report; here only whether the site itself is among them.
      sources: a.sources.filter(own),
      sourcesMore: a.sources.filter((d) => !own(d)).length,
      snippet: a.snippet.slice(0, 360),
    }
  }
  return { q: r.q, engines }
}

function failure(error: string | null) {
  const e = error ?? ""
  if (e.startsWith("unreachable")) return { error: "unreachable", reason: e.replace(/^unreachable:\s*/, "").slice(0, 200) }
  if (e.startsWith("questions_failed")) return { error: "questions_failed" }
  return { error: "check_failed" }
}

function view(run: PublicRun) {
  const base = { id: run.run_id, domain: run.domain, business: run.business ?? null, language: run.language ?? null }
  if (run.status === "failed") return { ...base, status: "failed", ...failure(run.error) }
  if (run.status !== "done" || !run.summary) {
    const p = run.progress ?? {}
    return {
      ...base,
      status: "running",
      stage: (p.stage as string) ?? "reading",
      answered: (p.answered as Record<string, number>) ?? null,
      total: (p.total as number) ?? 5,
      questions: (run.questions ?? []).slice(0, 5),
    }
  }
  const rows = run.results ?? []
  const open = pickOpen(rows)
  const linked = rows.reduce((n, r) => n + Object.values(r.engines).filter((a) => a.cited > 0).length, 0)
  return {
    ...base,
    status: "done",
    finishedAt: run.finished_at,
    engines: run.engines,
    summary: {
      named: run.summary.named,
      of: run.summary.of,
      linked,
      engines: run.summary.engines,
      namedInstead: run.summary.named_instead.slice(0, 1),
      namedInsteadMore: Math.max(0, run.summary.named_instead.length - 1),
    },
    open: open.map((i) => ({ n: i + 1, ...openRow(rows[i], run.domain ?? "") })),
    locked: rows
      .map((r, i) => ({ n: i + 1, q: r.q, answered: Object.keys(r.engines).filter((e) => r.engines[e].samples > 0) }))
      .filter((_, i) => !open.includes(i)),
  }
}

/** One line for the owner per check started from the page. A site checked in the last day gets its
 *  stored result back at once ("повтор"); a new check is announced when it starts and again, with
 *  its count, when it finishes (outcomeAlert). */
function teaserAlert(url: string, status: number, run: Partial<PublicRun> & { error?: string | null }): string {
  const site = run.domain ?? url
  if (status !== 200 && status !== 202) return `🔎 Анализатор: ${site} — не запустился (${run.error ?? status})`
  if (run.status === "failed") return `🔎 Анализатор: ${site} — проверка упала (${run.error ?? "?"})`
  if (run.status === "done" && run.summary) {
    return `🔎 Анализатор: ${site} — повтор (проверка за последние сутки): назван в ${run.summary.named} из ${run.summary.of}`
  }
  return `🔎 Анализатор: ${site} — новая проверка запущена`
}

/** The outcome of a new check, sent once. The page polls GET every few seconds, so the first poll
 *  that sees the check finished claims it in geo_run_alerts (lib/db/migrations/add_geo_run_alerts.sql)
 *  and only that poll sends. A visitor who leaves before the end sends nothing; the start line stays. */
async function outcomeAlert(run: Partial<PublicRun>) {
  if ((run.status !== "done" && run.status !== "failed") || !run.run_id) return
  try {
    const res = await db.execute(sql`INSERT INTO geo_run_alerts (run_id) VALUES (${run.run_id}::uuid) ON CONFLICT DO NOTHING RETURNING run_id`)
    const claimed = Array.isArray(res) ? res.length : ((res as { rows?: unknown[] }).rows?.length ?? 0)
    if (!claimed) return
    const site = run.domain ?? "?"
    await sendOwner(
      run.status === "failed"
        ? `🔎 Анализатор: ${site} — проверка упала (${run.error ?? "?"})`
        : `🔎 Анализатор: ${site} — готово: назван в ${run.summary?.named ?? "?"} из ${run.summary?.of ?? "?"}`
    )
  } catch (e) {
    console.warn("[geo/teaser] outcome alert:", e instanceof Error ? e.message : e)
  }
}

async function relay(status: number, data: Partial<PublicRun> & { error?: string }) {
  if (status === 200 || status === 202) return NextResponse.json(view(data as PublicRun))
  return NextResponse.json({ status: "failed", error: data.error ?? "unavailable" }, { status: status >= 400 && status < 600 ? status : 502 })
}

export async function POST(req: NextRequest) {
  let url = ""
  try {
    url = String(((await req.json()) as { url?: unknown }).url ?? "").trim()
  } catch {}
  if (url.length < 3 || url.length > 300) {
    return NextResponse.json({ status: "failed", error: "invalid_url" }, { status: 400 })
  }
  try {
    const r = await geoCheck<PublicRun>("/teaser", { url, ip: clientIp(req.headers) }, 25_000)
    void sendOwner(`${teaserAlert(url, r.status, r.data)}\n📍 ${await visitSource(req.headers)}`)
    return relay(r.status, r.data)
  } catch {
    void sendOwner(`🔎 Анализатор: ${url} — сервис проверки не ответил\n📍 ${await visitSource(req.headers)}`)
    return NextResponse.json({ status: "failed", error: "unavailable" }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? ""
  if (!RUN_ID.test(id)) return NextResponse.json({ status: "failed", error: "not_found" }, { status: 404 })
  try {
    const r = await geoCheck<PublicRun>(`/run/${id}`, undefined, 15_000)
    // This endpoint is public: it may only ever show instant checks, never someone's report.
    if (r.status !== 200 || r.data.kind !== "teaser") {
      return NextResponse.json({ status: "failed", error: "not_found" }, { status: 404 })
    }
    await outcomeAlert(r.data)
    return relay(200, r.data)
  } catch {
    return NextResponse.json({ status: "failed", error: "unavailable" }, { status: 502 })
  }
}
