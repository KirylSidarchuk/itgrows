"use client"

// The pieces of the AI-visibility page. Rules that hold on every card: counts, never percentages or
// scores; "you" is violet, everyone else slate; an assistant that could not be checked is shown as
// such and left out of the totals — it never counts as "not named"; nothing is projected.
//
// The detailed report is paid for. Until it is, the server sends a preview (access "preview"): the
// counts, the questions of the quick check with their answers, the rest as the question alone
// ("locked" rows), three names given instead and how many sites are quoted. Nothing hidden reaches
// the browser, so a locked row is drawn as a placeholder, never as data.
//
// What is sold, said the same way on every page: the report is the diagnosis plus the plan of what
// WE do about it; the plan is us doing that work. The report never teaches how to do it yourself:
// a step says what we do, why (the evidence) and what it should change — no how-to, no guides.
// Clients on the plan, and clients we set up by hand (site.client), read every step as "We're on it".

import { Fragment, useEffect, useState, type ReactNode } from "react"
import { ENGINE_ICONS } from "../../engine-icons"
import { CREDIT_DAYS, GEO_PRICES, REPORT_SITES, SAMPLE_PATH, type GeoInterval } from "@/lib/geo-pricing"

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
  /** Absent on a locked row: the preview sends only the question. */
  engines?: Record<string, EngineAnswer>
  /** Preview: the answers to this question are in the full report only. */
  locked?: boolean
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
  /** Preview: how many names given instead are left out of named_instead. */
  rivalsMore?: number
  /** Preview: how many cited sites the full report lists (sources is then empty). */
  sourcesMore?: number
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
  /** "preview" until the report is bought or the site is on the plan. Absent means full. */
  access?: "full" | "preview"
  /** A client we set up by hand (geo_clients) who owns this domain: read like a site on the plan. */
  client?: boolean
  /** creditUntil: the report's price comes off the first plan payment until then. */
  research?: { paidAt: string | null; creditUntil: string | null }
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

/** Questions of a report whose answers are in the full report only. */
export const lockedCount = (rows: Row[]) => rows.filter((r) => r.locked).length

/** A preview site: its detailed report is not bought and it is not on the plan. */
export const isPreview = (site: SiteReport) => site.access === "preview"

/** We do the work for this site: it is on the plan, or a client we set up by hand. No unlock, no
 *  offer of the plan; every step reads "We're on it". */
export const onPlan = (site: SiteReport) => site.plan === "paid" || site.client === true

/** The report the detailed cards come from: a weekly check of five questions is not the full
 *  picture, so the day-0 report stays it. */
export function fullReport(site: SiteReport) {
  return site.baseline && site.latest && site.latest.rows.length < site.baseline.rows.length ? site.baseline : site.latest
}

function Lock({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
    </svg>
  )
}

