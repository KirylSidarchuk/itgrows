"use client"

import { useEffect, useState } from "react"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { ReportSections, YourPlan, card, fmtDate, fullReport, planSteps, type SiteReport } from "../dashboard/visibility/parts"

// The whole detailed report of our own appslift.com, from /api/geo/sample, drawn with the cabinet's
// own cards. Read-only: the answers open, nothing is followed or bought. "Your plan" comes from the
// report alone (no crawler check here) and leads to the plan on the home page.

const CHECK = "/#geo-check"

function PriceLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm leading-relaxed ${className}`}>
      The quick check: no signup, about 30 seconds. Create an account and we build this report for your site: the totals and the
      questions from your quick check are open, and the full report is {GEO_PRICES.research.label}, one payment. It comes off your
      first plan payment if you start the plan within {CREDIT_DAYS} days.
    </p>
  )
}

export default function SampleReport() {
  const [site, setSite] = useState<SiteReport | "missing" | null>(null)

  useEffect(() => {
    fetch("/api/geo/sample")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { site?: SiteReport }) => setSite(j.site?.latest ? j.site : "missing"))
      .catch(() => setSite("missing"))
  }, [])

  const report = site && site !== "missing" ? site : null
  const full = report ? fullReport(report) : null

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
      <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">Sample report</p>
        <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight break-words">A real report: {SAMPLE_DOMAIN}</h1>
        <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
          An app-store-optimisation agency (our own company). This is what the detailed report shows for your site.
        </p>
        {full && (
          <p className="mt-2 text-xs text-white/50">
            Checked {fmtDate(full.finishedAt)} · {full.rows.length} questions × {full.engines.length} assistants, {full.samples} asks each
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <a href={CHECK} className="shrink-0 text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
            Check my site
          </a>
          <PriceLine className="text-white/70" />
        </div>
      </section>

      {site === null ? (
        <>
          <div className="h-56 rounded-2xl bg-white/70 animate-pulse" />
          <div className="h-96 rounded-2xl bg-white/70 animate-pulse" />
        </>
      ) : !report ? (
        <section className={card}>
          <p className="font-bold">The sample report isn&apos;t available right now.</p>
          <p className="text-sm text-slate-600 mt-1">Try again in a few minutes, or run the quick check on your own site.</p>
        </section>
      ) : (
        <>
          <ReportSections site={report} readOnly />
          <YourPlan site={report} steps={planSteps(report, undefined)} ready mode="sample" />
        </>
      )}

      <section className="rounded-2xl bg-white border border-black/10 p-6 sm:p-7">
        <h2 className="font-extrabold text-xl">The same report for your site</h2>
        <PriceLine className="text-slate-600 mt-2" />
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          No one can promise that assistants will name you. The report shows where you stand, honestly, and what we would do about it.
        </p>
        <a
          href={CHECK}
          className="mt-5 inline-flex w-full sm:w-auto justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-bold"
        >
          Check my site
        </a>
      </section>
    </main>
  )
}
