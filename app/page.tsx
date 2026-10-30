import type { Metadata } from "next"
import Link from "next/link"
import AuditForm from "./business/AuditForm"
import ContactForm from "./business/ContactForm"
import HashForward from "./_home/HashForward"
import SignIn from "./_home/SignIn"
import SiteFooter from "./_home/SiteFooter"
import { ORGANIZATION } from "@/lib/entity"
import { noteCrawler } from "@/lib/crawler-log"
import { mainGuides } from "@/components/geo/guide-data"
import { VersusArticles, WhyThisMatters, WorkSystem, geoIncluded } from "./business/GeoSections"
import PricingPlans from "./business/PricingPlans"
import { SAMPLE_PATH, YEAR_DISCOUNT } from "@/lib/geo-pricing"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { absoluteUrl, localePath } from "@/lib/i18n/paths"
import { formatNumber } from "@/lib/i18n/format"
import { rich } from "@/lib/i18n/rich"
import homeMessages from "@/lib/i18n/messages/home"
import growthGuarantee from "@/lib/i18n/messages/growthGuarantee"

// The front door says what ItGrows is first: AI visibility for companies. The LinkedIn/X product
// lives at /personal, one click away from here and from the sign-in menu. Since 22 Oct 2026 this is
// also the AI-visibility page: /business redirects here (next.config.ts), so its contact form (#apply)
// and its questions live on this page.
// Every string is in lib/i18n/messages/home.ts, in five languages. No plan price is named here (the
// price test shows it only in the cabinet, lib/geo-pricing.ts PRICE_TEST).
// Since 30 Oct 2026 the page's headline promise is the growth guarantee (growthGuarantee.ts,
// /terms#growth-guarantee). No other guarantee word, no invented numbers or cases, no plan price, no
// client results (removed by the owner 30 Oct). Order: hero with the guarantee, why (what is being lost),
// how, versus, pricing, questions, then the contact form with the guarantee as the closing call.
// The guarantee's line keeps its "*" and nothing under it; its footnote (the condition and the link to
// /terms#growth-guarantee) is the last line of the page, in SiteFooter.

const BASE = "https://www.itgrows.ai"

// The page is rendered per request: /de, /fr, /es and /ru are this same page, told apart by the
// language middleware.ts puts on the request (lib/i18n). What used to be cached for an hour with the
// page (the guides) is cached on its own (components/geo/guide-data.ts).

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, homeMessages)
  const share = { title: m.ogTitle, description: m.ogDescription }
  return localizedMetadata(locale, "/", { title: m.metaTitle, description: m.metaDescription, openGraph: share, twitter: share })
}

// The LinkedIn/X product's prices (its own pricing lives on /personal).
const LI = { personal: "$49", duo: "$99", allIn: "$199" }

