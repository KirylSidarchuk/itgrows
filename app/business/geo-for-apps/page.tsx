import type { Metadata } from "next"
import Link from "next/link"
import ToolShell from "../_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../_tools/Faq"
import { ORGANIZATION, OG_GEO } from "@/lib/entity"
import { noteCrawler } from "@/lib/crawler-log"

// "GEO for apps", in English (26 Nov 2026, ChatGPT visibility plan of 25 Nov): how we get apps named in AI
// answers, shown only on our own products, with only numbers we can show in full: MagiScan (Magiscan Inc.,
// the company behind ItGrows), FreightSizer (our joint venture in freight measurement) and AppsLift (the app
// store optimization agency of the same founder). Sources, as checked on 25 Nov 2026 (session report
// projects.json / runs.json): our own count (geo_runs: 20 buyer questions x 4 assistants; MagiScan one ask
// per question on both dates, FreightSizer and AppsLift three), Google Search Console (impressions in Google's
// AI features, the 28 days to 23 Nov against the 28 days before) and Bing Webmaster Tools (AI Performance:
// how often Microsoft Copilot cited the site). No money, no installs or revenue, no third parties' names, and
// numbers whose windows do not compare are given as one window, said so. Update the figures and AS_OF together.

const BASE = "https://www.itgrows.ai"
const PATH = "/business/geo-for-apps"
const URL = BASE + PATH
const AS_OF = "25 November 2026"

const TITLE = "GEO for apps: how we get apps named by ChatGPT, Claude, Gemini and Perplexity | ItGrows"
const DESCRIPTION =
  "How we get apps named in AI answers, shown on our own apps: in two weeks MagiScan went from 6 to 15 of 80, FreightSizer from 18 to 24 of 80, on the same buyer questions to four assistants."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { type: "article", siteName: "ItGrows.ai", title: "GEO for apps: getting an app named in AI answers", description: DESCRIPTION, url: URL, locale: "en_US", images: [OG_GEO] },
  twitter: { card: "summary_large_image", title: "GEO for apps: getting an app named in AI answers", description: DESCRIPTION, images: [OG_GEO.url] },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"

type App = {
  name: string
  site: string
  what: string
  questions: string[]
  named: string
  namedNote: string
  google: string
  googleNote: string
  copilot: string
  copilotNote: string
}

const APPS: App[] = [
  {
    name: "MagiScan",
    site: "magiscan.app",
    what: "3D scanner app for iPhone and Android",
    questions: ["What is the best 3D scanner app for iPhone?", "Best app to 3D scan an object for 3D printing?", "Which 3D scanning app works best on Android phones?"],
    named: "6 → 15 of 80",
    namedNote: "7 Nov → 21 Nov 2026, each question asked once both times",
    google: "3,534 → 6,569",
    googleNote: "the 28 days to 23 Nov against the 28 days before",
    copilot: "313",
    copilotNote: "25 Oct – 23 Nov 2026",
  },
  {
    name: "FreightSizer",
    site: "freightsizer.ai",
    what: "freight dimensioning app: measures pallets and cargo with a phone",
    questions: ["What is the best app to measure freight dimensions with an iPhone?", "Which tool can calculate LTL freight class automatically?", "What's a good app for warehouses to measure pallet dimensions?"],
    named: "18 → 18 → 24 of 80",
    namedNote: "23 Oct → 7 Nov → 21 Nov 2026, each question asked 3 times every time",
    google: "457",
    googleNote: "site 204 + blog 253 in the 28 days to 23 Nov; data starts 22 Oct, so there is no earlier window to compare",
    copilot: "427",
    copilotNote: "site 216 + blog 211, late Oct – 23 Nov 2026",
  },
  {
    name: "AppsLift",
    site: "appslift.com",
    what: "app store optimization (ASO) agency of the same founder",
    questions: ["Which ASO agency is best for ranking an app on the App Store?", "Best agency for Google Play keyword ranking?", "Is it better to do ASO in-house or hire an agency?"],
    named: "8 of 80",
    namedNote: "day 0, 21 Oct 2026, each question asked 3 times; no later count on the same basis yet",
    google: "921 → 1,915",
    googleNote: "the 28 days to 23 Nov against the 28 days before",
    copilot: "1,426",
    copilotNote: "22 Oct – 23 Nov 2026",
  },
]

