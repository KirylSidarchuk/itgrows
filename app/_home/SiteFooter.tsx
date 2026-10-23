import Link from "next/link"
import { t } from "@/lib/i18n/messages"
import siteFooter from "@/lib/i18n/messages/siteFooter"
import { localePath } from "@/lib/i18n/paths"
import { getLocale } from "@/lib/i18n/server"

// The footer of the public pages ("/"; /business redirects there). Short on purpose: what ItGrows is
// in one line, then the way around the site. The long description lives on /about.
// A server component that reads the page's language itself (lib/i18n/server), so any page can use it
// as it is; labels in lib/i18n/messages/siteFooter.ts. Links to the public GEO pages keep the language.

type M = (typeof siteFooter)["en"]

const COLUMNS: { title: keyof M["titles"]; links: { href: string; label: keyof M["links"] }[] }[] = [
  {
    title: "geo",
    links: [
      { href: "/#geo-check", label: "check" },
      { href: "/#geo-pricing", label: "pricing" },
      { href: "/business/sample-report", label: "sample" },
      { href: "/business/blog", label: "guides" },
    ],
  },
  {
    title: "tools",
    links: [
      { href: "/business/ai-visibility-checker", label: "visibilityChecker" },
      { href: "/business/ai-crawler-checker", label: "crawlerChecker" },
    ],
  },
  {
    title: "linkedin",
    links: [
      { href: "/personal", label: "posts" },
      { href: "/company", label: "companyPages" },
      { href: "/reddit", label: "reddit" },
      { href: "/blog", label: "blog" },
    ],
  },
  {
    title: "company",
    links: [
      { href: "/about", label: "about" },
      { href: "/privacy", label: "privacy" },
      { href: "/terms", label: "terms" },
    ],
  },
]

export default async function SiteFooter() {
  const locale = await getLocale()
  const m = t(locale, siteFooter)
  return (
    <footer className="bg-[#1b1916] text-slate-400 px-4 sm:px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link href={localePath(locale, "/")} className="inline-flex items-center gap-2 text-lg font-bold text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="" />
              ItGrows.ai
            </Link>
            <p className="mt-4 text-sm leading-relaxed">{m.tagline}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:contents">
            {COLUMNS.map((c) => (
              <nav key={c.title} aria-label={m.titles[c.title]}>
                <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">{m.titles[c.title]}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={localePath(locale, l.href)} className="hover:text-white transition-colors">{m.links[l.label]}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-between text-xs text-slate-500">
          <p>© 2026 ItGrows.ai</p>
          <p>{m.disclaimer}</p>
        </div>
      </div>
    </footer>
  )
}
