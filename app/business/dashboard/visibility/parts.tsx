"use client"

// The pieces of the AI-visibility page. Rules that hold on every card: counts, never percentages or
// scores; "you" is violet, everyone else slate; an assistant that could not be checked is shown as
// such and left out of the totals — it never counts as "not named"; nothing is projected.

import { useEffect, useState } from "react"

export interface EngineAnswer {
  named: number
  cited: number
  samples: number
  errors: number
  snippet: string
  sources: string[]
  named_instead: string[]
}
export interface Row {
  q: string
  engines: Record<string, EngineAnswer>
}
export interface Summary {
  named: number
  of: number
  engines: Record<string, { named: number; of: number }>
  named_instead: { name: string; count: number }[]
  own_cited?: number
  sources?: { domain: string; count: number; type: string }[]
  previous?: { kind: string; finished_at: string; named: number; of: number }
  changes?: Change[]
}
export type Change =
  | { type: "new"; engine: string; q: string }
  | { type: "lost"; engine: string; q: string }
  | { type: "rival"; name: string; count: number }
export interface Report {
  kind: string
  finishedAt: string
  engines: string[]
  samples: number
  summary: Summary
  rows: Row[]
}
export interface SiteReport {
  domain: string
  business: string | null
  language: string | null
  city: string | null
  offering: string | null
  plan: string
  followedAt: string
  pending: {
    kind: string
    status: string
    createdAt: string
    startedAt: string | null
    questions: number
    engines: string[]
    samples: number
    progress: { stage?: string; done?: number; total?: number } | null
  } | null
  failed: boolean
  latest: Report | null
  baseline: Report | null
  history: { kind: string; finishedAt: string; samples: number; questions: number; named: number; of: number }[]
  teaser: { engines: string[]; summary: Summary; rows: Row[]; finishedAt: string } | null
}
export interface Audit {
  site: string
  unreachable?: boolean
  robots: { found: boolean; bots: { bot: string; verdict: "blocked" | "allowed" | "wildcard" | "none" }[] }
  liveFetch: { bot: string; status: number; blocked: boolean }[]
  surface: { urlCount: number; sitemapKind: "none" | "urlset" | "index"; isFloor: boolean; answerPages: number; partial: boolean }
  llmsTxt: boolean
  structuredData: { count: number; types: string[] }
  serverRenderedWords: number
}

export const ENGINES = ["chatgpt", "claude", "gemini", "perplexity"]
export const LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" }

export const card = "rounded-2xl bg-white/90 border border-white shadow-sm p-5 sm:p-6"
const label = "text-[11px] font-bold uppercase tracking-wide text-slate-500"

export function fmtDate(iso?: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function citedByEngine(rows: Row[]) {
  const out: Record<string, number> = {}
  for (const r of rows) for (const [e, a] of Object.entries(r.engines)) if (a.cited > 0) out[e] = (out[e] ?? 0) + 1
  return out
}

function firstSnippet(rows: Row[], engines: string[]) {
  for (const r of rows) for (const e of engines) if (r.engines[e]?.snippet) return { e, q: r.q, text: r.engines[e].snippet }
  return null
}

// ── banner while the full report runs ─────────────────────────────────────────────────────────

export function Banner({ pending }: { pending: NonNullable<SiteReport["pending"]> }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])
  const p = pending.progress ?? {}
  const total = p.total ?? pending.questions * pending.engines.length * pending.samples
  const done = Math.min(p.done ?? 0, total)
  const startedMin = pending.startedAt ? (now - new Date(pending.startedAt).getTime()) / 60000 : 0
  const queuedMin = (now - new Date(pending.createdAt).getTime()) / 60000
  const waiting = pending.status === "queued" && queuedMin > 2
  const weekly = pending.kind === "weekly"
  return (
    <section className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
      <p className="font-bold text-violet-900">
        {waiting ? "In the queue" : weekly ? "This week's check is running" : "Building your full report"}
      </p>
      <p className="text-sm text-violet-900/80 mt-1 leading-relaxed">
        {waiting
          ? "Many reports are running today. Yours starts as soon as there is room — we'll email you when it's ready."
          : `${pending.questions} buyer questions × ${pending.engines.length} assistants, ${pending.samples} asks each, because answers vary. About 10 minutes; we'll email you.`}
      </p>
      {!waiting && (
        <>
          <div className="mt-3 h-1.5 rounded-full bg-violet-100 overflow-hidden">
            <div className="h-full bg-violet-600 transition-all duration-700" style={{ width: `${total ? Math.max(3, (done / total) * 100) : 3}%` }} />
          </div>
          <p className="text-xs text-violet-900/70 mt-2 tabular-nums">
            {p.stage === "analysing" ? "Reading the answers: who is named, which sites are cited." : `${done} of ${total} asks done`}
          </p>
        </>
      )}
      {startedMin > 20 && <p className="text-xs text-violet-900/70 mt-1">Taking longer than usual. We&apos;ll email you.</p>}
    </section>
  )
}