const STEPS = [
  {
    t: "Ask what buyers ask",
    d: "Twenty questions a buyer types into an assistant before installing: \"best app for…\", \"which tool can…\", \"is a free app enough…\". None names the app. They are fixed on day 0 and asked again every two weeks, to ChatGPT, Claude, Gemini and Perplexity, so every change is counted on the same questions.",
  },
  {
    t: "Make the store listing say it plainly",
    d: "In our November data directories were the largest group of sources ChatGPT cited on buyer questions, and for apps that means the App Store and Google Play. A listing whose first lines say in buyers' words what the app does, on which phones, for which job, is a page the assistant can quote and name.",
  },
  {
    t: "Answer the questions on the app's own site",
    d: "Articles on the app's own domain that answer the buyer questions one by one: what the app measures, how accurate it is, what it costs to do the job another way, which file format to export. Researched on live search, every claim checked against the product's facts, the app named where it is the answer.",
  },
  {
    t: "Publish the comparison buyers look for",
    d: "A few \"best apps for…\" pages with our app first, saying at the top that it is ours, with how we compared, real strengths of the other apps and a \"best for\" line for each. In our November data Claude, Gemini and Perplexity used such lists in 44–73% of buyer answers; Perplexity cited our MagiScan ranking on 21 Nov 2026.",
  },
  {
    t: "Open the doors and get indexed",
    d: "The app's site and blog tested as the AI crawlers, sitemaps in Google Search Console and Bing Webmaster Tools, new pages sent to Bing the day they go live. ChatGPT's web search draws on Bing among other sources, so every page has to be in Bing's index too.",
  },
  {
    t: "Re-ask and push",
    d: "Every two weeks the same 20 questions go back to all four assistants. Where the app is still missing is where the next article, listing fix or comparison goes.",
  },
]

const FAQ: QA[] = [
  {
    q: "Can an app get recommended by ChatGPT?",
    a: "Yes. On buyer questions like \"best 3D scanner app for iPhone\" ChatGPT names a few apps and backs most names with a page: the App Store or Google Play listing, or the app's own site. In our count of 21 Nov 2026 ChatGPT named FreightSizer on 4 of its 20 buyer questions and MagiScan on 2, one of them \"Best app to 3D scan an object for 3D printing?\". Across all four assistants FreightSizer was named in 24 and MagiScan in 15 of 80 question-and-assistant pairs.",
  },
  {
    q: "Which pages do AI assistants use when they name an app?",
    a: "Mostly the store listing and the app's own pages; for the comparison questions also \"best apps\" lists. That is why the work covers all three: a listing that says plainly what the app does, answer pages on the app's domain, and a few honest comparison pages.",
  },
  {
    q: "How do you count whether an app is named?",
    a: "Twenty buyer questions, fixed on day 0, asked to ChatGPT, Claude, Gemini and Perplexity with web search on. A question-and-assistant pair counts when the answer names the app or links to its site; the score is how many of the 80 pairs do. We compare only like with like: the same questions and the same number of asks.",
  },
  {
    q: "Does this bring installs?",
    a: "Assistants answer in place: the buyer gets a short list instead of ten links, and an app's link usually goes to the store, not to its website. So we count what we can measure for every app: whether it is named, and how often the AI features of Google and Microsoft Copilot show or cite its pages.",
  },
]

