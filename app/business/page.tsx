import type { Metadata } from "next"
import Link from "next/link"
import AuditForm from "./AuditForm"
import LeadForm from "./LeadForm"
import { ENGINE_ICONS } from "./engine-icons"
import { FoundOnSites, GEO_INCLUDED, VersusArticles, WorkSystem } from "./GeoSections"
import { OG_GEO } from "@/lib/entity"
import SiteFooter from "../_home/SiteFooter"

// Server-rendered on purpose. This page sells machine legibility, so it has to be legible to a
// machine itself: the substance is in the HTML, not assembled by script after arrival.
export const metadata: Metadata = {
  title: "Get named by ChatGPT, Claude, Gemini & Perplexity | ItGrows",
  description:
    "We get businesses named by ChatGPT, Claude, Gemini and Perplexity: answer pages on your domain, crawler fixes and a weekly check.",
  alternates: { canonical: "https://www.itgrows.ai/business" },
  openGraph: {
    title: "Make your site visible to ChatGPT, Claude, Perplexity, Gemini and the rest",
    description: "Crawler and index fixes, answer pages on your own domain, and a weekly count of four assistants. $499/mo.",
    url: "https://www.itgrows.ai/business",
    siteName: "ItGrows.ai",
    images: [OG_GEO],
    type: "website",
  },
  // Without this the root layout's card wins, and a link shared to X or Slack advertises the
  // personal posting product — "AI Drafts Your LinkedIn & X Posts" — which is not what this sells.
  twitter: {
    card: "summary_large_image",
    title: "Make your site visible to ChatGPT, Claude, Perplexity, Gemini and the rest",
    description:
      "Crawler and index fixes, answer pages on your own domain, and a weekly count of four assistants.",
    images: [OG_GEO.url],
  },
}

// Counted 2026-08-11 across the full retained nginx log archive of a site we operate,
// 28 July to 11 August 2026. Our own server log, not an industry study.
// All six counted the same way on the same pass — requests, not user-agent tokens, because most
// of these names appear twice in their own UA string and a token count silently doubles them.
const CRAWLERS = [
  { name: "ClaudeBot", sub: "Claude", hits: "19,272,125", n: 19272125, ai: true },
  { name: "Meta-ExternalAgent", sub: "Meta AI", hits: "3,854,076", n: 3854076, ai: true },
  { name: "GPTBot", sub: "ChatGPT", hits: "2,744,985", n: 2744985, ai: true },
  { name: "Applebot", sub: "Apple Intelligence", hits: "2,655,555", n: 2655555, ai: true },
  { name: "Amazonbot", sub: "Amazon", hits: "1,170,268", n: 1170268, ai: true },
  { name: "Googlebot", sub: "Google Search", hits: "52,292", n: 52292, ai: false },
]

const RUNGS = [
  { i: "🤖", t: "Crawled", w: "Week 1–2", d: "The engines find and read your new material" },
  { i: "💬", t: "Retrieved live", w: "Week 3–5", d: "Assistants fetch your pages mid-answer" },
  { i: "📚", t: "Regular source", w: "Week 6–10", d: "Reached for across related questions" },
  { i: "⭐", t: "Authority", w: "Month 3+", d: "A default reference for your topic" },
]

// Outcomes, as the clients report them. Kiryl, 2026-10-21: FreightSizer's two B2B customers in a
// month both came from ChatGPT; MagiScan gets hundreds of installs a month from the assistants;
// appslift (same engine, installed separately) gets 2-5 leads a month from ChatGPT and the others.
const CASES = [
  {
    kind: "B2B SaaS · freight dimensioning",
    site: "freightsizer.ai",
    url: "https://freightsizer.ai",
    n: "2",
    l: "new B2B customers in one month",
    d: "Both came from ChatGPT.",
  },
  {
    kind: "iOS app · 3D scanning",
    site: "magiscan.app",
    url: "https://magiscan.app",
    n: "Hundreds",
    l: "of installs a month from AI assistants",
    d: "From people who came from ChatGPT, Claude and Gemini.",
  },
  {
    kind: "B2B service · app store optimisation",
    site: "appslift.com",
    url: "https://appslift.com",
    n: "2–5",
    l: "leads a month from AI assistants",
    d: "Every month, steadily — from ChatGPT and the others.",
  },
]

