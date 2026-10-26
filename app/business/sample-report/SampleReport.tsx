"use client"

import { Suspense } from "react"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { formatDate } from "@/lib/i18n/format"
import sampleReportNs from "@/lib/i18n/messages/sampleReport"
import { localePath } from "@/lib/i18n/paths"
import { ReportSections, YourPlan, card, fullReport, planSteps, type SiteReport } from "../dashboard/visibility/parts"

// The whole detailed report of our own appslift.com, drawn with the cabinet's own cards. The report
// comes from the server (page.tsx reads it as /api/geo/sample does), so its totals and answers are
// in the first HTML, for readers and crawlers alike. Read-only: the answers open, nothing is
// followed or bought. "Your plan" comes from the report alone (no crawler check here) and leads to
// the plan on the home page.

const CHECK = "/#geo-check"

function PriceLine({ className = "" }: { className?: string }) {
  const m = useT(sampleReportNs)
  return (
    <p className={`text-sm leading-relaxed ${className}`}>
      {m.priceLine(GEO_PRICES.research.label, CREDIT_DAYS)}
    </p>
  )
}

export default function SampleReport({ site }: { site: SiteReport | null }) {
  const m = useT(sampleReportNs)
  const locale = useLocale()
  const check = localePath(locale, CHECK)
  const full = site ? fullReport(site) : null
  // In UTC, so the server's HTML and the browser agree on the day. English keeps the cabinet's day
  // month year order ("21 Oct 2026"); the other languages write the date their way.
  const checkedOn = (iso: string) =>
    !iso || Number.isNaN(Date.parse(iso))
      ? iso
      : locale === "en"
        ? new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
        : formatDate(locale, iso, { day: "numeric", month: "short", year: "numeric" })

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
      <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">{m.badge}</p>
        <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight break-words">{m.h1(SAMPLE_DOMAIN)}</h1>
        <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
          {m.intro}
        </p>
        {full && (
          <p className="mt-2 text-xs text-white/50">
            {m.checked(checkedOn(full.finishedAt), full.rows.length, full.engines.length, full.samples)}
          </p>
        )}
        <div className="mt-6">
          <a href={check} className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
            {m.checkMySite}
          </a>
        </div>
      </section>

      {!site ? (
        <section className={card}>
          <p className="font-bold">{m.unavailable}</p>
          <p className="text-sm text-slate-600 mt-1">{m.unavailableHint}</p>
        </section>
      ) : (
        // The cards format some dates in the browser's time zone; if one differs from the server's by
        // a day, React redraws only this part in the browser instead of the whole page.
        <Suspense fallback={null}>
          <ReportSections site={site} readOnly />
          <YourPlan site={site} steps={planSteps(site, undefined)} ready mode="sample" />
        </Suspense>
      )}

      <section className="rounded-2xl bg-white border border-black/10 p-6 sm:p-7">
        <h2 className="font-extrabold text-xl">{m.sameTitle}</h2>
        <PriceLine className="text-slate-600 mt-2" />
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {m.honesty}
        </p>
        <a
          href={check}
          className="mt-5 inline-flex w-full sm:w-auto justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-bold"
        >
          {m.checkMySite}
        </a>
      </section>
    </main>
  )
}
