import type { Metadata } from "next"
import Link from "next/link"
import { noteCrawler } from "@/lib/crawler-log"
import { ORGANIZATION } from "@/lib/entity"
import { SAMPLE_PATH, YEAR_DISCOUNT } from "@/lib/geo-pricing"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { formatNumber } from "@/lib/i18n/format"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { absoluteUrl, localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import { getLocale } from "@/lib/i18n/server"
import aboutNs from "@/lib/i18n/messages/about"

// What ItGrows is, for people and for the machines that read it: AI visibility (GEO) only, as the
// Organization in lib/entity.ts says (owner's decision, 26 Oct 2026). The LinkedIn/X product is one
// short line at the end, with its own pages at /personal.
// Since 30 Oct 2026 (owner's decision) no client results here; the second paragraph is the growth
// guarantee's line and the link to its conditions (lib/entity.ts ENTITY_ABOUT[1]).

// The LinkedIn/X product's entry price (its own pages are English and unprefixed).
const LI_FROM = "$49"

const link = "text-violet-700 font-semibold"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, aboutNs)
  return localizedMetadata(locale, "/about", { title: m.metaTitle, description: m.metaDescription })
}

export default async function AboutPage() {
  const locale = await getLocale()
  const m = t(locale, aboutNs)
  void noteCrawler(localePath(locale, "/about"))
  // The yearly discount: "20%" in English, "20 %" in German and French. No plan price is named (the
  // price test shows it only in the cabinet, lib/geo-pricing.ts PRICE_TEST).
  const yearOff = formatNumber(locale, YEAR_DISCOUNT, { style: "percent", maximumFractionDigits: 0 })
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { ...ORGANIZATION, description: m.orgDescription },
      { "@type": "AboutPage", url: absoluteUrl(locale, "/about"), inLanguage: locale, about: { "@id": ORGANIZATION["@id"] } },
    ],
  }
  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between gap-4">
            <Link href={localePath(locale, "/")} className="text-sm text-violet-700 font-semibold">← ItGrows</Link>
            <LanguageSwitcher />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4">{m.h1}</h1>
          <p className="mt-5 text-lg text-slate-800 leading-relaxed">{m.lead}</p>
          {m.paragraphs.map((p) => (
            <p key={p} className="mt-4 text-slate-700 leading-relaxed">{p}</p>
          ))}
          <h2 className="text-xl font-bold mt-10">{m.offerTitle}</h2>
          <ul className="mt-3 space-y-3 text-slate-700 leading-relaxed list-disc pl-5">
            <li>
              {rich(
                m.plan({ yearOff }),
                { link: (c) => <Link href={localePath(locale, "/#geo-pricing")} className={link}>{c}</Link> },
              )}
            </li>
            <li>
              {rich(m.report, {
                sample: (c) => <Link href={localePath(locale, SAMPLE_PATH)} className={link}>{c}</Link>,
              })}
            </li>
            <li>
              {rich(m.checks, {
                check: (c) => <Link href={localePath(locale, "/business/ai-visibility-checker")} className={link}>{c}</Link>,
                crawler: (c) => <Link href={localePath(locale, "/business/ai-crawler-checker")} className={link}>{c}</Link>,
              })}
            </li>
            <li>
              {rich(m.guides, {
                // The German guides are the #de section of the one guides list.
                guides: (c) => <Link href={locale === "de" ? "/business/blog#de" : "/business/blog"} className={link}>{c}</Link>,
              })}
            </li>
          </ul>
          <h2 className="text-xl font-bold mt-10">{m.contactTitle}</h2>
          <p className="mt-3 text-slate-700"><a href="mailto:kiryl@itgrows.ai" className="text-violet-700">kiryl@itgrows.ai</a></p>
          <p className="mt-12 pt-6 border-t border-black/10 text-sm text-slate-500">
            {rich(m.liLine(LI_FROM), {
              link: (c) => <Link href="/personal" className="text-violet-700">{c}</Link>,
            })}
          </p>
        </main>
      </div>
    </LocaleProvider>
  )
}
