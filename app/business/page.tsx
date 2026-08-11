import type { Metadata } from "next"
import Link from "next/link"
import AuditForm from "./AuditForm"
import LeadForm from "./LeadForm"

// Server-rendered on purpose. This page sells machine legibility, so it has to be legible to a
// machine itself: the substance is in the HTML, not assembled by script after arrival.
export const metadata: Metadata = {
  title: "GEO engine for your business — get cited by AI assistants | ItGrows",
  description:
    "We publish research-grade articles to your own domain, shaped so ChatGPT, Claude and Perplexity can quote them — and show you which answer engines actually visited. $499/mo.",
  alternates: { canonical: "https://www.itgrows.ai/business" },
  openGraph: {
    title: "GEO engine for your business — get cited by AI assistants",
    description: "Articles on your own domain, shaped for answer engines, with measured evidence. $499/mo.",
    url: "https://www.itgrows.ai/business",
    type: "website",
  },
}

// Counted 2026-08-11 across the full retained nginx log archive of a site we operate,
// 28 July to 11 August 2026. Our own server log, not an industry study.
const CRAWLERS = [
  { name: "ClaudeBot", hits: "19,128,649", n: 19128649, ai: true },
  { name: "GPTBot", hits: "2,720,918", n: 2720918, ai: true },
  { name: "Applebot", hits: "2,617,827", n: 2617827, ai: true },
  { name: "Amazonbot", hits: "1,156,976", n: 1156976, ai: true },
  { name: "Googlebot", hits: "51,933", n: 51933, ai: false },
]

const STEPS = [
  { i: "🎯", t: "You set the territory", d: "One hour. The questions your buyers ask." },
  { i: "✍️", t: "We write for the answer", d: "Direct answer first. Every heading a real question." },
  { i: "📊", t: "Structure is scored", d: "Out of 100, before it reaches you." },
  { i: "✅", t: "You approve", d: "Nothing publishes without you. Ever." },
  { i: "🌐", t: "It lands on your domain", d: "One DNS record. Your name, your authority." },
  { i: "🔁", t: "It becomes social", d: "LinkedIn, X and Instagram from the same thinking." },
]

const RUNGS = [
  { i: "🤖", t: "Crawled", w: "Week 1–2", proof: true },
  { i: "💬", t: "Retrieved live", w: "Week 3–5", proof: true },
  { i: "📚", t: "Regular source", w: "Week 6–10", proof: false },
  { i: "⭐", t: "Authority", w: "Month 3+", proof: false },
]

const INCLUDED = [
  "Up to 12 articles a month, on your domain",
  "An original cover image for every one",
  "LinkedIn, X and Instagram repurposing",
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
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Blog</Link>
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] mb-4 tracking-tight">
            Ask an AI about your field.
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Does it name you?
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8">
            Start with your own site. Free, no signup.
          </p>
          <AuditForm />
        </div>
      </section>

      {/* Proof — chart first, one line of prose */}
      <section id="proof" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-6xl sm:text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              370×
            </div>
            <p className="text-base sm:text-xl font-semibold mt-2">
              more crawling from one answer engine than from Google
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Server log of{" "}
              <a href="https://www.pickaclass.com" target="_blank" rel="noopener" className="text-violet-600 font-semibold hover:underline">
                pickaclass.com
              </a>{" "}
              · 28 Jul – 11 Aug 2026
            </p>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            {CRAWLERS.map((c) => (
              <div key={c.name} className="px-5 py-4 border-b border-black/5 last:border-0">
                <div className="flex items-baseline justify-between mb-2 gap-3">
                  <span className="font-semibold text-sm flex items-center gap-2 min-w-0">
                    <span className="truncate">{c.name}</span>
                    {c.ai && <span className="text-[10px] uppercase tracking-wide font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 shrink-0">AI</span>}
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

          {/* Named, linkable proof — a reader can go and look at both of these */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <a
              href="https://www.pickaclass.com"
              target="_blank"
              rel="noopener"
              className="block bg-white border border-black/10 rounded-2xl p-5 hover:border-violet-300 transition-colors"
            >
              <div className="text-[10px] uppercase tracking-wide font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 inline-block mb-2">
                Latest case
              </div>
              <div className="text-xs text-slate-500 mb-1">International edtech platform</div>
              <div className="font-bold text-base mb-3 text-violet-600">pickaclass.com ↗</div>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">19.1M</div>
                  <div className="text-[11px] text-slate-500 leading-tight">AI crawls / 2 weeks</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">~11,000</div>
                  <div className="text-[11px] text-slate-500 leading-tight">organic visits / month</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-3 leading-tight">
                Running on this engine
              </div>
            </a>
            <a
              href="https://blog.magiscan.app"
              target="_blank"
              rel="noopener"
              className="block bg-white border border-black/10 rounded-2xl p-5 hover:border-violet-300 transition-colors"
            >
              <div className="text-xs text-slate-500 mb-2">Client · industrial 3D scanning</div>
              <div className="font-bold text-base mb-3 text-violet-600">blog.magiscan.app ↗</div>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">56</div>
                  <div className="text-[11px] text-slate-500 leading-tight">live retrievals / 2 weeks</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">24</div>
                  <div className="text-[11px] text-slate-500 leading-tight">articles reached for</div>
                </div>
              </div>
            </a>
          </div>

          {/* Crawler vs live reader — the distinction the whole product rests on */}
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            <div className="bg-white border border-black/10 rounded-2xl p-5">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-bold text-sm mb-1">Indexing crawler</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Building a library. May never show you to anyone.
              </p>
            </div>
            <div className="bg-white border-2 border-violet-300 rounded-2xl p-5">
              <div className="text-3xl mb-2">💬</div>
              <div className="font-bold text-sm mb-1">Live reader</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sent <strong>while answering a real person</strong>. This one counts.
              </p>
            </div>
          </div>

          {/* The live-retrieval evidence */}
          <div className="mt-6 bg-white border border-black/10 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center mb-5">
              {[
                { n: "56", l: "live retrievals" },
                { n: "24", l: "articles" },
                { n: "2", l: "weeks" },
              ].map((s) => (
                <div key={s.l} className="bg-[#f8f7f6] rounded-xl p-3 sm:p-5">
                  <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-violet-600">{s.n}</div>
                  <div className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed text-center">
              On{" "}
              <a href="https://blog.magiscan.app" target="_blank" rel="noopener" className="text-violet-600 font-semibold hover:underline">
                blog.magiscan.app
              </a>{" "}
              — a few dozen pages, written by this engine. <strong>Not a large site.</strong>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed text-center mt-3">
              A retrieval proves the assistant reached for the article, not that the answer quoted it. User-agents can
              be faked. It is still the closest thing to evidence this category has.
            </p>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-10 tracking-tight text-center">Six steps. One needs you.</h2>
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
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Four rungs</h2>
          <p className="text-slate-600 text-center mb-10 text-sm sm:text-base">
            Green is read from a server log. Amber we will not pretend to measure.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {RUNGS.map((r) => (
              <div
                key={r.t}
                className={`rounded-2xl p-4 sm:p-5 border-2 text-center ${r.proof ? "bg-white border-green-300" : "bg-white/60 border-amber-200"}`}
              >
                <div className="text-3xl mb-2">{r.i}</div>
                <div className="font-bold text-sm mb-1">{r.t}</div>
                <div className="text-xs text-slate-500 mb-3">{r.w}</div>
                <span
                  className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full border ${
                    r.proof ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}
                >
                  {r.proof ? "Measured" : "Not yet"}
                </span>
              </div>
            ))}
          </div>
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
