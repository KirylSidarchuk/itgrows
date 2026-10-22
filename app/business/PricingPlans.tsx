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

const START: Record<"month" | "year", { i: GeoInterval; label: string }[]> = {
  month: [
    { i: "month", label: `Start monthly — ${P.month.label}/mo + ${P.setup.label} setup` },
    { i: "quarter", label: `Pay 3 months upfront — ${P.quarter.label}, setup free` },
  ],
  year: [{ i: "year", label: `Start yearly — ${P.year.label}, setup free` }],
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
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">See the full picture. Have us fix it.</h2>
      <p className="text-slate-600 text-center mt-3 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
        The detailed report shows where you stand and what we will do about it. On the plan, we do that work for you and measure it
        every week. Start the plan within {CREDIT_DAYS} days of buying the report and its {P.research.label} comes off your first
        payment.
      </p>

      {/* The quick check: one line, not an offer */}
      <p className="mt-8 text-center text-sm text-slate-600 leading-relaxed">
        <span className="font-semibold text-[#1b1916]">First look:</span> the quick check puts 5 questions your buyers ask to ChatGPT
        and Perplexity, live. No signup, about 30 seconds.{" "}
        <Go href={checkHref} onClick={() => track("check")} className="font-semibold text-violet-700 hover:underline whitespace-nowrap">
          Check my site →
        </Go>
      </p>

      <div className="grid md:grid-cols-[1fr_1.15fr] gap-4 mt-6">
        {/* The full picture: the detailed report, the diagnosis that leads to the plan */}
        <div className="rounded-2xl bg-white border-2 border-violet-200 p-6 flex flex-col shadow-xl shadow-violet-600/5">
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-700">Full picture</p>
          <h3 className="font-bold text-lg mt-1">Detailed report</h3>
          <p className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-extrabold tabular-nums">{P.research.label}</span>
            <span className="text-sm text-slate-500">one payment, per site</span>
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Where you stand in all four assistants, who is named instead of you, and what we will do about it.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <Tick>20 questions × ChatGPT, Claude, Gemini and Perplexity × 3 asks: 240 answers</Tick>
            <Tick>Every business named instead of you, and how often</Tick>
            <Tick>The sites the assistants quote instead of you</Tick>
            <Tick>Your plan: each step we will take, and why</Tick>
          </ul>
          <p className="mt-5 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-950 leading-relaxed">
            Create an account and we build it for your site: the totals and the quick check&apos;s 5 questions are open. The whole
            report is {P.research.label}, and it comes off your first plan payment if you start within {CREDIT_DAYS} days.
          </p>
          <div className="mt-auto pt-6 space-y-3">
            <Go
              href={REPORT_HREF}
              onClick={() => track("report")}
              className="block text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20"
            >
              See the detailed report — {P.research.label}
            </Go>
            <Link href={SAMPLE_PATH} onClick={() => track("sample")} className="block text-center text-sm font-semibold text-violet-700 hover:underline">
              See a real report →
            </Link>
          </div>
        </div>

        {/* Done for you: the plan */}
        <div className="rounded-2xl bg-[#1b1916] text-white p-6 flex flex-col">
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-300">We do it for you</p>
          <div className="flex items-center justify-between gap-3 mt-1">
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
          {period === "month" ? (
            <p className="text-sm text-white/80 mt-1">
              Plus a one-time {P.setup.label} setup: your site and its indexes made ready, delivered as a launch report. The setup is
              free when you pay 3 months upfront ({P.quarter.label}) or a year.
            </p>
          ) : (
            <p className="text-sm text-white/80 mt-1">
              Billed {P.year.label} a year: 20% off, and the {P.setup.label} setup is free.
            </p>
          )}

          <p className="text-sm text-white/80 mt-4 leading-relaxed">
            We do the work: articles on your domain, crawler and index fixes, and all four assistants measured again every week. The
            detailed report is included.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {included.map((f) => (
              <Tick key={f} dark>
                {f}
              </Tick>
            ))}
          </ul>
          <div className="mt-auto pt-6 space-y-2.5">
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
            <p className="text-xs text-white/60 text-center">
              {period === "month" ? "Month to month. 3 months upfront renews every 3 months." : "Renews every year."}
            </p>
            <Link
              href={SAMPLE_PATH}
              onClick={() => track("sample", { from: "plan" })}
              className="block text-center text-sm font-semibold text-violet-200 hover:text-white hover:underline"
            >
              See a real report →
            </Link>
            <Go
              href={planHref}
              onClick={() => track("plan_talk")}
              className="block text-center text-sm font-semibold text-white/75 hover:text-white hover:underline pt-1"
            >
              {planLabel}
            </Go>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        No one can guarantee that an assistant will name a business. We measure and show you every week.
      </p>
    </div>
  )
}
