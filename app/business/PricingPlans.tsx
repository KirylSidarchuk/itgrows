"use client"

import { useEffect, useRef, useState } from "react"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_PATH, type GeoInterval } from "@/lib/geo-pricing"
import LocaleLink from "@/components/i18n/LocaleLink"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { splitLocale, type Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"
import { rich } from "@/lib/i18n/rich"
import pricingPlans from "@/lib/i18n/messages/pricingPlans"
import { GEO_CHECKED_KEY, GEO_HANDOFF_KEY, handOff, readChecked, type CheckedSite } from "@/lib/geo-handoff"

// The pricing block of "/": the quick check in one line, then the two offers side by side. What is
// sold, said the same way everywhere: the quick check is free (two answers at once, all five with an account); the detailed report is the
// diagnosis and our plan for the site — computed after the account is created, its totals and the
// quick check's questions open, the whole of it for the report's price; the plan is us doing that
// work, and the report's price comes off its first payment within CREDIT_DAYS. Every number comes
// from lib/geo-pricing.ts; every string from lib/i18n/messages/pricingPlans.ts.
//
// The plan's buttons are the billing choices themselves: a Month / Year toggle; by the month there are
// two (monthly plus the one-time setup, or 3 months upfront with the setup free), by the year one.
// Each goes to sign-up and on to the plan page with that choice made (?interval=). The page passes
// the link for talking to us first. Sign-up keeps the visitor's language (LocaleLink); the plan page
// in the cabinet has no prefix.
//
// After a quick check in this browser ("/"'s check leaves its shown result in itg_geo_checked, and the
// hand-over for sign-up in itg_geo_handoff: lib/geo-handoff.ts), "Run the check first" becomes the way
// to that site's answers, and the report's button signs up with the site. geo_cta_seen (where:
// "pricing") says the line was on screen, once per page, with the state it was in at that moment.

const P = GEO_PRICES

// A new account lands on the plan page with the choice made; the page asks for the site first.
const startHref = (i: GeoInterval) => `/signup?from=ai-check&callbackUrl=${encodeURIComponent(`/business/dashboard/plan?interval=${i}`)}`
// The report: the account first, then the site; the cabinet builds the report and shows its open part.
const REPORT_HREF = `/signup?from=ai-check&callbackUrl=${encodeURIComponent("/business/dashboard/visibility")}`
// With a checked site: the same sign-up the check's own button opens, and the cabinet follows the site.
const siteHref = (site: string) =>
  `/signup?from=ai-check&site=${encodeURIComponent(site)}&callbackUrl=${encodeURIComponent(
    `/business/dashboard/visibility?site=${encodeURIComponent(site)}`
  )}`

// The path without its language prefix, so "/" and "/de" count as one page in the funnel; the
// language the page was shown in (prefix or cookie) goes along as its own property.
function send(locale: Locale, event: string, props: Record<string, unknown>) {
  try {
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({
        event,
        path: splitLocale(window.location.pathname).path,
        props: { ...props, locale },
        anon_id: localStorage.getItem("itg_anon"),
      })
    )
  } catch {
    // Analytics never gets in the way.
  }
}

const track = (locale: Locale, where: string, props?: Record<string, unknown>) => send(locale, "geo_pricing_click", { where, ...props })

function Go({ href, className, onClick, children }: { href: string; className: string; onClick: () => void; children: React.ReactNode }) {
  return href.startsWith("#") ? (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ) : (
    <LocaleLink href={href} onClick={onClick} className={className}>
      {children}
    </LocaleLink>
  )
}

function Tick({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-2.5 leading-relaxed">
      <span className={`font-bold shrink-0 ${dark ? "text-violet-300" : "text-violet-600"}`}>✓</span>
      <span>{children}</span>
    </li>
  )
}

