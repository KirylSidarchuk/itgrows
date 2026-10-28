"use client"

// The pieces of the AI-visibility page. Rules that hold on every card: counts, never percentages or
// scores; "you" is violet, everyone else slate; an assistant that could not be checked is shown as
// such and left out of the totals — it never counts as "not named"; nothing is projected.
//
// The detailed report is free once an account is created (since 27 Oct 2026) and always arrives
// whole: every question with its answers, everyone named instead, every cited source. An account gets
// it for one site, and a connection for one (lib/geo-pricing.ts); past that the page says "contact us
// and we'll run it for you" (AddSite), never a price.
//
// What is sold, said the same way on every page: the report is the diagnosis plus the plan of what
// WE do about it; the plan is us doing that work. The report never teaches how to do it yourself:
// a step says what we do, why (the evidence) and what it should change — no how-to, no guides.
// Clients on the plan, and clients we set up by hand (site.client), read each step with where it
// stands (site.work): the article's state, the launch items behind a fix, or what we set by hand;
// "Planned" until there is something to say. Never why, never our notes, never a forecast.

import { useEffect, useState } from "react"
import { ENGINE_ICONS } from "../../engine-icons"
import { YEAR_DISCOUNT, type GeoInterval, type GeoPrices } from "@/lib/geo-pricing"
import { listQuestions } from "@/lib/geo-list-question"
import { useT } from "@/components/i18n/LocaleProvider"
import visibilityOpening from "@/lib/i18n/messages/visibilityOpening"

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
  engines?: Record<string, EngineAnswer>
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
  /** The run, to open it from the history. */
  id?: string
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
  /** A client we set up by hand (geo_clients) who owns this domain: read like a site on the plan. */
  client?: boolean
  planInterval?: GeoInterval | null
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
  /** Every finished report, oldest first, counts only (lib/geo-report.ts). */
  history: HistoryRun[]
  teaser: { engines: string[]; summary: Summary; rows: Row[]; finishedAt: string } | null
  /** A client's own site only: where the plan's work stands (lib/geo-report.ts planWork). */
  work?: PlanWork | null
  /** The site profile's questions as the generator wrote them, null for a profile written by hand
   *  (lib/geo-list-question.ts generatedQuestions): the answer key that makes questions 1-8 of the
   *  day-0 report list questions. Without it only their words decide. */
  generatedQuestions?: unknown[] | null
}
/** Keyed by the day-0 question as asked, and by launch item or "step:<step id>". */
export interface PlanWork {
  articles: Record<string, PlanArticle>
  launch: Record<string, LaunchState>
  /** The latest weekly check, per question: named by how many of the assistants it could check. */
  week: { finishedAt: string; samples: number; named: Record<string, { named: number; of: number }> } | null
  day0: { samples: number; named: Record<string, { named: number; of: number }> }
}
export interface PlanArticle {
  state: "scheduled" | "written" | "approval" | "published" | "stopped"
  /** scheduled / written: the day it goes live (YYYY-MM-DD, UTC); approval / published: when it was sent. */
  date: string | null
  url: string | null
  title: string
}
export interface LaunchState {
  status: string
  who: "you" | "us"
  updatedAt: string | null
  /** Belongs in the "Done" list (worked out on the server, so the page never learns how an item was
   *  confirmed). */
  done: boolean
  /** As "Your website" titles it; null for a step of the plan. */
  title: string | null
}
/** One finished report in the history; its answers load when it is opened (/api/geo/report/run). */
export interface HistoryRun {
  id: string
  kind: string
  finishedAt: string
  samples: number
  questions: number
  /** Equal for runs that asked the same questions the same number of times: only those compare. */
  basis: string
  named: number
  of: number
  engines: Record<string, { named: number; of: number }>
  /** What a weekly check was compared with; for the first week of a shorter check, day 0 read that way. */
  previous: { kind: string; finishedAt: string | null; named: number; of: number } | null
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

const ICON: Record<string, string> = Object.fromEntries(ENGINE_ICONS.map((i) => [i.label, i.d]))

function EngineMark({ engine, className = "w-4 h-4" }: { engine: string; className?: string }) {
  const d = ICON[LABEL[engine]]
  if (!d) return null
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  )
}

/** Answers arrive as markdown; quoted on a card they should read as plain sentences. */
export function plain(s: string) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\d+\]/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/(^|\s)[*_](\S)/g, "$1$2")
    .replace(/(\S)[*_](?=\s|$|[.,;:!?])/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\s+[-•]\s+/g, " · ")
    .replace(/\s+/g, " ")
    .trim()
}
const label = "text-[11px] font-bold uppercase tracking-wide text-slate-500"

