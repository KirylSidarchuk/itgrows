import type { Metadata } from "next"
import Link from "next/link"
import AuditForm from "./AuditForm"
import LeadForm from "./LeadForm"
import { ENGINE_ICONS } from "./engine-icons"

// Server-rendered on purpose. This page sells machine legibility, so it has to be legible to a
// machine itself: the substance is in the HTML, not assembled by script after arrival.
export const metadata: Metadata = {
  title: "Make your site visible to ChatGPT, Claude, Perplexity, Gemini and the rest | ItGrows",
  description:
    "We publish research-grade articles to your own domain, shaped so AI assistants can quote them — and show you which answer engines actually visited. Free check, then $499/mo.",
  alternates: { canonical: "https://www.itgrows.ai/business" },
  openGraph: {
    title: "Make your site visible to ChatGPT, Claude, Perplexity, Gemini and the rest",
    description: "Articles on your own domain, shaped for answer engines, with measured evidence. $499/mo.",
    url: "https://www.itgrows.ai/business",
    type: "website",
  },
  // Without this the root layout's card wins, and a link shared to X or Slack advertises the
  // personal posting product — "AI Drafts Your LinkedIn & X Posts" — which is not what this sells.
  twitter: {
    card: "summary_large_image",
    title: "Make your site visible to ChatGPT, Claude, Perplexity, Gemini and the rest",
    description:
      "Articles published to your own domain, structured for answer engines, with measured evidence of who came. Free check.",
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

const STEPS = [
  { i: "🔧", t: "We set your site up", d: "Free with your first month: robots.txt, llms.txt, whatever is blocking the engines, and a spec for your developer." },
  { i: "🎯", t: "You set the topics", d: "One hour, once. The questions your buyers actually ask." },
  { i: "✍️", t: "We write the articles", d: "Up to 12 a month, researched and written for you. You write nothing." },
  { i: "🧩", t: "Shaped so AI can quote it", d: "Direct answer first, every heading a real question, structure scored out of 100." },
  { i: "✅", t: "You approve each one", d: "Every article waits in a queue. Edit it, or kill it. Nothing publishes without you." },
  { i: "🌐", t: "We publish to your blog", d: "On your own domain, with a cover image. One DNS record to set up." },
  { i: "📈", t: "You see who came", d: "A monthly report from the server log: which engines crawled you, which fetched you mid-answer." },
]

const RUNGS = [
  { i: "🤖", t: "Crawled", w: "Week 1–2", d: "The engines find and read your new material" },
  { i: "💬", t: "Retrieved live", w: "Week 3–5", d: "Assistants fetch your pages mid-answer" },
  { i: "📚", t: "Regular source", w: "Week 6–10", d: "Reached for across related questions" },
  { i: "⭐", t: "Authority", w: "Month 3+", d: "A default reference for your topic" },
]

const INCLUDED = [
  "Site setup — free when you start",
  "Up to 12 articles a month, on your domain",
  "An original cover image for every one",
  "Blog hosting — one DNS record",
  "Monthly evidence report from the server log",
  "Approval queue, full veto",
  "A human who knows your account",
]

const FAQS = [
  {
    q: "Can you guarantee ChatGPT will cite me?",
    a: "No, and distrust anyone who does. No assistant sells placement or publishes its ranking mechanism. What we can do is make you eligible, publish consistently, and show you the crawler evidence.",
  },
  {
    q: "What can you actually prove?",
    a: "Two things, both from a server log. That indexing crawlers fetched your pages — which, what, when. And that assistants retrieved specific articles while answering somebody live: ChatGPT-User, OAI-SearchBot and Perplexity-User only appear mid-conversation. We cannot prove how often you are chosen across every question in your field, or that an answer quoted you word for word.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "They optimise for a crawler that, on our own logs, is a rounding error next to the answer engines. And we publish rather than advise — no deck, no list of recommendations for your team to implement.",
  },
  {
    q: "Is this AI blog spam on my domain?",
    a: "That is the right thing to fear — most of this category is exactly that. Two things stop it, neither magic: you define the positions, and nothing publishes without your approval. If you would not put your name on it, it does not go out.",
  },
  {
    q: "How long before anything happens?",
    a: "Crawlers find new material in a week or two. Becoming a source an assistant reaches for repeatedly takes months and a body of work. If you need attributable revenue this quarter, buy ads — we will say so on the call rather than after your third invoice.",
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
        "@type": "Service",
        name: "ItGrows for Business — GEO engine",
        serviceType: "Generative engine optimisation and content publishing",
        description:
          "Research-grade articles published to a customer's own domain, structured so AI assistants can quote them, with server-side measurement of answer-engine activity.",
        provider: { "@type": "Organization", name: "ItGrows", url: "https://www.itgrows.ai" },
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
            <a href="#proof" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Proof</a>
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">How</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Pricing</a>
            <Link href="/business/blog" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Blog</Link>
          </div>
          <a href="#apply" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5">
            Request access
          </a>
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
            So that when someone asks about your field, they name you. Check your own site first — free, no signup.
          </p>
          <AuditForm />

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

      {/* The case, given the whole width it deserves */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#1b1916" }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block text-[11px] uppercase tracking-[0.2em] font-bold text-violet-300 border border-violet-400/40 rounded-full px-4 py-1.5 mb-6">
            Latest case
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

      {/* How */}
      <section id="how" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">
            We write and publish your articles
          </h2>
          <p className="text-slate-600 text-center mb-10 text-sm sm:text-base">
            We set the site up once, free. After that the subscription is the writing and publishing.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.t} className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl mb-2">{s.i}</div>
                <div className="text-[10px] font-bold text-violet-600 tracking-widest mb-1">0{i + 1}</div>
                <h3 className="font-bold text-sm sm:text-base mb-1 leading-snug">{s.t}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ladder */}
      <section className="px-4 sm:px-6 py-14 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Where this goes</h2>
          <p className="text-slate-600 text-center mb-12 text-sm sm:text-base">
            Authority compounds. Here is the road.
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
            Your monthly report shows the first two straight from the server log — which engines came, and which
            fetched you mid-answer.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-2 border-violet-200 rounded-3xl p-7 sm:p-10 shadow-xl shadow-violet-600/5">
            <div className="text-center mb-7">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-6xl sm:text-7xl font-extrabold tracking-tight">$499</span>
                <span className="text-slate-500 text-lg font-medium">/mo</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">One plan. Month to month.</p>
              <p className="text-violet-700 text-sm font-semibold mt-3 bg-violet-50 border border-violet-200 rounded-full inline-block px-4 py-1.5">
                Site setup free when you start
              </p>
            </div>
            <ul className="space-y-2.5 mb-7">
              {INCLUDED.map((f) => (
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

      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-6xl mx-auto">
          © 2026 ItGrows.ai ·{" "}
          <Link href="/privacy" className="hover:text-[#1b1916]">Privacy</Link>{" · "}
          <Link href="/terms" className="hover:text-[#1b1916]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
