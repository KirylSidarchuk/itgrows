import { NextRequest, NextResponse } from "next/server"
import { geoCheck, clientIp, type PublicRun, type ResultRow } from "@/lib/geo-check"
import { sendOwner } from "@/lib/telegram"

// The instant check on /business: five questions a buyer of this business would ask, put to ChatGPT
// and Perplexity. POST starts it (or returns a result under a day old at once); GET ?id= follows it,
// stage by stage, so the page can show the questions as soon as they exist.
//
// A stranger gets two answers in full. For the other three only the question leaves the server, so
// the blur on the page hides nothing devtools could lift. The full answers, and the other two
// assistants, are what the account and the detailed report are for.

export const dynamic = "force-dynamic"
export const maxDuration = 30

const OPEN_ROWS = 2
const RUN_ID = /^[0-9a-f-]{36}$/i

const anyNamed = (r: ResultRow) => Object.values(r.engines).some((a) => a.named > 0)
const anyRivals = (r: ResultRow) => Object.values(r.engines).some((a) => a.named_instead.length > 0)

/** Which two answers to show: where the site is named and where it is not, if both happened;
 * otherwise the ones that name somebody, which say more than general advice. */
function pickOpen(rows: ResultRow[]): number[] {
  const idx = rows.map((_, i) => i)
  const named = idx.filter((i) => anyNamed(rows[i]))
  const missed = idx.filter((i) => !anyNamed(rows[i]))
  if (named.length && missed.length) {
    return [named[0], missed.find((i) => anyRivals(rows[i])) ?? missed[0]].sort((a, b) => a - b)
  }
  const preferred = idx.filter((i) => anyRivals(rows[i]))
  return [...preferred, ...idx.filter((i) => !preferred.includes(i))].slice(0, OPEN_ROWS).sort((a, b) => a - b)
}

function openRow(r: ResultRow) {
  const engines: Record<string, unknown> = {}
  for (const [e, a] of Object.entries(r.engines)) {
    engines[e] = {
      named: a.named > 0,
      cited: a.cited > 0,
      failed: a.samples === 0,
      namedInstead: a.named_instead,
      sources: a.sources,
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
      namedInstead: run.summary.named_instead.slice(0, 3),
    },
    open: open.map((i) => ({ n: i + 1, ...openRow(rows[i]) })),
    locked: rows.map((r, i) => ({ n: i + 1, q: r.q })).filter((_, i) => !open.includes(i)),
  }
}

/** One line for the owner per check started from the page. */
function teaserAlert(url: string, status: number, run: Partial<PublicRun> & { error?: string | null }): string {
  const site = run.domain ?? url
  if (status !== 200 && status !== 202) return `🔎 Анализатор: ${site} — не запустился (${run.error ?? status})`
  if (run.status === "failed") return `🔎 Анализатор: ${site} — проверка упала (${run.error ?? "?"})`
  if (run.status === "done" && run.summary) {
    return `🔎 Анализатор: ${site} — готовый результат: назван в ${run.summary.named} из ${run.summary.of}`
  }
  return `🔎 Анализатор: ${site} — новая проверка`
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
    void sendOwner(teaserAlert(url, r.status, r.data))
    return relay(r.status, r.data)
  } catch {
    void sendOwner(`🔎 Анализатор: ${url} — сервис проверки не ответил`)
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
    return relay(200, r.data)
  } catch {
    return NextResponse.json({ status: "failed", error: "unavailable" }, { status: 502 })
  }
}
