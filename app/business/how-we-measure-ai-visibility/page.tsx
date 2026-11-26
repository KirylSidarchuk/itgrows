import type { Metadata } from "next"
import Link from "next/link"
import ToolShell from "../_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../_tools/Faq"
import { ORGANIZATION, OG_GEO } from "@/lib/entity"
import { noteCrawler } from "@/lib/crawler-log"
import { SAMPLE_PATH } from "@/lib/geo-pricing"

// "How we measure AI visibility", in English (26 Nov 2026, ChatGPT visibility plan of 25 Nov): the one method
// behind every number ItGrows reports, with its limits, plainly. The same facts as the landing's "How we count"
// (geoSections.ts work.method), the cabinet's MethodNote and /terms#growth-guarantee; the engine settings are
// those of VM /root/geo_check/engines.py on 26 Nov 2026 (ChatGPT gpt-5.4-mini via the Responses API with its web
// search tool, Claude Sonnet 5 with web search up to 5 searches, Gemini 3.8 Flash with Google Search, Perplexity's
// API "fast" preset) and the ownership rule of geo_check/ownership.py (host = the domain or a subdomain). The
// chatgpt.com cross-check (14 of 15, 25 Nov 2026) and the share of ChatGPT answers with a search (46%) are from
// the 25 Nov review. The internal noise band is not published. Change geo_check (models, asks) -> change this page.

const BASE = "https://www.itgrows.ai"
const PATH = "/business/how-we-measure-ai-visibility"
const URL = BASE + PATH

const TITLE = "How we measure AI visibility: 20 questions, 4 assistants, every two weeks | ItGrows"
const DESCRIPTION =
  "Our method: 20 buyer questions to ChatGPT, Claude, Gemini and Perplexity, asked 3 times each, counted the same way every two weeks. Why ChatGPT through its API, and the limits."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { type: "article", siteName: "ItGrows.ai", title: "How we measure AI visibility", description: DESCRIPTION, url: URL, locale: "en_US", images: [OG_GEO] },
  twitter: { card: "summary_large_image", title: "How we measure AI visibility", description: DESCRIPTION, images: [OG_GEO.url] },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"

const RULES: { k: string; v: string }[] = [
  {
    k: "Questions",
    v: "20 questions a customer would type, in the customer's language, with the city and country for a business that serves one area. None contains the business's name. They are fixed on day 0 and stay the same for every count after it.",
  },
  {
    k: "Assistants",
    v: "ChatGPT, Claude, Gemini and Perplexity, each through its own API with web search available. Each assistant decides for itself whether to search, as it does for its users.",
  },
  {
    k: "Asks",
    v: "On the plan every question goes to every assistant 3 times: 240 answers per count, every two weeks. The free detailed report asks each question once: 80 answers. Our own sites are counted with one ask on scheduled counts, and compared only with other one-ask counts.",
  },
  {
    k: "Named",
    v: "An answer names the business when its text names the business or one of its links goes to the business's site. A link counts only when its host is the business's domain or a subdomain of it: a page on someone else's site whose address contains the name does not count.",
  },
  {
    k: "Score",
    v: "Out of 80 question-and-assistant pairs (20 × 4). A pair counts when at least one of its answers names the business. An answer that never came back (an API error) is left out, never counted as \"not named\".",
  },
  {
    k: "Growth",
    v: "Only like with like: the same questions and the same number of asks. Answers vary from ask to ask, so we judge growth by the average of two counts against day 0, never by one answer.",
  },
]

const ENGINES: { a: string; how: string }[] = [
  { a: "ChatGPT", how: "OpenAI's Responses API, model gpt-5.4-mini with its web search tool. No location is sent unless a site is measured for one country, so the search runs as from the US." },
  { a: "Claude", how: "Anthropic's API, Claude Sonnet 5 with its web search tool, up to 5 searches per answer." },
  { a: "Gemini", how: "Google's Gemini 3.8 Flash with Google Search grounding." },
  { a: "Perplexity", how: "Perplexity's own API, its fast preset." },
]

