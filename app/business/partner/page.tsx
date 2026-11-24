import type { Metadata } from "next"
import ToolShell from "../_tools/ToolShell"
import { noteCrawler } from "@/lib/crawler-log"
import { geoPriceLabels } from "@/lib/geo-pricing"
import { t } from "@/lib/i18n/messages"
import pricingPlans from "@/lib/i18n/messages/pricingPlans"

// Partner page for web, SEO and practice-marketing agencies in DE/AT, in German only (24 Nov 2026, Venture OS mission 52,
// sprint test T4 "partners"). middleware.ts marks it German (GERMAN_PAGES). Two ways to work together: a referral (20% of
// the payments ItGrows actually receives from the referred client in the first 3 months, the client pays the public price)
// or white label (the agency resells under its own name; ItGrows delivers at the public price, the agency sets its markup).
// Proof is only what is real: the Köln quick check of 22 Nov 2026 (on /business/kieferorthopaedie) and an anonymous client
// mention the client allowed on 23 Nov 2026 ("orthopädische Privatpraxis in Bonn"); no growth claims.

const PATH = "/business/partner"
const MAIL = "kiryl@itgrows.ai"

export const metadata: Metadata = {
  title: "Partnerprogramm für Web- und SEO-Agenturen: KI-Sichtbarkeit für Ihre Kunden | ItGrows",
  description:
    "Ihre Kunden fragen, ob ChatGPT sie empfiehlt. Bieten Sie KI-Sichtbarkeit an, ohne eigenes Team: als Empfehlung mit 20 % Provision oder als White Label unter Ihrem Namen.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "KI-Sichtbarkeit für Ihre Kunden, ohne neues Team",
    description: "Partnerprogramm von ItGrows für Web-, SEO- und Praxismarketing-Agenturen.",
    url: PATH,
    locale: "de_DE",
    type: "website",
  },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"
const btnDark = "inline-block text-center rounded-xl bg-[#1b1916] text-white hover:bg-black px-5 py-3 text-sm font-bold"

function mailto(subject: string, body: string) {
  return `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const JOIN = mailto(
  "Partner werden: KI-Sichtbarkeit für unsere Kunden",
  "Guten Tag,\n\nwir möchten KI-Sichtbarkeit für unsere Kunden anbieten.\n\nAgentur:\nWebsite:\nModell (Empfehlung / White Label):\nWelche Kunden (Branche, Region):\n",
)
const ONE = mailto(
  "Einen Kunden prüfen: wen nennt die KI statt ihm?",
  "Guten Tag,\n\nbitte prüfen Sie einen unserer Kunden.\n\nWebsite des Kunden:\nStadt:\nBranche:\nAgentur:\n",
)

export default async function PartnerPage() {
  void noteCrawler(PATH)
  const plan = t("de", pricingPlans)
  const p = geoPriceLabels("de")
  const report = "/de/business/ai-visibility-checker?utm_source=partner-page&utm_medium=site&utm_campaign=m52-partner"

  return (
    <ToolShell guaranteeFootnote>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">Für Web-, SEO- und Praxismarketing-Agenturen</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ihre Kunden fragen, ob ChatGPT sie empfiehlt. Haben Sie eine Antwort?
          </h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
            Patienten und Kunden fragen inzwischen ChatGPT, Gemini und Perplexity, wen sie wählen sollen. Wer dort nicht
            genannt wird, fehlt in der Auswahl. Mit ItGrows bieten Sie KI-Sichtbarkeit an, ohne dafür ein Team aufzubauen:
            wir messen, schreiben und berichten, Sie behalten die Kundenbeziehung.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={JOIN} className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
              Partner werden
            </a>
            <a href={ONE} className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              Einen Ihrer Kunden prüfen lassen
            </a>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className={card}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Modell 1 · Empfehlung</p>
            <h2 className="mt-1 text-lg font-extrabold">Sie empfehlen, wir liefern</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>Ihr Kunde schließt direkt mit uns ab, zum öffentlichen Preis.</li>
              <li>Sie erhalten 20 % der Zahlungen, die wir von diesem Kunden in den ersten 3 Monaten tatsächlich erhalten.</li>
              <li>Kein Aufwand für Sie nach der Empfehlung; Sie sehen die Berichte, wenn Ihr Kunde zustimmt.</li>
            </ul>
          </div>
          <div className={`${card} border-violet-300`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Modell 2 · White Label</p>
            <h2 className="mt-1 text-lg font-extrabold">Unter Ihrem Namen</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>Sie verkaufen KI-Sichtbarkeit als eigene Leistung und legen Ihren Preis selbst fest.</li>
              <li>Wir liefern zum öffentlichen Preis: Messung, Artikel, Berichte, ohne unseren Namen beim Kunden.</li>
              <li>Ihr Aufschlag bleibt bei Ihnen.</li>
            </ul>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-extrabold">Was Ihr Kunde bekommt</h2>
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
          <h2 className="text-lg font-extrabold">Was wir zeigen können</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>
              Ein echter Schnellcheck für Köln: 30 KI-Antworten zu Kieferorthopäden, 28 verschiedene Praxen genannt.{" "}
              <a className="underline" href="/business/kieferorthopaedie#beispiel">Zum Beispiel</a>
            </li>
            <li>Unter unseren Kunden ist eine orthopädische Privatpraxis in Bonn; wir betreuen sie seit Oktober 2026.</li>
            <li>Jeder Artikel kommt in WordPress als Entwurf und geht erst nach Freigabe online.</li>
          </ul>
          <p className="mt-4 text-sm">
            Am schnellsten überzeugt ein Bericht über einen Ihrer Kunden:{" "}
            <a className="underline" href={report}>kostenloser Bericht</a>, oder schicken Sie uns die Website per{" "}
            <a className="underline" href={ONE}>E-Mail</a>.
          </p>
        </section>

        <p className="text-center">
          <a href={JOIN} className={btnDark}>
            Partner werden
          </a>
        </p>
      </main>
    </ToolShell>
  )
}
