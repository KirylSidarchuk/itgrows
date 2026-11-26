import type { Metadata } from "next"
import Link from "next/link"
import ToolShell from "../business/_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../business/_tools/Faq"
import PricingPlans from "../business/PricingPlans"
import { geoIncluded } from "../business/GeoSections"
import { ORGANIZATION, OG_GEO } from "@/lib/entity"
import { noteCrawler } from "@/lib/crawler-log"
import { GEO_PRICES, PRO_PRICES, SAMPLE_PATH, YEAR_DISCOUNT, geoPriceLabels } from "@/lib/geo-pricing"
import { t } from "@/lib/i18n/messages"
import homeMessages from "@/lib/i18n/messages/home"
import pricingPlans from "@/lib/i18n/messages/pricingPlans"
import growthGuarantee from "@/lib/i18n/messages/growthGuarantee"

// /pricing, in English (26 Nov 2026, ChatGPT visibility plan of 25 Nov: the address answered 404 while the
// nav says "Pricing"; assistants and people guess this address, and a page of its own can be indexed and
// cited, where the anchor /#geo-pricing cannot). The same offer as the pricing block of "/": the cards are
// that block itself (PricingPlans), every price comes from lib/geo-pricing.ts (geoPriceLabels, GEO_PRICES)
// and is written in the price sentences of lib/geo-price-article.ts ("$499 a month, month to month, plus a
// one-time $499 setup", "$1,497 for 3 months", "$4,788 for a year ($399 a month, 20% off)"). The guarantee
// is growthGuarantee.ts word for word, its "*" footnote is the last line of the frame (ToolShell
// guaranteeFootnote). The FAQ reuses the home page's answers on price and scope (home.ts) and adds two from
// the Terms (cancelling) and the plan card (one site). Not localized: /de/pricing and the like go to this
// address (lib/i18n/middleware.ts, as for every page outside the GEO pages).

const BASE = "https://www.itgrows.ai"
const PATH = "/pricing"
const URL = BASE + PATH

// The price test is off (lib/geo-pricing.ts PRICE_TEST); should it come back, this page shows the visitor's
// price through PricingPlans and must never be cached.
export const dynamic = "force-dynamic"

