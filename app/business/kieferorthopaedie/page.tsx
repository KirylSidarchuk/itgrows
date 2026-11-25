import type { Metadata } from "next"
import ToolShell from "../_tools/ToolShell"
import { noteCrawler } from "@/lib/crawler-log"
import { geoPriceLabels } from "@/lib/geo-pricing"
import { t } from "@/lib/i18n/messages"
import growthGuarantee from "@/lib/i18n/messages/growthGuarantee"
import pricingPlans from "@/lib/i18n/messages/pricingPlans"

// The page for orthodontists and dental practices, in German only (22 Nov 2026, Venture OS №72). middleware.ts
// marks it German (GERMAN_PAGES), so the layout renders <html lang="de"> and ToolShell its German header.
//
// What it shows is real: a quick check we ran on 22 Nov 2026 (5 questions about orthodontists in Köln, ChatGPT,
// Gemini and Perplexity with web search, each asked twice: 30 answers; /root/geo_check/sample_check.py, the answers
// in /root/geo_check/state/sample/kfo-koeln-2026-11-22.json on itgrows-vm). The practices are numbered, not named.
// It is labelled a sample, not a client case: no client has yet grown above the noise in two measurements in a row.
// The plan, its prices and the guarantee come from the same sources as the home page (pricingPlans, geo-pricing,
// growthGuarantee), so they cannot drift from it.
//
// The outreach links come here with ?utm_source=kfo-…; the free-report buttons carry that mark on to the check,
// where lib/visit-source.ts names it in the owner's Telegram line.

const PATH = "/business/kieferorthopaedie"
const MAIL = "kiryl@itgrows.ai"

export const metadata: Metadata = {
  title: "KI-Sichtbarkeit für Kieferorthopäden und Zahnarztpraxen | ItGrows",
  description:
    "Wen nennen ChatGPT, Gemini und Perplexity, wenn Patienten nach einem Kieferorthopäden in ihrer Stadt fragen? Ein echter Schnellcheck für Köln und was der Plan für Praxen enthält.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Wird Ihre Praxis genannt, wenn Patienten ChatGPT fragen?",
    description: "Ein echter Schnellcheck: 30 KI-Antworten zu Kieferorthopäden in Köln.",
    url: PATH,
    locale: "de_DE",
    type: "website",
  },
}

// 22 Nov 2026: the five questions as asked.
const QUESTIONS = [
  "Welcher Kieferorthopäde in Köln ist gut für Kinder?",
  "Welche kieferorthopädische Praxis in Köln empfiehlst du für Erwachsene, die eine unsichtbare Zahnspange (Aligner) möchten?",
  "Welcher Kieferorthopäde in Köln macht eine Behandlung mit Invisalign?",
  "Wo bekomme ich in Köln eine kieferorthopädische Zweitmeinung zu einem Behandlungsplan?",
  "Welche Kieferorthopädie-Praxis in Köln hat schnell einen Termin für die Erstberatung?",
]

// The eight practices named most often, of 28 named at all, in how many of the 30 answers each appeared
// (spellings merged), and by which assistant (out of 10 answers each).
const TOP: { n: number; chatgpt: number; gemini: number; perplexity: number }[] = [
  { n: 11, chatgpt: 5, gemini: 2, perplexity: 4 },
  { n: 10, chatgpt: 3, gemini: 5, perplexity: 2 },
  { n: 9, chatgpt: 2, gemini: 5, perplexity: 2 },
  { n: 8, chatgpt: 4, gemini: 2, perplexity: 2 },
  { n: 8, chatgpt: 3, gemini: 2, perplexity: 3 },
  { n: 8, chatgpt: 1, gemini: 1, perplexity: 6 },
  { n: 6, chatgpt: 3, gemini: 3, perplexity: 0 },
  { n: 6, chatgpt: 5, gemini: 1, perplexity: 0 },
]

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"
const btnDark = "inline-block text-center rounded-xl bg-[#1b1916] text-white hover:bg-black px-5 py-3 text-sm font-bold"
const btnLight = "inline-block text-center rounded-xl bg-white text-[#1b1916] border border-black/15 hover:bg-violet-50 px-5 py-3 text-sm font-bold"