const FAQS = [
  {
    q: "Can you guarantee ChatGPT will cite me?",
    a: "No, and distrust anyone who does. No assistant sells placement or publishes its ranking mechanism. What we can do is make you findable and quotable, publish consistently, and show you every week whether you are named.",
  },
  {
    q: "What can you actually prove?",
    a: "Three things. Whether the assistants name you: every week we put the same questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and count the answers that name you and the sites they cite. And, for blogs we host, from the server log, that crawlers fetched your pages and that assistants retrieved specific articles while answering somebody live — ChatGPT-User, OAI-SearchBot and Perplexity-User only appear mid-conversation. Nobody can measure every question anyone might ask; we measure the ones your buyers do.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "An SEO agency optimises for one index and counts rankings. Each assistant searches a different index — Bing, Brave, Google or its own — and we count the answers, not the rankings. We publish rather than advise; where a fix needs your developer, we give exact instructions and check that it worked.",
  },
  {
    q: "Is this AI blog spam on my domain?",
    a: "That is the right thing to fear — most of this category is exactly that. Two things stop it, neither magic: you define the positions, and nothing publishes without your approval. If you would not put your name on it, it does not go out.",
  },
  {
    q: "How long before anything happens?",
    a: "Once a page is in the right indexes, crawlers usually arrive within a week or two, and we test findability every week so a gap is caught. Becoming a source an assistant reaches for repeatedly takes months and a body of work. If you need attributable revenue this quarter, buy ads — we will say so on the call rather than after your third invoice.",
  },
  {
    q: "Who is this wrong for?",
    a: "Anyone without real expertise to publish — the engine amplifies a point of view, it cannot invent one. Anyone needing a signed guarantee. And anyone shopping for a $50 tool: at $499 this is priced against a fractional content hire.",
  },
]

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.itgrows.ai/#organization",
        name: "ItGrows",
        alternateName: "ItGrows.ai",
        url: "https://www.itgrows.ai",
        logo: "https://www.itgrows.ai/logo.jpg",
        email: "kiryl@itgrows.ai",
        description:
          "ItGrows makes businesses visible in AI answers: articles on the client's own domain that answer buyers' questions, fixes for AI crawler access and indexing, and a weekly measurement of whether ChatGPT, Claude, Gemini and Perplexity name the business. It also drafts LinkedIn and X posts in a founder's own voice.",
        knowsAbout: [
          "Generative engine optimization",
          "AI visibility",
          "Answer engine optimization",
          "ChatGPT search",
          "Perplexity",
          "Claude",
          "Google Gemini",
          "AI crawlers",
          "llms.txt",
          "IndexNow",
        ],
      },
      {
        "@type": "WebApplication",
        name: "ItGrows AI visibility check",
        url: "https://www.itgrows.ai/business",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@id": "https://www.itgrows.ai/#organization" },
      },
      {
        "@type": "Service",
        name: "ItGrows for Business — AI visibility (GEO)",
        serviceType: "Generative engine optimisation and content publishing",
        description:
          "Articles published to a customer's own domain that answer the questions buyers ask AI assistants, fixes for crawler access and indexing, and a weekly measurement across ChatGPT, Claude, Gemini and Perplexity of whether the business is named.",
        provider: { "@id": "https://www.itgrows.ai/#organization" },
        offers: {
          "@type": "Offer",
          price: "499",
          priceCurrency: "USD",
          url: "https://www.itgrows.ai/business",
          availability: "https://schema.org/LimitedAvailability",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  }
}

