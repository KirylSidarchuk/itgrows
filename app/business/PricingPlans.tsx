"use client"

import { useState } from "react"
import Link from "next/link"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_PATH, type GeoInterval } from "@/lib/geo-pricing"

// The pricing block of "/": the quick check in one line, then the two offers side by side. What is
// sold, said the same way everywhere: the quick check needs no signup; the detailed report is the
// diagnosis and our plan for the site — computed after the account is created, its totals and the
// quick check's questions open, the whole of it for the report's price; the plan is us doing that
// work, and the report's price comes off its first payment within CREDIT_DAYS. Every number comes
// from lib/geo-pricing.ts.
//
// The plan's buttons are the billing choices themselves: a Month / Year toggle; by the month there are
// two (monthly plus the one-time setup, or 3 months upfront with the setup free), by the year one.
// Each goes to sign-up and on to the plan page with that choice made (?interval=). The page passes
// the link for talking to us first.

const P = GEO_PRICES

const PLAN_POINTS = [
  "Site setup, with a launch report",
  "Up to 12 researched articles a month on your domain",
  "Profiles and editor letters on the sites AI quotes",
  "All four assistants measured every week",
  "Every article shown to you 2 days before it goes live",
]

const START: Record<"month" | "year", { i: GeoInterval; label: string }[]> = {
  month: [
    { i: "month", label: "Start monthly" },
    { i: "quarter", label: `3 months upfront — ${P.quarter.label}, no setup fee` },
  ],
  year: [{ i: "year", label: `Start yearly — ${P.year.label}` }],
}
// A new account lands on the plan page with the choice made; the page asks for the site first.
const startHref = (i: GeoInterval) => `/signup?from=ai-check&callbackUrl=${encodeURIComponent(`/business/dashboard/plan?interval=${i}`)}`
// The report: the account first, then the site; the cabinet builds the report and shows its open part.
const REPORT_HREF = `/signup?from=ai-check&callbackUrl=${encodeURIComponent("/business/dashboard/visibility")}`

function track(where: string, props?: Record<string, unknown>) {
  try {
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({ event: "geo_pricing_click", path: window.location.pathname, props: { where, ...props }, anon_id: localStorage.getItem("itg_anon") })
    )
  } catch {
    // Analytics never gets in the way.
  }
}

function Go({ href, className, onClick, children }: { href: string; className: string; onClick: () => void; children: React.ReactNode }) {
  return href.startsWith("#") ? (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
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
  /** What the plan includes (GEO_INCLUDED). */
  included: readonly string[]
}) {
  const [period, setPeriod] = useState<"month" | "year">("month")
  // The card shows five points; the full list (included) stays in the page's structured data and FAQ.
  const points = PLAN_POINTS
  void included
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">See where you stand. Have us fix it.</h2>
      <p className="mt-3 text-center text-sm text-slate-600">
        Not sure yet?{" "}
        <Go href={checkHref} onClick={() => track("check")} className="font-semibold text-violet-700 hover:underline">
          Run the 30-second check first →
        </Go>
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {/* The detailed report */}
        <div className="rounded-2xl bg-white border-2 border-violet-200 p-6 sm:p-7 flex flex-col">
          <h3 className="font-bold text-lg">Detailed report</h3>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums">{P.research.label}</span>
            <span className="text-sm text-slate-500">one payment</span>
          </p>
          <p className="text-sm text-slate-600 mt-2">Where you stand in all four assistants, and what we would do about it.</p>
          <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
            <Tick>240 answers: 20 questions × 4 assistants × 3</Tick>
            <Tick>Who is named and quoted instead of you</Tick>
            <Tick>Your plan, step by step</Tick>
          </ul>
          <div className="mt-auto pt-7 space-y-3">
            <Go
              href={REPORT_HREF}
              onClick={() => track("report")}
              className="block text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold"
            >
              Get the report — {P.research.label}
            </Go>
            <p className="text-xs text-slate-500 text-center">Comes off your first plan payment within {CREDIT_DAYS} days.</p>
            <Link href={SAMPLE_PATH} onClick={() => track("sample")} className="block text-center text-sm font-semibold text-violet-700 hover:underline">
              See a real report →
            </Link>
          </div>
        </div>

        {/* The plan */}
        <div className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-lg">The plan</h3>
            <div role="group" aria-label="Billing period" className="inline-flex rounded-full bg-white/10 p-1 text-xs font-semibold">
              {(["month", "year"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={period === k}
                  onClick={() => {
                    setPeriod(k)
                    track("period", { period: k })
                  }}
                  className={`rounded-full px-3 py-1.5 ${period === k ? "bg-white text-[#1b1916]" : "text-white/75 hover:text-white"}`}
                >
                  {k === "month" ? "Month" : "Year −20%"}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums">{period === "month" ? P.month.label : P.year.perMonth}</span>
            <span className="text-white/60 font-semibold">/ month</span>
          </p>
          <p className="text-sm text-white/70 mt-2">
            {period === "month"
              ? `+ ${P.setup.label} one-time setup · free with 3 months or a year`
              : `Billed ${P.year.label} a year · setup free`}
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/85">
            {points.map((f) => (
              <Tick key={f} dark>
                {f}
              </Tick>
            ))}
          </ul>
          <div className="mt-auto pt-7 space-y-2.5">
            {START[period].map(({ i, label }, n) => (
              <Go
                key={i}
                href={startHref(i)}
                onClick={() => track("plan", { interval: i })}
                className={`block text-center rounded-xl px-5 py-3 text-sm font-semibold ${
                  n === 0 ? "bg-white text-[#1b1916] hover:bg-violet-50" : "border border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                {label}
              </Go>
            ))}
            <Go href={planHref} onClick={() => track("plan_talk")} className="block text-center text-sm font-semibold text-white/70 hover:text-white hover:underline pt-1">
              {planLabel}
            </Go>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">
        No one can guarantee that an assistant will name a business. We measure and show you every week.
      </p>
    </div>
  )
}