// ── hero ──────────────────────────────────────────────────────────────────────────────────────

function Tile({ engine, named, of, linked, asking }: { engine: string; named?: number; of?: number; linked?: number; asking?: boolean }) {
  return (
    <div className="rounded-xl bg-[#f8f7f6] px-3.5 py-3">
      <div className={label}>{LABEL[engine]}</div>
      {asking ? (
        <div className="text-sm font-semibold text-slate-400 mt-1">Asking…</div>
      ) : of ? (
        <>
          <div className="text-xl font-extrabold tabular-nums mt-0.5">
            {named}
            <span className="text-slate-400 text-sm font-bold">/{of}</span>
          </div>
          {linked !== undefined && <div className="text-[11px] text-slate-500 mt-0.5">Linked your site: {linked}</div>}
        </>
      ) : (
        <div className="text-sm font-semibold text-slate-400 mt-1">Couldn&apos;t check</div>
      )}
    </div>
  )
}

export function Hero({ report }: { report: Report }) {
  const l = report
  const s = l.summary
  const engines = ENGINES.filter((e) => s.engines[e])
  const cited = citedByEngine(l.rows)
  const skipped = engines.filter((e) => !s.engines[e].of)
  const snip = firstSnippet(l.rows, engines)
  const nq = l.rows.length
  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className={label}>Do AI assistants name you?</p>
        <span className="text-[11px] font-semibold text-slate-600 bg-[#f8f7f6] rounded-full px-2.5 py-1">
          {l.kind === "weekly" ? "Weekly check" : "Day-0 report"} · {fmtDate(l.finishedAt)}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-violet-600 tabular-nums">{s.named}</span>
        <span className="text-xl font-bold text-slate-400">of {s.of} answers named you</span>
      </div>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        {nq} questions your buyers ask × {engines.length - skipped.length} assistants.{" "}
        {l.samples > 1 ? `An answer counts if you were named in at least 1 of ${l.samples} asks.` : "One ask each."}
        {skipped.length > 0 && ` ${skipped.map((e) => LABEL[e]).join(", ")} couldn't be checked and ${skipped.length > 1 ? "are" : "is"} left out.`}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
        {engines.map((e) => (
          <Tile key={e} engine={e} named={s.engines[e].named} of={s.engines[e].of} linked={cited[e] ?? 0} />
        ))}
      </div>
      {snip && (
        <figure className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <blockquote className="text-sm text-slate-800 leading-relaxed">“{snip.text}”</blockquote>
          <figcaption className="text-xs text-slate-500 mt-2">
            {LABEL[snip.e]}, asked “{snip.q}”
          </figcaption>
        </figure>
      )}
      {l.kind !== "weekly" && (
        <p className="text-xs text-slate-500 mt-3">This is your starting point. Every weekly check is compared with it.</p>
      )}
    </section>
  )
}