export default function BusinessPage() {
  return (
    <div
      className="min-h-screen text-[#1b1916] scroll-smooth"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />

      {/* Nav */}
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-50" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#cases" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Cases</a>
            <a href="#proof" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Proof</a>
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">How</a>
            <a href="#versus" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Compare</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Pricing</a>
            <Link href="/business/blog" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-4">
            {/* Free report accounts sign in straight to their report, not to the LinkedIn cabinet. */}
            <Link href="/login?callbackUrl=%2Fbusiness%2Fdashboard%2Fvisibility" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">
              Sign in
            </Link>
            <a href="#apply" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5">
              Request access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — the check comes first, before any argument */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight">
            We make your site visible to
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              ChatGPT, Claude, Perplexity, Gemini and the rest
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            So that when someone asks about your field, they name you. Check your own site first — no signup, about 30 seconds.
          </p>
          <AuditForm />
          <p className="text-xs text-slate-500 mt-3">
            Tools: <Link href="/business/ai-visibility-checker" className="text-violet-700 hover:underline">AI visibility checker</Link>
            {" · "}
            <Link href="/business/ai-crawler-checker" className="text-violet-700 hover:underline">AI crawler checker</Link>
            {" · "}
            <Link href="/business/blog" className="text-violet-700 hover:underline">Guides</Link>
          </p>

          {/* The headline names four; we watch all of these. Every one appears in our own logs. */}
          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-4">
              Engines we track
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ENGINE_ICONS.map((e) => (
                <span
                  key={e.label}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-black/10 rounded-full pl-2.5 pr-3.5 py-1.5"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-slate-800" aria-hidden="true">
                    <path d={e.d} />
                  </svg>
                  {e.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cases: what being named brought, then the crawler evidence underneath */}
      <section id="cases" className="px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block text-[11px] uppercase tracking-[0.2em] font-bold text-violet-300 border border-violet-400/40 rounded-full px-4 py-1.5 mb-6">
            Cases
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-10 sm:mb-12">What being named brings</h2>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 text-left mb-16 sm:mb-20">
            {CASES.map((c) => (
              <a
                key={c.site}
                href={c.url}
                target="_blank"
                rel="noopener"
                className="group block rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors p-6 sm:p-8"
              >
                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">{c.kind}</p>
                <p className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-violet-300 transition-colors mt-1">
                  {c.site} ↗
                </p>
                <div className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
                  {c.n}
                </div>
                <p className="text-base sm:text-lg font-semibold text-white mt-2 leading-snug">{c.l}</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{c.d}</p>
              </a>
            ))}
          </div>

          <p className="text-slate-400 text-sm sm:text-base mb-2">International edtech platform</p>
          <a
            href="https://www.pickaclass.com"
            target="_blank"
            rel="noopener"
            className="inline-block text-3xl sm:text-5xl font-extrabold tracking-tight text-white hover:text-violet-300 transition-colors mb-12"
          >
            pickaclass.com ↗
          </a>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { n: "19.1M", l: "AI crawls", s: "in two weeks" },
              { n: "1,919", l: "live retrievals", s: "assistants mid-answer" },
              { n: "1,890", l: "different pages", s: "reached for" },
              { n: "~11,000", l: "organic visits", s: "every month" },
            ].map((m) => (
              <div key={m.l} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5 sm:p-7">
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
                  {m.n}
                </div>
                <div className="text-sm sm:text-base font-semibold text-white mt-2 leading-tight">{m.l}</div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-tight">{m.s}</div>
              </div>
            ))}
          </div>

          <p className="text-slate-400 text-xs sm:text-sm mt-10 max-w-2xl mx-auto leading-relaxed">
            Counted from the server log. This is <strong className="text-slate-300">fifteen days</strong> — as far back
            as the logs are kept, not as far back as the engine has been running. A retrieval proves an assistant
            reached for the page, not that the answer quoted it. It is still the closest thing to evidence this
            category has.
          </p>
        </div>
      </section>

      {/* Proof — chart first, one line of prose */}
      <section id="proof" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-6xl sm:text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              368×
            </div>
            <p className="text-base sm:text-xl font-semibold mt-2">
              more crawling from one answer engine than from Google
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Server log of{" "}
              <a href="https://www.pickaclass.com" target="_blank" rel="noopener" className="text-violet-600 font-semibold hover:underline">
                pickaclass.com
              </a>{" "}
              · fifteen days
            </p>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            {CRAWLERS.map((c) => (
              <div key={c.name} className="px-5 py-4 border-b border-black/5 last:border-0">
                <div className="flex items-baseline justify-between mb-2 gap-3">
                  <span className="font-semibold text-sm flex items-baseline gap-2 min-w-0">
                    <span className="truncate">{c.sub}</span>
                    <span className="text-[11px] font-normal text-slate-400 truncate hidden sm:inline">{c.name}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums shrink-0">{c.hits}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.ai ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-slate-400"}`}
                    style={{ width: `${Math.max(1.5, (c.n / CRAWLERS[0].n) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <FoundOnSites id="found" />

      <WorkSystem id="how" />

      <VersusArticles id="versus" />

      {/* Ladder */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Where this goes</h2>
          <p className="text-slate-600 text-center mb-12 text-sm sm:text-base">
            Typical, when indexing works — and we test that it does, every week. Not a guarantee.
          </p>

          <div className="relative">
            {/* The road itself — behind the nodes, hidden on mobile where the list stacks */}
            <div className="hidden lg:block absolute top-[38px] left-[12.5%] right-[12.5%] h-1 rounded-full bg-gradient-to-r from-violet-300 via-violet-500 to-cyan-400" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4">
              {RUNGS.map((r, i) => (
                <div key={r.t} className="relative flex lg:flex-col items-start lg:items-center gap-4 lg:gap-0 lg:text-center">
                  {/* Node */}
                  <div
                    className="relative z-10 w-[76px] h-[76px] shrink-0 rounded-full bg-white border-4 flex items-center justify-center text-3xl shadow-sm lg:mb-5"
                    style={{ borderColor: ["#c4b5fd", "#a78bfa", "#8b5cf6", "#22d3ee"][i] }}
                  >
                    {r.i}
                  </div>
                  <div className="min-w-0 lg:px-1">
                    <div className="text-[11px] font-bold tracking-widest text-violet-600 mb-1">{r.w.toUpperCase()}</div>
                    <div className="font-bold text-base mb-1">{r.t}</div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{r.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-500 mt-10 max-w-xl mx-auto leading-relaxed">
            For blogs we host, the monthly report shows the first two straight from the server log — which engines
            came, and which fetched you mid-answer.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20 border-t border-black/5">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-2 border-violet-200 rounded-3xl p-7 sm:p-10 shadow-xl shadow-violet-600/5">
            <div className="text-center mb-7">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-6xl sm:text-7xl font-extrabold tracking-tight">$499</span>
                <span className="text-slate-500 text-lg font-medium">/mo</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">One plan. Month to month.</p>
              <p className="text-violet-700 text-sm font-semibold mt-3 bg-violet-50 border border-violet-200 rounded-full inline-block px-4 py-1.5">
                Site setup included
              </p>
            </div>
            <ul className="space-y-2.5 mb-7">
              {GEO_INCLUDED.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="text-violet-600 font-bold shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href="#apply" className="block w-full text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 text-base font-semibold shadow-lg shadow-violet-600/30">
              Request access
            </a>
            <p className="text-center text-xs text-slate-500 mt-4">
              An agency doing this properly: $2,000–5,000/mo.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-14 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-8 tracking-tight text-center">Questions worth asking</h2>
          <div className="space-y-2.5">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-black/10 rounded-2xl overflow-hidden group">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-sm sm:text-base flex items-center justify-between gap-4">
                  <span>{f.q}</span>
                  <span className="text-violet-600 text-xl shrink-0 leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Request access</h2>
          <p className="text-slate-600 text-center mb-8 text-sm sm:text-base">
            We reply within a day. If it does not fit, we will say so.
          </p>
          <LeadForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
