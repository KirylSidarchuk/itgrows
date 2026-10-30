// The three blocks of "/" (why, how, versus; /business redirects there): what the plan
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
// Their cards lift on hover and keyboard focus and their big numbers grow a little (components/geo/
// motion.ts); the ones marked "reveal" fade in as they scroll into view (app/_home/ScrollReveal.tsx,
// mounted by the page). Owner's request, 30 Oct 2026.

import { useId, type ReactNode } from "react"
import type { Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"
import { t } from "@/lib/i18n/messages"
import { rich } from "@/lib/i18n/rich"
import geoSections from "@/lib/i18n/messages/geoSections"
import growthGuarantee from "@/lib/i18n/messages/growthGuarantee"
import { getLocale } from "@/lib/i18n/server"
import { LIFT_ACCENT, LIFT_DARK, NUM, SHINE, STEP, STEP_NODE } from "@/components/geo/motion"

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
          <div aria-hidden className="reveal lg:hidden absolute left-[27px] top-7 bottom-7 w-0.5 rounded-full bg-gradient-to-b from-violet-300 via-violet-500 to-cyan-400" />
          <div aria-hidden className="reveal hidden lg:block absolute top-[27px] left-[10%] right-[10%] h-0.5 rounded-full bg-gradient-to-r from-violet-300 via-violet-500 to-cyan-400" />
          <ol className="relative grid gap-5 lg:grid-cols-5 lg:gap-6">
            {stages.map((s, i) => (
              <li key={s.step} className={`reveal group relative flex lg:flex-col lg:items-center gap-4 lg:gap-0 lg:text-center ${STEP}`}>
                <div className={`relative z-10 w-14 h-14 shrink-0 rounded-full bg-white border-2 border-violet-200 text-violet-600 flex items-center justify-center shadow-sm lg:mb-4 ${STEP_NODE}`}>
                  <StageIcon name={s.icon} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
                    {String(i + 1).padStart(2, "0")} · {s.step}
                  </p>
                  <p className={`text-4xl lg:text-5xl font-extrabold tracking-tighter leading-none mt-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent ${NUM} lg:origin-center`}>
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
          <a href={pricingAnchor(id)} className={`shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 ${SHINE}`}>
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
// None of it is our own result: no ItGrows price, no invented number, no promise beyond the growth
// guarantee (lib/i18n/messages/growthGuarantee.ts).
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
 * search ads against being named in the answer, the closing and the check. Desktop: the two
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
              <li key={i} className={`reveal group flex flex-col rounded-2xl border p-5 sm:p-6 ${tile} ${LIFT_DARK}`}>
                <p
                  className={`font-extrabold tracking-tighter leading-none bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent ${NUM} ${
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
              className={`reveal rounded-2xl border p-5 sm:p-6 md:row-span-5 md:grid md:grid-rows-subgrid ${LIFT_DARK} ${
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

        <div className="reveal mt-10 sm:mt-14 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-5 py-5 sm:px-8 sm:py-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="flex-1 text-center md:text-left text-base sm:text-lg text-white font-semibold leading-relaxed">{m.closing}</p>
          <a
            href={checkHref}
            className={`shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm sm:text-base font-semibold shadow-lg shadow-violet-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${SHINE}`}
          >
            {m.cta}
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto text-center">{m.footnote}</p>
      </div>
    </section>
  )
}

// The ✓ and ✗ of the versus panels, drawn inline so every font shows the same mark: ours white on the
// violet panel, theirs a pale ✗ on the grey one (only the mark is muted; the text beside it is
// stone-600, 5.8:1 on that grey).
function VersusMark({ yes }: { yes?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${yes ? "bg-white text-violet-700 shadow-md shadow-violet-950/40" : "bg-stone-300/60 text-rose-500/70"}`}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {yes ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7L7 17" />}
      </svg>
    </span>
  )
}

/**
 * The seal on the guarantee card's top right corner: the guarantee's label (growthGuarantee.ts) in
 * capitals round a dark ring, a ✓ in the middle. Decorative, the card says the label in words. The
 * ring turns once in 28 s, only without "reduce motion". The ring's path needs an id of its own on
 * the page (useId; React's characters are dropped, so it is a plain fragment for href). A short label
 * goes round twice, a long one (French, Spanish) once, and the letters shrink until the text fits the
 * ring at about 0.68 em a capital; textLength then spaces it to close the circle exactly.
 * It sits above the guarantee line, never beside it: only the label line keeps room for it on its
 * right, so the line has the card's full width (a padding there left "for free.*" alone on a line).
 */
function GuaranteeSeal({ label, locale }: { label: string; locale: Locale }) {
  const pathId = `seal${useId().replace(/[^\w-]/g, "")}`
  const word = label.toLocaleUpperCase(locale)
  const ring = word.length <= 18 ? `${word} • ${word} • ` : `${word} • `
  const fontSize = Math.round(Math.min(11, 212 / (ring.length * 0.68)) * 100) / 100
  return (
    <span aria-hidden className="absolute -top-10 right-3 sm:-top-11 sm:right-5 lg:-top-13 size-20 sm:size-22 lg:size-24 -rotate-12">
      <span className="absolute inset-0 rounded-full bg-[#1b1916] ring-4 ring-white shadow-lg shadow-violet-950/40" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full motion-safe:animate-[spin_28s_linear_infinite]">
        <defs>
          <path id={pathId} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text fill="#fff" fontSize={fontSize} fontWeight={800}>
          <textPath href={`#${pathId}`} textLength={224} lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[29%] grid place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700">
        <svg viewBox="0 0 24 24" className="size-5 sm:size-6 text-white" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  )
}

/**
 * A duel (owner's choice of 30 Oct 2026, concept A "VS split"): two panels meeting at a dark "VS"
 * badge, stacked on the phone (article-only first, ours overlapping it by 28px), side by side from md
 * (ours 24px over theirs and 96px taller). Theirs is deliberately dull: grey, a dashed border, a pale
 * ✗ per line, its lines sharing the height. Ours is violet with a glow and a ✓ per line, and lifts on
 * hover (LIFT_ACCENT). Both fade in on scroll ("reveal"; ours with its badge). Our last line is the
 * growth guarantee (growthGuarantee.ts, label and line with its "*") as a white card with a seal;
 * nothing under it here, its footnote is the last line of the page. The heading is in two colours,
 * so it is two strings (titleA grey, titleB violet). overflow-x-clip: the glows never scroll the page.
 */
export async function VersusArticles({ id }: { id?: string }) {
  const locale = await getLocale()
  const m = t(locale, geoSections).versus
  const g = t(locale, growthGuarantee)
  const titleId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={titleId} className="relative overflow-x-clip px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
      <div className="max-w-5xl mx-auto">
        <h2 id={titleId} className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center text-balance mb-10 sm:mb-14">
          <span className="text-stone-500">{m.titleA}</span>{" "}
          <span className="inline-block bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">{m.titleB}</span>
        </h2>
        <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="reveal flex flex-col rounded-3xl border border-dashed border-stone-400/60 bg-[#e3e0db] p-6 pb-14 sm:p-8 sm:pb-16 md:my-12 md:pb-8 md:pr-16 lg:p-10 lg:pr-20">
            <h3 className="flex items-center gap-3 pb-5 border-b border-stone-400/40 text-xl lg:text-2xl font-extrabold tracking-tight text-stone-600">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-stone-300/70 text-stone-500">
                <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5M9 13h6M9 17h4" />
                </svg>
              </span>
              {m.them.title}
            </h3>
            <ul className="flex flex-1 flex-col divide-y divide-dashed divide-stone-400/40">
              {m.them.lines.map((line) => (
                <li key={line} className="flex flex-1 items-center py-4">
                  <div className="flex items-start gap-3 text-base leading-relaxed text-stone-600">
                    <VersusMark />
                    <span className="text-pretty">{line}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal relative z-10 -mt-7 md:mt-0 md:-ml-6">
            <span
              aria-hidden
              className="absolute z-20 left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 md:left-0 md:top-1/2 grid size-14 lg:size-16 place-items-center rounded-full bg-[#1b1916] text-base lg:text-lg font-extrabold italic tracking-tight text-white ring-[6px] ring-[#ebe9e5] shadow-xl shadow-black/20"
            >
              VS
            </span>
            <div
              className={`relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 p-6 pt-11 sm:p-8 sm:pt-12 md:pt-8 md:pl-12 lg:p-10 lg:pl-14 text-white ring-1 ring-inset ring-white/15 shadow-[0_30px_70px_-20px_rgb(76_29_149/0.55),0_0_70px_-10px_rgb(139_92_246/0.45)] ${LIFT_ACCENT}`}
            >
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-fuchsia-400/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-cyan-300/15 blur-3xl" />
              <h3 className="relative flex items-center gap-3 pb-5 border-b border-white/20 text-2xl sm:text-3xl font-extrabold tracking-tight">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" className="size-9 rounded-lg ring-2 ring-white/30" alt="" />
                {m.us.title}
              </h3>
              <ul className="relative mt-6 flex flex-1 flex-col gap-4">
                {m.us.lines.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-base leading-relaxed text-white/95">
                    <VersusMark yes />
                    <span className="text-pretty">{line}</span>
                  </li>
                ))}
                <li className="relative mt-auto pt-8 sm:pt-9 lg:pt-11">
                  <div className="relative rounded-2xl bg-white p-5 sm:p-6 text-[#1b1916] shadow-xl shadow-violet-950/40">
                    <span className="block pr-20 max-[359px]:pr-0 max-[359px]:pt-7 sm:pr-24 lg:pr-28 text-[11px] uppercase tracking-[0.15em] font-bold text-violet-700">{g.label}</span>
                    <span className="block mt-3 text-lg max-[359px]:text-[17px] sm:text-xl font-extrabold leading-snug tracking-tight text-balance">{g.line}</span>
                    <GuaranteeSeal label={g.label} locale={locale} />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** What the plan includes, in a language (was GEO_INCLUDED): plain strings, so a client component can take it. */
export function geoIncluded(locale: Locale): string[] {
  return [...t(locale, geoSections).included]
}
