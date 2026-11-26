import type { Metadata } from "next"
import ToolShell from "../../_tools/ToolShell"
import { noteCrawler } from "@/lib/crawler-log"

// Sample report and an anonymous client case, in German only (25 Nov 2026, Venture OS mission 140, plan item
// proof-sample-report-de). middleware.ts marks the page German (GERMAN_PAGES).
//
// Part 1 uses only the saved quick check of 22 Nov 2026 (5 questions about orthodontists in Köln, ChatGPT, Gemini
// and Perplexity with web search, each asked twice: 30 answers; itgrows-vm
// /root/geo_check/state/sample/kfo-koeln-2026-11-22.json). The figures are the same as on /business/kieferorthopaedie
// (28 practices after merging spellings, the top eight, "20 more with 1 to 5"); keep both pages in step.
// No new measurement was made for this page.
//
// Part 2 is a client who allowed us on 23 Nov 2026 to describe the work anonymously, as an "orthopädische
// Privatpraxis in Bonn". It says what was done and what was seen. 26 Nov 2026 (Kiryl): the Google Search Console
// figures from the GEO Results Update of 25 Nov (report "Generative AI features": 181 -> 3,928 impressions, 29.09-26.10
// vs 27.10-23.11; clicks 111 -> 301), the same as on "/" (app/_home/Cases.tsx). Mentions by the four assistants in our
// 20-question measurement are unchanged (12 of 80), so no growth is claimed for those.

const PATH = "/business/kieferorthopaedie/beispielbericht"
const MAIL = "kiryl@itgrows.ai"
const REPORT = "/de/business/ai-visibility-checker?utm_source=kfo-sample&utm_medium=site&utm_campaign=m140-sample"

export const metadata: Metadata = {
  title: "Beispielbericht: Wen nennt die KI als Kieferorthopäde in Köln? | ItGrows",
  description:
    "Ein Beispielbericht aus 30 echten KI-Antworten zu Kieferorthopäden in Köln: Methode, Ergebnis, Schwankung und was das für eine Praxis bedeutet. Dazu ein anonymer Praxisfall aus Bonn.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Beispielbericht: Wen nennt die KI als Kieferorthopäde in Köln?",
    description: "30 KI-Antworten, 28 Praxen, drei davon in rund jeder dritten Antwort.",
    url: PATH,
    locale: "de_DE",
    type: "article",
  },
}

const QUESTIONS = [
  "Welcher Kieferorthopäde in Köln ist gut für Kinder?",
  "Welche kieferorthopädische Praxis in Köln empfiehlst du für Erwachsene, die eine unsichtbare Zahnspange (Aligner) möchten?",
  "Welcher Kieferorthopäde in Köln macht eine Behandlung mit Invisalign?",
  "Wo bekomme ich in Köln eine kieferorthopädische Zweitmeinung zu einem Behandlungsplan?",
  "Welche Kieferorthopädie-Praxis in Köln hat schnell einen Termin für die Erstberatung?",
]

// Same rows as /business/kieferorthopaedie: in how many of the 30 answers each practice appeared, and per assistant (of 10).
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
const label = "text-[11px] font-bold uppercase tracking-wide text-violet-700"
const btnDark = "inline-block text-center rounded-xl bg-[#1b1916] text-white hover:bg-black px-5 py-3 text-sm font-bold"
const btnLight = "inline-block text-center rounded-xl bg-white text-[#1b1916] border border-black/15 hover:bg-violet-50 px-5 py-3 text-sm font-bold"

const CALL = `mailto:${MAIL}?subject=${encodeURIComponent("15 Minuten: KI-Sichtbarkeit meiner Praxis")}&body=${encodeURIComponent(
  "Guten Tag,\n\nich möchte in 15 Minuten sehen, wen KI-Assistenten in meiner Stadt statt meiner Praxis nennen.\n\nPraxis:\nWebsite:\nPassende Zeiten:\n",
)}`

function Stat({ value, text }: { value: string; text: string }) {
  return (
    <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-slate-700">{text}</p>
    </div>
  )
}

