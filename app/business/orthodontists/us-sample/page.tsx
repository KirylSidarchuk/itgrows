import type { Metadata } from "next"
import ToolShell from "../../_tools/ToolShell"
import { noteCrawler } from "@/lib/crawler-log"

// US sample report, English (27 Nov 2026, Venture OS №491, itgrows:us-sample). Built like
// /business/kieferorthopaedie/beispielbericht. English is the default, so middleware.ts does not need this path.
//
// Part 1 uses only the browser check of 26-27 Nov 2026: 5 patient questions per city (Austin TX, Denver CO), each asked
// once in ChatGPT (temporary chat), Gemini (temporary chat) and Perplexity: 15 answers per city, 30 in all
// (itgrows-vm /root/geo_check/state/sample/us-browser-2026-11.json). Spellings of the same practice were merged
// (branches, "— Dr. …" suffixes). Austin: 47 practices, 32 named by one assistant only, 4 by all three, top 6 of 15.
// Denver: 42 practices, 29 by one only, 7 by all three, top 7 of 15. Practices are numbered, not named.
// These figures are quoted by itgrows:li-accepts (LinkedIn US); keep them in step.
//
// Part 2 is the anonymous client case also shown on /business/kieferorthopaedie/beispielbericht and "/"
// (app/_home/Cases.tsx): GSC "Generative AI features" 181 -> 3,928 (29.09-26.10 vs 27.10-23.11), clicks 111 -> 301,
// 12 of 80 mentions unchanged. The comparison line (other sites we track: 1.3 to 2.1 times over the same weeks) is from
// /opt/venture_os/research/itgrows_geo/2026-11-27_checks.md.

const PATH = "/business/orthodontists/us-sample"
const MAIL = "kiryl@itgrows.ai"
const REPORT = "/business/ai-visibility-checker?utm_source=us-sample&utm_medium=site&utm_campaign=us-li"

export const metadata: Metadata = {
  title: "Sample report: Which orthodontists do AI assistants name in Austin and Denver? | ItGrows",
  description:
    "A sample report from 30 real AI answers about orthodontists and family dentists in Austin and Denver: method, result, how much the assistants disagree and what it means for a practice.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Which orthodontists do AI assistants name in Austin and Denver?",
    description: "30 AI answers, 89 practices, 61 of them named by only one assistant.",
    url: PATH,
    locale: "en_US",
    type: "article",
  },
}

const QUESTIONS = [
  "Who is the best orthodontist in <City>?",
  "Which orthodontist in <City> is good for kids?",
  "Where can I get Invisalign in <City>?",
  "Which orthodontist in <City> offers a free consultation?",
  "Which dentist in <City> do you recommend for a family?",
]

type Row = { n: number; chatgpt: number; gemini: number; perplexity: number }

// In how many of the city's 15 answers each practice appeared, and per assistant (of 5).
const CITIES: { city: string; practices: number; one: number; all3: number; top: Row[]; rest: string }[] = [
  {
    city: "Austin, TX",
    practices: 47,
    one: 32,
    all3: 4,
    top: [
      { n: 6, chatgpt: 2, gemini: 1, perplexity: 3 },
      { n: 6, chatgpt: 3, gemini: 1, perplexity: 2 },
      { n: 5, chatgpt: 3, gemini: 0, perplexity: 2 },
      { n: 4, chatgpt: 2, gemini: 2, perplexity: 0 },
      { n: 4, chatgpt: 1, gemini: 1, perplexity: 2 },
      { n: 4, chatgpt: 2, gemini: 2, perplexity: 0 },
    ],
    rest: "41 more practices, 1 to 3 of 15 answers each",
  },
  {
    city: "Denver, CO",
    practices: 42,
    one: 29,
    all3: 7,
    top: [
      { n: 7, chatgpt: 3, gemini: 1, perplexity: 3 },
      { n: 7, chatgpt: 4, gemini: 3, perplexity: 0 },
      { n: 7, chatgpt: 0, gemini: 3, perplexity: 4 },
      { n: 5, chatgpt: 1, gemini: 2, perplexity: 2 },
      { n: 5, chatgpt: 1, gemini: 2, perplexity: 2 },
      { n: 4, chatgpt: 1, gemini: 1, perplexity: 2 },
      { n: 4, chatgpt: 1, gemini: 2, perplexity: 1 },
    ],
    rest: "35 more practices, 1 to 3 of 15 answers each",
  },
]

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"
const label = "text-[11px] font-bold uppercase tracking-wide text-violet-700"
const btnDark = "inline-block text-center rounded-xl bg-[#1b1916] text-white hover:bg-black px-5 py-3 text-sm font-bold"
const btnLight = "inline-block text-center rounded-xl bg-white text-[#1b1916] border border-black/15 hover:bg-violet-50 px-5 py-3 text-sm font-bold"

