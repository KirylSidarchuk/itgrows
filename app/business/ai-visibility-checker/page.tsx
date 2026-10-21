import type { Metadata } from "next"
import Link from "next/link"
import AuditForm from "../AuditForm"
import ToolShell from "../_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../_tools/Faq"

const URL = "https://www.itgrows.ai/business/ai-visibility-checker"

export const metadata: Metadata = {
  title: "Free AI visibility checker: does ChatGPT recommend your business? | ItGrows",
  description:
    "Enter your website: we ask ChatGPT and Perplexity five questions your buyers ask and show whether they name you, who they name instead and which sites they cite. Free.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Does ChatGPT recommend your business? Free AI visibility check",
    description: "Five buyer questions, asked live to ChatGPT and Perplexity. See who they name instead of you.",
    url: URL,
    type: "website",
  },
}

const FAQ: QA[] = [
  {
    q: "Is the AI visibility check free?",
    a: "Yes. The check asks ChatGPT and Perplexity five questions and shows two answers in full. A free account shows all of them, adds Claude and Gemini (20 questions, three asks each) and re-checks every week.",
  },
  {
    q: "Where do the questions come from?",
    a: "We read your homepage and write the questions a buyer of your business would type into an assistant, in your site's language: who to choose, what it costs, how to decide. If your site blocks our reader, we learn what the business is from a web search instead.",
  },
  {
    q: "Why do the answers change if I run it again?",
    a: "Assistants do not answer the same question the same way twice. That is why one check is a first look, and the full report asks every question three times and compares weeks only on the same questions.",
  },
  {
    q: "Can anyone guarantee that ChatGPT will recommend my business?",
    a: "No. No assistant sells organic placement or publishes how it chooses. What can be done is making your site readable and indexed, publishing pages that answer your buyers' questions, being present on the sites assistants cite, and measuring the result honestly.",
  },
]

export default function AiVisibilityCheckerPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "ItGrows AI visibility checker",
        url: URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Free check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@id": "https://www.itgrows.ai/#organization" },
      },
      faqSchema(FAQ),
    ],
  }
  return (
    <ToolShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">Free AI visibility check</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3">Does ChatGPT recommend your business?</h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
            Enter your site. We write five questions your buyers would ask and put them to ChatGPT and Perplexity, live,
            with web search on. You see whether they name you, who they name instead and which sites they cite. About 30
            seconds.
          </p>
        </div>
        <div className="mt-8">
          <AuditForm />
        </div>

        <article className="max-w-3xl mx-auto mt-16 text-[#1b1916]">
          <h2 className="text-2xl font-extrabold tracking-tight">What the check does</h2>
          <ol className="mt-4 space-y-3 text-slate-700 leading-relaxed list-decimal pl-5">
            <li>Reads your homepage and works out what you sell, to whom and where.</li>
            <li>Writes five questions a buyer would ask an assistant: who to choose, what it costs, how to decide.</li>
            <li>Asks ChatGPT and Perplexity each question with web search on, and reads the answers: are you named, is your site cited, who is named instead, which sites are the sources.</li>
          </ol>

          <h2 className="text-2xl font-extrabold tracking-tight mt-12">How to read the result</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            <b>Named</b> means the answer mentions your business. <b>Cited</b> means it links your site as a source. The
            sites cited instead of you are where the assistants learn who exists in your field: directories, comparison
            pages, your competitors&apos; own pages. One run is a first look, because answers vary between asks; the full
            report asks 20 questions to ChatGPT, Claude, Gemini and Perplexity, three times each.
          </p>

          <h2 className="text-2xl font-extrabold tracking-tight mt-12">If you are not named</h2>
          <ul className="mt-4 space-y-2 text-slate-700 leading-relaxed list-disc pl-5">
            <li>
              Start with the whole path: <Link className="text-violet-700 underline" href="/business/blog/how-to-get-your-business-recommended-by-chatgpt">how to get your business recommended by ChatGPT, Claude, Gemini and Perplexity</Link>.
            </li>
            <li>
              Check that crawlers can read you: <Link className="text-violet-700 underline" href="/business/ai-crawler-checker">AI crawler check</Link> — it tests your sitemap pages against your robots.txt for each crawler.
            </li>
            <li>
              See the usual causes: <Link className="text-violet-700 underline" href="/business/blog/why-doesnt-chatgpt-mention-my-company">why ChatGPT names your competitors and not you</Link>.
            </li>
          </ul>

          <Faq items={FAQ} />
        </article>
      </main>
    </ToolShell>
  )
}
