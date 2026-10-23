"use client"

import { useState } from "react"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { formatNumber } from "@/lib/i18n/format"
import { localePath } from "@/lib/i18n/paths"
import ns from "@/lib/i18n/messages/crawlerChecker"

interface PathBlock {
  bot: string
  checked: number
  blocked: number
  rules: { rule: string; count: number }[]
  examples: string[]
}
interface Result {
  site: string
  unreachable?: boolean
  robots: { found: boolean; bots: { bot: string; verdict: string }[] }
  liveFetch: { bot: string; status: number; blocked: boolean }[]
  surface: { urlCount: number; sitemapKind: "none" | "urlset" | "index"; isFloor: boolean }
  llmsTxt: boolean
  serverRenderedWords: number
  pathBlocks?: PathBlock[]
  error?: string
}

// The one error text /api/business/audit sends for a bad address; shown in the page's language.
const INVALID_ADDRESS = "That does not look like a public website address."

function track(event: string, props?: Record<string, unknown>) {
  try {
    navigator.sendBeacon("/api/track", JSON.stringify({ event, path: "/business/ai-crawler-checker", props, anon_id: localStorage.getItem("itg_anon") }))
  } catch {}
}

export default function CrawlerChecker() {
  const m = useT(ns)
  const locale = useLocale()
  const role = m.roles as Readonly<Record<string, string | undefined>>
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [r, setR] = useState<Result | null>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (url.trim().length < 3 || busy) return
    setBusy(true)
    setError("")
    setR(null)
    try {
      const res = await fetch("/api/business/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const j = (await res.json()) as Result
      if (!res.ok || j.error) setError(j.error === INVALID_ADDRESS ? m.invalidAddress : (j.error ?? m.failed))
      else {
        setR(j)
        track("crawler_check_done", { site: j.site, blocked: (j.pathBlocks ?? []).filter((b) => b.blocked).map((b) => b.bot) })
      }
    } catch {
      setError(m.failed)
    } finally {
      setBusy(false)
    }
  }

  const worst = r?.pathBlocks?.filter((b) => b.blocked > 0) ?? []

  return (
    <div className="max-w-3xl mx-auto text-left">
      <form onSubmit={run} className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-lg shadow-violet-600/5 flex flex-col sm:flex-row gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={m.placeholder}
          aria-label={m.inputLabel}
          className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          disabled={busy || url.trim().length < 3}
          className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-base font-semibold whitespace-nowrap"
        >
          {busy ? m.checking : m.submit}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {r?.unreachable && (
        <div className="mt-5 rounded-2xl bg-red-50 border border-red-200 p-5">
          <p className="font-bold">{m.refusedTitle(r.site)}</p>
          <p className="text-sm text-slate-700 mt-1">{m.refusedBody}</p>
        </div>
      )}

      {r && !r.unreachable && (
        <div className="mt-5 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className={`px-5 py-5 border-b ${worst.length ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{r.site}</p>
            {worst.length ? (
              <>
                <p className="font-extrabold text-lg mt-1">
                  {m.closesTitle(Math.max(...worst.map((w) => w.blocked)), worst[0].checked, worst.map((w) => w.bot).join(", "))}
                </p>
                <p className="text-sm text-slate-700 mt-1">{m.rulesLine(worst[0].rules.map((x) => x.rule))}</p>
              </>
            ) : (
              <p className="font-extrabold text-lg mt-1">{m.allOpenTitle}</p>
            )}
          </div>

          <div className="divide-y divide-black/[0.06]">
            {(r.pathBlocks ?? []).map((b) => {
              const live = r.liveFetch.find((l) => l.bot === b.bot)
              return (
                <div key={b.bot} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{b.bot}</p>
                    <p className="text-xs text-slate-500">{role[b.bot]}</p>
                    {b.blocked > 0 && b.examples[0] && <p className="text-xs text-red-700 mt-1 break-all">{m.example(b.examples[0])}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        b.blocked ? "text-red-700 bg-red-50 border-red-200" : "text-green-700 bg-green-50 border-green-200"
                      }`}
                    >
                      {b.blocked ? m.closedOf(b.blocked, b.checked) : m.allOpen}
                    </span>
                    {live && (
                      <p className={`text-[11px] mt-1 ${live.blocked ? "text-red-700" : "text-slate-500"}`}>
                        {live.blocked ? m.serverRefused(live.status) : live.status ? m.serverAnswered(live.status) : m.noAnswer}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm px-5 py-4 bg-[#f8f7f6]">
            <dt className="text-slate-500">robots.txt</dt>
            <dd className="text-right font-semibold">{r.robots.found ? m.found : m.none}</dd>
            <dt className="text-slate-500">{m.sitemapPages}</dt>
            <dd className="text-right font-semibold">{r.surface.sitemapKind === "none" ? m.noSitemap : `${r.surface.isFloor ? "≥" : ""}${formatNumber(locale, r.surface.urlCount)}`}</dd>
            <dt className="text-slate-500">{m.words}</dt>
            <dd className="text-right font-semibold">{formatNumber(locale, r.serverRenderedWords)}</dd>
            <dt className="text-slate-500">llms.txt</dt>
            <dd className="text-right font-semibold">{r.llmsTxt ? m.yes : m.no}</dd>
          </dl>
          <div className="px-5 py-4">
            <a href={localePath(locale, "/business/ai-visibility-checker")} className="block text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-semibold">
              {m.nextCta}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
