"use client"

import { useState, useRef, useEffect } from "react"
import AiAnswers, { type TeaserView } from "./AiAnswers"
import LocaleLink from "@/components/i18n/LocaleLink"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { formatNumber } from "@/lib/i18n/format"
import { localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/auditForm"

type Verdict = "blocked" | "allowed" | "wildcard" | "none"

interface Audit {
  site: string
  unreachable?: boolean
  checkedUrl: string
  robots: { found: boolean; bots: { bot: string; verdict: Verdict }[] }
  liveFetch: { bot: string; status: number; blocked: boolean }[]
  humanStatus: number
  surface: { urlCount: number; sitemapKind: "none" | "urlset" | "index"; isFloor: boolean; answerPages: number; partial: boolean }
  llmsTxt: boolean
  structuredData: { count: number; types: string[] }
  serverRenderedWords: number
  pathBlocks?: { bot: string; checked: number; blocked: number; rules: { rule: string; count: number }[]; examples: string[] }[]
}

const TONE = {
  bad: "text-red-700 bg-red-50 border-red-200",
  good: "text-green-700 bg-green-50 border-green-200",
  warn: "text-amber-700 bg-amber-50 border-amber-200",
} as const
type Tone = keyof typeof TONE

const DOT = { bad: "bg-red-500", good: "bg-green-500", warn: "bg-amber-500" } as const

// Secondary conversion. The ads promise a free check, so the free check has to be the thing we
// can measure — asking a stranger to request a $499/mo service after two clicks is far too rare
// an event to tell us which keyword did the work.
const REPORT_CONVERSION = "AW-18160234884/GnV1COO4h-AcEITjvNND"
// "GEO check done": the quick check came back with the assistants' answers. Once per site per page,
// so the ads can be judged by the cost of one finished check. gtag runs under Consent Mode basic
// (app/layout.tsx): the call is queued and reaches Google only after "Accept".
const CHECK_CONVERSION = "AW-18160234884/jlHTCPW47qYdEITjvNND"
const checksCounted = new Set<string>()

function countCheck(domain: string | undefined) {
  const key = domain || "?"
  if (checksCounted.has(key)) return
  checksCounted.add(key)
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    w.gtag?.("event", "conversion", { send_to: CHECK_CONVERSION })
  } catch {
    // Analytics never gets in the way.
  }
}

// How long the page follows an instant check before calling it failed. The VM keeps working, and a
// retry within a day returns its answers at once.
const TEASER_GIVE_UP_MS = 150_000

// The one error text /api/business/audit sends for a bad address; shown in the page's language.
const INVALID_ADDRESS = "That does not look like a public website address."

function track(event: string, props?: Record<string, unknown>) {
  try {
    navigator.sendBeacon("/api/track", JSON.stringify({ event, path: "/business", props, anon_id: localStorage.getItem("itg_anon") }))
  } catch {
    // Analytics never gets in the way.
  }
}

/** What the visitor typed, reduced to a bare domain for labels until the server says otherwise. */
function bareDomain(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
}

/** Someone checking our own site gets a wink instead of a check: no API is called for it. */
function isOurSite(raw: string) {
  return bareDomain(raw).replace(/:\d+$/, "").replace(/\.$/, "") === "itgrows.ai"
}