const TITLE = "Pricing: the AI visibility plan, done for you | ItGrows"
const P = geoPriceLabels("en")
const PRO = geoPriceLabels("en", PRO_PRICES)
const PRO_SENTENCE = `For firms where one client is worth $5,000 or more, Pro costs ${PRO.month} a month plus a one-time ${PRO.setup} setup, or ${PRO.quarter} for 3 months with the setup free.`
const YEAR_OFF = `${Math.round(YEAR_DISCOUNT * 100)}%`
const PRICE_SENTENCE = `The plan costs ${P.month} a month, month to month, plus a one-time ${P.setup} setup. The setup is free with ${P.quarter} for 3 months upfront or ${P.year} for a year (${P.yearPerMonth} a month, ${YEAR_OFF} off).`
const DESCRIPTION = `The ItGrows AI visibility plan: ${P.month} a month, month to month, plus a one-time ${P.setup} setup; the setup is free with ${P.quarter} for 3 months or ${P.year} for a year (${P.yearPerMonth} a month, ${YEAR_OFF} off). Pro, for firms where one client is worth $5,000+: ${PRO.month} a month. The detailed report is free.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    siteName: "ItGrows.ai",
    title: "ItGrows pricing: one plan, done for you",
    description: PRICE_SENTENCE,
    url: URL,
    locale: "en_US",
    images: [OG_GEO],
  },
  twitter: { card: "summary_large_image", title: "ItGrows pricing: one plan, done for you", description: PRICE_SENTENCE, images: [OG_GEO.url] },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"

// The home page's answers on price and scope, in this order, found by their question.
const FROM_HOME = [
  "What does the plan cost?",
  "What does the detailed report cost?",
  "Will ChatGPT name us?",
  "How fast do we start?",
  "Do you give us a guide to do it ourselves, or do the work?",
  "How will we know it's working?",
]

function faq(): QA[] {
  const home = t("en", homeMessages).faq({ sample: SAMPLE_PATH, ...P, yearOff: YEAR_OFF })
  const picked = FROM_HOME.map((q) => home.find((f) => f.q === q)).filter((f): f is QA => !!f)
  const plan = t("en", pricingPlans)
  return [
    ...picked.slice(0, 2),
    {
      q: "Can we cancel?",
      a: "Yes, any time, on the Plan page of your cabinet. The cancellation takes effect at the end of the period you have paid for: until then the plan keeps running, and you can take the cancellation back. Nothing is charged after that. A period that has started is not refunded (itgrows.ai/terms).",
    },
    { q: "Does one plan cover more than one website?", a: "No: one plan, one site. A second website is a second plan, with its own questions and its own count." },
    { q: "What is not included?", a: plan.notIncluded.replace(/^Not included:\s*/, "").replace(/^./, (c) => c.toUpperCase()) },
    ...picked.slice(2),
  ]
}

// Offers in USD (schema.org wants the amount as a plain number): month to month and its one-time setup
// (an activation fee), 3 months upfront and a year, as on "/" (app/page.tsx).
const amount = (cents: number) => (cents / 100).toFixed(2)
const recurring = (name: string, cents: number, value: number, unitCode: "MON" | "ANN") => ({
  "@type": "Offer",
  name,
  price: amount(cents),
  priceCurrency: "USD",
  url: URL,
  priceSpecification: {
    "@type": "UnitPriceSpecification",
    price: amount(cents),
    priceCurrency: "USD",
    priceComponentType: "https://schema.org/Subscription",
    referenceQuantity: { "@type": "QuantitativeValue", value, unitCode },
  },
})

export default async function PricingPage() {
  void noteCrawler(PATH)
  const m = t("en", homeMessages)
  const g = t("en", growthGuarantee)
  const plan = t("en", pricingPlans)
  const included = geoIncluded("en")
  const items = faq()

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { ...ORGANIZATION, description: m.orgDescription },
      {
        "@type": "WebPage",
        "@id": `${URL}#webpage`,
        url: URL,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "en",
        isPartOf: { "@id": `${BASE}/#website` },
        about: { "@id": ORGANIZATION["@id"] },
        breadcrumb: { "@id": `${URL}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ItGrows", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "Pricing", item: URL },
        ],
      },
      {
        "@type": "Service",
        name: m.serviceName,
        serviceType: m.serviceType,
        inLanguage: "en",
        description: m.serviceDescription,
        provider: { "@id": ORGANIZATION["@id"] },
        offers: [
          { "@type": "Offer", name: m.offerReport, price: "0", priceCurrency: "USD", url: URL },
          recurring(m.offerPlan, GEO_PRICES.month.cents, 1, "MON"),
          {
            "@type": "Offer",
            name: m.offerSetup,
            price: amount(GEO_PRICES.setup.cents),
            priceCurrency: "USD",
            url: URL,
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: amount(GEO_PRICES.setup.cents),
              priceCurrency: "USD",
              priceComponentType: "https://schema.org/ActivationFee",
            },
          },
          recurring(m.offerQuarter, GEO_PRICES.quarter.cents, 3, "MON"),
          recurring(m.offerYear(YEAR_OFF), GEO_PRICES.year.cents, 1, "ANN"),
          recurring("Pro, month to month", PRO_PRICES.month.cents, 1, "MON"),
          recurring("Pro, 3 months upfront", PRO_PRICES.quarter.cents, 3, "MON"),
        ],
      },
      faqSchema(items),
    ],
  }

  const ways = [
    { name: "Month to month", price: `${P.month} a month`, note: `plus a one-time ${P.setup} setup` },
    { name: "3 months upfront", price: `${P.quarter} for 3 months`, note: "setup included" },
    { name: "A year upfront", price: `${P.year} for a year`, note: `${P.yearPerMonth} a month, ${YEAR_OFF} off, setup included` },
  ]

  return (
    <ToolShell guaranteeFootnote>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" className="hover:text-[#1b1916]">ItGrows</Link> <span aria-hidden>›</span> Pricing
        </nav>
        <section className="mt-3 text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-600">Pricing</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">Done for you. Public prices, the same for everyone.</h1>
          <p className="mt-4 text-slate-700 leading-relaxed">
            {PRICE_SENTENCE} {PRO_SENTENCE} The detailed report, our diagnosis and plan for your site, is free once you create an account.
          </p>
          <div className="mt-6 rounded-2xl border-2 border-violet-300 bg-white/70 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-600">{g.label}</p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold leading-snug">{g.line}</p>
          </div>
        </section>
      </div>

      <section id="plans" className="px-4 sm:px-6 py-6 scroll-mt-20">
        <PricingPlans checkHref="/#geo-check" planHref="/#apply" planLabel={m.talkFirst} included={included} />
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-5">
        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Three ways to pay for the plan</h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {ways.map((w) => (
              <div key={w.name} className="rounded-xl border border-black/10 bg-[#f7f6f4] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{w.name}</p>
                <p className="mt-1 text-lg font-extrabold">{w.price}</p>
                <p className="text-sm text-slate-600">{w.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Prices in US dollars. Every way to pay includes the same work and the detailed report; only the billing period differs.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">What the plan includes</h2>
          <ul className="mt-4 space-y-2.5 text-sm sm:text-base">
            {included.map((x) => (
              <li key={x} className="flex gap-2.5 leading-relaxed">
                <span className="font-bold text-violet-600 shrink-0">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500">{plan.notIncluded}</p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">The growth guarantee</h2>
          <p className="mt-3 font-bold">{g.line}</p>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            It comes with every paid plan, from its launch. We count it the way we count everything: your day-0 questions, all four assistants,
            the same number of asks every time. How that count works:{" "}
            <Link href="/business/how-we-measure-ai-visibility" className="text-violet-700 font-semibold hover:underline">
              how we measure AI visibility
            </Link>
            . Full conditions:{" "}
            <Link href="/terms#growth-guarantee" className="text-violet-700 font-semibold hover:underline">
              Terms
            </Link>
            .
          </p>
        </section>

        <Faq items={items} />

        <section className="mt-10 grid sm:grid-cols-3 gap-4">
          <Link href={SAMPLE_PATH} className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">See a real report →</span>
            <span className="block text-sm text-slate-600 mt-1">What the free detailed report shows, on a real site.</span>
          </Link>
          <Link href="/business/how-we-measure-ai-visibility" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">How we measure →</span>
            <span className="block text-sm text-slate-600 mt-1">20 questions, 4 assistants, the same count every two weeks.</span>
          </Link>
          <Link href="/business/geo-for-apps" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">GEO for apps →</span>
            <span className="block text-sm text-slate-600 mt-1">The same work on our own apps, with their numbers.</span>
          </Link>
        </section>

        <p className="text-center pt-6">
          <Link href="/#geo-check" className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-3">
            {m.checkMySite}
          </Link>
        </p>
      </div>
      </main>
    </ToolShell>
  )
}