const LIMITS = [
  "The consumer apps can differ from the API: another model behind the same name, the user's memory and history, the user's location. We ask as a new user with no memory.",
  "Assistants decide whether to search. In our November counts the ChatGPT model searched the web in 46% of its answers; an answer from memory changes slowly, whatever is published.",
  "One count is a sample. The same question asked twice can name different businesses, which is why the plan asks 3 times and growth is judged on two counts.",
  "Named is not the same as recommended first. We count whether the business is in the answer, not its position or the tone around it.",
  "We count names, not visits. Assistants answer in place, so an answer that names a business often sends no click at all.",
  "Twenty questions are a sample of what customers ask. We choose them for buying intent, and keep them fixed so the count stays comparable.",
]

const FAQ: QA[] = [
  {
    q: "How do you measure whether ChatGPT recommends a business?",
    a: "We ask ChatGPT, through OpenAI's API with web search available, the 20 questions the business's customers ask, 3 times each on the plan, and count the answers whose text names the business or links to its site. The same questions go to Claude, Gemini and Perplexity. The score is how many of the 80 question-and-assistant pairs name the business at least once.",
  },
  {
    q: "Why do you measure ChatGPT through the API and not chatgpt.com?",
    a: "Because a count has to be repeatable: the same model and settings every time, every answer saved with its links, 240 answers every two weeks. The consumer app cannot be asked that often without automating it. We check the API against the real app by hand: on 25 Nov 2026 we asked 15 questions in chatgpt.com (temporary chat, no memory), and named or not named matched our API count on 14 of 15.",
  },
  {
    q: "What is the difference between being named and being cited?",
    a: "Named: the answer's text names the business. Cited: one of the answer's links goes to the business's site. Either one counts in the score, because either one puts the business in front of the person asking; the report lists every answer's links, so you can see which of your pages, and which other sites, the assistants used.",
  },
  {
    q: "Why ask each question three times?",
    a: "Because answers vary: the same question asked twice can name different businesses. Three asks per question per assistant make a count less of a coin toss, and judging growth by the average of two counts makes it less so again.",
  },
  {
    q: "Can I check the numbers myself?",
    a: "Yes. The report shows every question, every answer, who is named in it and which sites it links to, so any line can be asked again in the assistant itself. Remember that a single answer can differ from ours, for the reasons in the limits above.",
  },
]