function mailto(subject: string, body: string) {
  return `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const CALL = mailto(
  "15 Minuten: KI-Sichtbarkeit meiner Praxis",
  "Guten Tag,\n\nich möchte in 15 Minuten sehen, wen KI-Assistenten in meiner Stadt statt meiner Praxis nennen.\n\nPraxis:\nWebsite:\nPassende Zeiten:\n",
)
const START = mailto(
  "START: Plan für meine Praxis",
  "START\n\nPraxis:\nWebsite:\nRechnungsadresse:\nUSt-IdNr. (falls vorhanden):\nMonatlich oder 3 Monate im Voraus:\n",
)

function mark(raw: string | string[] | undefined) {
  const v = (Array.isArray(raw) ? raw[0] : raw) ?? ""
  return /^[a-z0-9-]{1,40}$/.test(v) ? v : "kfo-page"
}

export default async function KieferorthopaediePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const q = await searchParams
  const source = mark(q.utm_source)
  const report = `/de/business/ai-visibility-checker?utm_source=${source}&utm_medium=${source === "kfo-page" ? "site" : "outreach"}&utm_campaign=m52-kfo`
  void noteCrawler(PATH)
  const plan = t("de", pricingPlans)
  const g = t("de", growthGuarantee)
  const p = geoPriceLabels("de")

  return (
    <ToolShell guaranteeFootnote>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">Für Kieferorthopäden und Zahnarztpraxen</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Patienten fragen ChatGPT nach einem Kieferorthopäden. Wird Ihre Praxis genannt?
          </h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
            Wir haben es für Köln ausprobiert: fünf typische Patientenfragen, drei KI-Assistenten, jede Frage zweimal.
            In 30 Antworten tauchten 28 verschiedene Praxen auf, drei davon in rund jeder dritten Antwort. Jede andere
            Kölner Praxis kam in keiner dieser 30 Antworten vor.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={report} className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
              Kostenlosen Bericht für meine Praxis
            </a>
            <a href={CALL} className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              15 Minuten sprechen
            </a>
          </div>
        </section>

        <section className={card} id="beispiel">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Beispiel · Schnellcheck Köln · 22. November 2026 · kein Kundenfall</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Wen die KI in Köln als Kieferorthopäden nennt</h2>
          <p className="mt-2 text-sm text-slate-600">Die fünf Fragen, so wie wir sie gestellt haben, ohne den Namen einer Praxis:</p>
          <ol className="mt-2 list-decimal pl-5 text-sm space-y-1">
            {QUESTIONS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-black/10">
                  <th className="py-2 pr-3 font-semibold">Praxis</th>
                  <th className="py-2 pr-3 font-semibold">Genannt in</th>
                  <th className="py-2 pr-3 font-semibold">ChatGPT</th>
                  <th className="py-2 pr-3 font-semibold">Gemini</th>
                  <th className="py-2 font-semibold">Perplexity</th>
                </tr>
              </thead>
              <tbody>
                {TOP.map((r, i) => (
                  <tr key={i} className="border-b border-black/5">
                    <td className="py-2 pr-3 font-semibold">Praxis {i + 1}</td>
                    <td className="py-2 pr-3">{r.n} von 30 Antworten</td>
                    <td className="py-2 pr-3">{r.chatgpt} von 10</td>
                    <td className="py-2 pr-3">{r.gemini} von 10</td>
                    <td className="py-2">{r.perplexity} von 10</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 text-slate-500">20 weitere Praxen</td>
                  <td className="py-2 pr-3 text-slate-500" colSpan={4}>je 1 bis 5 von 30 Antworten</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-5 text-sm space-y-2 list-disc pl-5">
            <li>
              Die Assistenten sind sich nicht einig: Praxis 6 nennt Perplexity in 6 von 10 Antworten, ChatGPT nur in einer.
              Wer nur ChatGPT prüft, sieht einen Teil des Bildes.
            </li>
            <li>
              Bei der Frage nach einer Zweitmeinung nannte Gemini in beiden Durchläufen gar keine Praxis. Diese Antwort
              ist noch frei.
            </li>
            <li>29 der 30 Antworten verweisen auf Quellen im Netz. Was dort über eine Praxis steht, entscheidet mit, ob sie genannt wird.</li>
          </ul>
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm leading-relaxed">
            <p className="font-bold">Warum ein einzelner Check nicht reicht</p>
            <p className="mt-1">
              Dieselbe Frage zweimal gestellt, ergibt nicht dieselbe Antwort. Bei Frage 5 nannte ChatGPT erst vier, dann fünf
              Praxen, keine davon in beiden Antworten. Bei Frage 3 waren es beide Male fast dieselben. Deshalb messen wir im
              Plan mit 20 Fragen, vier Assistenten und je drei Durchläufen und vergleichen nur Gleiches mit Gleichem.
            </p>
          </div>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Methode dieses Beispiels: 5 Fragen auf Deutsch, die Stadt in der Frage; ChatGPT, Gemini und Perplexity mit Websuche,
            je 2 Durchläufe, zusammen 30 Antworten; genannt heißt: die Praxis oder eine Ärztin, ein Arzt der Praxis steht im
            Antworttext, verschiedene Schreibweisen zusammengeführt. Claude war in diesem Beispiel nicht dabei. Eine kleine
            Stichprobe an einem Tag: Sie zeigt, wie die Antworten aussehen, und ist keine feste Rangliste. Die Praxen sind
            nummeriert statt genannt.
          </p>
          <p className="mt-3 text-sm">
            <a href="/business/kieferorthopaedie/beispielbericht" className="underline font-semibold">
              Der ausführliche Beispielbericht, mit einem anonymen Praxisfall aus Bonn
            </a>
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className={card}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ein Monitoring-Tool</p>
            <h2 className="mt-1 text-lg font-extrabold">Zeigt Ihnen, wo Sie fehlen</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>Ein Dashboard mit Fragen, die Sie meist selbst eintragen</li>
              <li>Texte, Profile und Einträge schreiben Sie oder Ihre Agentur</li>
              <li>Sie bezahlen für die Messung; ob sich etwas ändert, liegt bei Ihnen</li>
            </ul>
          </div>
          <div className={`${card} border-violet-300`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">ItGrows</p>
            <h2 className="mt-1 text-lg font-extrabold">Misst und macht die Arbeit</h2>
            <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
              <li>Gemessen wird mit den Fragen Ihrer Patienten, bei allen vier Assistenten</li>
              <li>Wir schreiben die Artikel und veröffentlichen sie auf Ihrer Domain</li>
              <li>Wir bereiten Ihre Profile auf den Seiten vor, die KI zitiert</li>
              <li>Alle zwei Wochen neu gemessen, und der nächste Schritt dort, wo Sie fehlen</li>
            </ul>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-extrabold">Für Arztpraxen geschrieben</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>In WordPress kommt jeder Artikel als Entwurf: Online geht er erst, wenn Sie ihn freigeben.</li>
            <li>Ohne Heilversprechen und ohne Vorher-Nachher-Bilder; Studien mit Autor, Jahr und Zeitschrift.</li>
            <li>Ihre Praxis steht als Kontaktzeile im Artikel, nicht als Werbetext.</li>
          </ul>
        </section>

        <section className={card} id="plan">
          <h2 className="text-xl sm:text-2xl font-extrabold">Was der Plan enthält</h2>
          <p className="mt-2 text-3xl font-extrabold">
            {p.month}
            <span className="text-base font-semibold text-slate-500">{plan.perMonth}</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">{plan.monthNote(p.setup)}</p>
          <p className="mt-1 text-sm text-slate-600">
            3 Monate im Voraus: {p.quarter}, ohne Einrichtungsgebühr · Jährlich: {p.year} ({p.yearPerMonth}
            {plan.perMonth}), ohne Einrichtungsgebühr
          </p>
          <ul className="mt-4 text-sm space-y-2 list-disc pl-5">
            {plan.planPoints.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold">{g.line}</p>
          <p className="mt-3 text-xs text-slate-500">{plan.notIncluded}</p>
        </section>

        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8" id="kontakt">
          <h2 className="text-xl sm:text-2xl font-extrabold">Zwei Wege, Sie entscheiden</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/15 p-4">
              <p className="font-bold">15 Minuten</p>
              <p className="mt-1 text-sm text-white/75">Wir zeigen Ihnen, wen die KI in Ihrer Stadt statt Ihrer Praxis nennt, und was wir als Erstes tun würden.</p>
              <a href={CALL} className={`${btnLight} mt-3`}>
                Termin anfragen
              </a>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/15 p-4">
              <p className="font-bold">START</p>
              <p className="mt-1 text-sm text-white/75">Antworten Sie mit START. Sie bekommen die Rechnung und den Startplan, die Einrichtung beginnt.</p>
              <a href={START} className={`${btnLight} mt-3`}>
                START senden
              </a>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/75">
            Lieber erst selbst sehen?{" "}
            <a href={report} className="underline text-white">
              Der kostenlose Bericht für Ihre Website
            </a>{" "}
            zeigt, wen die vier Assistenten bei 20 Fragen Ihrer Patienten statt Ihnen nennen.
          </p>
        </section>

        <p className="text-center">
          <a href={report} className={btnDark}>
            Kostenlosen Bericht für meine Praxis
          </a>
        </p>
      </main>
    </ToolShell>
  )
}
