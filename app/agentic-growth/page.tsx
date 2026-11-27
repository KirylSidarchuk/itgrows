import type { Metadata } from "next"
import Link from "next/link"
import ToolShell from "../business/_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../business/_tools/Faq"
import { ORGANIZATION, OG_GEO } from "@/lib/entity"
import { noteCrawler } from "@/lib/crawler-log"
import { PRO_PRICES } from "@/lib/geo-pricing"

// Agentic-Led Growth, the offer (Kiryl 27 Nov 2026: itgrows sells ALG, not only GEO; canon /opt/venture_os/playbooks/alg.md).
// Pro covers steps 01–03, 05 and 07 today. Steps 04 (gateway: MCP, API) and 06 (agentic commerce) are sold to outside
// clients only after a 30-day paid pilot, 3 outside prepayments and a repeatable improvement, so the page offers them
// as a pilot, not a product. Prices: only the ones approved on 26 Nov 2026 (lib/geo-pricing.ts). Proof: only our own
// numbers (the cases on "/", #geo-results) and what itgrows.ai itself runs (/mcp, /openapi.json, /feeds/services.json).
// Assistants send little traffic yet (reference_ai_referral_traffic_is_zero): we sell being found and chosen, measured.

const BASE = "https://www.itgrows.ai"
const PATH = "/agentic-growth"
const URL = BASE + PATH

const TITLE = "Agentic-Led Growth: get your business chosen by AI agents | ItGrows"
const DESCRIPTION =
  "AI assistants now find, compare and recommend businesses, and start to book and buy for people. We make your business the one they find, understand and choose, and measure it every week."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { type: "website", siteName: "ItGrows.ai", title: "Agentic-Led Growth: get chosen by AI agents", description: DESCRIPTION, url: URL, locale: "en_US", images: [OG_GEO] },
  twitter: { card: "summary_large_image", title: "Agentic-Led Growth: get chosen by AI agents", description: DESCRIPTION, images: [OG_GEO.url] },
}

const card = "rounded-2xl bg-white border border-black/10 p-5 sm:p-7"

type Step = { n: string; name: string; q: string; what: string; measure: string; inPro: boolean }

const STEPS: Step[] = [
  {
    n: "01",
    name: "AI Discovery",
    q: "Does the agent find you?",
    what: "Articles on your site for the questions your buyers ask, your pages in the Bing and Google indexes, profiles on the sites assistants quote.",
    measure: "20 buyer questions × ChatGPT, Claude, Gemini and Perplexity: in how many answers you are named.",
    inPro: true,
  },
  {
    n: "02",
    name: "Agent Readiness",
    q: "Does the agent understand what you offer?",
    what: "Your business data accurate in Google, Bing and Apple; services, prices and hours on your site in a form AI reads without mistakes.",
    measure: "Whether the assistants repeat your service and price correctly.",
    inPro: true,
  },
  {
    n: "03",
    name: "Agent Selection",
    q: "Why does the agent pick a competitor?",
    what: "We read every answer that names someone else and find the reason: rating, reviews, online booking, price, distance, the source it trusted. Then we close the gap.",
    measure: "How often you are the first business named, against 2–3 competitors.",
    inPro: true,
  },
  {
    n: "04",
    name: "Agent Gateway",
    q: "Can the agent act with you?",
    what: "An open door for agents: a quote or booking form they can use, a payment link, a feed, an API or an MCP server.",
    measure: "Whether the action works from an agent's answer.",
    inPro: false,
  },
  {
    n: "05",
    name: "Agent Conversion",
    q: "Does the agent take the buyer to the action?",
    what: "Booking, quote or payment in one link an agent can read, each link marked with the assistant that sent it.",
    measure: "Visits and actions from chatgpt.com, perplexity.ai, Copilot, Gemini and Claude.",
    inPro: true,
  },
  {
    n: "06",
    name: "Agentic Commerce",
    q: "Can the agent complete the purchase?",
    what: "Checkout through the agent itself, on the protocols the platforms open (OpenAI, Stripe and others).",
    measure: "Purchases completed inside an assistant.",
    inPro: false,
  },
  {
    n: "07",
    name: "Agent Analytics",
    q: "What is working?",
    what: "AI crawler and assistant visits, arrivals from assistants, Bing AI Performance, Google's AI features report, every week on the same basis.",
    measure: "A change counts only when it is larger than the week-to-week swing.",
    inPro: true,
  },
]

const FAQ: QA[] = [
  {
    q: "What is Agentic-Led Growth?",
    a: "Growth that comes from AI agents: ChatGPT, Claude, Gemini, Perplexity and Copilot answering 'who should I use?', and increasingly booking or buying on the person's behalf. It goes past being mentioned (GEO): the agent has to find you, understand your offer, choose you over a competitor, and be able to act with you.",
  },
  {
    q: "How is it different from GEO?",
    a: "GEO is step 01: getting named in AI answers. Agentic-Led Growth adds why an agent picks a competitor instead (03), whether it can repeat your services and prices correctly (02), whether it can send the buyer straight to booking or payment (05), and weekly measurement of what agents do on your site (07).",
  },
  {
    q: "Will it bring traffic right away?",
    a: "For most businesses assistants still send few visitors; the value today is being the business the assistant names and chooses when someone asks. We measure that every week on the same questions and the same assistants, and count visits from assistants separately so you can see them grow.",
  },
  {
    q: "Do you build MCP servers and agent checkout for clients?",
    a: "We run them on our own site first (itgrows.ai answers agents at /mcp, /openapi.json and /feeds/services.json). For clients they are a pilot, by agreement, after the core work shows results; we do not sell them as a standard product yet.",
  },
  {
    q: "What does it cost?",
    a: `Pro: ${PRO_PRICES.month.label} a month plus a one-time ${PRO_PRICES.setup.label} setup, or ${PRO_PRICES.quarter.label} for 3 months with the setup free. It starts after a 15-minute call. The detailed report is free.`,
  },
]