export function fmtDate(iso?: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** "28 Oct", under a bar of the trend. */
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function citedByEngine(rows: Row[]) {
  const out: Record<string, number> = {}
  for (const r of rows) for (const [e, a] of Object.entries(r.engines ?? {})) if (a.cited > 0) out[e] = (out[e] ?? 0) + 1
  return out
}

function firstSnippet(rows: Row[], engines: string[]) {
  for (const r of rows)
    for (const e of engines) {
      const a = r.engines?.[e]
      if (a?.snippet) return { e, q: r.q, text: a.snippet }
    }
  return null
}

/** We do the work for this site: it is on the plan, or a client we set up by hand. No offer of the
 *  plan; each step says where it stands. */
export const onPlan = (site: SiteReport) => site.plan === "paid" || site.client === true

/** The report the detailed cards come from: a weekly check of five questions is not the full
 *  picture, so the day-0 report stays it. */
export function fullReport(site: SiteReport) {
  return site.baseline && site.latest && site.latest.rows.length < site.baseline.rows.length ? site.baseline : site.latest
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
  // The time grows with the asks: 240 (3 asks each) take about 6 minutes, 80 (one each) about 3.
  const minutes = Math.max(3, Math.ceil(1 + total / 50))
  return (
    <section className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
      <p className="font-bold text-violet-900">
        {waiting ? "In the queue" : weekly ? "The new check is running" : "Building your full report"}
      </p>
      <p className="text-sm text-violet-900/80 mt-1 leading-relaxed">
        {waiting
          ? "Many reports are running today. Yours starts as soon as there is room — we'll email you when it's ready."
          : pending.samples > 1
            ? `${pending.questions} buyer questions × ${pending.engines.length} assistants, ${pending.samples} asks each, because answers vary. About 10 minutes; we'll email you.`
            : `${pending.questions} buyer questions × ${pending.engines.length} assistants, each asked once. About ${minutes} minutes; we'll email you.`}
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
      <div className={`${label} flex items-center gap-1.5`}>
        <EngineMark engine={engine} className="w-3.5 h-3.5 text-slate-600" />
        {LABEL[engine]}
      </div>
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
          {l.kind === "weekly" ? "Regular check" : "Day-0 report"} · {fmtDate(l.finishedAt)}
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
          <blockquote className="text-sm text-slate-800 leading-relaxed break-words">“{plain(snip.text)}”</blockquote>
          <figcaption className="text-xs text-slate-500 mt-2 break-words">
            {LABEL[snip.e]}, asked “{snip.q}”
          </figcaption>
        </figure>
      )}
      {l.kind !== "weekly" && (
        <p className="text-xs text-slate-500 mt-3">On the plan, every check (once every two weeks) is compared with this starting point.</p>
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

/** "5 questions × 1 ask": how a run was measured, shown where two runs do not compare. */
const basisLabel = (h: HistoryRun) => `${h.questions} questions × ${h.samples} ask${h.samples === 1 ? "" : "s"}`

/** Assistants that did not answer every question of a run. Their missing answers are out of its
 *  total, so a smaller "of" is a partial week, not a drop. */
const unchecked = (h: HistoryRun) => ENGINES.filter((e) => h.engines[e] && h.engines[e].of < h.questions)

/** The basis of the latest report: what the trend and the changes in the history are measured on. */
const latestBasis = (site: SiteReport) => site.history[site.history.length - 1]?.basis

/** Weekly checks measured the same way as the latest one, oldest first. */
function sameBasis(site: SiteReport) {
  const basis = latestBasis(site)
  return site.history.filter((h) => h.kind === "weekly" && h.basis === basis)
}

/** Day 0 measured on `basis`, where the trend starts: the day-0 report itself when it asked the same
 *  questions as often, else day 0 read on the shorter weekly basis, which the VM keeps with the first
 *  weekly check of that basis (summary.previous). `id` opens the day-0 report either way. `partial`
 *  is the History row's test (an assistant that could not answer every question), so the bar and the
 *  row agree; day 0 read the weekly way keeps only its counts, so it cannot say and is not marked. */
function dayZero(history: HistoryRun[], basis: string | undefined) {
  const days0 = history.filter((h) => h.kind === "baseline")
  const same = days0.filter((h) => h.basis === basis).pop()
  if (same) return { id: same.id as string | undefined, named: same.named, of: same.of, partial: unchecked(same).length > 0 }
  const first = history.find((h) => h.kind === "weekly" && h.basis === basis && h.previous?.kind === "baseline")
  if (!first?.previous) return null
  return { id: days0[days0.length - 1]?.id, named: first.previous.named, of: first.previous.of, partial: false }
}

export function WeeklyHero({
  site,
  onShowBaseline,
  onOpenRun,
  readOnly,
}: {
  site: SiteReport
  onShowBaseline?: () => void
  /** Opens the report of a bar, as a row of the history does. */
  onOpenRun?: (id: string) => void
  readOnly?: boolean
}) {
  const l = site.latest!
  const s = l.summary
  const weeks = sameBasis(site)
  const last4 = weeks.slice(-4)
  const avg = last4.length === 4 ? last4.reduce((n, w) => n + w.named, 0) / 4 : null
  const prev8 = weeks.slice(-8, -4)
  const avgPrev = prev8.length === 4 ? prev8.reduce((n, w) => n + w.named, 0) / 4 : null
  const avgTone = avg !== null && avgPrev !== null && weeks.length >= 8 ? (avg > avgPrev ? "bg-green-50 text-green-800" : avg < avgPrev ? "bg-amber-50 text-amber-800" : "") : ""
  const prev = s.previous
  // The trend: day 0 measured the same way first, when there is one, then the weeks; 12 bars, 8 on a
  // phone, where day 0 stays and the oldest weeks drop.
  const day0 = dayZero(site.history, latestBasis(site))
  const lead = day0 ? 1 : 0
  const bars = [
    ...(day0 ? [{ ...day0, label: "Day 0" }] : []),
    ...weeks.slice(lead - 12).map((w) => ({ id: w.id as string | undefined, named: w.named, of: w.of, label: fmtDay(w.finishedAt), partial: unchecked(w).length > 0 })),
  ]
  const max = Math.max(1, ...bars.map((b) => b.of))
  const engines = ENGINES.filter((e) => s.engines[e])
  // This week's check asks fewer questions than day 0: say how short. The day-0 report opens from here.
  const short = !readOnly && fullReport(site) !== l
  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className={label}>Latest check</p>
        <span className="text-[11px] font-semibold text-slate-600 bg-[#f8f7f6] rounded-full px-2.5 py-1">Regular check · {fmtDate(l.finishedAt)}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-violet-600 tabular-nums">{s.named}</span>
        <span className="text-xl font-bold text-slate-400">of {s.of} answers named you in this check</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {prev && (
          <span className="text-xs font-semibold text-slate-700 bg-[#f8f7f6] rounded-full px-3 py-1.5">
            {prev.kind === "baseline" ? "Day 0, same questions" : "Previous check"}: {prev.named}
          </span>
        )}
        {avg !== null && (
          <span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${avgTone || "bg-[#f8f7f6] text-slate-700"}`}>
            4-check average: {avg.toFixed(1).replace(/\.0$/, "")}
          </span>
        )}
      </div>
      {bars.length > 1 && (
        <div className="mt-5 flex items-end gap-1.5" aria-label="Answers that named you, check by check">
          {bars.map((b, i) => {
            const cls = `flex-1 min-w-0 flex-col items-center ${i >= lead && i < bars.length - 8 + lead ? "hidden sm:flex" : "flex"}`
            const title = `${b.label}: named in ${b.named} of ${b.of}${b.partial ? " (partial)" : ""}`
            const body = (
              <>
                <span className="h-24 w-full flex flex-col items-center justify-end">
                  <span className="text-[10px] text-slate-500 tabular-nums mb-0.5">{b.named}</span>
                  <span
                    className={`block w-full rounded-t ${b.partial ? "bg-violet-300" : "bg-violet-500/80"}`}
                    style={{ height: `${Math.max(3, (b.named / max) * 100)}%` }}
                  />
                </span>
                <span className="mt-1 text-[10px] text-slate-500 whitespace-nowrap">{b.label}</span>
              </>
            )
            const id = b.id
            const open = onOpenRun
            return open && id ? (
              <button key={i} type="button" onClick={() => open(id)} title={title} className={`${cls} rounded hover:bg-[#f8f7f6]`}>
                {body}
              </button>
            ) : (
              <div key={i} title={title} className={cls}>
                {body}
              </div>
            )
          })}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        One check is noise: answers vary between asks. The 4-check average is the signal.
        {weeks.length < 4 && ` Trend appears after 4 checks (${weeks.length} of 4).`}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
        {engines.map((e) => (
          <Tile key={e} engine={e} named={s.engines[e].named} of={s.engines[e].of} />
        ))}
      </div>
      {(short || onShowBaseline) && (
        <p className="text-xs text-slate-500 mt-3">
          {short && `This check: ${l.rows.length} questions × ${engines.length} assistants, ${l.samples} ask${l.samples === 1 ? "" : "s"} each. `}
          {onShowBaseline && (
            <button type="button" onClick={onShowBaseline} className="text-violet-700 font-semibold hover:underline">
              View day-0 report
            </button>
          )}
        </p>
      )}
    </section>
  )
}

export function WhatChanged({ changes, title = "What changed since the last check" }: { changes: Change[]; title?: string }) {
  const list = changes.slice(0, 5)
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{title}</h2>
      {list.length === 0 ? (
        <p className="text-sm text-slate-600 mt-3">No changes since the last check.</p>
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
    <section className={`${card} min-w-0`}>
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
              <span className="min-w-0 font-bold text-violet-700 truncate">You · {you}</span>
              <span className="shrink-0 font-bold text-violet-700 tabular-nums">{summary.named}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-violet-50 overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(summary.named / max) * 100}%` }} />
            </div>
          </li>
          {top.map((r) => (
            <li key={r.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium truncate">{r.name}</span>
                <span className="shrink-0 font-semibold text-slate-600 tabular-nums">{r.count}</span>
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

// What each kind of quoted site is. What we do about the ones that matter is in "Your plan".
const TYPE: Record<string, { tag: string; what: string }> = {
  directory: { tag: "Directory & reviews", what: "A directory with reviews: the assistants read the profiles here." },
  competitor: { tag: "Competitor", what: "A competitor answering your buyers' question on its own site." },
  roundup: { tag: "Media & guides", what: "An article or guide that lists providers." },
  news: { tag: "News & media", what: "A news site the assistants quote." },
  marketplace: { tag: "Marketplace", what: "A marketplace: the assistants read the listings here." },
  community: { tag: "Community", what: "Discussions the assistants read." },
  video: { tag: "Video", what: "A video that answers these questions." },
  official: { tag: "Official", what: "An authority, not a rival." },
  reference: { tag: "Reference", what: "A reference work." },
}

export function Sources({ summary }: { summary: Summary }) {
  const list = (summary.sources ?? []).slice(0, 10)
  const own = summary.own_cited ?? 0
  return (
    <section className={`${card} min-w-0`}>
      <h2 className="font-bold text-lg">Sites the assistants rely on</h2>
      <p className="text-xs text-slate-500 mt-1">Cited as sources for your questions: what the assistants read before they answer.</p>
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
                {/* On a phone a long domain and its tag wrap onto two lines instead of widening the card. */}
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                  <a href={`https://${s.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="max-w-full text-sm font-semibold truncate hover:text-violet-700">
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
              {TYPE[s.type] && <p className="text-xs text-slate-500 mt-0.5 break-words">{TYPE[s.type].what}</p>}
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
            const a = row.engines?.[e]
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
                {a.snippet && <p className="text-sm text-slate-700 mt-2 leading-relaxed break-words">“{plain(a.snippet)}”</p>}
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
            <span key={e} title={LABEL[e]} className="w-11 sm:w-20 flex flex-col items-center gap-0.5 text-slate-600">
              <EngineMark engine={e} />
              <span className="hidden sm:block text-[10px] font-semibold">{LABEL[e]}</span>
            </span>
          ))}
        </div>
      </div>

      {groups.map((g, gi) => {
        const pairs = g.rows.reduce((n, r) => n + cols.filter((e) => (r.engines?.[e]?.samples ?? 0) > 0).length, 0)
        const named = g.rows.reduce((n, r) => n + cols.filter((e) => (r.engines?.[e]?.named ?? 0) > 0).length, 0)
        const isOpen = !grouped || open[gi]
        return (
          <div key={gi} className="mt-2">
            {grouped && (
              // The count is labelled, so a closed group that names you nowhere reads as a result, not as empty.
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [gi]: !o[gi] }))}
                className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 py-2.5 text-left text-sm font-semibold"
                aria-expanded={isOpen}
              >
                <span>
                  {isOpen ? "▾" : "▸"} {g.title}
                </span>
                <span className="pl-4 sm:pl-0 text-xs sm:text-sm text-slate-500 font-medium tabular-nums">
                  {g.rows.length} question{g.rows.length === 1 ? "" : "s"} · named in {named} of {pairs} answer{pairs === 1 ? "" : "s"}
                </span>
              </button>
            )}
            {isOpen && (
              <ul className="divide-y divide-black/[0.05]">
                {g.rows.map((r, i) => {
                  const instead = cols.flatMap((e) => r.engines?.[e]?.named_instead ?? []).filter((n, k, arr) => arr.indexOf(n) === k)
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
                            <span key={e} className="w-11 sm:w-20 flex justify-center">
                              <Dot a={r.engines?.[e]} />
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
        // Full width on the page: the crawlers and the numbers side by side on a wide screen.
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 items-start">
          <ul className="space-y-2">
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
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
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
        </div>
      )}
    </section>
  )
}

// ── your plan ─────────────────────────────────────────────────────────────────────────────────

/** One step of the plan: what we do, why (the evidence from the report or the crawler check) and
 *  what it should change. Never how to do it yourself. */
export interface Step {
  id: string
  /** fix: crawler access and indexing; write: an article we publish; place: a site the assistants quote. */
  kind: "fix" | "write" | "place"
  tag: string
  title: string
  /** What we do. */
  we: string
  /** The evidence: who was named instead, what is broken. */
  why: string
  /** What it should change and where that shows. Never a promise of being named. */
  change: string
  /** Only what needs the owner's own login or approval. */
  you?: string
  optional?: boolean
  /** An article step: the day-0 question it answers, word for word (its article is linked by it). */
  q?: string
}

const andList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const answers = (n: number) => `${n} answer${n === 1 ? "" : "s"}`

/** Answers (question x assistant) that cite a domain, and how many of them name the business. */
function citing(rows: Row[], domain: string) {
  let n = 0
  let named = 0
  for (const r of rows)
    for (const a of Object.values(r.engines ?? {}))
      if ((a.sources ?? []).includes(domain)) {
        n++
        if (a.named > 0) named++
      }
  return { n, named }
}

const ARTICLE_YOU = "Nothing to do. You see every article 2 days before it goes live, and can edit or stop it."
const HOSTING_YOU = "Access to your hosting or CDN settings, or a word to your developer."
const ADMIN_YOU = "Access to your site's admin, or a word to your developer."

/** A place step's evidence: where the assistants cited a site, and whether they named you there. A
 *  client's step stays from day 0 on, so it says when that was seen, in the past tense, as the Article
 *  steps do; the offer reads the latest report and speaks in the present. */
function seenIn(client: boolean, what: string, cited: string, named: string | null) {
  if (client) return `On day 0, ${what[0].toLowerCase()}${what.slice(1)} was cited in ${cited}${named ? `; you were named in ${named}` : ""}.`
  return `${what}: cited in ${cited}${named ? `; you're named in ${named}` : ""}.`
}

export function planSteps(site: SiteReport, audit: Audit | "failed" | undefined, client = false): Step[] {
  // Steps come from the fullest report, every one of them (the report is shown whole). A
  // client's plan is the day-0 report's, the one the work started from: a step stays when it starts
  // to work (its status says so) and the weekly checks never reshuffle it.
  const l = client ? (site.baseline ?? site.latest) : fullReport(site)
  if (!l) return []
  const s = l.summary
  const ok = audit && audit !== "failed" ? audit : null
  const crawlers: Step[] = []
  const tech: { ssr?: Step; sitemap?: Step; schema?: Step; llms?: Step } = {}

  if (ok?.unreachable) {
    crawlers.push({
      id: "crawlers",
      kind: "fix",
      tag: "Fix",
      title: "Let AI crawlers past your bot protection",
      we: "We find what turns the crawlers away and fix it, with you or your developer.",
      why: "Your site gave our check no answer at all, neither as a browser nor as GPTBot, ClaudeBot or PerplexityBot. That is usually bot protection (or the site was down at that moment), and bot protection stops AI crawlers the same way.",
      change: "The assistants' crawlers can read your pages again; the crawler check on this page shows it.",
      you: HOSTING_YOU,
    })
  } else if (ok) {
    const inRobots = ok.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot)
    const live = ok.liveFetch.filter((b) => b.blocked && !inRobots.includes(b.bot))
    const blocked = [...inRobots, ...live.map((b) => b.bot)].filter((b, i, arr) => arr.indexOf(b) === i)
    if (blocked.length) {
      const codes = [...new Set(live.map((b) => b.status))].map((c) => (c ? `HTTP ${c}` : "no answer"))
      const why = [
        inRobots.length ? `${andList(inRobots)} ${inRobots.length === 1 ? "is" : "are"} blocked in your robots.txt` : "",
        live.length ? `${inRobots.length ? "our" : "Our"} visit as ${andList(live.map((b) => b.bot))} got ${andList(codes)} from your server` : "",
      ].filter(Boolean)
      crawlers.push({
        id: "crawlers",
        kind: "fix",
        tag: "Fix",
        title: `Let ${andList(blocked)} in`,
        we: "We find the rule that turns them away and fix it, with you or your developer.",
        why: `${why.join("; ")}. While they are turned away, these assistants can't read your pages to quote them.`,
        change: `The crawler check on this page shows ${andList(blocked)} as allowed, so these assistants can read your pages.`,
        you: HOSTING_YOU,
      })
    }

    if (ok.serverRenderedWords < 200)
      tech.ssr = {
        id: "ssr",
        kind: "fix",
        tag: "Fix",
        title: "Make your pages readable without JavaScript",
        we: "We work out with your developer how to serve the text in the page's HTML itself.",
        why: `Only ${ok.serverRenderedWords} words of the page we sampled reach crawlers in the raw HTML. The rest needs JavaScript, which AI crawlers often don't run.`,
        change: "Crawlers that don't run JavaScript get your text. The crawler check on this page should count well over 200 words.",
        you: "A word to your developer, or access to your site builder.",
      }

    if (ok.surface.sitemapKind === "none")
      tech.sitemap = {
        id: "sitemap",
        kind: "fix",
        tag: "Fix",
        title: "Publish a sitemap",
        we: "We set up the sitemap and submit it to Google and Bing.",
        why: "It is one of the main ways crawlers find your pages, and we found none at /sitemap.xml or in your robots.txt.",
        change: "Crawlers and the search indexes the assistants use find all your pages; the crawler check on this page counts them.",
        you: "Access to your site's admin, and to Google Search Console and Bing Webmaster Tools.",
      }

    if (ok.structuredData.count === 0)
      tech.schema = {
        id: "schema",
        kind: "fix",
        tag: "Fix",
        title: site.city ? "Add LocalBusiness and FAQ markup" : "Add Organization and FAQ markup",
        we: "We write the markup and add it to your pages.",
        why: "We found no structured data (JSON-LD) on the page we sampled. It helps at the margins: it states who you are, where, and what you offer in a form machines read without guessing.",
        change: "Machines read who you are and what you offer without guessing; the crawler check on this page lists the markup it finds.",
        you: ADMIN_YOU,
      }

    if (!ok.llmsTxt)
      tech.llms = {
        id: "llms",
        kind: "fix",
        tag: "Fix",
        title: "Add an llms.txt file",
        we: "We write the file and put it on your site.",
        why: "We found none at /llms.txt. It is a proposed convention, not a standard, and there is little evidence the assistants rely on it yet. Cheap to add, so it comes last.",
        change: "The crawler check on this page shows llms.txt as Yes.",
        you: ADMIN_YOU,
        optional: true,
      }
  }

  // Content gaps: questions where the assistants named others and nobody named you. Never a list
  // question ("Best app for ...", "Which agency ..."; lib/geo-list-question.ts): the assistants answer
  // those from reviews, directories and app stores, the places the steps below cover, not from an
  // article of yours. seed-geo and the publisher's guard leave them out the same way.
  const listed = listQuestions(l.rows.map((r) => r.q), site.generatedQuestions)
  const gaps = l.rows
    .map((r, i) => {
      const eng = r.engines
      if (!eng || listed[i]) return null
      const checked = ENGINES.filter((e) => (eng[e]?.samples ?? 0) > 0)
      if (!checked.length || checked.some((e) => eng[e].named > 0)) return null
      const others = checked.filter((e) => (eng[e].named_instead ?? []).length > 0)
      if (!others.length) return null
      const tally = new Map<string, { name: string; n: number }>()
      for (const e of others)
        for (const name of new Set(eng[e].named_instead)) {
          const k = name.toLowerCase()
          const t = tally.get(k) ?? { name, n: 0 }
          t.n++
          tally.set(k, t)
        }
      const names = [...tally.values()].sort((a, b) => b.n - a.n).map((t) => t.name)
      return { q: r.q, i, checked: checked.length, others, names }
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.others.length - a.others.length || b.names.length - a.names.length || a.i - b.i)
  const used = new Set(gaps.map((g) => g.q))
  const content: Step[] = gaps.map((g) => {
    const top = g.names.slice(0, 3)
    const notYou = g.checked === 1 ? "the assistant we could check didn't name you" : `none of the ${g.checked} assistants named you`
    return {
      id: `gap:${g.q}`,
      q: g.q,
      kind: "write",
      tag: "Article",
      title: `A page that answers “${g.q}”`,
      we: "We research and write the article, and publish it on your site.",
      // A client's step stays from day 0 on, so its evidence says when it was seen.
      why: `${client ? `On day 0, ${notYou}` : notYou[0].toUpperCase() + notYou.slice(1)} for it. ${andList(g.others.map((e) => LABEL[e]))} named ${andList(g.names.length > 3 ? [...top, "others"] : top)} instead.`,
      change: "The assistants get a page of yours that answers this question directly. The check every two weeks shows whether their answers start naming you.",
      you: ARTICLE_YOU,
    }
  })

  // The places the assistants quote instead of you: we prepare everything; from the owner only
  // what needs their own login or approval. Only a directory or marketplace becomes a profile or
  // listing step; a competitor's site becomes an article of ours, never a listing; a news site
  // becomes a pitch to its journalist.
  const listings: Step[] = []
  const rivals: Step[] = []
  const media: Step[] = []
  if (s?.sources?.length) {
    const dir = s.sources.find((x) => x.type === "directory" || x.type === "marketplace")
    if (dir) {
      const c = citing(l.rows, dir.domain)
      const market = dir.type === "marketplace"
      const what = market ? "listing" : "profile"
      listings.push({
        id: `dir:${dir.domain}`,
        kind: "place",
        tag: market ? "Listing" : "Profile",
        title: `Your ${what} on ${dir.domain}`,
        we: `We prepare the ${what}: the text and every field, matching your site.`,
        why: seenIn(
          client,
          `${market ? "A marketplace" : "A directory with reviews"} the assistants quote`,
          `${c.n || dir.count} of ${s.of} answers to your questions`,
          c.n ? (c.named ? `${c.named} of those ${c.n}` : "none of them") : null,
        ),
        change: `The answers that quote ${dir.domain} find a complete, current ${what} of yours there.`,
        you: `Signing in to ${dir.domain} to claim the ${what} (it has to be your own login), and approving the text.`,
      })
    }
    const rival = s.sources.find((x) => x.type === "competitor")
    if (rival) {
      let best: { q: string; n: number; named: number } | null = null
      // The question it is cited for most that is neither an Article step above nor a list question.
      for (const [i, r] of l.rows.entries()) {
        if (used.has(r.q) || listed[i]) continue
        const cite = Object.values(r.engines ?? {}).filter((a) => (a.sources ?? []).includes(rival.domain))
        if (cite.length && (!best || cite.length > best.n)) best = { q: r.q, n: cite.length, named: cite.filter((a) => a.named > 0).length }
      }
      if (best)
        rivals.push({
          id: `answer:${rival.domain}`,
          kind: "write",
          tag: "Article",
          title: `A fuller answer than ${rival.domain} to “${best.q}”`,
          we: "We research and write the article, and publish it on your site.",
          why: client
            ? `On day 0, ${rival.domain}, a competitor's site, was cited for it in ${answers(best.n)}; you were named in ${best.named ? `${best.named} of them` : "none of them"}.`
            : `${rival.domain}, a competitor's site, is cited for it in ${answers(best.n)}; you're named in ${best.named ? `${best.named} of them` : "none of them"}.`,
          change: "The assistants get a fuller answer of yours to quote for this question. The check every two weeks shows whether they start citing your site or naming you.",
          you: ARTICLE_YOU,
        })
    }
    const m = s.sources.find((x) => x.type === "roundup")
    if (m) {
      const c = citing(l.rows, m.domain)
      media.push({
        id: `media:${m.domain}`,
        kind: "place",
        tag: "Media",
        title: `An expert quote on ${m.domain}`,
        we: `We find the article on ${m.domain} that covers your service and its editor, and write the letter to the editor.`,
        why: seenIn(
          client,
          "A media site or guide the assistants quote",
          `${answers(c.n || m.count)} for your questions`,
          c.n ? (c.named ? `${c.named} of them` : "none of them") : null,
        ),
        change: `If the editor uses it, the answers that quote ${m.domain} find you mentioned there.`,
        you: "Approving the letter: it goes out from your address.",
      })
    }
    const news = s.sources.find((x) => x.type === "news")
    if (news) {
      const c = citing(l.rows, news.domain)
      media.push({
        id: `news:${news.domain}`,
        kind: "place",
        tag: "PR",
        title: `A story or comment for ${news.domain}`,
        we: `We find the journalist at ${news.domain} who covers your field and write the pitch: a story, data or a comment they can use.`,
        why: seenIn(
          client,
          "A news site the assistants quote",
          `${answers(c.n || news.count)} for your questions`,
          c.n ? (c.named ? `${c.named} of them` : "none of them") : null,
        ),
        change: "If the journalist uses it, you're mentioned on a news site the assistants already quote.",
        you: "Approving the pitch: it goes out from your address.",
      })
    }
  }

  // Ordered by impact; the crawler-check steps are left out while the check is still running.
  return [
    ...crawlers,
    ...content,
    ...listings,
    ...rivals,
    ...(tech.ssr ? [tech.ssr] : []),
    ...(tech.sitemap ? [tech.sitemap] : []),
    ...(tech.schema ? [tech.schema] : []),
    ...media,
    ...(tech.llms ? [tech.llms] : []),
  ]
}

/** Who reads the plan: an account not on it (the offer, "Start the plan", at its own prices), a client
 *  on the plan or set up by hand (where each step stands), or a visitor of the public sample
 *  (read-only, and no price: the price test shows prices only in the cabinet, lib/geo-pricing.ts). */
export type PlanMode = "offer" | "client" | "sample"

const PLAN_HOME = "/#geo-pricing"

const TAG_TONE: Record<Step["kind"], string> = {
  fix: "text-amber-800 bg-amber-50",
  write: "text-violet-700 bg-violet-50",
  place: "text-slate-600 bg-[#f8f7f6]",
}

// ── a client's plan: where each step stands ──

const YOUR_ARTICLES = "/business/dashboard/articles"
/** "Write to us" in the cabinet: ?site= picks the site, ?report= asks us to run a site's report. */
const SUPPORT = "/business/dashboard/support"
const YOUR_WEBSITE = "/business/dashboard/settings"

/** What a step shows a client: one chip, at most one link, and for a published article the latest
 *  weekly count of its question. Never why something was skipped, our notes, or a forecast. */
export interface StepStatus {
  text: string
  tone: "planned" | "work" | "wait" | "you" | "done"
  link?: { href: string; text: string; external?: boolean }
  week?: string
}

// The colours "Your website" gives the same words (settings/page.tsx LAUNCH_PILL).
const STATUS_TONE: Record<StepStatus["tone"], string> = {
  planned: "text-slate-600 bg-[#f8f7f6] border border-black/[0.07]",
  work: "text-violet-700 bg-violet-50 border border-violet-200",
  wait: "text-sky-800 bg-sky-50 border border-sky-200",
  you: "text-amber-900 bg-amber-50 border border-amber-300",
  done: "text-green-800 bg-green-50 border border-green-200",
}

const PLANNED: StepStatus = { text: "Planned", tone: "planned" }
const ON_IT: StepStatus = { text: "We're on it", tone: "work" }
const CHECKING: StepStatus = { text: "We are checking", tone: "wait" }

/** A day the publisher counts in UTC ("2026-10-25"): the same date for every viewer. */
const fmtUtcDay = (d: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""

/** A launch item, or a step we set by hand, in the words "Your website" uses for it. */
function launchStatus(i: LaunchState, toYourWebsite: boolean): StepStatus {
  if (i.status === "ok" || i.status === "fixed") return { text: `Done ${fmtDate(i.updatedAt)}`.trim(), tone: "done" }
  if (i.status === "check") return CHECKING
  if (i.status === "you" || (i.who === "you" && ["issue", "handed", "todo"].includes(i.status)))
    return { text: "Needs you", tone: "you", link: toYourWebsite ? { href: YOUR_WEBSITE, text: "Your website →" } : undefined }
  if (i.status === "handed") return { text: "With your developer", tone: "wait" }
  return ON_IT
}

// The launch items behind each fix step (none behind "ssr": we work that out with the developer).
const FIX_ITEMS: Record<string, string[]> = {
  crawlers: ["firewall", "crawlers"],
  sitemap: ["sitemap", "gsc", "bing"],
  schema: ["structured_data"],
  llms: ["llms_txt"],
}
// Several items behind one fix: the one that waits on someone speaks for it, the client first.
const URGENCY = ["Needs you", "With your developer", "We are checking", "We're on it"]

function articleStatus(q: string, work: PlanWork): StepStatus {
  const a = work.articles[q]
  if (!a) return PLANNED
  if (a.state === "scheduled") return { text: `Scheduled for ${fmtUtcDay(a.date)}`, tone: "work" }
  if (a.state === "written")
    return { text: `Written, goes live ${fmtUtcDay(a.date)}`, tone: "work", link: { href: YOUR_ARTICLES, text: "Your articles →" } }
  if (a.state === "approval") return { text: "Sent to your WordPress for approval", tone: "wait" }
  if (a.state === "stopped") return { text: "Stopped by you", tone: "planned" }
  // Out. Its question's count once a weekly check has run since; day 0 beside it only when both
  // asked the same number of times (an answer counts as named in at least 1 of N asks).
  const w = work.week
  const now = w && a.date && Date.parse(w.finishedAt) > Date.parse(a.date) ? w.named[q] : undefined
  const then = w && work.day0.samples === w.samples ? work.day0.named[q] : undefined
  return {
    text: `Published ${fmtDate(a.date)}`.trim(),
    tone: "done",
    link: a.url ? { href: a.url, text: "Read it →", external: true } : undefined,
    week: now && now.of > 0 ? `Latest check: named by ${now.named} of ${now.of}${then && then.of > 0 ? ` (day 0: ${then.named} of ${then.of})` : ""}` : undefined,
  }
}

/** Where a step of a client's plan stands (site.work, lib/geo-report.ts planWork). */
export function stepStatus(step: Step, work: PlanWork | null | undefined): StepStatus {
  if (!work) return ON_IT
  if (step.q) return articleStatus(step.q, work)
  if (step.kind === "fix") {
    const items = (FIX_ITEMS[step.id] ?? []).map((k) => work.launch[k]).filter((i): i is LaunchState => Boolean(i))
    if (!items.length) return ON_IT
    const open = items
      .map((i) => launchStatus(i, true))
      .filter((st) => st.tone !== "done")
      .sort((a, b) => URGENCY.indexOf(a.text) - URGENCY.indexOf(b.text))
    // Every item behind it is in order by our daily check, yet the crawler check on this page still
    // finds the problem: one of the two is about to change.
    return open[0] ?? CHECKING
  }
  // A profile, listing, media, PR or rival-answer step: nothing checks that work, so only what we set
  // by hand (launch.py set <domain> step:<id>).
  const r = work.launch[`step:${step.id}`]
  return r && r.status !== "tip" ? launchStatus(r, false) : PLANNED
}

/** Under a client's plan, newest first: launch items the check saw fixed or we set in order by hand,
 *  steps we marked done, and the plan's articles that are out. */
function doneList(steps: Step[], work: PlanWork) {
  const out: { key: string; title: string; date: string | null; href?: string }[] = []
  for (const [key, i] of Object.entries(work.launch)) {
    if (!i.done) continue
    const title = key.startsWith("step:") ? steps.find((st) => `step:${st.id}` === key)?.title : i.title
    if (title) out.push({ key, title, date: i.updatedAt })
  }
  for (const [q, a] of Object.entries(work.articles))
    if (a.state === "published") out.push({ key: `article:${q}`, title: a.title || q, date: a.date, href: a.url ?? undefined })
  return out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}

const LINE = "text-sm text-slate-600 leading-relaxed mt-1 break-words"
const LEAD = "font-semibold text-[#1b1916]"
const CHIP = "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
const STEP_N = "shrink-0 mt-px w-6 h-6 rounded-full grid place-items-center text-xs font-bold bg-violet-50 text-violet-700"

/** Where a step stands, for a client: the chip and its link. */
function StatusChip({ status }: { status: StepStatus }) {
  return (
    <>
      <span className={`${CHIP} ${STATUS_TONE[status.tone]}`}>{status.text}</span>
      {status.link && (
        <a
          href={status.link.href}
          {...(status.link.external ? { target: "_blank", rel: "noopener" } : {})}
          className="text-xs font-semibold text-violet-700 hover:underline"
        >
          {status.link.text}
        </a>
      )}
    </>
  )
}

function PlanStep({ n, step, status }: { n: number; step: Step; status: StepStatus | null }) {
  return (
    <li className="rounded-xl border border-black/[0.07] bg-white p-4">
      <div className="flex gap-3">
        <span className={STEP_N}>{n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${CHIP} ${TAG_TONE[step.kind]}`}>{step.tag}</span>
            {step.optional && <span className={`${CHIP} text-slate-500 bg-[#f8f7f6]`}>Optional</span>}
            {status && <StatusChip status={status} />}
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug break-words">{step.title}</p>
          {status?.week && <p className="mt-1 text-xs font-semibold text-slate-700">{status.week}</p>}
          <p className={`${LINE} mt-1.5`}>
            <span className={LEAD}>We do: </span>
            {step.we}
          </p>
          <p className={LINE}>
            <span className={LEAD}>Why: </span>
            {step.why}
          </p>
          <p className={LINE}>
            <span className={LEAD}>What it should change: </span>
            {step.change}
          </p>
          {step.you && (
            <p className={LINE}>
              <span className={LEAD}>From you: </span>
              {step.you}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

// The Article steps for the buyer questions (planSteps' "gap:" steps) differ only in the question and
// its evidence. From ARTICLES_AS_ONE of them on they are one card: what we do, what it should change
// and what we need from you said once, then the questions, each with its evidence and, for a client,
// where its article stands. Every other step (fixes, profiles, the answer to a competitor's page,
// media) keeps its own card.
const ARTICLES_AS_ONE = 3
const ARTICLES_SHOWN = 3
type PlanItem = { step: Step } | { articles: Step[] }

function planItems(steps: Step[]): PlanItem[] {
  const articles = steps.filter((st) => st.id.startsWith("gap:"))
  if (articles.length < ARTICLES_AS_ONE) return steps.map((step) => ({ step }))
  const out: PlanItem[] = []
  for (const step of steps) {
    if (!step.id.startsWith("gap:")) out.push({ step })
    else if (step === articles[0]) out.push({ articles })
  }
  return out
}

function ArticlesStep({ n, steps, work, client }: { n: number; steps: Step[]; work: PlanWork | null | undefined; client: boolean }) {
  const [all, setAll] = useState(false)
  const shown = all ? steps : steps.slice(0, ARTICLES_SHOWN)
  return (
    <li className="rounded-xl border border-black/[0.07] bg-white p-4">
      <div className="flex gap-3">
        <span className={STEP_N}>{n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${CHIP} ${TAG_TONE.write}`}>{steps[0].tag}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug">Articles for {steps.length} of your buyer questions</p>
          <p className={`${LINE} mt-1.5`}>
            <span className={LEAD}>We do: </span>
            We research and write an article for each question, and publish it on your site.
          </p>
          <p className={LINE}>
            <span className={LEAD}>Why: </span>
            {client ? "On day 0 the assistants" : "The assistants"} named others for these questions, not you.
          </p>
          <ol className="mt-2 space-y-2">
            {shown.map((st) => {
              const status = client ? stepStatus(st, work) : null
              return (
                <li key={st.id} className="rounded-lg bg-[#f8f7f6] px-3 py-2.5">
                  {status && (
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <StatusChip status={status} />
                    </div>
                  )}
                  <p className="text-sm font-semibold leading-snug break-words">“{st.q}”</p>
                  {status?.week && <p className="mt-0.5 text-xs font-semibold text-slate-700">{status.week}</p>}
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed break-words">{st.why}</p>
                </li>
              )
            })}
          </ol>
          {steps.length > ARTICLES_SHOWN && (
            <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-2 text-xs font-semibold text-violet-700 hover:underline">
              {all ? "Show fewer" : `Show all ${steps.length} questions`}
            </button>
          )}
          <p className={`${LINE} mt-2`}>
            <span className={LEAD}>What it should change: </span>
            The assistants get a page of yours that answers each question directly. The check every two weeks shows whether their answers
            start naming you.
          </p>
          {steps[0].you && (
            <p className={LINE}>
              <span className={LEAD}>From you: </span>
              {steps[0].you}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/** The end of the report: what we do for the site, step by step. For an account not on the plan,
 *  "Start the plan" and "Talk to us", with its own prices (/api/geo/report price), right under the
 *  plan's summary and before the steps; for a client, where each step stands and what is done. The
 *  public sample names no price. The article steps for the buyer questions are one card (planItems). */
export function YourPlan({
  site,
  steps,
  ready,
  mode,
  prices,
}: {
  site: SiteReport
  steps: Step[]
  ready: boolean
  mode: PlanMode
  /** The account's plan prices; null while they load or if they could not be read: no price is named. */
  prices?: GeoPrices | null
}) {
  const client = mode === "client"
  const done = client && site.work ? doneList(steps, site.work) : []
  const sample = mode === "sample"
  const planHref = sample ? PLAN_HOME : `/business/dashboard/plan?site=${encodeURIComponent(site.domain)}`
  const p = sample ? null : (prices ?? null)
  const yearOff = `${Math.round(YEAR_DISCOUNT * 100)}% off`
  const items = planItems(steps)
  return (
    <section id="your-plan" className={`${card} scroll-mt-24`}>
      <h2 className="font-bold text-lg">Your plan</h2>
      {!ready ? (
        <p className="text-sm text-slate-500 mt-3">Fills in when your full report is ready.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {client
              ? `What we do for ${site.domain}, most important first. Each step says where it stands, why and what it should change; the check every two weeks shows whether it did.`
              : sample
                ? `What we would do for ${site.domain}, most important first: why, from the report, and what it should change.`
                : `What we do for ${site.domain} on the plan, most important first: why, from your report, and what it should change.`}
          </p>
          {/* The offer comes right under the summary, not after every step. */}
          {!client && (
            <div className="mt-4 rounded-xl bg-[#1b1916] text-white p-5 sm:p-6">
              <p className="font-extrabold text-lg">{steps.length > 0 ? "We do every step below on the plan" : "We do all of this on the plan"}</p>
              <p className="text-sm text-white/80 mt-1.5 leading-relaxed">
                The articles, the fixes and the places the assistants quote, for {sample ? "your site" : site.domain}; and every two weeks all 20
                questions put to all 4 assistants, 3 times each, so you see what moved.
              </p>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                No one can promise that assistants will name you. We promise the work and an honest count every two weeks.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {p ? (
                  <p className="flex-1 text-sm text-white/80">
                    <b className="text-white tabular-nums">{p.month.label}</b> a month plus a one-time {p.setup.label} setup. The setup is free with
                    3 months upfront (<b className="text-white tabular-nums">{p.quarter.label}</b>) or a year (<b className="text-white tabular-nums">{p.year.label}</b>, {yearOff}).
                  </p>
                ) : (
                  <p className="flex-1 text-sm text-white/80">
                    By the month plus a one-time setup; the setup is free with 3 months upfront or a year ({yearOff}).{" "}
                    {sample ? "You see your price after your free report." : "You see your price on the next page."}
                  </p>
                )}
                <a
                  href={planHref}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold"
                >
                  {sample ? "See the plan" : "Start the plan"}
                </a>
              </div>
              {!sample && (
                <a
                  href={`${SUPPORT}?site=${encodeURIComponent(site.domain)}`}
                  className="mt-3 inline-block text-sm font-semibold text-violet-200 hover:text-white hover:underline"
                >
                  Talk to us →
                </a>
              )}
            </div>
          )}
          {steps.length === 0 && <p className="text-sm text-slate-600 mt-4">Nothing in this report stands out as urgent.</p>}
          {items.length > 0 && (
            <ol className="mt-4 space-y-3">
              {items.map((it, i) =>
                "articles" in it ? (
                  <ArticlesStep key="articles" n={i + 1} steps={it.articles} work={site.work} client={client} />
                ) : (
                  <PlanStep key={it.step.id} n={i + 1} step={it.step} status={client ? stepStatus(it.step, site.work) : null} />
                )
              )}
            </ol>
          )}
          {done.length > 0 && (
            <div className="mt-5">
              <p className={label}>Done</p>
              <ul className="mt-2 rounded-xl border border-black/[0.07] bg-white divide-y divide-black/[0.06]">
                {done.map((d) => (
                  <li key={d.key} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <span aria-hidden className="mt-px font-bold text-green-700">✓</span>
                    <span className="min-w-0 flex-1 break-words">
                      {d.href ? (
                        <a href={d.href} target="_blank" rel="noopener" className="hover:underline">
                          {d.title}
                        </a>
                      ) : (
                        d.title
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500 tabular-nums">{fmtDate(d.date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {client ? (
            <a href={YOUR_ARTICLES} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
              Your articles →
            </a>
          ) : (
            steps.length > 0 && (
              <a href={planHref} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
                {sample ? "See the plan →" : "Start the plan →"}
              </a>
            )
          )}
        </>
      )}
    </section>
  )
}

/** The report from the headline down to the questions; the cabinet and the public sample share it. */
export function ReportSections({
  site,
  showBase,
  onToggleBase,
  onOpenRun,
  readOnly,
}: {
  site: SiteReport
  showBase?: boolean
  onToggleBase?: () => void
  /** The cabinet: a bar of the trend opens its report, as the history does. */
  onOpenRun?: (id: string) => void
  readOnly?: boolean
}) {
  const latest = site.latest
  const full = fullReport(site)
  if (!latest || !full) return null
  const fromDay0 = full !== latest
  const you = site.business || site.domain
  return (
    <>
      {latest.kind === "weekly" ? (
        <>
          <WeeklyHero site={site} onShowBaseline={site.baseline ? onToggleBase : undefined} onOpenRun={onOpenRun} readOnly={readOnly} />
          <WhatChanged changes={latest.summary.changes ?? []} />
          {fromDay0 && (
            <WhereNamed rows={latest.rows} engines={latest.engines} samples={latest.samples} asked={latest.finishedAt} title="Questions in this check" />
          )}
        </>
      ) : (
        <Hero report={latest} />
      )}
      {fromDay0 && (
        <p className="text-xs font-semibold text-slate-600 px-1">
          From {readOnly ? "the" : "your"} day-0 report · {fmtDate(full.finishedAt)} · {full.rows.length} questions × {full.engines.length} assistants,{" "}
          {full.samples === 1 ? "each asked once" : `${full.samples} asks each`}
        </p>
      )}
      {fromDay0 && showBase && <Hero report={full} />}
      {/* One column below xl: without it the column takes the width of the longest line and the cards
          run off a phone's screen. */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <NamedInstead summary={full.summary} you={you} />
        <Sources summary={full.summary} />
      </div>
      <WhereNamed rows={full.rows} engines={full.engines} samples={full.samples} asked={full.finishedAt} />
    </>
  )
}

// ── every report, newest first ────────────────────────────────────────────────────────────────

/** Every finished report of the site, newest first: the count, per assistant, and the change since
 *  day 0 where both were measured the same way. A row opens that report; the latest one is the page
 *  itself. The cabinet only: the public sample has no history to open. */
export function History({ site, openId, onOpen }: { site: SiteReport; openId: string | null; onOpen: (id: string) => void }) {
  const h = site.history
  const latest = h[h.length - 1]
  if (!latest) return null
  const day0 = dayZero(h, latest.basis)
  const onScreen = openId ?? latest.id
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">History</h2>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        Every report for {site.domain}, newest first. Change is against day 0, same questions.
      </p>
      <ul className="mt-3 divide-y divide-black/[0.06]">
        {[...h].reverse().map((r) => {
          const missing = unchecked(r)
          const same = r.basis === latest.basis
          const d = same && day0 && r.kind === "weekly" && !missing.length && r.of === day0.of ? r.named - day0.named : null
          const change = !same
            ? basisLabel(r)
            : r.id === day0?.id
              ? "Starting point"
              : d === null
                ? "—"
                : d === 0
                  ? "Same as day 0"
                  : `${d > 0 ? "+" : "−"}${Math.abs(d)} vs day 0`
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onOpen(r.id)}
                aria-current={r.id === onScreen ? "true" : undefined}
                className={`w-full text-left py-3 px-2 rounded-lg flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 ${
                  r.id === onScreen ? "bg-violet-50" : "hover:bg-[#f8f7f6]"
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold">{fmtDate(r.finishedAt)}</span>
                    <span className="text-slate-500">{r.kind === "weekly" ? "Regular check" : "Day-0 report"}</span>
                    {r.id === latest.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
                        Latest
                      </span>
                    )}
                    {missing.length > 0 && (
                      <span
                        title={`${missing.map((e) => LABEL[e]).join(", ")} couldn't be fully checked`}
                        className="text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 rounded-full px-2 py-0.5"
                      >
                        Partial
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
                    {ENGINES.filter((e) => r.engines[e]).map((e) => (
                      <span key={e} title={LABEL[e]} className="inline-flex items-center gap-1">
                        <EngineMark engine={e} className="w-3.5 h-3.5 text-slate-500" />
                        <span className="sr-only">{LABEL[e]}</span>
                        {r.engines[e].of ? (
                          <>
                            {r.engines[e].named}
                            <span className="text-slate-400">/{r.engines[e].of}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="shrink-0 flex items-baseline justify-between sm:justify-end gap-3">
                  <span className="text-sm text-slate-700">
                    Named in <b className="text-violet-700 tabular-nums">{r.named}</b> of {r.of}
                  </span>
                  <span
                    title={d !== null && day0 ? `Day 0, same questions: ${day0.named} of ${day0.of}` : undefined}
                    className={`sm:w-32 sm:text-right text-xs font-semibold tabular-nums ${d !== null && d > 0 ? "text-violet-700" : "text-slate-500"}`}
                  >
                    {change}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {h.length === 1 && latest.kind === "baseline" && (
        <p className="text-xs text-slate-500 mt-3">
          {onPlan(site) ? "The first regular check comes about two weeks after day 0." : "A check every two weeks comes with the plan."}
        </p>
      )}
    </section>
  )
}

/** A report opened from the history, drawn with the report's own cards in place of this week's. */
export function RunView({
  site,
  run,
  onBack,
  onRetry,
}: {
  site: SiteReport
  run: Report | "loading" | "failed"
  onBack: () => void
  onRetry: () => void
}) {
  const back = (
    <div>
      <button type="button" onClick={onBack} className="text-sm font-semibold text-violet-700 hover:underline">
        ← Back to {site.latest?.kind === "weekly" ? "the latest check" : "the latest report"}
      </button>
    </div>
  )
  if (run === "loading")
    return (
      <>
        {back}
        <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
      </>
    )
  if (run === "failed")
    return (
      <>
        {back}
        <div className={`${card} text-sm text-slate-700`}>
          We couldn&apos;t open this report.{" "}
          <button type="button" onClick={onRetry} className="font-semibold text-violet-700 hover:underline">
            Try again
          </button>
        </div>
      </>
    )
  // Laid out as ReportSections lays it.
  return (
    <>
      {back}
      <Hero report={run} />
      {run.kind === "weekly" && <WhatChanged changes={run.summary.changes ?? []} title="What changed in that check" />}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <NamedInstead summary={run.summary} you={site.business || site.domain} />
        <Sources summary={run.summary} />
      </div>
      <WhereNamed rows={run.rows} engines={run.engines} samples={run.samples} asked={run.finishedAt} />
    </>
  )
}

// ── placeholders and adding a site ────────────────────────────────────────────────────────────

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

const FOLLOW_ERRORS: Record<string, string> = {
  limit_user: "An account follows up to 3 sites.",
  unreachable: "We couldn't open that site. If our check can't, AI crawlers may not either.",
  questions_failed: "We couldn't read enough text on that site to work out what its buyers ask.",
  invalid_url: "That doesn't look like a website address. Enter it like yourcompany.com.",
}

/** /api/geo/follow's answers for a report past the free one: the account's site is taken
 *  ("report_limit") or this connection already had one ("report_ip_used", geo_check/service.py). */
export const REPORT_USED = new Set(["report_limit", "report_ip_used"])

export function AddSite({
  onAdd,
  busy,
  error,
  first,
  reportUsed,
}: {
  onAdd: (site: string) => void
  busy: boolean
  /** `domain` is empty when the page only knows the server would refuse a new site (after a reload). */
  error: { domain: string; error: string } | null
  first?: boolean
  /** The server would refuse a new site (/api/geo/report reportLimit): another site's report is run on request. */
  reportUsed?: boolean
}) {
  const m = useT(visibilityOpening)
  const [v, setV] = useState("")
  // Past the free report (REPORT_USED, naming the domain as the server spells it) the form gives way to
  // "contact us and we'll run it for you": any other site would be refused the same way. Never a price.
  if (error && REPORT_USED.has(error.error))
    return (
      <section className={card} aria-live="polite">
        <p className="font-bold text-lg leading-snug">{error.error === "report_ip_used" ? m.usedConnection : m.usedAccount}</p>
        {error.domain && <p className="text-sm text-slate-600 mt-1 break-words">{m.site(error.domain)}</p>}
        <a
          href={error.domain ? `${SUPPORT}?report=${encodeURIComponent(error.domain)}` : SUPPORT}
          className="mt-4 inline-flex justify-center w-full sm:w-auto rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-semibold"
        >
          {m.contact}
        </a>
      </section>
    )
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{first ? "See what AI assistants say about you" : "Add a site"}</h2>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
        We put 20 questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity. It takes a few minutes and it&apos;s free.
        {reportUsed && (
          <>
            {" "}
            {m.reportUsedHint}{" "}
            <a href={SUPPORT} className="font-semibold text-violet-700 hover:underline">
              {m.contact}
            </a>
          </>
        )}
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

/** The first screen while the site checked on the homepage is being followed ("Opening your answers for
 *  …", in place of an empty address form), and a retry when that fails: the page keeps the site and the
 *  check's handoff for it. One live region, so a screen reader hears the switch. */
export function OpeningSite({
  domain,
  busy,
  error,
  onRetry,
  onOther,
}: {
  domain: string
  busy: boolean
  /** The error /api/geo/follow returned; null while it is still working. */
  error: string | null
  onRetry: () => void
  onOther: () => void
}) {
  const m = useT(visibilityOpening)
  const failed = !busy && error !== null
  const reason = error === "unreachable" ? m.reasonSite : error === "questions_failed" ? m.reasonText : m.reasonOther
  return (
    <section className={card} aria-live="polite">
      {failed ? (
        <>
          <h2 className="font-bold text-lg break-words">{m.failedTitle(domain)}</h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{reason}</p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            >
              {m.retry}
            </button>
            <button
              type="button"
              onClick={onOther}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:underline focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {m.other}
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <span aria-hidden className="w-5 h-5 shrink-0 rounded-full border-2 border-violet-300 border-t-violet-700 animate-spin" />
          <h2 className="font-bold text-lg break-words min-w-0">{m.opening(domain)}</h2>
        </div>
      )}
    </section>
  )
}
