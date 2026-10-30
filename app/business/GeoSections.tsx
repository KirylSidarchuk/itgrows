// The three blocks between the cases and the pricing on "/" (/business redirects there): what the plan
// actually runs (WorkSystem), why being in the answer matters (WhyThisMatters) and why it is not paying
// for articles (VersusArticles). WorkSystem and VersusArticles describe work we do for the client on the
// plan, not steps for the reader to follow: each ends on "we do it", never on "how to". Built to be
// read in seconds; the detail sits in native <details>, so it stays in the server-rendered HTML for
// crawlers.
// Every number in WorkSystem and VersusArticles comes from our own checks and code (Oct 2026), not
// from an industry study:
//  - 240 = 20 questions x 4 assistants x 3 asks (the plan's day-0 report and its check every two
//    weeks; the free report asks once: 80)
//  - 11 crawlers = the bot user agents geo_onboard_check.py fetches a new client's site as
//  - 3-5 sources = client_writer.py research step; findability = geo_findability.py (Mondays)
//  - 26 = full recounts a year: the re-measure runs every two weeks since 26 Oct 2026 (it was 52, weekly)
// WhyThisMatters is the exception: third-party figures only, each linked to its source on the page
// (WHY below says where each was checked). It replaced "Publishing is not the same as being found"
// (owner, 29 Oct 2026).
// What none of them says is how: which rules, which tests, which order.
// Server components that read the page's language themselves (lib/i18n/server); every string is in
// lib/i18n/messages/geoSections.ts.

import type { ReactNode } from "react"
import type { Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"
import { t } from "@/lib/i18n/messages"
import { rich } from "@/lib/i18n/rich"
import geoSections from "@/lib/i18n/messages/geoSections"
import { getLocale } from "@/lib/i18n/server"

// "See the plan" points at the pricing section of the page the block sits on: "/" prefixes its GEO
// section ids with "geo-" (#geo-pricing); a page without the prefix would use #pricing.
const pricingAnchor = (id?: string) => (id?.startsWith("geo-") ? "#geo-pricing" : "#pricing")

// Native disclosure without the browser's triangle (Safari draws it unless the marker is hidden).
const SUMMARY = "cursor-pointer list-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300"

// Line icons for the five stages, drawn inline: no icon library, no image requests.
const ICONS = {
  measure: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V6M17 16V9" />
    </>
  ),
  doors: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />
    </>
  ),
  index: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.6-4.6" />
    </>
  ),
  write: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  repeat: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v4h-4" />
    </>
  ),
} as const

// Icon and big number of each stage; its name, line and detail are geoSections.work.stages, in this order.
const STAGES: { icon: keyof typeof ICONS; n: string }[] = [
  { icon: "measure", n: "240" },
  { icon: "doors", n: "11" },
  { icon: "index", n: "4" },
  { icon: "write", n: "3–5" },
  { icon: "repeat", n: "26" },
]

function StageIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

/**
 * The plan as a pipeline: five stages, a big number each. Desktop: one row with a road through the
 * nodes. Phone: a vertical timeline. What runs inside each stage opens below, aligned to its column.
 */
