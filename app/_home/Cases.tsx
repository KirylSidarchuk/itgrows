import type { Locale } from "@/lib/i18n/config"
import { t } from "@/lib/i18n/messages"
import { formatNumber } from "@/lib/i18n/format"
import cases from "@/lib/i18n/messages/cases"
import { LIFT } from "@/components/geo/motion"

// Real results on "/", right under the check (Kiryl, 26 Nov 2026: real cases with names and links, the
// orthopaedic practice without its name; the loudest true numbers). Every figure is from the GEO Results
// Update of 25 Nov 2026 (Google Search Console and Bing Webmaster Tools to 23 Nov 2026, our own count of 80
// answers); the strings are lib/i18n/messages/cases.ts. Each card has one big number and, where both ends are
// known exactly, a before/after bar drawn to scale. No "client" / "our product" tag (Kiryl, 26 Nov 2026: names and links). Update the figures here, together, from a newer report.
const D = {
  total: { before: 10211, after: 19863 },
  ortho: { before: 181, after: 3928, clicksBefore: 111, clicksAfter: 301 },
  firma: { before: 8, after: 17, copilot: 247, impressions: 7451, impressionsGrowth: 0.34 },
  magiscan: { before: 6, after: 15, copilot: 313, impressions: 6569, impressionsGrowth: 0.86 },
  appslift: { growth: 1.08, copilot: 1426, impressions: 1915 },
  freight: { customers: 2, before: 18, after: 24, copilot: 216 + 211 },
} as const

function Bar({ before, after, labels }: { before: number; after: number; labels: { before: string; now: string; b: string; a: string } }) {
  const w = Math.max(2, Math.round((before / after) * 100))
  return (
    <div className="mt-4 space-y-1.5 text-xs text-slate-600" aria-hidden>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0">{labels.before}</span>
        <span className="h-2.5 rounded-full bg-slate-300" style={{ width: `${w}%` }} />
        <span className="tabular-nums">{labels.b}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0">{labels.now}</span>
        <span className="h-2.5 rounded-full bg-violet-600 flex-1 max-w-full" />
        <span className="tabular-nums font-semibold text-[#1b1916]">{labels.a}</span>
      </div>
    </div>
  )
}

export default function Cases({ locale, id }: { locale: Locale; id?: string }) {
  const m = t(locale, cases)
  const n = (x: number) => formatNumber(locale, x)
  const pct = (x: number) => formatNumber(locale, x, { style: "percent", maximumFractionDigits: 0, signDisplay: "always" })
  const times = (x: number) => `×${formatNumber(locale, x, { maximumFractionDigits: 1 })}`
  const growth = (a: number, b: number) => pct(b / a - 1)
  const bar = (b: number, a: number) => ({ before: m.before, now: m.now, b: n(b), a: n(a) })

  const cards = [
    {
      key: "ortho",
      name: m.ortho.name,
      big: times(D.ortho.after / D.ortho.before),
      caption: m.ortho.caption,
      bar: [D.ortho.before, D.ortho.after] as const,
      lines: [m.ortho.l1(n(D.ortho.clicksBefore), n(D.ortho.clicksAfter), growth(D.ortho.clicksBefore, D.ortho.clicksAfter)), m.ortho.l2],
    },
    {
      key: "firma",
      name: m.firma.name,
      href: "https://firma-ausland.de",
      big: times(D.firma.after / D.firma.before),
      caption: m.firma.caption,
      bar: [D.firma.before, D.firma.after] as const,
      lines: [m.firma.l1(n(D.firma.copilot)), m.firma.l2(pct(D.firma.impressionsGrowth), n(D.firma.impressions))],
    },
    {
      key: "magiscan",
      name: m.magiscan.name,
      href: "https://magiscan.app",
      big: times(D.magiscan.after / D.magiscan.before),
      caption: m.magiscan.caption,
      bar: [D.magiscan.before, D.magiscan.after] as const,
      lines: [m.magiscan.l1(pct(D.magiscan.impressionsGrowth), n(D.magiscan.impressions)), m.magiscan.l2(n(D.magiscan.copilot))],
    },
    {
      key: "appslift",
      name: m.appslift.name,
      href: "https://appslift.com",
      big: pct(D.appslift.growth),
      caption: m.appslift.caption,
      lines: [m.appslift.l1(n(D.appslift.copilot)), m.appslift.l2(n(D.appslift.impressions))],
    },
    {
      key: "freight",
      name: m.freight.name,
      href: "https://freightsizer.ai",
      big: n(D.freight.customers),
      caption: m.freight.caption,
      lines: [m.freight.l1(n(D.freight.before), n(D.freight.after)), m.freight.l2(n(D.freight.copilot))],
    },
  ]

  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">{m.h2}</h2>
        <p className="mt-4 text-center text-slate-700 max-w-3xl mx-auto leading-relaxed">
          {m.lead(n(D.total.after), n(D.total.before), growth(D.total.before, D.total.after))}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {cards.map((c) => (
            <div key={c.key} className={`reveal group rounded-2xl bg-white border border-black/10 p-6 flex flex-col ${LIFT}`}>
              <h3 className="font-bold leading-snug">{c.name}</h3>
              {c.href ? (
                <a href={c.href} target="_blank" rel="noopener" className="mt-1 text-sm font-semibold text-violet-700 hover:underline">
                  {c.href.replace("https://", "")} ↗
                </a>
              ) : null}
              <p className="mt-3 text-4xl font-extrabold tabular-nums text-violet-700">{c.big}</p>
              <p className="text-sm text-slate-600 mt-1">{c.caption}</p>
              {c.bar ? <Bar before={c.bar[0]} after={c.bar[1]} labels={bar(c.bar[0], c.bar[1])} /> : null}
              <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                {c.lines.map((l) => (
                  <li key={l} className="flex gap-2 leading-relaxed">
                    <span className="font-bold text-violet-600 shrink-0">✓</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto text-center">{m.note}</p>
      </div>
    </section>
  )
}
