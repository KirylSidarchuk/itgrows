import type { Metadata } from "next"
import Link from "next/link"
import { ORGANIZATION } from "@/lib/entity"
import { GEO_PRICES } from "@/lib/geo-pricing"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { absoluteUrl, localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import { getLocale } from "@/lib/i18n/server"
import aboutNs from "@/lib/i18n/messages/about"

// The LinkedIn/X product's entry price (its own pages are English and unprefixed).
const LI_FROM = "$49"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, aboutNs)
  return localizedMetadata(locale, "/about", { title: m.metaTitle, description: m.metaDescription })
}

export default async function AboutPage() {
  const locale = await getLocale()
  const m = t(locale, aboutNs)
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
          {m.paragraphs.map((p) => (
            <p key={p} className="mt-4 text-slate-700 leading-relaxed">{p}</p>
          ))}
          <h2 className="text-xl font-bold mt-10">{m.productsTitle}</h2>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>
              {rich(m.geoProduct(GEO_PRICES.month.label, GEO_PRICES.setup.label, GEO_PRICES.research.label), {
                link: (c) => <Link href={localePath(locale, "/")} className="text-violet-700 font-semibold">{c}</Link>,
              })}
            </li>
            <li>
              {rich(m.liProduct(LI_FROM), {
                link: (c) => <Link href="/personal" className="text-violet-700 font-semibold">{c}</Link>,
              })}
            </li>
          </ul>
          <h2 className="text-xl font-bold mt-10">{m.contactTitle}</h2>
          <p className="mt-3 text-slate-700"><a href="mailto:kiryl@itgrows.ai" className="text-violet-700">kiryl@itgrows.ai</a></p>
        </main>
      </div>
    </LocaleProvider>
  )
}
