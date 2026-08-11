"use client"

import { useState, useRef } from "react"

type Verdict = "blocked" | "allowed" | "wildcard" | "none"

interface Audit {
  site: string
  unreachable?: boolean
  checkedUrl: string
  robots: { found: boolean; bots: { bot: string; verdict: Verdict }[] }
  liveFetch: { bot: string; status: number; blocked: boolean }[]
  humanStatus: number
  surface: { urlCount: number; sitemapKind: "none" | "urlset" | "index"; isFloor: boolean }
  llmsTxt: boolean
  structuredData: { count: number; types: string[] }
  serverRenderedWords: number
}

const TONE = {
  bad: "text-red-700 bg-red-50 border-red-200",
  good: "text-green-700 bg-green-50 border-green-200",
  warn: "text-amber-700 bg-amber-50 border-amber-200",
} as const
type Tone = keyof typeof TONE

const DOT = { bad: "bg-red-500", good: "bg-green-500", warn: "bg-amber-500" } as const

function Tile({ value, label, tone }: { value: string; label: string; tone: Tone }) {
  const colour = tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-green-600"
  return (
    <div className="bg-[#f8f7f6] rounded-xl p-3 sm:p-4 text-center">
      <div className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${colour}`}>{value}</div>
      <div className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-tight">{label}</div>
    </div>
  )
}

// Secondary conversion. The ads promise a free check, so the free check has to be the thing we
// can measure — asking a stranger to request a $499/mo service after two clicks is far too rare
// an event to tell us which keyword did the work.
const REPORT_CONVERSION = "AW-18160234884/GnV1COO4h-AcEITjvNND"

export default function AuditForm() {
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<Audit | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const [reportEmail, setReportEmail] = useState("")
  const [reportSent, setReportSent] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)

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

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setError("")
    setData(null)
    try {
      const res = await fetch("/api/business/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const j = (await res.json()) as Audit & { error?: string }
      if (!res.ok || j.error) setError(j.error ?? "That check did not complete. Try again.")
      else {
        setData(j)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120)
      }
    } catch {
      setError("That check did not complete. Try again.")
    } finally {
      setBusy(false)
    }
  }

  // An unreachable result carries only { site, unreachable } — reading robots/liveFetch off it
  // would throw and take the whole page down.
  const blocked =
    data && !data.unreachable
      ? [
          ...data.robots.bots.filter((b) => b.verdict === "blocked").map((b) => b.bot),
          ...data.liveFetch.filter((b) => b.blocked).map((b) => b.bot),
        ]
      : []
  const thin = (data?.surface.urlCount ?? 0) < 30

  return (
    <div className="max-w-2xl mx-auto text-left">
      <form onSubmit={run} className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-lg shadow-violet-600/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            aria-label="Your website address"
            className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button
            type="submit"
            disabled={busy || url.trim().length < 3}
            className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {busy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              "Check my site →"
            )}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </form>

      {data?.unreachable && (
        <div ref={resultRef} className="mt-5 scroll-mt-24 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-6 text-center bg-red-50 border-b border-red-200">
            <div className="text-3xl mb-2">🚧</div>
            <div className="font-extrabold text-base sm:text-lg leading-snug">
              {data.site} refused every request we made
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Not a typo — we tried as a browser and as three different crawlers, and got nothing back. That is almost
              always bot protection. It stops the answer engines exactly the same way.
            </p>
            <a
              href="#apply"
              className="block w-full text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 text-sm font-semibold"
            >
              Talk to us about it — $499/mo →
            </a>
          </div>
        </div>
      )}

      {data && !data.unreachable && (
        <div ref={resultRef} className="mt-5 scroll-mt-24 bg-white border border-black/10 rounded-2xl overflow-hidden">
          {/* Verdict */}
          <div
            className={`px-5 py-5 text-center border-b ${
              blocked.length ? "bg-red-50 border-red-200" : thin ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
            }`}
          >
            <div className="text-3xl mb-1">{blocked.length ? "⛔" : thin ? "⚠️" : "✅"}</div>
            <div className="font-extrabold text-base sm:text-lg leading-snug">
              {blocked.length ? (
                <>You are turning away {blocked.join(", ")}</>
              ) : thin ? (
                <>They can reach you — but there is almost nothing to read</>
              ) : (
                <>Reachable, with a real body of pages</>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">{data.site}</div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4">
            <Tile
              value={data.surface.urlCount > 0 ? `${data.surface.isFloor ? "≥" : ""}${data.surface.urlCount.toLocaleString()}` : "0"}
              label="pages findable"
              tone={thin ? "bad" : data.surface.urlCount < 200 ? "warn" : "good"}
            />
            <Tile
              value={data.serverRenderedWords.toLocaleString()}
              label="words without JS"
              tone={data.serverRenderedWords < 200 ? "bad" : data.serverRenderedWords < 500 ? "warn" : "good"}
            />
            <Tile
              value={String(data.structuredData.count)}
              label="structured blocks"
              tone={data.structuredData.count > 0 ? "good" : "warn"}
            />
            <Tile value={data.llmsTxt ? "Yes" : "No"} label="llms.txt" tone={data.llmsTxt ? "good" : "warn"} />
          </div>

          {/* Per-bot access */}
          <div className="px-4 pb-4 space-y-2">
            {data.robots.bots.map((b) => {
              const live = data.liveFetch.find((l) => l.bot === b.bot)
              const tone: Tone = b.verdict === "blocked" || live?.blocked ? "bad" : b.verdict === "allowed" ? "good" : "warn"
              const text =
                b.verdict === "blocked"
                  ? "Blocked in robots.txt"
                  : live?.blocked
                  ? `Server refuses it (HTTP ${live.status})`
                  : b.verdict === "allowed"
                  ? "Allowed"
                  : "Wildcard rule only"
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

          <div className="px-5 pb-5">
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              We cannot read your server logs — this shows whether they are allowed in and whether there is enough to
              hold them, not who visited.
            </p>
            {reportSent ? (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center mb-3">
                <p className="text-sm font-semibold text-green-800">On its way.</p>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  You will get the full findings and the fix list, written by a person, within a day.
                </p>
              </div>
            ) : (
              <form onSubmit={requestReport} className="mb-4">
                <p className="text-sm font-semibold mb-1">Want the full report and the fix list?</p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Everything above plus what to change, in what order, and which parts your developer needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="you@company.com"
                    aria-label="Email for the full report"
                    className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <button
                    type="submit"
                    disabled={reportBusy || !reportEmail.includes("@")}
                    className="px-5 py-3 rounded-xl bg-[#1b1916] hover:bg-[#33302c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {reportBusy ? "Sending…" : "Email it to me"}
                  </button>
                </div>
              </form>
            )}

            <a
              href="#apply"
              className="block w-full text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 text-sm font-semibold"
            >
              Fix this — $499/mo →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