export default function AuditForm() {
  const m = useT(ns)
  const locale = useLocale()
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<Audit | null>(null)
  const [ours, setOurs] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  const [reportEmail, setReportEmail] = useState("")
  const [reportSent, setReportSent] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)

  // Card A: the instant check of what ChatGPT and Perplexity answer.
  const [ai, setAi] = useState<TeaserView | null>(null)
  const [aiOn, setAiOn] = useState(false)
  const [aiDomain, setAiDomain] = useState("")
  const [aiStart, setAiStart] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const aiToken = useRef(0)
  const aiRef = useRef<HTMLDivElement>(null)
  const [aiInView, setAiInView] = useState(true)
  const [pillDone, setPillDone] = useState(false)

  // Card B starts folded: the assistants' answers are the news, the crawler check explains them.
  const [bOpen, setBOpen] = useState(false)

  const aiRunning = aiOn && (!ai || ai.status === "running")
  const aiFailed = ai?.status === "failed"
  const aiDone = ai?.status === "done"

  useEffect(() => {
    if (!aiRunning) return
    const t = setInterval(() => setElapsed(Math.round((Date.now() - aiStart) / 1000)), 1000)
    return () => clearInterval(t)
  }, [aiRunning, aiStart])

  useEffect(() => {
    const el = aiRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => setAiInView(entry.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [aiOn])

  useEffect(() => {
    if (aiDone && aiInView) setPillDone(true)
  }, [aiDone, aiInView])

  // When the answers fail, the crawler check is all there is: open it, and offer a person's reply by
  // email. Not a free report: the detailed one is paid (lib/geo-pricing.ts).
  useEffect(() => {
    if (aiFailed) setBOpen(true)
  }, [aiFailed])

  const shownDomain = ai?.domain || aiDomain
  const signupHref = localePath(
    locale,
    `/signup?from=ai-check&site=${encodeURIComponent(shownDomain)}&callbackUrl=${encodeURIComponent(
      `/business/dashboard/visibility?site=${shownDomain}`
    )}`
  )

  function onCta(where: string) {
    try {
      localStorage.setItem(
        "itg_geo_handoff",
        JSON.stringify({ site: shownDomain, named: ai?.summary?.named ?? null, of: ai?.summary?.of ?? null, at: Date.now() })
      )
    } catch {}
    track("geo_cta_click", { where, domain: shownDomain, named: ai?.summary?.named, of: ai?.summary?.of })
  }

  async function startTeaser(target: string) {
    const token = ++aiToken.current
    const t0 = Date.now()
    setAi(null)
    setAiOn(true)
    setAiStart(t0)
    setElapsed(0)
    setPillDone(false)
    const show = (v: TeaserView) => {
      if (aiToken.current === token) setAi(v)
    }
    let v: TeaserView
    try {
      const res = await fetch("/api/geo/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      })
      v = (await res.json()) as TeaserView
      if (!v?.status) v = { status: "failed", error: "check_failed" }
    } catch {
      v = { status: "failed", error: "check_failed" }
    }
    show(v)
    while (aiToken.current === token && v.status === "running" && v.id) {
      if (Date.now() - t0 > TEASER_GIVE_UP_MS) {
        v = { ...v, status: "failed", error: "check_failed" }
        show(v)
        break
      }
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const res = await fetch(`/api/geo/teaser?id=${v.id}`, { cache: "no-store" })
        const next = (await res.json()) as TeaserView
        if (next?.status) v = { ...next, id: next.id ?? v.id }
      } catch {
        // A dropped poll is not a failed check; ask again.
      }
      show(v)
    }
    if (aiToken.current !== token) return
    if (v.status === "done") {
      track("geo_teaser_done", { domain: v.domain, named: v.summary?.named, of: v.summary?.of, ms: Date.now() - t0 })
      countCheck(v.domain)
    } else {
      track("geo_teaser_failed", { domain: v.domain ?? bareDomain(target), error: v.error, ms: Date.now() - t0 })
    }
  }

  async function requestReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportEmail.includes("@") || reportBusy || !data) return
    setReportBusy(true)
    try {
      const res = await fetch("/api/business/audit/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reportEmail, site: data.site, audit: data }),
      })
      if (res.ok) {
        try {
          const w = window as unknown as { gtag?: (...args: unknown[]) => void }
          w.gtag?.("event", "conversion", { send_to: REPORT_CONVERSION })
        } catch {
          // Never let reporting break the confirmation.
        }
        setReportSent(true)
      }
    } catch {
      // Silent: the audit result is already on screen and is the thing they came for.
    } finally {
      setReportBusy(false)
    }
  }

  async function run(e?: React.FormEvent) {
    e?.preventDefault()
    if (!url.trim() || busy) return
    if (isOurSite(url)) {
      // No check, no API call, no tracking: a friendly card where the results would be.
      aiToken.current++
      setAiOn(false)
      setAi(null)
      setError("")
      setData(null)
      setOurs(true)
      setTimeout(() => {
        urlRef.current?.focus()
        urlRef.current?.select()
      }, 0)
      return
    }
    setOurs(false)
    setBusy(true)
    setError("")
    setData(null)
    setBOpen(false)
    setAiDomain(bareDomain(url))
    track("geo_check_start", { domain: bareDomain(url) })
    void startTeaser(url)
    // One scroll, to the answers, and never again: the page must not jump while people read.
    setTimeout(() => aiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120)
    try {
      const res = await fetch("/api/business/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const j = (await res.json()) as Audit & { error?: string }
      if (!res.ok || j.error) setError(j.error === INVALID_ADDRESS ? m.invalidAddress : (j.error ?? m.failed))
      else setData(j)
    } catch {
      setError(m.failed)
    } finally {
      setBusy(false)
    }
  }

  function otherUrl() {
    urlRef.current?.focus()
    urlRef.current?.select()
    urlRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  // An unreachable result carries only { site, unreachable } — reading robots, liveFetch or surface
  // off it would throw and take the whole page down (it did: booba.net, 23 Oct).
  const blocked =
    data && !data.unreachable
      ? [
          ...data.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
          ...data.liveFetch.filter((b) => b.blocked).map((b) => b.bot),
        ]
      : []
  const answers = data && !data.unreachable ? (data.surface?.answerPages ?? 0) : 0
  const showEmailCapture = aiFailed

  return (
    <div className="max-w-2xl mx-auto text-left">
      <form onSubmit={run} className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-lg shadow-violet-600/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={urlRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={m.placeholder}
            aria-label={m.inputLabel}
            className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button
            type="submit"
            disabled={busy || aiRunning || url.trim().length < 3}
            className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {busy || aiRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {m.checking}
              </>
            ) : (
              m.submit
            )}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </form>

      {ours && (
        <div role="status" className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/70 px-5 py-5 text-center">
          <p className="font-extrabold text-base sm:text-lg leading-snug text-[#1b1916]">{m.oursTitle}</p>
          <p className="text-sm text-slate-600 mt-1.5">
            {m.oursTry} <span aria-hidden className="text-violet-600 font-bold">↑</span>
          </p>
        </div>
      )}

      {aiOn && (
        <div ref={aiRef} className="mt-5 scroll-mt-24">
          <AiAnswers
            view={ai}
            domain={aiDomain}
            elapsed={elapsed}
            signupHref={signupHref}
            onCta={onCta}
            onRetry={() => void run()}
            onOtherUrl={otherUrl}
          />
        </div>
      )}

      {data?.unreachable && (
        <div className="mt-5 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-6 text-center bg-red-50 border-b border-red-200">
            <div className="text-3xl mb-2">🚧</div>
            <div className="font-extrabold text-base sm:text-lg leading-snug">{m.unreachableTitle(data.site)}</div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{m.unreachableBody}</p>
            <LocaleLink
              href="/#apply"
              className="block w-full text-center rounded-xl border border-black/10 bg-white hover:bg-[#f8f7f6] text-[#1b1916] px-6 py-3.5 text-sm font-semibold"
            >
              {m.talkToUs}
            </LocaleLink>
          </div>
        </div>
      )}

      {data && !data.unreachable && (
        <div className="mt-5 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{m.crawlersEyebrow}</p>
          </div>
          {/* Verdict */}
          <div
            className={`mx-4 mt-3 rounded-xl px-5 py-5 text-center border ${
              blocked.length ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="text-3xl mb-1">{blocked.length ? "⛔" : "⚠️"}</div>
            <div className="font-extrabold text-base sm:text-lg leading-snug">
              {blocked.length
                ? m.turningAway(blocked.join(", "))
                : answers === 0
                  ? m.nothingToQuote
                  : m.canBeQuoted(answers, data.surface.urlCount)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{data.site}</div>
          </div>

          {/* The gap */}
          <div className="grid grid-cols-2 gap-2.5 p-4">
            <div className="bg-[#f8f7f6] rounded-xl p-4 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1b1916]">
                {data.surface.isFloor ? "≥" : ""}
                {formatNumber(locale, data.surface.urlCount)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-tight">{m.pagesReach(data.surface.partial)}</div>
            </div>
            <div className={`rounded-xl p-4 text-center ${answers === 0 ? "bg-red-50" : "bg-amber-50"}`}>
              <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${answers === 0 ? "text-red-600" : "text-amber-600"}`}>
                {formatNumber(locale, answers)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-tight">{m.answerAQuestion}</div>
            </div>
          </div>

          {/* A robots.txt rule closing pages of the sitemap: the trap that looks harmless */}
          {(() => {
            const hit = (data.pathBlocks ?? []).filter((b) => b.blocked > 0)
            if (!hit.length) return null
            return (
              <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <b>{m.robotsCloses(Math.max(...hit.map((h) => h.blocked)), hit[0].checked, hit.map((h) => h.bot).join(", "))}</b>
                {hit[0].rules[0] && <> {m.ruleNote(hit[0].rules[0].rule)}</>}{" "}
                <a href={localePath(locale, "/business/ai-crawler-checker")} className="underline">{m.details}</a>
              </div>
            )
          })()}

          {/* Bots, at a glance */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {data.robots.bots.map((b) => {
              const live = data.liveFetch.find((l) => l.bot === b.bot)
              const tone: Tone = b.verdict === "blocked" || live?.blocked ? "bad" : b.verdict === "allowed" ? "good" : "warn"
              return (
                <span key={b.bot} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${TONE[tone]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${DOT[tone]}`} />
                  {b.bot}
                </span>
              )
            })}
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={() => setBOpen((o) => !o)}
              className="w-full text-sm font-semibold text-violet-700 hover:text-violet-600 py-2"
              aria-expanded={bOpen}
            >
              {bOpen ? m.hideDetails : m.showProjection}
            </button>
          </div>

          {bOpen && (
            <>
              <div className="px-5 pb-1">
                <p className="text-sm text-slate-700 leading-relaxed">{m.answerPagesExplain(answers)}</p>
              </div>

              {/* Ninety days, with and without */}
              <div className="p-4">
                <div className="rounded-xl border border-black/10 overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#1b1916] text-white text-[11px] font-bold tracking-wide uppercase">{m.ownTitle}</div>
                  <div className="divide-y divide-black/[0.07]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-600">{m.today}</span>
                      <span className="font-extrabold text-lg tabular-nums">{answers}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-600">{m.in90Nothing}</span>
                      <span className="font-extrabold text-lg tabular-nums text-slate-400">{answers}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-violet-50">
                      <span className="text-sm font-semibold text-violet-900">{m.in90WithUs}</span>
                      <span className="font-extrabold text-lg tabular-nums text-violet-700">{answers + 36}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5">{m.arithmetic}</p>
              </div>

              {/* What we measured ourselves */}
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-[#f8f7f6] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">{m.logsEyebrow}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{rich(m.logsBody, { b: (c) => <b>{c}</b> })}</p>
                </div>
              </div>

              {/* Per-bot access */}
              <div className="px-4 pb-4 space-y-2">
                {data.robots.bots.map((b) => {
                  const live = data.liveFetch.find((l) => l.bot === b.bot)
                  const tone: Tone = b.verdict === "blocked" || live?.blocked ? "bad" : b.verdict === "allowed" ? "good" : "warn"
                  const text =
                    b.verdict === "blocked"
                      ? m.verdictBlocked
                      : live?.blocked
                      ? m.verdictRefused(live.status)
                      : b.verdict === "allowed"
                      ? m.verdictAllowed
                      : m.verdictWildcard
                  return (
                    <div key={b.bot} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#f8f7f6]">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[tone]}`} />
                        <span className="font-semibold text-sm truncate">{b.bot}</span>
                      </span>
                      <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${TONE[tone]}`}>{text}</span>
                    </div>
                  )
                })}
              </div>

              <div className="px-5 pb-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">{m.noLogs}</p>
              </div>
            </>
          )}

          <div className="px-5 pt-2 pb-5">
            {showEmailCapture &&
              (reportSent ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center mb-3">
                  <p className="text-sm font-semibold text-green-800">{m.gotIt}</p>
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">{m.gotItBody}</p>
                </div>
              ) : (
                <form onSubmit={requestReport} className="mb-4">
                  <p className="text-sm font-semibold mb-1">{m.wantPerson}</p>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{m.wantPersonBody}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder={m.emailPlaceholder}
                      aria-label={m.emailLabel}
                      className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button
                      type="submit"
                      disabled={reportBusy || !reportEmail.includes("@")}
                      className="px-5 py-3 rounded-xl bg-[#1b1916] hover:bg-[#33302c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {reportBusy ? m.sending : m.writeToMe}
                    </button>
                  </div>
                </form>
              ))}

            <LocaleLink
              href="/#geo-pricing"
              className="block w-full text-center rounded-xl border border-black/10 bg-white hover:bg-[#f8f7f6] text-[#1b1916] px-6 py-3.5 text-sm font-semibold"
            >
              {m.fixCta}
            </LocaleLink>
          </div>
        </div>
      )}

      {aiDone && !aiInView && !pillDone && (
        <button
          type="button"
          onClick={() => aiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#1b1916] text-white text-sm font-semibold px-5 py-3 shadow-xl"
        >
          {m.readyPill}
        </button>
      )}
    </div>
  )
}
