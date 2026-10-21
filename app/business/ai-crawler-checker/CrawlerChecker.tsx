"use client"

import { useState } from "react"

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

const ROLE: Record<string, string> = {
  GPTBot: "OpenAI · training",
  "OAI-SearchBot": "OpenAI · ChatGPT search index",
  "ChatGPT-User": "OpenAI · fetches while answering",
  ClaudeBot: "Anthropic · crawler",
  "Claude-SearchBot": "Anthropic · search index",
  PerplexityBot: "Perplexity · index",
  Googlebot: "Google · Search, AI Overviews",
  Bingbot: "Microsoft · Bing (ChatGPT search, Copilot)",
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    navigator.sendBeacon("/api/track", JSON.stringify({ event, path: "/business/ai-crawler-checker", props, anon_id: localStorage.getItem("itg_anon") }))
  } catch {}
}

export default function CrawlerChecker() {
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
      if (!res.ok || j.error) setError(j.error ?? "That check did not complete. Try again.")
      else {
        setR(j)
        track("crawler_check_done", { site: j.site, blocked: (j.pathBlocks ?? []).filter((b) => b.blocked).map((b) => b.bot) })
      }
    } catch {
      setError("That check did not complete. Try again.")
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
          placeholder="yourcompany.com"
          aria-label="Your website address"
          className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          disabled={busy || url.trim().length < 3}
          className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-base font-semibold whitespace-nowrap"
        >
          {busy ? "Checking…" : "Check crawlers →"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {r?.unreachable && (
        <div className="mt-5 rounded-2xl bg-red-50 border border-red-200 p-5">
          <p className="font-bold">{r.site} refused every request we made</p>
          <p className="text-sm text-slate-700 mt-1">We tried as a browser and as three crawlers and got nothing back. That is almost always bot protection, and it stops AI crawlers the same way.</p>
        </div>
      )}

      {r && !r.unreachable && (
        <div className="mt-5 bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className={`px-5 py-5 border-b ${worst.length ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{r.site}</p>
            {worst.length ? (
              <>
                <p className="font-extrabold text-lg mt-1">
                  Your robots.txt closes {Math.max(...worst.map((w) => w.blocked))} of the {worst[0].checked} pages we checked to{" "}
                  {worst.map((w) => w.bot).join(", ")}
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Rule{worst[0].rules.length > 1 ? "s" : ""}: {worst[0].rules.map((x) => `“${x.rule}”`).join(", ")}. Rules match
                  prefixes, so a rule meant for one page closes every path that starts the same way.
                </p>
              </>
            ) : (
              <p className="font-extrabold text-lg mt-1">robots.txt lets these crawlers reach the pages in your sitemap</p>
            )}
          </div>

          <div className="divide-y divide-black/[0.06]">
            {(r.pathBlocks ?? []).map((b) => {
              const live = r.liveFetch.find((l) => l.bot === b.bot)
              return (
                <div key={b.bot} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{b.bot}</p>
                    <p className="text-xs text-slate-500">{ROLE[b.bot]}</p>
                    {b.blocked > 0 && b.examples[0] && <p className="text-xs text-red-700 mt-1 break-all">e.g. {b.examples[0]}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        b.blocked ? "text-red-700 bg-red-50 border-red-200" : "text-green-700 bg-green-50 border-green-200"
                      }`}
                    >
                      {b.blocked ? `${b.blocked} of ${b.checked} pages closed` : "All pages open"}
                    </span>
                    {live && (
                      <p className={`text-[11px] mt-1 ${live.blocked ? "text-red-700" : "text-slate-500"}`}>
                        {live.blocked ? `Server refused it (HTTP ${live.status})` : live.status ? `Server answered ${live.status}` : "No answer"}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm px-5 py-4 bg-[#f8f7f6]">
            <dt className="text-slate-500">robots.txt</dt>
            <dd className="text-right font-semibold">{r.robots.found ? "Found" : "None"}</dd>
            <dt className="text-slate-500">Pages in your sitemap</dt>
            <dd className="text-right font-semibold">{r.surface.sitemapKind === "none" ? "No sitemap found" : `${r.surface.isFloor ? "≥" : ""}${r.surface.urlCount.toLocaleString()}`}</dd>
            <dt className="text-slate-500">Words readable without JavaScript</dt>
            <dd className="text-right font-semibold">{r.serverRenderedWords.toLocaleString()}</dd>
            <dt className="text-slate-500">llms.txt</dt>
            <dd className="text-right font-semibold">{r.llmsTxt ? "Yes" : "No"}</dd>
          </dl>
          <div className="px-5 py-4">
            <a href="/business/ai-visibility-checker" className="block text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-semibold">
              Now check whether ChatGPT names you →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