export default async function GeoForAppsPage() {
  void noteCrawler(PATH)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION,
      {
        "@type": "Article",
        "@id": `${URL}#article`,
        headline: "GEO for apps: how we get apps named by ChatGPT, Claude, Gemini and Perplexity",
        description: DESCRIPTION,
        url: URL,
        mainEntityOfPage: URL,
        inLanguage: "en",
        datePublished: "2026-11-26",
        dateModified: "2026-11-26",
        author: { "@id": ORGANIZATION["@id"] },
        publisher: { "@id": ORGANIZATION["@id"] },
        about: ["Generative engine optimization", "App store optimization", "AI visibility"],
        image: OG_GEO.url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ItGrows", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "GEO for apps", item: URL },
        ],
      },
      faqSchema(FAQ),
    ],
  }

  return (
    <ToolShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" className="hover:text-[#1b1916]">ItGrows</Link> <span aria-hidden>›</span> GEO for apps
        </nav>
        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">GEO for apps</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">
            When someone asks AI which app to use, your app should be in the answer.
          </h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-3xl">
            People ask ChatGPT, Claude, Gemini and Perplexity &ldquo;what is the best app for…&rdquo; and install one of the few apps the
            answer names. We do the work that gets an app into that answer, and we run it on our own apps first. Below: the method, and every
            number from our own apps, counted the same way for each.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/business/ai-visibility-checker" className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
              Check your app&rsquo;s site free
            </Link>
            <Link href="/pricing" className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              See pricing
            </Link>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Our own apps, counted</h2>
          <p className="mt-2 text-sm text-slate-600">
            Named: in how many of 80 question-and-assistant pairs (20 buyer questions × ChatGPT, Claude, Gemini and Perplexity) the answer
            names the app or links to its site, compared only on the same questions and the same number of asks. Google: impressions in
            Google&rsquo;s AI features, from Search Console. Copilot: how often Microsoft Copilot cited the site&rsquo;s pages, from Bing
            Webmaster Tools. As of {AS_OF}.
          </p>
          <div className="mt-5 space-y-4">
            {APPS.map((a) => (
              <article key={a.name} className="rounded-xl border border-black/10 bg-[#f7f6f4] p-4 sm:p-5">
                <h3 className="text-lg font-extrabold">
                  {a.name} <span className="text-sm font-semibold text-slate-500">· {a.site} · {a.what}</span>
                </h3>
                <div className="mt-3 grid sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Named in AI answers</p>
                    <p className="text-2xl font-extrabold tabular-nums">{a.named}</p>
                    <p className="text-xs text-slate-600">{a.namedNote}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Google AI features</p>
                    <p className="text-2xl font-extrabold tabular-nums">{a.google}</p>
                    <p className="text-xs text-slate-600">impressions, {a.googleNote}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Copilot citations</p>
                    <p className="text-2xl font-extrabold tabular-nums">{a.copilot}</p>
                    <p className="text-xs text-slate-600">{a.copilotNote}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold">Some of its 20 questions:</span> {a.questions.map((q) => `“${q}”`).join(" · ")}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            MagiScan is made by Magiscan Inc., the company behind ItGrows; FreightSizer is our joint venture in freight measurement; AppsLift is
            run by the same founder. How every number here is counted, and what the count cannot tell:{" "}
            <Link href="/business/how-we-measure-ai-visibility" className="underline">how we measure AI visibility</Link>.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">What we do for an app</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-extrabold text-sm">{i + 1}</span>
                <span>
                  <span className="block font-bold">{s.t}</span>
                  <span className="block text-sm text-slate-700 leading-relaxed mt-1">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">What the numbers say, and what they don&rsquo;t</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5 leading-relaxed">
            <li>MagiScan&rsquo;s 6 → 15 and FreightSizer&rsquo;s 18 → 24 are counts on the same questions with the same number of asks, two weeks apart.</li>
            <li>Answers vary from ask to ask, so one count is a sample; we judge growth by the average of two counts against day 0.</li>
            <li>Google and Copilot figures cover the whole site, not only the pages we wrote, and depend on how often people search.</li>
            <li>AppsLift has its day-0 count only; its next count on the same basis will be added here.</li>
          </ul>
        </section>

        <Faq items={FAQ} />

        <section className="mt-10 grid sm:grid-cols-3 gap-4">
          <Link href="/business/blog/how-apps-get-recommended-by-chatgpt" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">Guide: how apps get recommended by ChatGPT →</span>
          </Link>
          <Link href="/business/how-we-measure-ai-visibility" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">How we measure AI visibility →</span>
          </Link>
          <Link href="/pricing" className={`${card} block hover:border-violet-300`}>
            <span className="block font-bold">Pricing: one plan, done for you →</span>
          </Link>
        </section>
      </main>
    </ToolShell>
  )
}