export default function PricingPlans({
  checkHref,
  planHref,
  planLabel,
  included,
}: {
  /** Where the quick check is on the page: "#geo-check" on "/". */
  checkHref: string
  /** Talking to us before paying: the request form, "#apply" on "/". */
  planHref: string
  planLabel: string
  /** What the plan includes (geoIncluded(locale) from GeoSections). */
  included: readonly string[]
}) {
  const m = useT(pricingPlans)
  const locale = useLocale()
  const [period, setPeriod] = useState<"month" | "year">("month")

  // Read after mounting (the server has no localStorage), again each time the block comes into view
  // (the check above may have finished since), and when another tab changes it.
  const [checked, setChecked] = useState<CheckedSite | null>(null)
  const lineRef = useRef<HTMLParagraphElement>(null)
  const seen = useRef(false)
  useEffect(() => {
    const update = () => {
      const c = readChecked()
      setChecked((prev) => (prev?.site === c?.site && prev?.named === c?.named && prev?.of === c?.of ? prev : c))
      return c
    }
    update()
    const onStorage = (e: StorageEvent) => {
      if (e.key === GEO_CHECKED_KEY || e.key === GEO_HANDOFF_KEY || e.key === null) update()
    }
    window.addEventListener("storage", onStorage)
    const el = lineRef.current
    const io =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return
              const c = update()
              if (seen.current) return
              seen.current = true
              send(locale, "geo_cta_seen", { where: "pricing", checked: Boolean(c), domain: c?.site, named: c?.named ?? undefined, of: c?.of ?? undefined })
            },
            { threshold: 0.5 }
          )
        : null
    if (el && io) io.observe(el)
    return () => {
      window.removeEventListener("storage", onStorage)
      io?.disconnect()
    }
  }, [locale])

  // Sign-up with the checked site: the hand-over is written for it (with its own count, not one left by
  // an earlier check of another site), so sign-up shows the check's result and the cabinet follows it.
  const onSite = (where: "answers" | "report") => {
    if (!checked) return
    handOff(checked.site, checked.named, checked.of)
    const quick = { domain: checked.site, named: checked.named ?? undefined, of: checked.of ?? undefined }
    track(locale, where, quick)
    if (where === "answers") send(locale, "geo_cta_click", { where: "pricing", ...quick })
  }
  // The card shows five points; the full list (included) stays in the page's structured data and FAQ.
  const points = m.planPoints
  void included
  // The yearly discount, from the prices themselves: "20%" in English, "20 %" in German and French.
  const yearOff = formatNumber(locale, 1 - P.year.cents / (P.month.cents * 12), { style: "percent", maximumFractionDigits: 0 })
  const start: Record<"month" | "year", { i: GeoInterval; label: string }[]> = {
    month: [
      { i: "month", label: m.startMonthly },
      { i: "quarter", label: m.startQuarter(P.quarter.label) },
    ],
    year: [{ i: "year", label: m.startYearly(P.year.label) }],
  }
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">{m.h2}</h2>
      <p ref={lineRef} className="mt-3 text-center text-sm text-slate-600 break-words">
        {checked
          ? rich(m.checked, {
              site: () => <strong className="font-semibold text-[#1b1916]">{checked.site}</strong>,
              link: (c) => (
                <LocaleLink href={siteHref(checked.site)} onClick={() => onSite("answers")} className="font-semibold text-violet-700 hover:underline">
                  {c}
                </LocaleLink>
              ),
            })
          : rich(m.notSure, {
              link: (c) => (
                <Go href={checkHref} onClick={() => track(locale, "check")} className="font-semibold text-violet-700 hover:underline">
                  {c}
                </Go>
              ),
            })}
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {/* The detailed report */}
        <div className="rounded-2xl bg-white border-2 border-violet-200 p-6 sm:p-7 flex flex-col">
          <h3 className="font-bold text-lg">{m.reportTitle}</h3>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums">{P.research.label}</span>
            <span className="text-sm text-slate-500">{m.onePayment}</span>
          </p>
          <p className="text-sm text-slate-600 mt-2">{m.reportLine}</p>
          <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
            {m.reportPoints.map((f) => (
              <Tick key={f}>{f}</Tick>
            ))}
          </ul>
          <div className="mt-auto pt-7 space-y-3">
            <Go
              href={checked ? siteHref(checked.site) : REPORT_HREF}
              onClick={() => (checked ? onSite("report") : track(locale, "report"))}
              className="block text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold"
            >
              {m.getReport(P.research.label)}
            </Go>
            <p className="text-xs text-slate-500 text-center">{m.credit(CREDIT_DAYS)}</p>
            <LocaleLink href={SAMPLE_PATH} onClick={() => track(locale, "sample")} className="block text-center text-sm font-semibold text-violet-700 hover:underline">
              {m.seeSample}
            </LocaleLink>
          </div>
        </div>

        {/* The plan */}
        <div className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-lg">{m.planTitle}</h3>
            <div role="group" aria-label={m.billingPeriod} className="inline-flex rounded-full bg-white/10 p-1 text-xs font-semibold">
              {(["month", "year"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={period === k}
                  onClick={() => {
                    setPeriod(k)
                    track(locale, "period", { period: k })
                  }}
                  className={`rounded-full px-3 py-1.5 ${period === k ? "bg-white text-[#1b1916]" : "text-white/75 hover:text-white"}`}
                >
                  {k === "month" ? m.month : m.yearOff(yearOff)}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums">{period === "month" ? P.month.label : P.year.perMonth}</span>
            <span className="text-white/60 font-semibold">{m.perMonth}</span>
          </p>
          <p className="text-sm text-white/70 mt-2">{period === "month" ? m.monthNote(P.setup.label) : m.yearNote(P.year.label)}</p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/85">
            {points.map((f) => (
              <Tick key={f} dark>
                {f}
              </Tick>
            ))}
          </ul>
          <div className="mt-auto pt-7 space-y-2.5">
            {start[period].map(({ i, label }, n) => (
              <Go
                key={i}
                href={startHref(i)}
                onClick={() => track(locale, "plan", { interval: i })}
                className={`block text-center rounded-xl px-5 py-3 text-sm font-semibold ${
                  n === 0 ? "bg-white text-[#1b1916] hover:bg-violet-50" : "border border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                {label}
              </Go>
            ))}
            <Go href={planHref} onClick={() => track(locale, "plan_talk")} className="block text-center text-sm font-semibold text-white/70 hover:text-white hover:underline pt-1">
              {planLabel}
            </Go>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">{m.disclaimer}</p>
    </div>
  )
}
