// The three blocks that say what the plan actually runs, on "/" (/business redirects there).
// They describe work we do for the client on the plan, not steps for the reader to follow: each block
// ends on "we do it", never on "how to". Built to be read in seconds; the detail sits in native
// <details>, so it stays in the server-rendered HTML for crawlers.
// Every number here comes from our own checks and code (Oct 2026), not from an industry study:
//  - 240 = 20 questions x 4 assistants x 3 asks (geo_check baseline and the paid weekly run)
//  - 11 crawlers = the bot user agents geo_onboard_check.py fetches a new client's site as
//  - 3-5 sources = client_writer.py research step; findability = geo_findability.py (Mondays)
//  - findings = the 19 Oct audit of three client sites plus our own robots.txt (fixed 21 Oct)
// What it deliberately does not say is how: which rules, which tests, which order.
// Server components that read the page's language themselves (lib/i18n/server); every string is in
// lib/i18n/messages/geoSections.ts.

import type { Locale } from "@/lib/i18n/config"
import { t } from "@/lib/i18n/messages"
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
  { icon: "repeat", n: "52" },
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

/**
 * An evidence wall on dark. Desktop: the first finding spans two columns, four tiles follow, the
 * closing line runs full width under them. Phone: one column of tiles.
 */
export async function FoundOnSites({ id }: { id?: string }) {
  const m = t(await getLocale(), geoSections).found
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-center">{m.h2}</h2>
        <p className="text-slate-400 text-center mt-3 mb-10 text-sm sm:text-base">{m.lead}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {m.items.map((f, i) => (
            <div
              key={f.n}
              className={`rounded-2xl border p-5 sm:p-6 ${
                i === 0 ? "sm:col-span-2 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 border-violet-400/30" : "bg-white/[0.06] border-white/10"
              }`}
            >
              <p
                className={`font-extrabold tracking-tighter leading-none ${
                  i === 0
                    ? "text-5xl sm:text-7xl bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent"
                    : "text-4xl sm:text-5xl text-white"
                }`}
              >
                {f.n}
              </p>
              <p className={`font-bold text-white leading-snug mt-3 ${i === 0 ? "text-lg sm:text-2xl" : "text-base"}`}>{f.h}</p>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-5 py-4 text-center text-sm sm:text-base text-white font-semibold leading-relaxed">
          {m.closing}
        </p>
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