export async function WorkSystem({ id = "how" }: { id?: string }) {
  const m = t(await getLocale(), geoSections).work
  const stages = STAGES.map((s, i) => ({ ...s, ...m.stages[i] }))
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-600 text-center mb-3">{m.kicker}</p>
        <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">{m.h2}</h2>
        <p className="text-slate-600 text-center mb-10 sm:mb-14 text-sm sm:text-base">{m.lead}</p>

        <div className="relative">
          {/* The road: vertical on the phone, through the node centres on desktop */}
          <div aria-hidden className="lg:hidden absolute left-[27px] top-7 bottom-7 w-0.5 rounded-full bg-gradient-to-b from-violet-300 via-violet-500 to-cyan-400" />
          <div aria-hidden className="hidden lg:block absolute top-[27px] left-[10%] right-[10%] h-0.5 rounded-full bg-gradient-to-r from-violet-300 via-violet-500 to-cyan-400" />
          <ol className="relative grid gap-5 lg:grid-cols-5 lg:gap-6">
            {stages.map((s, i) => (
              <li key={s.step} className="relative flex lg:flex-col lg:items-center gap-4 lg:gap-0 lg:text-center">
                <div className="relative z-10 w-14 h-14 shrink-0 rounded-full bg-white border-2 border-violet-200 text-violet-600 flex items-center justify-center shadow-sm lg:mb-4">
                  <StageIcon name={s.icon} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
                    {String(i + 1).padStart(2, "0")} · {s.step}
                  </p>
                  <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter leading-none mt-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                    {s.n}
                  </p>
                  <p className="text-sm font-semibold leading-snug mt-1.5">{s.l}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <details className="group mt-10 border-t border-black/10">
          <summary className={`${SUMMARY} flex items-center justify-center gap-2 py-4 text-sm font-semibold text-violet-700`}>
            {m.inside}
            <span className="text-lg leading-none transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="grid gap-4 lg:grid-cols-5 lg:gap-6 pb-2">
            {stages.map((s) => (
              <div key={s.step} className="border-l-2 border-violet-200 pl-4 lg:border-l-0 lg:pl-0 lg:border-t-2 lg:pt-3">
                <p className="text-xs font-bold text-[#1b1916]">{s.step}</p>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </details>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <p className="text-sm sm:text-base font-semibold max-w-xl">{m.closing}</p>
          <a href={pricingAnchor(id)} className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20">
            {m.seePlan}
          </a>
        </div>
      </div>
    </section>
  )
}

// The sources of WhyThisMatters. Each figure was checked on its page on 29 Oct 2026 (quoted words are
// the page's own):
//  - OpenAI, 31 Aug 2026: "more than 1 billion weekly active users"; "Advertising does not influence
//    the answers ChatGPT provides."
//  - BrightLocal, Local Consumer Review Survey 2026, 1,002 US adults: use of ChatGPT and other
//    generative AI tools "for local recommendations ... rising from 6% last year to 45%"
//  - G2, March 2026, 1,076 B2B software buyers: "69% of buyers chose a different vendor than initially
//    planned, simply because it was part of the chatbot's recommendation"
//  - Pew Research Center, browsing data of 900 US adults, March 2025: a traditional result was clicked
//    in 8% of visits with an AI summary, 15% without
//  - WordStream by LocaliQ 2026, 13,474 US Google and Microsoft search campaigns, Apr 2025 - Mar 2026,
//    "averages" are medians: cost per lead $66.69; Attorneys & Legal Services $131.63, Home & Home
//    Improvement $90.92, Dentists & Dental Services $72.97
//  - First Page Sage, B2B CAC from its own clients, Jan 2022 - Aug 2025, inorganic ("primarily PPC / SEM
//    and Paid Social"): Legal Services $1,245, Transportation & Logistics $732, Construction $486
//  - Alphabet 10-K 2025: Google Search & other, cost-per-click change 2024 -> 2025: 7%
//  - Meta 10-K 2025: "average price per ad increased 9% year-over-year in 2025"
// None of it is our own result and nothing here promises one: no ItGrows price, no "you will be
// named", no AI traffic.
const WHY_SOURCES = {
  openai: "https://openai.com/index/expanding-access-to-ai-with-chatgpt-ads/",
  brightlocal: "https://www.brightlocal.com/research/local-consumer-review-survey/",
  g2: "https://company.g2.com/news/g2-research-the-answer-economy",
  pew: "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/",
  wordstream: "https://www.wordstream.com/blog/2026-google-ads-benchmarks",
  firstPageSage: "https://firstpagesage.com/marketing/average-customer-acquisition-cost-cac-by-industry-b2b-edition-fc/",
  alphabet10k: "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm",
  meta10k: "https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm",
} as const

// The figures themselves; formatted per language on the page ("45%", "45 %"; "$66.69", "66,69 $").
const WHY = {
  local: 0.45,
  localYearBefore: 0.06,
  localAsked: 1002,
  vendor: 0.69,
  vendorAsked: 1076,
  clickWithAi: 0.08,
  clickWithout: 0.15,
  pewPanel: 900,
  lead: { avg: 66.69, law: 131.63, home: 90.92, dent: 72.97 },
  customer: { legal: 1245, logistics: 732, construction: 486 },
  cpc: 0.07,
  pricePerAd: 0.09,
}

/** A source link: a new tab, an arrow for the eye and a note for screen readers. */
function SourceLink({ href, newTab, children }: { href: string; newTab: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="underline underline-offset-2 decoration-white/30 hover:decoration-white hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
    >
      {children}
      <span aria-hidden>{"\u00a0↗"}</span>
      <span className="sr-only"> {newTab}</span>
    </a>
  )
}

type WhyRow = { k: string; v: ReactNode; source?: ReactNode }

/**
 * Why being in the answer matters, on dark: four third-party figures (the first as a wide hero), paid
 * search ads against being named in the answer, the honest closing and the check. Desktop: the two
 * columns of the comparison share their rows (subgrid), so each row lines up across. Phone: one column,
 * the comparison as two stacked cards. Every figure links to its source.
 */
export async function WhyThisMatters({ id = "geo-why", checkHref = "#geo-check" }: { id?: string; checkHref?: string }) {
  const locale = await getLocale()
  const m = t(locale, geoSections).why
  const c = m.compare
  const pct = (n: number) => formatNumber(locale, n, { style: "percent", maximumFractionDigits: 0 })
  const usd = (n: number, digits = 2) =>
    formatNumber(locale, n, { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits })
  const num = (n: number) => formatNumber(locale, n)
  const source = (href: string, label: string) => (
    <SourceLink href={href} newTab={m.newTab}>
      {label}
    </SourceLink>
  )

  const figures: { n: ReactNode; l: string; source: ReactNode }[] = [
    { n: m.users.n, l: m.users.l, source: source(WHY_SOURCES.openai, `OpenAI, ${m.users.src}`) },
    { n: pct(WHY.local), l: m.local.l(pct(WHY.localYearBefore)), source: source(WHY_SOURCES.brightlocal, `BrightLocal, ${m.local.src(num(WHY.localAsked))}`) },
    { n: pct(WHY.vendor), l: m.vendor.l, source: source(WHY_SOURCES.g2, `G2, ${m.vendor.src(num(WHY.vendorAsked))}`) },
    {
      n: (
        <>
          {pct(WHY.clickWithAi)} <span className="text-[0.45em] tracking-normal text-slate-300">{m.clicks.vs}</span> {pct(WHY.clickWithout)}
        </>
      ),
      l: m.clicks.l,
      source: source(WHY_SOURCES.pew, `Pew Research Center, ${m.clicks.src(num(WHY.pewPanel))}`),
    },
  ]

  const big = (x: ReactNode) => <b className="text-2xl sm:text-3xl font-extrabold tracking-tight">{x}</b>
  const columns: { title: string; answer: boolean; rows: WhyRow[] }[] = [
    {
      title: c.colA,
      answer: false,
      rows: [
        {
          k: c.lead.k,
          v: rich(c.lead.a(usd(WHY.lead.avg), usd(WHY.lead.law), usd(WHY.lead.home), usd(WHY.lead.dent)), { b: big }),
          source: source(WHY_SOURCES.wordstream, "WordStream by LocaliQ, 2026"),
        },
        {
          k: c.customer.k,
          v: c.customer.a(usd(WHY.customer.legal, 0), usd(WHY.customer.logistics, 0), usd(WHY.customer.construction, 0)),
          source: source(WHY_SOURCES.firstPageSage, "First Page Sage"),
        },
        { k: c.stop.k, v: c.stop.a },
        { k: c.buy.k, v: c.buy.a },
      ],
    },
    {
      title: c.colB,
      answer: true,
      rows: [
        { k: c.lead.k, v: c.lead.b },
        {
          k: c.customer.k,
          v: (
            <>
              <span aria-hidden>—</span>
              <span className="sr-only">{c.customer.none}</span>
            </>
          ),
        },
        { k: c.stop.k, v: c.stop.b },
        { k: c.buy.k, v: rich(c.buy.b, { en: (x) => <span lang="en">{x}</span> }), source: source(WHY_SOURCES.openai, "OpenAI") },
      ],
    },
  ]

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-300 text-center mb-3">{m.kicker}</p>
        <h2 id={`${id}-title`} className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-center text-balance max-w-4xl mx-auto">
          {m.h2}
        </h2>
        <p className="text-slate-300 text-center mt-4 text-base sm:text-lg max-w-2xl mx-auto">{m.lead}</p>

        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-10 sm:mt-12">
          {figures.map((f, i) => {
            const hero = i === 0
            const tile = hero
              ? "md:col-span-2 lg:col-span-3 md:flex-row md:items-center md:gap-8 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 border-violet-400/30"
              : `bg-white/[0.06] border-white/10 ${i === figures.length - 1 ? "md:col-span-2 lg:col-span-1" : ""}`
            return (
              <li key={i} className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${tile}`}>
                <p
                  className={`font-extrabold tracking-tighter leading-none bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent ${
                    hero ? "text-4xl sm:text-6xl lg:text-7xl md:shrink-0" : "text-4xl"
                  }`}
                >
                  {f.n}
                </p>
                <div className={hero ? "mt-3 md:mt-0" : "mt-3 flex flex-1 flex-col"}>
                  <p className={`font-bold text-white leading-snug ${hero ? "text-lg sm:text-2xl" : "text-base"}`}>{f.l}</p>
                  <p className={`text-xs text-slate-400 ${hero ? "mt-2" : "mt-auto pt-3"}`}>{f.source}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <h3 className="mt-14 sm:mt-20 text-xl sm:text-3xl font-extrabold tracking-tight text-white text-center">{c.h3}</h3>
        <div className="mt-6 sm:mt-8 grid gap-3 md:grid-cols-2 md:grid-rows-[repeat(5,auto)] md:gap-x-4 md:gap-y-0">
          {columns.map((col) => (
            <div
              key={col.title}
              className={`rounded-2xl border p-5 sm:p-6 md:row-span-5 md:grid md:grid-rows-subgrid ${
                col.answer ? "bg-gradient-to-br from-violet-500/20 to-cyan-400/10 border-violet-400/30" : "bg-white/[0.04] border-white/10"
              }`}
            >
              <h4 className="flex items-center gap-2.5 pb-3 text-lg sm:text-xl font-extrabold text-white">
                <span
                  aria-hidden
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    col.answer ? "bg-white text-violet-700" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {col.answer ? "✓" : "$"}
                </span>
                {col.title}
              </h4>
              <dl className="md:row-span-4 md:grid md:grid-rows-subgrid">
                {col.rows.map((r) => (
                  <div key={r.k} className="border-t border-white/10 py-4 last:pb-0">
                    <dt className={`text-[11px] font-bold uppercase tracking-wider ${col.answer ? "text-violet-300" : "text-slate-400"}`}>{r.k}</dt>
                    <dd className="mt-1.5 text-sm sm:text-base text-white leading-relaxed">
                      {r.v}
                      {r.source && <span className="block mt-1.5 text-xs text-slate-400">{r.source}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-slate-300 leading-relaxed max-w-3xl mx-auto">
          {rich(m.costs(pct(WHY.cpc), pct(WHY.pricePerAd)), {
            g: (x) => (
              <SourceLink href={WHY_SOURCES.alphabet10k} newTab={m.newTab}>
                {x}
              </SourceLink>
            ),
            m: (x) => (
              <SourceLink href={WHY_SOURCES.meta10k} newTab={m.newTab}>
                {x}
              </SourceLink>
            ),
          })}
        </p>

        <div className="mt-10 sm:mt-14 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-5 py-5 sm:px-8 sm:py-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="flex-1 text-center md:text-left text-base sm:text-lg text-white font-semibold leading-relaxed">{m.closing}</p>
          <a
            href={checkHref}
            className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm sm:text-base font-semibold shadow-lg shadow-violet-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            {m.cta}
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto text-center">{m.footnote}</p>
      </div>
    </section>
  )
}

/**
 * Seven contrasts as cards, then the one that sums them up. A card: what the plan does (bold), the
 * detail, and under a rule what an article-only service does instead. The first card spans both
 * columns; the last pair ("what you pay for") closes the block on dark. No disclosure: the detail is
 * what makes each short phrase readable, so it stays visible (and in the HTML for crawlers).
 */
export async function VersusArticles({ id }: { id?: string }) {
  const m = t(await getLocale(), geoSections).versus
  const cards = m.rows.slice(0, -1)
  const last = m.rows[m.rows.length - 1]
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center mb-10">{m.h2}</h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {cards.map((r, i) => {
            const hero = i === 0
            return (
              <div
                key={r.k}
                className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${
                  hero ? "sm:col-span-2 bg-gradient-to-br from-violet-600 to-violet-700 border-violet-700 text-white shadow-lg shadow-violet-600/20" : "bg-white border-black/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`mt-1 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      hero ? "bg-white text-violet-700" : "bg-violet-600 text-white"
                    }`}
                  >
                    ✓
                  </span>
                  <p className={`font-extrabold tracking-tight leading-tight ${hero ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl text-[#1b1916]"}`}>{r.b}</p>
                </div>
                <p className={`text-sm leading-relaxed mt-2.5 ${hero ? "text-violet-100 sm:text-base" : "text-slate-600"}`}>
                  <b className={hero ? "text-white" : "text-[#1b1916]"}>{/[.?!]$/.test(r.k) ? r.k : `${r.k}.`}</b> {r.d}
                </p>
                <div className="mt-auto pt-4">
                  <p className={`border-t pt-3 flex items-center gap-2 text-sm ${hero ? "border-white/20 text-violet-200" : "border-black/[0.07] text-slate-500"}`}>
                    <span
                      aria-hidden
                      className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        hero ? "bg-white/15 text-white" : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      ✕
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${hero ? "text-violet-300" : "text-slate-400"}`}>{m.colA}:</span>
                    <span>{r.a}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 sm:mt-4 rounded-2xl px-5 py-6 sm:px-8 sm:py-8" style={{ backgroundColor: "#1b1916" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center">{last.k}</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-5 sm:gap-0 items-center text-center">
            <div className="sm:pr-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{m.colA}</p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-500 line-through decoration-rose-500/70 decoration-2">{last.a}</p>
            </div>
            <div className="sm:pl-6 sm:border-l sm:border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">{m.colB}</p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                {last.b}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-400 leading-relaxed text-center max-w-xl mx-auto">{last.d}</p>
        </div>
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-5">{m.footnote}</p>
      </div>
    </section>
  )
}

/** What the plan includes, in a language (was GEO_INCLUDED): plain strings, so a client component can take it. */
export function geoIncluded(locale: Locale): string[] {
  return [...t(locale, geoSections).included]
}