export default async function HowWeMeasurePage() {
  void noteCrawler(PATH)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION,
      {
        "@type": "Article",
        "@id": `${URL}#article`,
        headline: "How we measure AI visibility",
        description: DESCRIPTION,
        url: URL,
        mainEntityOfPage: URL,
        inLanguage: "en",
        datePublished: "2026-11-26",
        dateModified: "2026-11-26",
        author: { "@id": ORGANIZATION["@id"] },
        publisher: { "@id": ORGANIZATION["@id"] },
        about: ["AI visibility", "Generative engine optimization", "ChatGPT", "Claude", "Google Gemini", "Perplexity"],
        image: OG_GEO.url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ItGrows", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "How we measure AI visibility", item: URL },
        ],
      },
      faqSchema(FAQ),
    ],
  }

  return (
    <ToolShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" className="hover:text-[#1b1916]">ItGrows</Link> <span aria-hidden>›</span> How we measure AI visibility
        </nav>
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-600">Method</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">How we measure AI visibility</h1>
          <p className="mt-4 text-slate-700 leading-relaxed text-base sm:text-lg">
            Every count of AI answers ItGrows reports, in the free detailed report, in the cabinet, in the growth guarantee and on our own apps, comes from one method:
            the questions your customers ask, put to ChatGPT, Claude, Gemini and Perplexity, counted the same way every two weeks. Here it is,
            with what it can and cannot tell you.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">The rules of the count</h2>
          <dl className="mt-4 space-y-4">
            {RULES.map((r) => (
              <div key={r.k} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-4">
                <dt className="font-bold text-violet-700">{r.k}</dt>
                <dd className="text-sm sm:text-base text-slate-700 leading-relaxed">{r.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">How each assistant is asked</h2>
          <p className="mt-2 text-sm text-slate-600">Settings as of November 2026. When a model or a setting changes, we compare only counts made the same way.</p>
          <ul className="mt-4 divide-y divide-black/10">
            {ENGINES.map((e) => (
              <li key={e.a} className="py-3 grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-4">
                <span className="font-bold">{e.a}</span>
                <span className="text-sm sm:text-base text-slate-700 leading-relaxed">{e.how}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Why ChatGPT through its API</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            A count is only worth something if it can be repeated: the same model, the same settings, every answer saved with its links, 240
            answers for every site every two weeks. That is what the API gives. The consumer app at chatgpt.com cannot be asked that often
            without automating it, and its answers also depend on each user&rsquo;s memory and history.
          </p>
          <p className="mt-3 text-slate-700 leading-relaxed">
            So we check the API against the real thing by hand. On 25 November 2026 we asked 15 questions in chatgpt.com, in a temporary chat
            with no memory: whether the business was named matched our API count on 14 of the 15. We made that check where our count showed
            zeros in ChatGPT, to be sure a zero in our count is a zero in the app.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Named and cited</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            <b>Named</b> means the answer&rsquo;s text names the business. <b>Cited</b> means one of the answer&rsquo;s links goes to the
            business&rsquo;s site. The score counts either, because either puts the business in front of the person asking. The report keeps
            them apart where it matters: it lists every answer&rsquo;s links, so you see which of your pages the assistants used, and which
            sites they used instead of yours.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">What the count cannot tell you</h2>
          <ul className="mt-3 space-y-2 text-sm sm:text-base text-slate-700 list-disc pl-5 leading-relaxed">
            {LIMITS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">What we read next to the count</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Not part of the score, but read every two weeks: impressions in Google&rsquo;s AI features (Google Search Console), how often
            Microsoft Copilot cites the site (Bing Webmaster Tools, AI Performance), whether the site&rsquo;s pages are in Bing&rsquo;s and
            Google&rsquo;s indexes, and, on blogs we host, which AI crawlers fetched which pages. These show where the count is likely to move
            next.
          </p>
        </section>

        <Faq items={FAQ} />

        <section className="mt-10 grid sm:grid-cols-3 gap-4">
          <Link href={SAMPLE_PATH} className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">See a real report →</span>
            <span className="block text-sm text-slate-600 mt-1">Every question, answer and link, counted this way.</span>
          </Link>
          <Link href="/business/geo-for-apps" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">The method on our own apps →</span>
            <span className="block text-sm text-slate-600 mt-1">MagiScan, FreightSizer and AppsLift, with their numbers.</span>
          </Link>
          <Link href="/pricing" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">Pricing →</span>
            <span className="block text-sm text-slate-600 mt-1">One plan, done for you, with the growth guarantee.</span>
          </Link>
        </section>

        <p className="text-sm text-slate-600">
          Want to measure it yourself, without us? Our guide{" "}
          <Link href="/business/blog/how-to-measure-ai-visibility" className="text-violet-700 font-semibold hover:underline">
            how to measure AI visibility
          </Link>{" "}
          walks through it, and{" "}
          <Link href="/business/blog/we-measured-our-own-ai-visibility" className="text-violet-700 font-semibold hover:underline">
            we measured our own AI visibility
          </Link>{" "}
          shows the first count of our own site.
        </p>

        <p className="text-center pt-4">
          <Link href="/business/ai-visibility-checker" className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-3">
            Run the free check
          </Link>
        </p>
      </main>
    </ToolShell>
  )
}