/** Grey bars standing in for data the preview does not have. Decorative only. */
function Placeholder({ lines = 3 }: { lines?: number }) {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-5/12"]
  return (
    <div aria-hidden className="space-y-2.5 blur-[2px] select-none">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`h-2.5 rounded-full bg-slate-200 ${widths[i % widths.length]}`} />
          <div className="ml-auto h-2.5 w-6 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  )
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
  // In a preview most rows carry no answers, so the per-assistant link count would undercount.
  const partial = lockedCount(l.rows) > 0
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
          <Tile key={e} engine={e} named={s.engines[e].named} of={s.engines[e].of} linked={partial ? undefined : (cited[e] ?? 0)} />
        ))}
      </div>
      {snip && (
        <figure className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <blockquote className="text-sm text-slate-800 leading-relaxed">“{plain(snip.text)}”</blockquote>
          <figcaption className="text-xs text-slate-500 mt-2">
            {LABEL[snip.e]}, asked “{snip.q}”
          </figcaption>
        </figure>
      )}
      {l.kind !== "weekly" && (
        <p className="text-xs text-slate-500 mt-3">This is the starting point every weekly check on the plan is compared with.</p>
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

export function WeeklyHero({ site, onShowBaseline, readOnly }: { site: SiteReport; onShowBaseline?: () => void; readOnly?: boolean }) {
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
  // Not on the plan: this week's check is a short one, so say how short and where the full picture is.
  const short = !onPlan(site) && !readOnly
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
      {short && (
        <p className="text-xs text-slate-500 mt-3">
          This check: {l.rows.length} questions × {engines.length} assistants, {l.samples} ask{l.samples === 1 ? "" : "s"} each.
          {onShowBaseline && (
            <>
              {" "}
              <button type="button" onClick={onShowBaseline} className="text-violet-700 font-semibold hover:underline">
                View day-0 report
              </button>
            </>
          )}
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
  const more = summary.rivalsMore ?? 0
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
      {more > 0 && <LockedMore text={`and ${more} more named instead of you`} />}
    </section>
  )
}

/** The line under a cut list in a preview: how much more the full report has. */
function LockedMore({ text }: { text: string }) {
  return (
    <div className="mt-4">
      <Placeholder lines={2} />
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
          <Lock className="w-3.5 h-3.5 text-violet-600" />
          {text}
        </span>
        <span className="text-slate-500">— in the full report.</span>
        <a href="#unlock" className="font-semibold text-violet-700 hover:underline">
          Unlock
        </a>
      </p>
    </div>
  )
}

// ── which sites the assistants rely on ────────────────────────────────────────────────────────

// What each kind of quoted site is. What we do about the ones that matter is in "Your plan".
const TYPE: Record<string, { tag: string; what: string }> = {
  directory: { tag: "Directory & reviews", what: "A directory with reviews: the assistants read the profiles here." },
  competitor: { tag: "Competitor", what: "A competitor answering your buyers' question on its own site." },
  roundup: { tag: "Media & guides", what: "An article or guide that lists providers." },
  marketplace: { tag: "Marketplace", what: "A marketplace: the assistants read the listings here." },
  community: { tag: "Community", what: "Discussions the assistants read." },
  video: { tag: "Video", what: "A video that answers these questions." },
  official: { tag: "Official", what: "An authority, not a rival." },
  reference: { tag: "Reference", what: "A reference work." },
}

export function Sources({ summary }: { summary: Summary }) {
  const list = (summary.sources ?? []).slice(0, 10)
  const own = summary.own_cited ?? 0
  const hidden = summary.sourcesMore ?? 0
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">Sites the assistants rely on</h2>
      <p className="text-xs text-slate-500 mt-1">Cited as sources for your questions: what the assistants read before they answer.</p>
      <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${own ? "bg-violet-50 text-violet-800" : "bg-[#f8f7f6] text-slate-700"}`}>
        {own ? `Your site: cited in ${own} answer${own === 1 ? "" : "s"}` : "Your site isn't cited yet."}
      </div>
      {hidden > 0 ? (
        <LockedMore text={`${hidden} source${hidden === 1 ? "" : "s"} the assistants quote`} />
      ) : list.length === 0 ? (
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
              {TYPE[s.type] && <p className="text-xs text-slate-500 mt-0.5">{TYPE[s.type].what}</p>}
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
                {a.snippet && <p className="text-sm text-slate-700 mt-2 leading-relaxed">“{plain(a.snippet)}”</p>}
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
  unlock,
}: {
  rows: Row[]
  engines: string[]
  samples: number
  asked?: string
  title?: string
  /** Preview: shown where the locked questions start. */
  unlock?: ReactNode
}) {
  const [openRow, setOpenRow] = useState<Row | null>(null)
  const grouped = rows.length === 20
  const groups = grouped ? GROUPS.map((g) => ({ ...g, rows: rows.slice(g.from, g.to) })) : [{ from: 0, to: rows.length, title: "", rows }]
  const firstLocked = rows.findIndex((r) => r.locked)
  // The group where the locked questions start is open, so the unlock panel is in view. Collapsed,
  // that group still shows the panel under its title: every "#unlock" link on the page lands on it.
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const at = grouped && firstLocked >= 0 ? groups.findIndex((g) => firstLocked < g.to) : 0
    return { 0: true, [at]: true }
  })
  const cols = ENGINES.filter((e) => engines.includes(e))

  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        {samples > 1 ? `Darker dot = named in more of the ${samples} asks.` : "Filled dot = named."} Link mark = linked your site. Tap a
        question for the answers.{firstLocked >= 0 && " Questions with a lock are answered in the full report."}
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
        const locked = lockedCount(g.rows)
        const isOpen = !grouped || open[gi]
        const holdsUnlock = Boolean(unlock) && firstLocked >= g.from && firstLocked < g.to
        return (
          <div key={gi} className="mt-2">
            {grouped && (
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [gi]: !o[gi] }))}
                className="w-full flex items-center justify-between gap-3 py-2.5 text-left text-sm font-semibold"
                aria-expanded={isOpen}
              >
                <span>
                  {isOpen ? "▾" : "▸"} {g.title}
                </span>
                {locked ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-slate-500 font-medium tabular-nums whitespace-nowrap">
                    <Lock className="w-3 h-3" />
                    {locked === g.rows.length ? "In the full report" : `${g.rows.length - locked} of ${g.rows.length} shown`}
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium tabular-nums">
                    {named} of {pairs}
                  </span>
                )}
              </button>
            )}
            {holdsUnlock && !isOpen && <div className="py-4">{unlock}</div>}
            {isOpen && (
              <ul className="divide-y divide-black/[0.05]">
                {g.rows.map((r, i) => {
                  if (r.locked)
                    return (
                      <Fragment key={i}>
                        {unlock && g.from + i === firstLocked && <li className="py-4">{unlock}</li>}
                        <li className="py-3 px-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="flex-1 min-w-0 text-sm leading-snug line-clamp-2 text-slate-600">
                            <Lock className="inline w-3 h-3 mr-1.5 -mt-0.5 text-slate-400" />
                            {r.q}
                          </span>
                          <span className="flex self-end sm:self-auto" aria-label="Answers in the full report">
                            {cols.map((e) => (
                              <span key={e} className="w-11 sm:w-20 flex justify-center">
                                <span aria-hidden className="block w-4 h-4 rounded-full bg-slate-200 blur-[2px]" />
                              </span>
                            ))}
                          </span>
                        </li>
                      </Fragment>
                    )
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
        <div className="mt-4 grid lg:grid-cols-2 gap-x-8 gap-y-4 items-start">
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

export function planSteps(site: SiteReport, audit: Audit | "failed" | undefined): Step[] {
  // Steps come from the fullest report. A preview keeps to the few steps its open questions support;
  // the full report lists every step, so it is always a superset of what the preview showed.
  const l = fullReport(site)
  if (!l) return []
  const preview = isPreview(site)
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

  // Content gaps: questions where the assistants named others and nobody named you.
  const gaps = l.rows
    .map((r, i) => {
      const eng = r.engines
      if (!eng) return null
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
    .slice(0, preview ? 2 : undefined)
  const used = new Set(gaps.map((g) => g.q))
  const content: Step[] = gaps.map((g) => {
    const top = g.names.slice(0, 3)
    return {
      id: `gap:${g.q}`,
      kind: "write",
      tag: "Article",
      title: `A page that answers “${g.q}”`,
      we: "We research and write the article, and publish it on your site.",
      why: `${g.checked === 1 ? "The assistant we could check didn't name you" : `None of the ${g.checked} assistants named you`} for it. ${andList(g.others.map((e) => LABEL[e]))} named ${andList(g.names.length > 3 ? [...top, "others"] : top)} instead.`,
      change: "The assistants get a page of yours that answers this question directly. The weekly check shows whether their answers start naming you.",
      you: ARTICLE_YOU,
    }
  })

  // The places the assistants quote instead of you: we prepare everything; from the owner only
  // what needs their own login or approval.
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
        why: `${market ? "A marketplace" : "A directory with reviews"} the assistants quote: ${
          c.n
            ? `cited in ${c.n} of ${s.of} answers to your questions; you're named in ${c.named ? `${c.named} of those ${c.n}` : "none of them"}.`
            : `cited in ${dir.count} of ${s.of} answers to your questions.`
        }`,
        change: `The answers that quote ${dir.domain} find a complete, current ${what} of yours there.`,
        you: `Signing in to ${dir.domain} to claim the ${what} (it has to be your own login), and approving the text.`,
      })
    }
    const rival = s.sources.find((x) => x.type === "competitor")
    if (rival) {
      let best: { q: string; n: number; named: number } | null = null
      for (const r of l.rows) {
        if (used.has(r.q)) continue
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
          why: `${rival.domain}, a competitor's site, is cited for it in ${answers(best.n)}; you're named in ${best.named ? `${best.named} of them` : "none of them"}.`,
          change: "The assistants get a fuller answer of yours to quote for this question. The weekly check shows whether they start citing your site or naming you.",
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
        why: `A media site or guide the assistants quote: ${
          c.n
            ? `cited in ${answers(c.n)} for your questions; you're named in ${c.named ? `${c.named} of them` : "none of them"}.`
            : `cited in ${answers(m.count)} for your questions.`
        }`,
        change: `If the editor uses it, the answers that quote ${m.domain} find you mentioned there.`,
        you: "Approving the letter: it goes out from your address.",
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
  ].slice(0, preview ? 6 : undefined)
}

/** Who reads the plan: an account not on it (the offer, "Start the plan"), a client on the plan or
 *  set up by hand ("We're on it"), or a visitor of the public sample (read-only; the plan's prices
 *  are on the home page). */
export type PlanMode = "offer" | "client" | "sample"

const PLAN_HOME = "/#geo-pricing"

const TAG_TONE: Record<Step["kind"], string> = {
  fix: "text-amber-800 bg-amber-50",
  write: "text-violet-700 bg-violet-50",
  place: "text-slate-600 bg-[#f8f7f6]",
}

function PlanStep({ n, step, client }: { n: number; step: Step; client: boolean }) {
  const line = "text-sm text-slate-600 leading-relaxed mt-1 break-words"
  const lead = "font-semibold text-[#1b1916]"
  const chip = "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
  return (
    <li className="rounded-xl border border-black/[0.07] bg-white p-4">
      <div className="flex gap-3">
        <span className="shrink-0 mt-px w-6 h-6 rounded-full grid place-items-center text-xs font-bold bg-violet-50 text-violet-700">{n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${chip} ${TAG_TONE[step.kind]}`}>{step.tag}</span>
            {step.optional && <span className={`${chip} text-slate-500 bg-[#f8f7f6]`}>Optional</span>}
            {client && <span className={`${chip} text-green-800 bg-green-50 border border-green-200`}>We&apos;re on it</span>}
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug break-words">{step.title}</p>
          <p className={`${line} mt-1.5`}>
            <span className={lead}>We do: </span>
            {step.we}
          </p>
          <p className={line}>
            <span className={lead}>Why: </span>
            {step.why}
          </p>
          <p className={line}>
            <span className={lead}>What it should change: </span>
            {step.change}
          </p>
          {step.you && (
            <p className={line}>
              <span className={lead}>From you: </span>
              {step.you}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/** The end of the report: what we do for the site, step by step. One button, "Start the plan", for an
 *  account not on it; "We're on it" on every step for a client. */
export function YourPlan({ site, steps, ready, mode }: { site: SiteReport; steps: Step[]; ready: boolean; mode: PlanMode }) {
  const client = mode === "client"
  const sample = mode === "sample"
  const more = mode === "offer" ? lockedSteps(site) : null
  const credit = mode === "offer" ? (site.research?.creditUntil ?? null) : null
  const planHref = sample ? PLAN_HOME : `/business/dashboard/plan?site=${encodeURIComponent(site.domain)}`
  const p = GEO_PRICES
  return (
    <section id="your-plan" className={`${card} scroll-mt-24`}>
      <h2 className="font-bold text-lg">Your plan</h2>
      {!ready ? (
        <p className="text-sm text-slate-500 mt-3">Fills in when your full report is ready.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {client
              ? `What we do for ${site.domain}, most important first. Each step says why and what it should change; the weekly check shows whether it did.`
              : sample
                ? `What we would do for ${site.domain}, most important first: why, from the report, and what it should change.`
                : `What we do for ${site.domain} on the plan, most important first: why, from your report, and what it should change.`}
          </p>
          {steps.length === 0 && !more && <p className="text-sm text-slate-600 mt-4">Nothing in this report stands out as urgent.</p>}
          {steps.length > 0 && (
            <ol className="mt-4 space-y-3">
              {steps.map((st, i) => (
                <PlanStep key={st.id} n={i + 1} step={st} client={client} />
              ))}
            </ol>
          )}
          {more && (
            <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/60 p-4 flex gap-3">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-[#1b1916]">More of your plan is in the full report ({p.research.label}):</span> the steps
                that come from your other {more.questions} questions{more.sources > 0 && ` and the ${more.sources} sites the assistants quote`}.{" "}
                <a href="#unlock" className="font-semibold text-violet-700 hover:underline">
                  Unlock
                </a>
              </p>
            </div>
          )}
          {client ? (
            <a href="/business/dashboard/articles" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
              Your articles →
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-[#1b1916] text-white p-5 sm:p-6">
              <p className="font-extrabold text-lg">We do all of this on the plan</p>
              <p className="text-sm text-white/80 mt-1.5 leading-relaxed">
                The articles, the fixes and the places the assistants quote, for {sample ? "your site" : site.domain}; and every week all 20
                questions put to all 4 assistants, 3 times each, so you see what moved.{isPreview(site) && " The full report comes with it."}
              </p>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                No one can promise that assistants will name you. We promise the work and an honest weekly count.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="flex-1 text-sm text-white/80">
                  <b className="text-white tabular-nums">{p.month.label}</b> a month plus a one-time {p.setup.label} setup. The setup is free with
                  3 months upfront (<b className="text-white tabular-nums">{p.quarter.label}</b>) or a year (<b className="text-white tabular-nums">{p.year.label}</b>, 20% off).
                </p>
                <a
                  href={planHref}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold"
                >
                  {sample ? "See the plan" : "Start the plan"}
                </a>
              </div>
              {!sample && (
                <a href={SAMPLE_PATH} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-semibold text-violet-200 hover:text-white hover:underline">
                  See a real report →
                </a>
              )}
              {credit && (
                <p className="text-sm text-violet-200 mt-3">
                  Your {p.research.label} report comes off the first payment if you start by {fmtDate(credit)}.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── the paid report: preview, unlock, credit ──────────────────────────────────────────────────

function beacon(event: string, props: Record<string, unknown>) {
  try {
    navigator.sendBeacon("/api/track", JSON.stringify({ event, path: window.location.pathname, props, anon_id: localStorage.getItem("itg_anon") }))
  } catch {}
}

/** Stripe Checkout for one site's detailed report. A site not followed yet is followed on payment. */
const CHECKOUT_ERRORS: Record<string, string> = {
  limit_user: "An account follows up to 3 sites, so this one can't be added. Nothing was charged.",
  unreachable: "We couldn't open that site. Check the address; nothing was charged.",
  invalid_domain: "That doesn't look like a website address. Nothing was charged.",
  questions_failed: "We couldn't read enough on that site to work out what its buyers ask. Nothing was charged.",
  limit_reads: "That's a lot of new sites for one day. Try again tomorrow; nothing was charged.",
  payment_processing: "Your payment for this report is in. It unlocks within a few minutes; refresh the page shortly.",
  slow: "Reading the site is taking longer than usual. Nothing was charged; try again in a few minutes.",
}

// A site not followed yet is read first (about a minute), so the payment never waits on it.
const PREPARE_POLL_MS = 5_000
const PREPARE_WAIT_MS = 3 * 60 * 1000

export function UnlockButton({ domain, where, label }: { domain: string; where: string; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setBusy(true)
    setError(null)
    beacon("geo_research_checkout", { domain, where })
    const deadline = Date.now() + PREPARE_WAIT_MS
    try {
      for (;;) {
        const r = await fetch("/api/geo/research-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        })
        const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string; preparing?: boolean }
        if (j.url) {
          window.location.href = j.url
          return
        }
        if (!j.preparing) {
          setError(j.error === "already_unlocked" ? "already" : r.status === 401 ? "signin" : (j.error ?? "failed"))
          break
        }
        if (Date.now() > deadline) {
          setError("slow")
          break
        }
        setPreparing(true)
        await new Promise((done) => setTimeout(done, PREPARE_POLL_MS))
      }
    } catch {
      setError("failed")
    }
    setPreparing(false)
    setBusy(false)
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full sm:w-auto rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-5 py-3 text-sm font-bold"
      >
        {preparing ? `Reading ${domain}…` : busy ? "Opening checkout…" : (label ?? `Unlock the full report — ${GEO_PRICES.research.label}`)}
      </button>
      {preparing && (
        <p className="text-sm text-slate-600 mt-2">
          First we read {domain} and work out what its buyers ask, about a minute. Checkout opens by itself; nothing is charged until
          you pay there.
        </p>
      )}
      {error === "already" && (
        <p className="text-sm text-slate-700 mt-2">
          This report is already unlocked.{" "}
          <a href={`/business/dashboard/visibility?site=${encodeURIComponent(domain)}`} className="font-semibold text-violet-700 hover:underline">
            Show it
          </a>
        </p>
      )}
      {error === "signin" && (
        <p className="text-sm text-red-700 mt-2">
          You&apos;re signed out.{" "}
          <a href="/login?callbackUrl=/business/dashboard/visibility" className="font-semibold underline">
            Sign in
          </a>{" "}
          and try again.
        </p>
      )}
      {error && error !== "already" && error !== "signin" && (
        <p className={`text-sm mt-2 ${error === "payment_processing" ? "text-slate-700" : "text-red-700"}`}>
          {CHECKOUT_ERRORS[error] ?? "Checkout didn't open, and nothing was charged. Try again in a minute."}
        </p>
      )}
    </div>
  )
}

/** The one unlock panel, placed where the locked questions start. */
export function UnlockPanel({ domain, report }: { domain: string; report: Report }) {
  const s = report.summary
  const questions = report.rows.length
  const engines = report.engines.length
  const rivals = s.named_instead.length + (s.rivalsMore ?? 0)
  const sources = s.sourcesMore ?? 0
  const inside = [
    `All ${questions} questions, with what each of the ${engines} assistants answered`,
    rivals ? `The ${rivals} businesses named instead of you, and how often` : "Who the assistants name instead of you",
    sources ? `The ${sources} sites the assistants quote most` : "The sites the assistants quote",
    "Your plan: what we do for your site, step by step, and why",
  ]
  return (
    <div id="unlock" className="scroll-mt-24 rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50 to-white p-5 sm:p-6">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
        <Lock className="w-3.5 h-3.5" />
        Below this line: the full report
      </p>
      <h3 className="mt-2 text-xl font-extrabold tracking-tight">
        See the full report — {questions * engines * report.samples} answers
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        {inside.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-violet-600 shrink-0">✓</span>
            {i}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline gap-x-2 flex-wrap">
        <span className="text-2xl font-extrabold tabular-nums">{GEO_PRICES.research.label}</span>
        <span className="text-sm text-slate-600">one payment, for {domain}</span>
      </p>
      <p className="text-sm text-slate-600 mt-1">Comes off your first plan payment if you start the plan within {CREDIT_DAYS} days.</p>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <UnlockButton domain={domain} where="panel" />
        <a href={SAMPLE_PATH} target="_blank" rel="noopener" className="text-center sm:text-left text-sm font-semibold text-violet-700 hover:underline">
          See a real report
        </a>
      </div>
    </div>
  )
}

/** Says openly, right under the headline, that this is a preview and what the rest costs. */
export function PreviewNote({ report }: { report: Report }) {
  const shown = report.rows.length - lockedCount(report.rows)
  const all = report.rows.length
  return (
    <div className="rounded-2xl bg-white/80 border border-violet-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 text-sm text-slate-700">
      <p className="flex-1 flex gap-2 leading-relaxed">
        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
        <span>
          The totals and the {shown} question{shown === 1 ? "" : "s"} from your quick check are open. The full report — all {all} questions,
          every assistant, who is named instead, which sources they quote, and your plan — is {GEO_PRICES.research.label}.
        </span>
      </p>
      <a href="#unlock" className="shrink-0 pl-6 sm:pl-0 font-semibold text-violet-700 hover:underline">
        What&apos;s in it ↓
      </a>
    </div>
  )
}

/** While the report's price still comes off the first plan payment. */
export function CreditNote({ site }: { site: SiteReport }) {
  const until = site.research?.creditUntil
  if (!until || onPlan(site)) return null
  return (
    <a
      href={`/business/dashboard/plan?site=${encodeURIComponent(site.domain)}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
    >
      {GEO_PRICES.research.label} comes off your first plan payment until {fmtDate(until)} →
    </a>
  )
}

/** The report from the headline down to the questions; the cabinet and the public sample share it.
 *  A preview puts the questions first, so the unlock panel sits where the locked part starts. */
export function ReportSections({
  site,
  showBase,
  onToggleBase,
  readOnly,
}: {
  site: SiteReport
  showBase?: boolean
  onToggleBase?: () => void
  readOnly?: boolean
}) {
  const latest = site.latest
  const full = fullReport(site)
  if (!latest || !full) return null
  const fromDay0 = full !== latest
  const preview = !readOnly && !onPlan(site) && isPreview(site) && lockedCount(full.rows) > 0
  const you = site.business || site.domain
  const rivalsAndSources = (
    <div className="grid xl:grid-cols-2 gap-5">
      <NamedInstead summary={full.summary} you={you} />
      <Sources summary={full.summary} />
    </div>
  )
  const questions = (
    <WhereNamed
      rows={full.rows}
      engines={full.engines}
      samples={full.samples}
      asked={full.finishedAt}
      unlock={preview ? <UnlockPanel domain={site.domain} report={full} /> : undefined}
    />
  )
  return (
    <>
      {latest.kind === "weekly" ? (
        <>
          <WeeklyHero site={site} onShowBaseline={site.baseline ? onToggleBase : undefined} readOnly={readOnly} />
          <WhatChanged changes={latest.summary.changes ?? []} />
          {fromDay0 && (
            <WhereNamed rows={latest.rows} engines={latest.engines} samples={latest.samples} asked={latest.finishedAt} title="This week's questions" />
          )}
        </>
      ) : (
        <Hero report={latest} />
      )}
      {preview && <PreviewNote report={full} />}
      {fromDay0 && (
        <p className="text-xs font-semibold text-slate-600 px-1">
          From {readOnly ? "the" : "your"} day-0 report · {fmtDate(full.finishedAt)} · {full.rows.length} questions × {full.engines.length} assistants,{" "}
          {full.samples} asks each
        </p>
      )}
      {fromDay0 && showBase && <Hero report={full} />}
      {preview ? (
        <>
          {questions}
          {rivalsAndSources}
        </>
      ) : (
        <>
          {rivalsAndSources}
          {questions}
        </>
      )}
    </>
  )
}

/** Preview: what the locked part of the report would add to the plan. */
function lockedSteps(site: SiteReport) {
  const full = fullReport(site)
  if (!full || !isPreview(site)) return null
  const questions = lockedCount(full.rows)
  return questions ? { questions, sources: full.summary.sourcesMore ?? 0 } : null
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

// The account's own report, and what another site's costs; said the same way wherever it comes up.
const reportSites = REPORT_SITES === 1 ? "one site" : `${REPORT_SITES} sites`
const REPORT_LIMIT = `Your account includes the report for ${reportSites}; for another site the report is ${GEO_PRICES.research.label}.`

export function AddSite({
  onAdd,
  busy,
  error,
  first,
  reportUsed,
}: {
  onAdd: (site: string) => void
  busy: boolean
  error: { domain: string; error: string } | null
  first?: boolean
  /** The account's report site is taken: another site's report is paid for. */
  reportUsed?: boolean
}) {
  const [v, setV] = useState("")
  // /api/geo/follow refuses a site past the account's report (402 "report_limit"), naming the domain
  // as the server spells it: its report is bought instead, and the purchase follows it.
  const limit = error?.error === "report_limit" ? error.domain : null
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">{first ? "See what AI assistants say about you" : "Add a site"}</h2>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
        We put 20 questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity, 3 times each. About 10 minutes.
        {reportUsed && ` ${REPORT_LIMIT}`}
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
      {limit ? (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-4">
          <p className="font-semibold">{REPORT_LIMIT}</p>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
            For {limit}: 20 questions its buyers ask, put to 4 assistants 3 times each, all of it open, with your plan. One payment; it comes
            off your first plan payment if you start the plan within {CREDIT_DAYS} days.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <UnlockButton domain={limit} where="second_site" label={`Get the report for ${limit} — ${GEO_PRICES.research.label}`} />
            <a href={SAMPLE_PATH} target="_blank" rel="noopener" className="text-center sm:text-left text-sm font-semibold text-violet-700 hover:underline">
              See a real report
            </a>
          </div>
        </div>
      ) : (
        error && (
          <p className="text-sm text-red-700 mt-3">
            {error.domain}: {FOLLOW_ERRORS[error.error] ?? "That didn't work. Try again in a minute."}
          </p>
        )
      )}
    </section>
  )
}