const CALL = `mailto:${MAIL}?subject=${encodeURIComponent("15 minutes: AI visibility of my practice")}&body=${encodeURIComponent(
  "Hi Kiryl,\n\nI'd like to see in 15 minutes whom AI assistants name in my city instead of my practice.\n\nPractice:\nWebsite:\nGood times:\n",
)}`

function Stat({ value, text }: { value: string; text: string }) {
  return (
    <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-slate-700">{text}</p>
    </div>
  )
}

export default function UsSamplePage() {
  void noteCrawler(PATH)
  return (
    <ToolShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">
            Sample report · quick check Austin and Denver · 26–27 November 2026 · not a client case
          </p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Which orthodontists do AI assistants name in Austin and Denver?
          </h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">
            This is how a report from us is built: method, result, how stable it is and what it means for a practice. Here with a small
            quick check and no client data. Below is an anonymous case from a practice we work with.
          </p>
        </section>

        <section className={card}>
          <p className={label}>1 · Method</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Five patient questions, three assistants, two cities</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm space-y-1">
            {QUESTIONS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <ul className="mt-4 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>
              We asked ChatGPT and Gemini in a temporary chat (no memory) and Perplexity, a new chat for every question, once each: 15
              answers per city, 30 in all.
            </li>
            <li>
              Named means: the practice, or a doctor of the practice, is in the answer. Different spellings and branches of the same
              practice were merged.
            </li>
            <li>Claude was not part of this sample. In the plan we measure with 20 questions, four assistants and three runs each.</li>
          </ul>
        </section>

        <section className={card}>
          <p className={label}>2 · Result</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Many practices, few of them in most answers</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value="30" text="answers checked, each one named practices" />
            <Stat value="89" text="different practices named in the two cities" />
            <Stat value="61 of 89" text="named by only one of the three assistants" />
            <Stat value="11" text="named by all three (4 in Austin, 7 in Denver)" />
          </div>
          {CITIES.map((c) => (
            <div key={c.city} className="mt-6">
              <h3 className="font-bold">
                {c.city}: {c.practices} practices, {c.one} named by one assistant only, {c.all3} by all three
              </h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-black/10">
                      <th className="py-2 pr-3 font-semibold">Practice</th>
                      <th className="py-2 pr-3 font-semibold">Named in</th>
                      <th className="py-2 pr-3 font-semibold">ChatGPT</th>
                      <th className="py-2 pr-3 font-semibold">Gemini</th>
                      <th className="py-2 font-semibold">Perplexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.top.map((r, i) => (
                      <tr key={i} className="border-b border-black/5">
                        <td className="py-2 pr-3 font-semibold">Practice {i + 1}</td>
                        <td className="py-2 pr-3">{r.n} of 15 answers</td>
                        <td className="py-2 pr-3">{r.chatgpt} of 5</td>
                        <td className="py-2 pr-3">{r.gemini} of 5</td>
                        <td className="py-2">{r.perplexity} of 5</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 text-slate-500" colSpan={5}>
                        {c.rest}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="mt-3 text-xs text-slate-500">Practices are numbered, not named. This is not a ranking of treatment quality.</p>
        </section>

        <section className={card}>
          <p className={label}>3 · How stable is this?</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">The assistants do not agree with each other</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Of 89 practices, 61 were named by only one assistant. A practice can be on ChatGPT&apos;s list and missing from Gemini&apos;s.</li>
            <li>In Denver, Practice 3 was named by Perplexity in 4 of 5 answers and by Gemini in 3, but never by ChatGPT.</li>
            <li>In Denver, Practice 2 was named by ChatGPT in 4 of 5 answers and never by Perplexity.</li>
            <li>The most named practice appeared in 6 of 15 answers in Austin and 7 of 15 in Denver: even the leader misses most answers.</li>
          </ul>
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm leading-relaxed">
            <p className="font-bold">Our rule for the noise</p>
            <p className="mt-1">
              We asked each question once here. The same question asked again can give a different list, so a practice named in one or
              two answers may be missing next time. We do not count that as a result. A change only counts when it goes beyond this
              noise between two measurements with the same questions, the same assistants and the same number of runs.
            </p>
          </div>
        </section>

        <section className={card}>
          <p className={label}>4 · What this means for a practice</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Being named means being on the short list</h2>
          <ul className="mt-3 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>An answer names only two to eight practices, most often five or six. A practice that is not in it does not exist in that answer.</li>
            <li>
              Each assistant builds its list from different sources, which is why the lists differ. What those sources say about a
              practice decides whether it is named.
            </li>
            <li>
              That is why the plan is work, not only measurement: articles on the practice&apos;s own website that answer patients&apos;
              questions, profiles on the sites AI assistants cite, and a new measurement every two weeks on the same basis.
            </li>
          </ul>
        </section>

        <section className={`${card} border-violet-300`} id="case">
          <p className={label}>Anonymous client case · published with the practice&apos;s permission</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">A private orthopaedic practice in Germany</h2>
          <p className="mt-2 text-sm text-slate-600">Working together since late October 2026. As of 22 November 2026.</p>
          <h3 className="mt-4 font-bold">What we did</h3>
          <ul className="mt-2 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Set the questions the practice&apos;s patients ask AI assistants, and measured whom the assistants name.</li>
            <li>
              About every three days an article on one of these questions, under the treating doctor&apos;s name, with studies cited by
              author, year and journal, and no promises of a cure.
            </li>
            <li>Every article goes to the practice as a draft and is published only when the practice approves it.</li>
            <li>As of 22 November: 10 articles online.</li>
          </ul>
          <h3 className="mt-4 font-bold">What we saw</h3>
          <ul className="mt-2 text-sm space-y-2 list-disc pl-5 text-slate-700">
            <li>Perplexity (29 October) and Gemini (13 November) each cited one of these articles as a source.</li>
            <li>
              Google Search Console: 3,928 appearances in Google&apos;s AI answers in 28 days (27.10–23.11) instead of 181 in the 28
              days before; clicks from Google Search 111 → 301. Other sites we track grew 1.3 to 2.1 times over the same weeks.
            </li>
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 border border-black/10 p-4 text-sm leading-relaxed">
            <p className="font-bold">What we do not claim yet</p>
            <p className="mt-1">
              In mentions by the four AI assistants (our 20-question measurement) the practice is still at 12 of 80, unchanged. We will
              show a rise in these mentions only when it goes beyond the noise between two measurements on the same basis.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold">See the report for your practice</h2>
          <p className="mt-2 text-sm text-white/75">
            The free report shows whom the four assistants name instead of you for 20 of your patients&apos; questions. Or we go through
            it together in 15 minutes.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a href={REPORT} className={btnLight}>
              Free report for my practice
            </a>
            <a href={CALL} className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              Talk for 15 minutes
            </a>
          </div>
        </section>

        <p className="text-center">
          <a href="/business" className={btnDark}>
            Back to ItGrows for businesses
          </a>
        </p>
      </main>
    </ToolShell>
  )
}