export default async function AgenticGrowthPage() {
  void noteCrawler(PATH)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${URL}#service`,
        name: "Agentic-Led Growth",
        serviceType: "AI visibility and agent readiness",
        description: DESCRIPTION,
        provider: { "@id": ORGANIZATION["@id"] },
        url: URL,
        offers: {
          "@type": "Offer",
          name: "Pro",
          price: PRO_PRICES.month.cents / 100,
          priceCurrency: "USD",
          url: `${BASE}/pricing`,
          priceSpecification: { "@type": "UnitPriceSpecification", price: PRO_PRICES.month.cents / 100, priceCurrency: "USD", unitCode: "MON" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ItGrows", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "Agentic-Led Growth", item: URL },
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
          <Link href="/" className="hover:text-[#1b1916]">ItGrows</Link> <span aria-hidden>›</span> Agentic-Led Growth
        </nav>

        <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">Agentic-Led Growth</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight">When an AI agent picks a business for your customer, it should pick you.</h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-3xl">
            People ask ChatGPT, Claude, Gemini and Perplexity who to hire, and agents are starting to book and buy for them. We make your
            business discoverable, understandable, accessible and easy to buy for AI agents, find out why they choose a competitor, fix it, and
            show you every week what changed.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/#apply" className="inline-block text-center rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 px-5 py-3 text-sm font-bold">
              Book a 15-minute call
            </Link>
            <Link href="/" className="inline-block text-center rounded-xl border border-white/30 text-white hover:bg-white/10 px-5 py-3 text-sm font-bold">
              Check your site free
            </Link>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Seven steps from &ldquo;found&rdquo; to &ldquo;bought&rdquo;</h2>
          <p className="mt-2 text-sm text-slate-600">Each step has one question and one number we measure. Pro covers the five marked steps today.</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {STEPS.map((s) => (
              <article key={s.n} className={`rounded-xl border p-4 ${s.inPro ? "border-violet-200 bg-violet-50/40" : "border-black/10 bg-[#f7f6f4]"}`}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
                  {s.n} · {s.name} <span className={s.inPro ? "text-violet-700" : "text-slate-500"}>· {s.inPro ? "in Pro" : "pilot"}</span>
                </p>
                <h3 className="mt-1 font-bold">{s.q}</h3>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">{s.what}</p>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold">Measured:</span> {s.measure}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Why agents pick a competitor</h2>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            In the answers we count, the business that gets named often has something the agent can read: more and fresher reviews on the sites it
            trusts, online booking, a clear price, a page that answers the exact question, a profile on the source the agent quoted. The call
            starts with your own answers: we put your buyers&rsquo; questions to four assistants, show who they name instead of you and on what
            grounds, and what we would change first.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Results, counted the same way every time</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5 leading-relaxed">
            <li>
              An orthopaedic practice in Bonn: Google showed it in AI answers 3,928 times in 28 days, up from 181 (×21.7). Comparable sites grew 1.3–2×
              in the same weeks; the practice&rsquo;s growth began six days after our first article, before Google&rsquo;s November updates.
            </li>
            <li>firma-ausland.de: named in 17 of 80 assistant answers, up from 8, and cited 247 times by Microsoft Copilot.</li>
            <li>Our own app MagiScan: named in 15 of 80, up from 6, in two weeks.</li>
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/#geo-results" className="underline">All results with sources →</Link>
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">We run it on ourselves first</h2>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            itgrows.ai answers AI agents directly: an MCP server at <code className="text-xs">/mcp</code> (an agent can run the free visibility
            check, read our prices and request a call), the same tools as an API at <code className="text-xs">/openapi.json</code>, a services feed
            at <code className="text-xs">/feeds/services.json</code>, and links for assistants in <code className="text-xs">/llms.txt</code>, each
            marked with the assistant that gives it. We count what agents do here every week, the same way we count it for clients.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Price</h2>
          <p className="mt-2 text-slate-700">
            <span className="text-2xl font-extrabold tabular-nums">{PRO_PRICES.month.label}</span> a month plus a one-time {PRO_PRICES.setup.label} setup,
            or {PRO_PRICES.quarter.label} for 3 months with the setup free. Starts after a 15-minute call. Steps 04 and 06 are a pilot, agreed separately.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/#apply" className="inline-block text-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 px-5 py-3 text-sm font-bold">
              Book a 15-minute call
            </Link>
            <Link href="/pricing" className="inline-block text-center rounded-xl border border-black/15 hover:bg-black/5 px-5 py-3 text-sm font-bold">
              Compare Business and Pro
            </Link>
          </div>
        </section>

        <Faq items={FAQ} />
      </main>
    </ToolShell>
  )
}
