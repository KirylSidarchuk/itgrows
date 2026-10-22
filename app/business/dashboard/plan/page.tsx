"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { card, fmtDate, type SiteReport } from "../visibility/parts"

// The paid plan, for one site, built from that site's own report: the questions where others are
// named and it is not become the first articles; the directories and media the assistants cite
// become the places to be present. One button: Stripe Checkout, $499 a month, month to month.

const INCLUDED = [
  "Articles on your own domain that answer the questions your buyers ask, with sources, in your language",
  "Crawler and indexing fixes: robots.txt, sitemaps, Bing and Google, IndexNow",
  "All 20 questions to ChatGPT, Claude, Gemini and Perplexity, 3 asks each, every week",
  "A monthly report read by a person before it reaches you",
  "Nothing is published without your approval",
]

function plan(site: SiteReport) {
  const full = site.baseline && site.latest && site.latest.rows.length < site.baseline.rows.length ? site.baseline : site.latest
  if (!full) return { questions: [] as string[], places: [] as { domain: string; count: number }[] }
  const questions = full.rows
    .filter((r) => Object.values(r.engines).every((a) => !a.named) && Object.values(r.engines).some((a) => a.named_instead.length))
    .map((r) => r.q)
    .slice(0, 5)
  const places = (full.summary.sources ?? [])
    .filter((s) => ["directory", "roundup", "marketplace", "community"].includes(s.type))
    .slice(0, 3)
  return { questions, places }
}

export default function PlanPage() {
  const [sites, setSites] = useState<SiteReport[] | null>(null)
  const [domain, setDomain] = useState("")
  const [justPaid, setJustPaid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    fetch("/api/geo/report", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { sites: [] }))
      .then((j: { sites?: SiteReport[] }) => {
        const list = j.sites ?? []
        setJustPaid(p.get("paid") === "1")
        setSites(list)
        setDomain(p.get("site") || list[0]?.domain || "")
      })
      .catch(() => setSites([]))
  }, [])

  async function start() {
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/geo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
      if (j.url) {
        window.location.href = j.url
        return
      }
      setError(j.error === "already_paid" ? "This site is already on the paid plan." : "Checkout did not open. Try again in a minute.")
    } catch {
      setError("Checkout did not open. Try again in a minute.")
    }
    setBusy(false)
  }

  if (sites === null) return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><div className="h-48 rounded-2xl bg-white/60 animate-pulse" /></div>

  const site = sites.find((s) => s.domain === domain)
  if (!site) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className={card}>
          <h1 className="text-2xl font-extrabold">Articles written for you</h1>
          <p className="text-sm text-slate-600 mt-2">Add your site to the AI visibility report first; the plan is built from it.</p>
          <Link href="/business/dashboard/visibility" className="inline-block mt-4 rounded-xl bg-violet-600 text-white px-5 py-3 text-sm font-semibold">Open the report</Link>
        </section>
      </div>
    )
  }

  const paid = site.plan === "paid"
  const { questions, places } = plan(site)
  const named = site.latest?.summary.named
  const of = site.latest?.summary.of

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Articles written for you</h1>
        <p className="text-sm text-slate-600 mt-1">{[site.business, site.domain].filter(Boolean).join(" · ")}</p>
        {sites.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sites.map((s) => (
              <button key={s.domain} type="button" onClick={() => setDomain(s.domain)}
                className={`text-sm rounded-full px-3.5 py-1.5 font-medium ${s.domain === domain ? "bg-violet-600 text-white" : "bg-white/70 text-slate-700"}`}>
                {s.domain}
              </button>
            ))}
          </div>
        )}
      </header>

      {(paid || justPaid) ? (
        <section className="rounded-2xl bg-green-50 border border-green-200 p-6">
          <h2 className="font-extrabold text-lg text-green-900">{justPaid && !paid ? "Payment received — setting things up" : "You are on the paid plan"}</h2>
          <ol className="mt-3 space-y-2 text-sm text-green-900 list-decimal pl-5">
            <li>Within one business day we email you to connect publishing to {site.domain} (WordPress, a webhook, or a blog we host).</li>
            <li>You approve the first article topics; nothing is published without you.</li>
            <li>Your weekly check becomes the full one: 20 questions, 4 assistants, 3 asks.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/business/dashboard/settings" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Your website</Link>
            <Link href="/business/dashboard/support" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Write to us</Link>
          </div>
        </section>
      ) : (
        <>
          <section className={card}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Where you stand</p>
            <p className="mt-2 text-lg font-bold">
              {named !== undefined ? <>Named in {named} of {of} answers{site.latest ? <> · {fmtDate(site.latest.finishedAt)}</> : null}.</> : <>Your report is still being built.</>}
            </p>
            {questions.length > 0 && (
              <>
                <h2 className="font-bold mt-5">The first articles we would write</h2>
                <p className="text-xs text-slate-500 mt-1">Questions where the assistants named others and not you.</p>
                <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm">
                  {questions.map((q) => <li key={q}>{q}</li>)}
                </ol>
              </>
            )}
            {places.length > 0 && (
              <>
                <h2 className="font-bold mt-5">Where we would get you present</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {places.map((p) => <li key={p.domain}><b>{p.domain}</b> <span className="text-slate-500">— cited in {p.count} answers about your field</span></li>)}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-7">
            <h2 className="font-extrabold text-xl">What the plan includes</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              {INCLUDED.map((i) => <li key={i} className="flex gap-2"><span className="text-violet-300">✓</span>{i}</li>)}
            </ul>
            <p className="text-sm text-white/60 mt-4">No one can promise that assistants will name you. We promise the work and an honest weekly count.</p>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <span className="text-2xl font-extrabold">$499</span> <span className="text-white/70">/ month, month to month</span>
              </div>
              <button type="button" onClick={start} disabled={busy}
                className="sm:ml-auto rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 disabled:opacity-60 px-6 py-3.5 text-sm font-bold">
                {busy ? "Opening checkout…" : `Start for ${site.domain} — $499/month`}
              </button>
            </div>
            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
            <p className="text-xs text-white/50 mt-3">Secure payment by Stripe. Cancel any time from the billing portal.</p>
          </section>
        </>
      )}
    </div>
  )
}