const ICON = "h-6 w-6"
// Title and line of each: home.quickChecks, in this order.
const QUICK_CHECKS = [
  {
    href: "/business/ai-visibility-checker",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.4a8.5 8.5 0 1 1 15.6-4.6z" />
        <path d="M8.5 11.8l2.4 2.4 4.6-4.6" />
      </svg>
    ),
  },
  {
    href: "/business/ai-crawler-checker",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="8" width="14" height="11" rx="3" />
        <path d="M12 8V5" />
        <circle cx="12" cy="4" r="1" />
        <path d="M2.5 12.5v3M21.5 12.5v3M9.5 16h5" />
        <circle cx="9.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

// The Service JSON-LD offers the free report only: under the price test (lib/geo-pricing.ts
// PRICE_TEST) the plan's price is shown only in the cabinet, so no Offer names it.

export default async function Home() {
  const locale = await getLocale()
  const m = t(locale, homeMessages)
  const g = t(locale, growthGuarantee)
  void noteCrawler(localePath(locale, "/"))
  // The main guides in the page's language, always the same six (lib/geo-guides.ts): German on /de,
  // English everywhere else (fr/es/ru say "(in English)" in the heading).
  const guideLang = locale === "de" ? "de" : "en"
  const latest = await mainGuides(guideLang)
  // The yearly discount: "20%" in English, "20 %" in German and French.
  const yearOff = formatNumber(locale, YEAR_DISCOUNT, { style: "percent", maximumFractionDigits: 0 })
  const FAQ = m.faq({ sample: localePath(locale, SAMPLE_PATH), yearOff })
  const home = absoluteUrl(locale, "/")
  const pricingUrl = absoluteUrl(locale, "/#geo-pricing")
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { ...ORGANIZATION, description: m.orgDescription },
      { "@type": "WebSite", "@id": `${BASE}/#website`, url: `${BASE}/`, name: "ItGrows", publisher: { "@id": ORGANIZATION["@id"] } },
      {
        "@type": "WebApplication",
        name: m.appName,
        url: home,
        inLanguage: locale,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: m.appDescription,
        provider: { "@id": ORGANIZATION["@id"] },
      },
      {
        "@type": "Service",
        name: m.serviceName,
        serviceType: m.serviceType,
        inLanguage: locale,
        description: m.serviceDescription,
        provider: { "@id": ORGANIZATION["@id"] },
        offers: [
          { "@type": "Offer", name: m.offerReport, price: "0", priceCurrency: "USD", url: pricingUrl },
        ],
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  }

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen text-[#1b1916] scroll-smooth" style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <HashForward />

        <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-40" style={{ backgroundColor: "#f3f2f1" }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Link href={localePath(locale, "/")} className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
              <span>ItGrows.ai</span>
            </Link>
            <div className="hidden xl:flex items-center gap-4 text-sm text-slate-600 font-medium">
              <a href="#geo-why" className="whitespace-nowrap hover:text-[#1b1916]">{m.navWhy}</a>
              <a href="#geo-how" className="whitespace-nowrap hover:text-[#1b1916]">{m.navHow}</a>
              <a href="#geo-pricing" className="whitespace-nowrap hover:text-[#1b1916]">{m.navPricing}</a>
              <a href="#geo-tools" className="whitespace-nowrap hover:text-[#1b1916]">{m.navTools}</a>
              <Link href="/business/blog" className="whitespace-nowrap hover:text-[#1b1916]">{m.navGuides}</Link>
              <Link href="/personal" className="whitespace-nowrap hover:text-[#1b1916]">{m.navLinkedIn}</Link>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <SignIn />
              <a href="#geo-check" className="hidden sm:inline-block whitespace-nowrap rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5">
                {m.checkMySite}
              </a>
            </div>
          </div>
        </nav>

        <section id="geo-check" className="relative px-4 sm:px-6 pt-12 sm:pt-16 pb-10 overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight">
              {rich(m.h1, {
                g: (c) => <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">{c}</span>,
              })}
            </h1>
            {/* The growth guarantee, the page's headline promise: its line with the "*" and nothing under
                it; the footnote (the condition and the link to the Terms) is the last line of the page. */}
            <div className="max-w-2xl mx-auto mt-6 mb-8 rounded-2xl border-2 border-violet-300 bg-white/70 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-600">{g.label}</p>
              <p className="mt-1 text-lg sm:text-2xl font-extrabold leading-snug">{g.line}</p>
            </div>
            <AuditForm />
          </div>
        </section>

        <WhyThisMatters id="geo-why" checkHref="#geo-check" />

        <WorkSystem id="geo-how" />

        <VersusArticles id="geo-versus" />

        <section id="geo-pricing" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
          <PricingPlans checkHref="#geo-check" planHref="#apply" planLabel={m.talkFirst} included={geoIncluded(locale)} />
          <p className="text-center text-xs text-slate-500 mt-2">
            {rich(m.liPlans(LI.personal, LI.duo, LI.allIn), {
              link: (c) => (
                <Link href="/personal#pricing" className="underline">
                  {c}
                </Link>
              ),
            })}
          </p>
        </section>

        <section id="geo-faq" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center mb-8">{m.faqTitle}</h2>
            <div className="space-y-2.5">
              {FAQ.map((f) => (
                <details key={f.q} className="bg-white border border-black/10 rounded-2xl overflow-hidden group">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 py-4 font-semibold text-sm sm:text-base flex items-center justify-between gap-4">
                    <h3>{f.q}</h3>
                    <span className="text-violet-600 text-xl shrink-0 leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* The contact form: any question before paying, under the guarantee, as the page's closing call.
            The id stays "apply": the pricing cards and the crawler result link here. */}
        <section id="apply" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">{m.writeTitle}</h2>
            <p className="text-slate-600 text-center mb-6 text-sm sm:text-base">{m.writeLead}</p>
            <div className="mb-8 rounded-2xl border border-violet-200 bg-white px-5 py-4 text-center">
              <p className="font-bold">{g.line}</p>
            </div>
            <ContactForm />
          </div>
        </section>

        <section id="geo-tools" className="px-4 sm:px-6 py-12 sm:py-14 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">{m.toolsTitle}</h2>
            <p className="text-sm sm:text-base text-slate-600 text-center mt-2">{m.toolsLead}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {QUICK_CHECKS.map((c, i) => (
                <Link
                  key={c.href}
                  href={localePath(locale, c.href)}
                  className="group flex items-start gap-4 rounded-2xl bg-white border border-black/10 p-5 sm:p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 ring-4 ring-violet-50">
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-base sm:text-lg leading-snug">{m.quickChecks[i].title}</span>
                    <span className="block text-sm text-slate-600 mt-1 leading-relaxed">{m.quickChecks[i].line}</span>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-violet-700">
                      {m.runIt} <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {latest.length > 0 && (
          <section className="px-4 sm:px-6 py-14">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{m.guidesTitle}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {latest.map((g) => (
                  <Link key={g.slug} href={`/business/blog/${g.slug}`} className="rounded-2xl bg-white border border-black/10 p-5 hover:border-violet-300 font-semibold text-sm leading-snug">
                    {g.title}
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-sm">
                <Link href={guideLang === "de" ? "/business/blog#de" : "/business/blog"} className="text-violet-700 font-semibold hover:underline">{m.allGuides}</Link>
                <span className="mx-2 text-slate-400">·</span>
                <Link href="/blog" className="text-violet-700 font-semibold hover:underline">{m.expertsBlog}</Link>
              </p>
            </div>
          </section>
        )}

        {/* The LinkedIn/X product, after all of the AI-visibility page: right under the check's
            result it stood between the answers and everything that explains them. */}
        <section className="px-4 sm:px-6 py-10">
          <div className="max-w-4xl mx-auto rounded-2xl border border-violet-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-slate-700 flex-1">{rich(m.founder(LI.personal), { b: (c) => <b>{c}</b> })}</p>
            <div className="flex gap-2 shrink-0">
              <Link href="/personal" className="rounded-xl bg-[#1b1916] text-white px-4 py-2.5 text-sm font-semibold">{m.founderCta}</Link>
              <Link href="/cabinet" rel="nofollow" className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold">{m.openCabinet}</Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </LocaleProvider>
  )
}