export default function BeispielberichtPage() {
  void noteCrawler(PATH)
  return (
    <ToolShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">
            Beispielbericht · Schnellcheck Köln · 22. November 2026 · kein Kundenfall
          </p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">Wen nennt die KI als Kieferorthopäde in Köln?</h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
            So ist ein Bericht von uns aufgebaut: Methode, Ergebnis, wie stabil es ist und was es für eine Praxis bedeutet. Hier mit
            einem kleinen Schnellcheck ohne Kundendaten. Unten folgt ein anonymer Fall aus einer Praxis, mit der wir arbeiten.
          </p>
        </section>

        <section className={card}>
          <p className={label}>1 · Methode</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Fünf Patientenfragen, drei Assistenten, zwei Durchläufe</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm space-y-1">
            {QUESTIONS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <ul className="mt-4 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Gefragt wurden ChatGPT, Gemini und Perplexity, jeweils mit Websuche, jede Frage zweimal: zusammen 30 Antworten.</li>
            <li>
              Genannt heißt: Die Praxis oder eine Ärztin, ein Arzt der Praxis steht im Antworttext. Verschiedene Schreibweisen derselben
              Praxis haben wir zusammengeführt.
            </li>
            <li>Claude war in diesem Beispiel nicht dabei. Im Plan messen wir mit 20 Fragen, vier Assistenten und je drei Durchläufen.</li>
          </ul>
        </section>

        <section className={card}>
          <p className={label}>2 · Ergebnis</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Wenige Praxen teilen sich die Antworten</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value="30" text="Antworten ausgewertet" />
            <Stat value="28" text="verschiedene Praxen genannt" />
            <Stat value="3" text="Praxen in rund jeder dritten Antwort (11, 10 und 9 von 30)" />
            <Stat value="29 von 30" text="Antworten verweisen auf Quellen im Netz" />
          </div>
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
                  <td className="py-2 pr-3 text-slate-500" colSpan={4}>
                    je 1 bis 5 von 30 Antworten
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Die Praxen sind nummeriert statt genannt. Das ist keine Rangliste der Behandlungsqualität.</p>
        </section>

        <section className={card}>
          <p className={label}>3 · Wie stabil ist das?</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Dieselbe Frage ergibt nicht immer dieselbe Antwort</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Bei Frage 5 nannte ChatGPT erst vier, dann fünf Praxen. Keine davon kam in beiden Antworten vor.</li>
            <li>Bei Frage 3 waren es in beiden Durchläufen fast dieselben Praxen.</li>
            <li>Bei der Frage nach einer Zweitmeinung nannte Gemini in beiden Durchläufen gar keine Praxis.</li>
            <li>Die Assistenten sind sich nicht einig: Praxis 6 nennt Perplexity in 6 von 10 Antworten, ChatGPT nur in einer.</li>
          </ul>
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm leading-relaxed">
            <p className="font-bold">Unsere Regel für das Rauschen</p>
            <p className="mt-1">
              Eine Praxis, die nur in einer oder zwei von 30 Antworten vorkommt, kann beim nächsten Durchlauf fehlen. Das werten wir
              nicht als Ergebnis. Als Veränderung zählt nur, was zwischen zwei Messungen mit denselben Fragen, denselben Assistenten und
              gleich vielen Durchläufen über diese Schwankung hinausgeht.
            </p>
          </div>
        </section>

        <section className={card}>
          <p className={label}>4 · Was das für eine Praxis bedeutet</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Genannt werden heißt: auf der kurzen Liste stehen</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Eine Antwort nennt meist nur wenige Praxen. Wer nicht darin steht, kommt in dieser Antwort nicht vor.</li>
            <li>
              Fast jede Antwort stützt sich auf Quellen im Netz. Was dort über eine Praxis steht, entscheidet mit, ob sie genannt wird.
            </li>
            <li>
              Deshalb besteht der Plan aus Arbeit, nicht nur aus Messung: Artikel auf der eigenen Domain zu den Fragen der Patienten,
              vorbereitete Profile auf den Seiten, die KI zitiert, und alle zwei Wochen eine neue Messung auf gleicher Basis.
            </li>
          </ul>
        </section>

        <section className={`${card} border-violet-300`} id="praxisfall">
          <p className={label}>Anonymer Praxisfall · veröffentlicht mit Erlaubnis der Praxis</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Orthopädische Privatpraxis in Bonn</h2>
          <p className="mt-2 text-sm text-slate-600">Zusammenarbeit seit Ende Oktober 2026. Stand: 22. November 2026.</p>
          <h3 className="mt-4 font-bold">Was wir gemacht haben</h3>
          <ul className="mt-2 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Die Fragen festgelegt, die Patienten der Praxis an KI-Assistenten stellen, und gemessen, wer dort genannt wird.</li>
            <li>
              Etwa alle drei Tage ein Fachartikel zu einer dieser Fragen, mit Autorenzeile der behandelnden Ärztin oder des Arztes.
              Studien mit Autor, Jahr und Zeitschrift, die Quellen gesammelt am Ende, ohne Heilversprechen.
            </li>
            <li>Jeder Artikel kommt als Entwurf in WordPress und geht erst online, wenn die Praxis ihn freigibt.</li>
            <li>Stand 22. November: 10 Artikel online.</li>
          </ul>
          <h3 className="mt-4 font-bold">Was wir beobachtet haben</h3>
          <ul className="mt-2 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Perplexity (29. Oktober) und Gemini (13. November) haben je einen dieser Artikel als Quelle angeführt.</li>
            <li>
              Google Search Console: Einblendungen in KI-Antworten von Google 3.928 in 28 Tagen (27.10.–23.11.) statt 181 in den
              28 Tagen davor; Klicks aus der Google-Suche 111 → 301.
            </li>
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 border border-black/10 p-4 text-sm leading-relaxed">
            <p className="font-bold">Was wir noch nicht behaupten</p>
            <p className="mt-1">
              Bei den Nennungen durch die vier KI-Assistenten (unsere Messung mit 20 Fragen) steht die Praxis weiterhin bei 12 von 80,
              ohne Veränderung. Einen Anstieg dieser Nennungen zeigen wir erst, wenn er zwischen zwei Messungen auf gleicher Basis über
              dem Rauschen liegt. Die nächste Vergleichsmessung folgt.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold">Den Bericht für Ihre Praxis sehen</h2>
          <p className="mt-2 text-sm text-white/75">
            Der kostenlose Bericht zeigt, wen die vier Assistenten bei 20 Fragen Ihrer Patienten statt Ihnen nennen. Oder wir gehen ihn
            in 15 Minuten gemeinsam durch.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a href={REPORT} className={btnLight}>
              Kostenlosen Bericht für meine Praxis
            </a>
            <a href={CALL} className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              15 Minuten sprechen
            </a>
          </div>
        </section>

        <p className="text-center">
          <a href="/business/kieferorthopaedie" className={btnDark}>
            Zurück zur Seite für Kieferorthopäden
          </a>
        </p>
      </main>
    </ToolShell>
  )
}