export function FirstLook({ site }: { site: SiteReport }) {
  const t = site.teaser!
  const s = t.summary
  return (
    <section className={card}>
      <p className={label}>First look</p>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl font-extrabold tracking-tight text-violet-600 tabular-nums">{s.named}</span>
        <span className="text-xl font-bold text-slate-400">of {s.of} answers named you</span>
      </div>
      <p className="text-sm text-slate-600 mt-2">
        {t.rows.length} questions · {t.engines.map((e) => LABEL[e]).join(" and ")}, one ask each.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
        {ENGINES.map((e) =>
          s.engines[e] ? (
            <Tile key={e} engine={e} named={s.engines[e].named} of={s.engines[e].of} />
          ) : (
            <Tile key={e} engine={e} asking={Boolean(site.pending)} />
          )
        )}
      </div>
    </section>
  )
}

// ── the weekly view ──────────────────────────────────────────────────────────────────────────

/** Weekly checks measured the same way as the latest one, oldest first. */
function sameBasis(site: SiteReport) {
  const l = site.latest!
  return site.history.filter((h) => h.kind === "weekly" && h.samples === l.samples && h.questions === l.rows.length)
}

export function WeeklyHero({ site, onShowBaseline }: { site: SiteReport; onShowBaseline?: () => void }) {
  const l = site.latest!
  const s = l.summary
  const weeks = sameBasis(site)
  const last4 = weeks.slice(-4)
  const avg = last4.length === 4 ? last4.reduce((n, w) => n + w.named, 0) / 4 : null
  const prev8 = weeks.slice(-8, -4)
  const avgPrev = prev8.length === 4 ? prev8.reduce((n, w) => n + w.named, 0) / 4 : null
  const avgTone = avg !== null && avgPrev !== null && weeks.length >= 8 ? (avg > avgPrev ? "bg-green-50 text-green-800" : avg < avgPrev ? "bg-amber-50 text-amber-800" : "") : ""
  const prev = s.previous
  const shown = weeks.slice(-12)
  const max = Math.max(1, ...shown.map((w) => w.of))
  const engines = ENGINES.filter((e) => s.engines[e])
  const free = site.plan !== "paid"
  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className={label}>This week</p>
        <span className="text-[11px] font-semibold text-slate-600 bg-[#f8f7f6] rounded-full px-2.5 py-1">Weekly check · {fmtDate(l.finishedAt)}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-violet-600 tabular-nums">{s.named}</span>
        <span className="text-xl font-bold text-slate-400">of {s.of} answers named you this week</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {prev && (
          <span className="text-xs font-semibold text-slate-700 bg-[#f8f7f6] rounded-full px-3 py-1.5">
            {prev.kind === "baseline" ? "Day 0, same questions" : "Last week"}: {prev.named}
          </span>
        )}
        {avg !== null && (
          <span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${avgTone || "bg-[#f8f7f6] text-slate-700"}`}>
            4-week average: {avg.toFixed(1).replace(/\.0$/, "")}
          </span>
        )}
      </div>
      {shown.length > 1 && (
        <div className="mt-5 flex items-end gap-1.5 h-24" aria-label="Answers that named you, week by week">
          {shown.map((w, i) => (
            <div key={i} className={`flex-1 flex flex-col items-center justify-end h-full ${i < shown.length - 8 ? "hidden sm:flex" : ""}`}>
              <span className="text-[10px] text-slate-500 tabular-nums mb-0.5">{w.named}</span>
              <div className="w-full rounded-t bg-violet-500/80" style={{ height: `${Math.max(3, (w.named / max) * 100)}%` }} />
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        One week is noise: answers vary between asks. The 4-week average is the signal.
        {weeks.length < 4 && ` Trend appears after 4 checks (${weeks.length} of 4).`}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
        {engines.map((e) => (
          <Tile key={e} engine={e} named={s.engines[e].named} of={s.engines[e].of} />
        ))}
      </div>
      {free && (
        <p className="text-xs text-slate-500 mt-3">
          Free plan: {l.rows.length} questions × {engines.length} assistants, {l.samples} ask each ·{" "}
          {onShowBaseline && (
            <button type="button" onClick={onShowBaseline} className="text-violet-700 font-semibold hover:underline">
              View day-0 report
            </button>
          )}
          {onShowBaseline && " · "}
          <a href="/business#pricing" className="text-violet-700 font-semibold hover:underline">
            Compare plans
          </a>
        </p>
      )}
    </section>
  )
}

export function WhatChanged({ changes }: { changes: Change[] }) {
  const list = changes.slice(0, 5)
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">What changed this week</h2>
      {list.length === 0 ? (
        <p className="text-sm text-slate-600 mt-3">No changes since last week.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {list.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm leading-snug">
              <span
                className={`shrink-0 mt-0.5 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  c.type === "new" ? "bg-violet-100 text-violet-700" : c.type === "lost" ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"
                }`}
              >
                {c.type === "new" ? "+" : c.type === "lost" ? "−" : "•"}
              </span>
              <span>
                {c.type === "new" ? (
                  <>
                    <b>New:</b> {LABEL[c.engine]} named you for “{c.q}”
                  </>
                ) : c.type === "lost" ? (
                  <>
                    <b>Lost:</b> {LABEL[c.engine]} no longer names you for “{c.q}”
                  </>
                ) : (
                  <>
                    <b>New name instead of you:</b> {c.name} ({c.count})
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── who is named instead ──────────────────────────────────────────────────────────────────────

export function NamedInstead({ summary, you, firstLook }: { summary: Summary; you: string; firstLook?: boolean }) {
  const top = summary.named_instead.slice(0, 8)
  const max = Math.max(summary.named, ...top.map((r) => r.count), 1)
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">Named instead of you{firstLook ? " (first look)" : ""}</h2>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        Businesses the assistants named for your questions, counted like you: answers out of {summary.of}.
      </p>
      {top.length === 0 ? (
        <p className="text-sm text-slate-600 mt-4">No businesses named. The assistants gave general advice.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          <li>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-violet-700 truncate">You · {you}</span>
              <span className="font-bold text-violet-700 tabular-nums">{summary.named}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-violet-50 overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(summary.named / max) * 100}%` }} />
            </div>
          </li>
          {top.map((r) => (
            <li key={r.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium truncate">{r.name}</span>
                <span className="font-semibold text-slate-600 tabular-nums">{r.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── which sites the assistants rely on ────────────────────────────────────────────────────────

const TYPE: Record<string, { tag: string; action: string }> = {
  directory: { tag: "Directory & reviews", action: "Check your profile here is complete and current." },
  competitor: { tag: "Competitor", action: "They answer this on their own site. Publish your own answer." },
  roundup: { tag: "Media & guides", action: "A mention or an expert quote here is worth pursuing." },
  marketplace: { tag: "Marketplace", action: "Your listing here: description and reviews." },
  community: { tag: "Community", action: "Assistants read these discussions. Take part where you can genuinely help." },
  video: { tag: "Video", action: "A video that answers these questions can be cited too." },
  official: { tag: "Official", action: "An authority, not a rival. Cite it in your own pages." },
  reference: { tag: "Reference", action: "Nothing to do here directly." },
}

export function Sources({ summary }: { summary: Summary }) {
  const list = (summary.sources ?? []).slice(0, 10)
  const own = summary.own_cited ?? 0
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">Sites the assistants rely on</h2>
      <p className="text-xs text-slate-500 mt-1">Cited as sources for your questions. This is where to be present.</p>
      <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${own ? "bg-violet-50 text-violet-800" : "bg-[#f8f7f6] text-slate-700"}`}>
        {own ? `Your site: cited in ${own} answer${own === 1 ? "" : "s"}` : "Your site isn't cited yet."}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-slate-600 mt-4">The assistants cited no sources for these questions.</p>
      ) : (
        <ul className="mt-3 divide-y divide-black/[0.06]">
          {list.map((s) => (
            <li key={s.domain} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <a href={`https://${s.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-semibold truncate hover:text-violet-700">
                    {s.domain}
                  </a>
                  {TYPE[s.type] && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-[#f8f7f6] rounded-full px-2 py-0.5">
                      {TYPE[s.type].tag}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-600 tabular-nums">
                  {s.count} answer{s.count === 1 ? "" : "s"}
                </span>
              </div>
              {TYPE[s.type] && <p className="text-xs text-slate-500 mt-0.5">{TYPE[s.type].action}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── where you're named: questions x assistants ────────────────────────────────────────────────

function LinkMark() {
  return (
    <svg viewBox="0 0 16 16" className="absolute -right-1.5 -top-1.5 w-3 h-3 text-emerald-600 bg-white rounded-full" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 014.5 9l1-1" strokeLinecap="round" />
    </svg>
  )
}

function Dot({ a }: { a?: EngineAnswer }) {
  if (!a || a.samples === 0) return <span title="Not checked" className="block w-4 h-4 rounded-full border-2 border-dashed border-slate-300" />
  if (a.named === 0) return <span title="Not named" className="block w-4 h-4 rounded-full border-2 border-slate-300" />
  const share = a.named / a.samples
  const shade = share >= 0.99 ? "bg-violet-700" : share >= 0.5 ? "bg-violet-500" : "bg-violet-300"
  return (
    <span title={`Named in ${a.named} of ${a.samples}`} className={`relative block w-4 h-4 rounded-full ${shade}`}>
      {a.cited > 0 && <LinkMark />}
    </span>
  )
}

const GROUPS = [
  { from: 0, to: 8, title: "Finding a provider" },
  { from: 8, to: 16, title: "Before choosing: costs and risks" },
  { from: 16, to: 20, title: "Deciding: comparisons" },
]

function Drawer({ row, engines, samples, asked, onClose }: { row: Row; engines: string[]; samples: number; asked?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/25" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-4 border-b border-black/5 flex items-start justify-between gap-3">
          <p className="font-bold leading-snug">{row.q}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-slate-400 hover:text-slate-700 -mt-1">
            ×
          </button>
        </div>
        <div className="p-5 space-y-3">
          {engines.map((e) => {
            const a = row.engines[e]
            if (!a) return null
            return (
              <div key={e} className="rounded-xl bg-[#f8f7f6] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{LABEL[e]}</span>
                  <span className="text-xs text-slate-600">
                    {a.samples === 0
                      ? "Couldn't check"
                      : a.named
                        ? `Named in ${a.named} of ${a.samples} ask${a.samples === 1 ? "" : "s"}${a.cited ? ` · linked your site ${a.cited}×` : ""}`
                        : `Not named in ${a.samples} ask${a.samples === 1 ? "" : "s"}`}
                  </span>
                </div>
                {a.snippet && <p className="text-sm text-slate-700 mt-2 leading-relaxed">“{a.snippet}”</p>}
                {a.named_instead.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">{a.named ? "Also named" : "Named instead"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.named_instead.map((n) => (
                        <span key={n} className="text-xs bg-white border border-black/10 rounded-full px-2.5 py-1">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {a.sources.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.sources.map((d) => (
                        <span key={d} className="text-xs text-slate-600 bg-white border border-black/10 rounded-full px-2.5 py-1">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-xs text-slate-500">
            {asked ? `Asked ${fmtDate(asked)}, ` : ""}web search on{samples > 1 ? `, ${samples} asks per assistant` : ""}.
          </p>
        </div>
      </aside>
    </div>
  )
}

export function WhereNamed({
  rows,
  engines,
  samples,
  asked,
  title = "Where you're named",
}: {
  rows: Row[]
  engines: string[]
  samples: number
  asked?: string
  title?: string
}) {
  const [openRow, setOpenRow] = useState<Row | null>(null)
  const grouped = rows.length === 20
  const groups = grouped ? GROUPS.map((g) => ({ ...g, rows: rows.slice(g.from, g.to) })) : [{ from: 0, to: rows.length, title: "", rows }]
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true })
  const cols = ENGINES.filter((e) => engines.includes(e))

  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        {samples > 1 ? `Darker dot = named in more of the ${samples} asks.` : "Filled dot = named."} Link mark = linked your site. Tap a
        question for the answers.
      </p>
      <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-600" /> named</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-slate-300" /> not named</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-dashed border-slate-300" /> not checked</span>
      </div>

      <div className="mt-4 sticky top-14 lg:top-0 z-10 bg-white/95 backdrop-blur flex justify-end py-1.5 border-b border-black/5">
        <div className="flex gap-0">
          {cols.map((e) => (
            <span key={e} className="w-11 sm:w-16 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {LABEL[e].slice(0, 5)}
            </span>
          ))}
        </div>
      </div>

      {groups.map((g, gi) => {
        const pairs = g.rows.reduce((n, r) => n + cols.filter((e) => (r.engines[e]?.samples ?? 0) > 0).length, 0)
        const named = g.rows.reduce((n, r) => n + cols.filter((e) => (r.engines[e]?.named ?? 0) > 0).length, 0)
        const isOpen = !grouped || open[gi]
        return (
          <div key={gi} className="mt-2">
            {grouped && (
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [gi]: !o[gi] }))}
                className="w-full flex items-center justify-between py-2.5 text-sm font-semibold"
                aria-expanded={isOpen}
              >
                <span>
                  {isOpen ? "▾" : "▸"} {g.title}
                </span>
                <span className="text-slate-500 font-medium tabular-nums">
                  {named} of {pairs}
                </span>
              </button>
            )}
            {isOpen && (
              <ul className="divide-y divide-black/[0.05]">
                {g.rows.map((r, i) => {
                  const instead = cols.flatMap((e) => r.engines[e]?.named_instead ?? []).filter((n, k, arr) => arr.indexOf(n) === k)
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setOpenRow(r)}
                        className="w-full text-left py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-[#f8f7f6] rounded-lg px-1"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="text-sm leading-snug line-clamp-2">{r.q}</span>
                          {instead.length > 0 && (
                            <span className="hidden lg:block text-xs text-slate-500 mt-0.5 truncate">Named instead: {instead.slice(0, 2).join(", ")}</span>
                          )}
                        </span>
                        <span className="flex self-end sm:self-auto">
                          {cols.map((e) => (
                            <span key={e} className="w-11 sm:w-16 flex justify-center">
                              <Dot a={r.engines[e]} />
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
      {openRow && <Drawer row={openRow} engines={cols} samples={samples} asked={asked} onClose={() => setOpenRow(null)} />}
    </section>
  )
}

// ── can the crawlers read the site ────────────────────────────────────────────────────────────

const BOT_OWNER: Record<string, string> = { GPTBot: "OpenAI's crawler", ClaudeBot: "Anthropic's crawler", PerplexityBot: "Perplexity's crawler" }

export function Crawlers({ audit }: { audit: Audit | "failed" | undefined }) {
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">Can AI crawlers read your site?</h2>
      {audit === undefined ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[#f8f7f6] animate-pulse" />
          ))}
        </div>
      ) : audit === "failed" ? (
        <p className="text-sm text-slate-600 mt-3">We couldn&apos;t run the crawler check just now. It runs again next time you open this page.</p>
      ) : audit.unreachable ? (
        <p className="text-sm text-red-700 mt-3">
          Your site refused us as a browser and as three crawlers. That is almost always bot protection, and it stops the AI
          crawlers the same way.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {audit.robots.bots.map((b) => {
              const live = audit.liveFetch.find((l) => l.bot === b.bot)
              const bad = b.verdict === "blocked" || live?.blocked
              const text =
                b.verdict === "blocked"
                  ? "Blocked in robots.txt"
                  : live?.blocked
                    ? `Blocked when we visited (HTTP ${live.status})`
                    : b.verdict === "allowed"
                      ? "Allowed"
                      : "Allowed by the general rule"
              return (
                <li key={b.bot} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f7f6] px-3.5 py-2.5">
                  <span className="text-sm min-w-0">
                    <span className="font-semibold">{b.bot}</span>
                    <span className="text-slate-500"> · {BOT_OWNER[b.bot] ?? "crawler"}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      bad ? "text-red-700 bg-red-50 border-red-200" : "text-green-700 bg-green-50 border-green-200"
                    }`}
                  >
                    {text}
                  </span>
                </li>
              )
            })}
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-slate-500">Pages in your sitemap</dt>
            <dd className="font-semibold text-right tabular-nums">
              {audit.surface.sitemapKind === "none" ? "No sitemap" : `${audit.surface.isFloor ? "≥" : ""}${audit.surface.urlCount.toLocaleString()}`}
            </dd>
            <dt className="text-slate-500">Pages that answer a question</dt>
            <dd className="font-semibold text-right tabular-nums">{audit.surface.answerPages.toLocaleString()}</dd>
            <dt className="text-slate-500">Words readable without JavaScript</dt>
            <dd className={`font-semibold text-right tabular-nums ${audit.serverRenderedWords < 200 ? "text-red-600" : ""}`}>
              {audit.serverRenderedWords.toLocaleString()}
            </dd>
            <dt className="text-slate-500">Structured data</dt>
            <dd className="font-semibold text-right">{audit.structuredData.count ? audit.structuredData.types.slice(0, 2).join(", ") || "Yes" : "None"}</dd>
            <dt className="text-slate-500">llms.txt (optional)</dt>
            <dd className="font-semibold text-right">{audit.llmsTxt ? "Yes" : "No"}</dd>
          </dl>
        </>
      )}
    </section>
  )
}

// ── what to do next ───────────────────────────────────────────────────────────────────────────

interface Step {
  id: string
  title: string
  why: string
}

export function nextSteps(site: SiteReport, audit: Audit | "failed" | undefined): Step[] {
  const out: Step[] = []
  // Steps come from the fullest report: a free site's weekly check is only five questions.
  const l = site.baseline && site.latest && site.latest.rows.length < site.baseline.rows.length ? site.baseline : site.latest
  const s = l?.summary
  if (audit && audit !== "failed" && !audit.unreachable) {
    const blocked = [
      ...audit.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
      ...audit.liveFetch.filter((b) => b.blocked).map((b) => b.bot),
    ].filter((b, i, arr) => arr.indexOf(b) === i)
    if (blocked.length)
      out.push({
        id: "crawlers",
        title: `Let ${blocked.join(", ")} in`,
        why: "They are turned away, so nothing on your site can be read or quoted. Usually one setting in robots.txt or the CDN.",
      })
  }
  if (s?.sources?.length && l) {
    const dir = s.sources.find((x) => x.type === "directory" || x.type === "marketplace")
    if (dir) out.push({ id: `dir:${dir.domain}`, title: `Check your profile on ${dir.domain}`, why: `Cited in ${dir.count} of ${s.of} answers.` })
    const rival = s.sources.find((x) => x.type === "competitor")
    if (rival) {
      let best: { q: string; n: number } | null = null
      for (const r of l.rows) {
        const n = Object.values(r.engines).filter((a) => a.sources.includes(rival.domain)).length
        if (n && (!best || n > best.n)) best = { q: r.q, n }
      }
      if (best)
        out.push({
          id: `answer:${rival.domain}`,
          title: `Publish your own answer to “${best.q}”`,
          why: `${rival.domain} is cited for it in ${best.n} answer${best.n === 1 ? "" : "s"}.`,
        })
    }
  }
  if (audit && audit !== "failed" && !audit.unreachable) {
    if (audit.serverRenderedWords < 200)
      out.push({
        id: "ssr",
        title: "Make your pages readable without JavaScript",
        why: `Only ${audit.serverRenderedWords} words of your homepage reach crawlers in the raw HTML.`,
      })
    if (audit.surface.sitemapKind === "none")
      out.push({ id: "sitemap", title: "Publish a sitemap", why: "Crawlers find your pages through it, and your site has none." })
  }
  if (s?.sources?.length) {
    const media = s.sources.find((x) => x.type === "roundup")
    if (media) out.push({ id: `media:${media.domain}`, title: `Get mentioned on ${media.domain}`, why: `Cited in ${media.count} answers for your questions.` })
  }
  return out.slice(0, 5)
}

export function NextSteps({ domain, steps, ready }: { domain: string; steps: Step[]; ready: boolean }) {
  // Rendered only after the report has loaded in the browser, so reading storage here is safe;
  // the parent keys this card by domain.
  const key = `itg_geo_done_${domain}`
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, boolean>
    } catch {
      return {}
    }
  })
  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] }
    setDone(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">Next steps</h2>
      {!ready ? (
        <p className="text-sm text-slate-500 mt-3">Fills in when your full report is ready.</p>
      ) : steps.length === 0 ? (
        <p className="text-sm text-slate-600 mt-3">Nothing urgent stands out. Keep an eye on the weekly checks.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {steps.map((st) => (
            <li key={st.id} className="flex gap-3">
              <input
                type="checkbox"
                checked={Boolean(done[st.id])}
                onChange={() => toggle(st.id)}
                aria-label="Mark done"
                className="mt-1 w-4 h-4 accent-violet-600 shrink-0"
              />
              <div className={done[st.id] ? "opacity-50" : ""}>
                <p className="text-sm font-semibold leading-snug">{st.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Why: {st.why}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ── placeholders and the plan ─────────────────────────────────────────────────────────────────

export function Pending({ title }: { title: string }) {
  return (
    <section className={card}>
      <h2 className="font-bold text-lg text-slate-400">{title}</h2>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
      <p className="text-xs text-slate-400 mt-4">Fills in when your full report is ready.</p>
    </section>
  )
}

export function PlanCard({ domain }: { domain: string }) {
  return (
    <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-7">
      <h2 className="font-extrabold text-xl">Want us to do this for you?</h2>
      <p className="text-sm text-white/80 mt-2 leading-relaxed">
        On the paid plan we publish articles on {domain} that answer these questions, fix what blocks AI crawlers, and check
        all 20 questions with all 4 assistants, 3 times each, every week.
      </p>
      <p className="text-sm text-white/60 mt-2 leading-relaxed">
        No one can promise that assistants will name you. We promise the work and an honest weekly count.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-lg font-bold">$499 / month</span>
        <a href="/business#pricing" className="sm:ml-auto inline-flex justify-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-semibold">
          See the paid plan
        </a>
      </div>
    </section>
  )
}

const FOLLOW_ERRORS: Record<string, string> = {
  limit_user: "The free plan follows up to 3 sites.",
  unreachable: "We couldn't open that site. If our check can't, AI crawlers may not either.",
  questions_failed: "We couldn't read enough text on that site to work out what its buyers ask.",
  invalid_url: "That doesn't look like a website address. Enter it like yourcompany.com.",
}

export function AddSite({
  onAdd,
  busy,
  error,
  first,
}: {
  onAdd: (site: string) => void
  busy: boolean
  error: { domain: string; error: string } | null
  first?: boolean
}) {
  const [v, setV] = useState("")
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{first ? "See what AI assistants say about you" : "Add a site"}</h2>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
        We put 20 questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity, 3 times each. About 10 minutes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (v.trim().length >= 3 && !busy) onAdd(v.trim())
        }}
        className="mt-4 flex flex-col sm:flex-row gap-2.5"
      >
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="yourcompany.com"
          aria-label="Your website address"
          className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          disabled={busy || v.trim().length < 3}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 text-sm font-semibold"
        >
          {busy ? "Starting…" : "Run my report"}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-700 mt-3">
          {error.domain}: {FOLLOW_ERRORS[error.error] ?? "That didn't work. Try again in a minute."}
        </p>
      )}
    </section>
  )
}
