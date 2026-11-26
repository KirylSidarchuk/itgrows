import type { Metadata } from "next"
import ToolShell from "../_tools/ToolShell"
import { noteCrawler } from "@/lib/crawler-log"
import { geoPriceLabels } from "@/lib/geo-pricing"
import { t } from "@/lib/i18n/messages"
import pricingPlans from "@/lib/i18n/messages/pricingPlans"

// Partner page for web, SEO and marketing agencies worldwide, in English (24 Nov 2026, Venture OS mission 52, sprint
// test T4b "agencies worldwide"; the German version is /business/partner). Two ways to work together: a referral (20% of
// the payments ItGrows actually receives from the referred client in the first 6 months since 26 Nov 2026, the client pays the public
// price) or white label (the agency resells under its own name; ItGrows delivers at a partner price, unpublished, shared on request, the agency sets its
// markup). Proof is only what is real: the Cologne quick check of 22 Nov 2026 and an anonymous client mention allowed on
// 23 Nov 2026 ("a private orthopaedic practice in Bonn"); no growth claims.

const PATH = "/business/agencies"
const MAIL = "kiryl@itgrows.ai"

export const metadata: Metadata = {
  title: "Partner program for web, SEO and marketing agencies: AI visibility for your clients | ItGrows",
  description:
    "Your clients ask whether ChatGPT recommends them. Offer AI visibility without hiring a team: as a referral with 20% commission or white label under your own name.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "AI visibility for your clients, without a new team",
    description: "ItGrows partner program for web, SEO and marketing agencies.",
    url: PATH,
    locale: "en_US",
    type: "website",
  },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"
const btnDark = "inline-block text-center rounded-xl bg-[#1b1916] text-white hover:bg-black px-5 py-3 text-sm font-bold"

function mailto(subject: string, body: string) {
  return `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const JOIN = mailto(
  "Partner: AI visibility for our clients",
  "Hi Kiryl,\n\nwe'd like to offer AI visibility to our clients.\n\nAgency:\nWebsite:\nModel (referral / white label):\nClients (industry, region):\n",
)
const ONE = mailto(
  "Check one client: who does AI name instead of them?",
  "Hi Kiryl,\n\nplease check one of our clients.\n\nClient website:\nCity:\nIndustry:\nAgency:\n",
)

export default async function AgenciesPage() {
  void noteCrawler(PATH)
  const plan = t("en", pricingPlans)
  const p = geoPriceLabels("en")
  const report = "/business/ai-visibility-checker?utm_source=agencies-page&utm_medium=site&utm_campaign=m52-agencies"

  return (
    <ToolShell guaranteeFootnote>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">For web, SEO and marketing agencies</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Your clients ask whether ChatGPT recommends them. Do you have an answer?
          </h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
            Customers now ask ChatGPT, Gemini and Perplexity who to choose. A business that is not named is not in the
            shortlist. With ItGrows you offer AI visibility without building a team: we measure, write and report, you keep
            the client relationship.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={JOIN} className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
              Become a partner
            </a>
            <a href={ONE} className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              Check one of your clients
            </a>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className={card}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Model 1 · Referral</p>
            <h2 className="mt-1 text-lg font-extrabold">You refer, we deliver</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>Your client signs up with us directly, at the public price.</li>
              <li>You receive 20% of the payments we actually receive from that client in the first 6 months.</li>
              <li>No work for you after the intro; you see the reports if your client agrees.</li>
            </ul>
          </div>
          <div className={`${card} border-violet-300`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Model 2 · White label</p>
            <h2 className="mt-1 text-lg font-extrabold">Under your name</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>You sell AI visibility as your own service and set your own price.</li>
              <li>We deliver at a partner price for agencies, which we share when you write to us: measurement, articles, reports, with no ItGrows name in front of the client.</li>
              <li>Your markup stays with you.</li>
            </ul>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-extrabold">What your client gets</h2>
          <p className="mt-2 text-2xl font-extrabold">
            {p.month}
            <span className="text-base font-semibold text-slate-500">{plan.perMonth}</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">{plan.monthNote(p.setup)}</p>
          <ul className="mt-4 text-sm space-y-2 list-disc pl-5">
            {plan.planPoints.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">{plan.notIncluded}</p>
        </section>

        <section className={card}>
          <h2 className="text-lg font-extrabold">What we can show</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>
              A real quick check for Cologne: 30 AI answers about orthodontists, 28 different practices named.{" "}
              <a className="underline" href="/business/kieferorthopaedie#beispiel">See the example (German)</a>
            </li>
            <li>Our clients include a private orthopaedic practice in Bonn; we have worked with them since October 2026.</li>
            <li>Every article goes into WordPress as a draft and is published only after approval.</li>
          </ul>
          <p className="mt-4 text-sm">
            The fastest proof is a report on one of your clients:{" "}
            <a className="underline" href={report}>free report</a>, or send us the website by{" "}
            <a className="underline" href={ONE}>email</a>.
          </p>
        </section>

        <p className="text-center">
          <a href={JOIN} className={btnDark}>
            Become a partner
          </a>
        </p>
      </main>
    </ToolShell>
  )
}
