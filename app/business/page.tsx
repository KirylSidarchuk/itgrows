import type { Metadata } from "next"
import Link from "next/link"
import LeadForm from "./LeadForm"

// Server-rendered on purpose. This page sells machine legibility, so it has to be legible to a
// machine itself: no client-side rendering of the substance, explicit JSON-LD, and a markdown-
// clean structure of headings that read as questions.
export const metadata: Metadata = {
  title: "GEO engine for your business — get cited by AI assistants | ItGrows",
  description:
    "We publish research-grade articles to your own domain, shaped so ChatGPT, Claude and Perplexity can quote them — and show you which answer engines actually visited. $499/mo.",
  alternates: { canonical: "https://www.itgrows.ai/business" },
  openGraph: {
    title: "GEO engine for your business — get cited by AI assistants",
    description:
      "Articles published to your own domain, shaped for answer engines, with measured crawler evidence. $499/mo.",
    url: "https://www.itgrows.ai/business",
    type: "website",
  },
}

// Counted 2026-08-11 across the full retained nginx log archive of a site we operate — 28 July to
// 11 August 2026. Presented as exactly that: our own server log, not an industry study.
const CRAWLERS = [
  { name: "ClaudeBot", hits: "19,128,649", n: 19128649, ai: true },
  { name: "GPTBot", hits: "2,720,918", n: 2720918, ai: true },
  { name: "Applebot", hits: "2,617,827", n: 2617827, ai: true },
  { name: "Amazonbot", hits: "1,156,976", n: 1156976, ai: true },
  { name: "Googlebot", hits: "51,933", n: 51933, ai: false },
]

const STEPS = [
  {
    n: "01",
    t: "You set the territory",
    d: "The questions your buyers actually ask, and the positions you are willing to defend in public. Not keywords — territory. This is the one part that needs your expertise, and it takes about an hour.",
  },
  {
    n: "02",
    t: "We write for the answer, not the scroll",
    d: "Every article opens with a direct answer, each section heading is a real question, and each answer stands on its own in 40–55 words. That shape is what makes a passage quotable out of context — which is the only way an assistant can use it.",
  },
  {
    n: "03",
    t: "Every draft arrives with its structure scored",
    d: "Each article is scored out of 100 against the things an answer engine needs to be able to use it: a real question-and-answer block, key takeaways, tables where a comparison belongs, headings that are questions, a usable meta description. You see that number before you approve. It measures shape, not insight — whether the argument is actually any good is your call, which is what the next step is for.",
  },
  {
    n: "04",
    t: "You approve — or you do not",
    d: "Everything waits in a queue. Edit it, rewrite it, kill it. Nothing reaches your domain without you. Once you trust the output you can loosen the leash, and you can tighten it again the same day.",
  },
  {
    n: "05",
    t: "It publishes to your domain",
    d: "Your blog runs on your own domain, on our infrastructure, via a single DNS record. The article, the cover image and the sitemap all live under your name, and the authority accrues to you rather than to us. Because every request comes through our servers, we can also see exactly which machines asked for them. We can push into an existing WordPress, Shopify or Webflow instead — you lose the measurement that way, so we will try to talk you out of it.",
  },
  {
    n: "06",
    t: "The same thinking becomes your social presence",
    d: "Each article turns into LinkedIn posts, an X thread, and visuals — in your voice, on your schedule. One piece of thinking, published everywhere it belongs, instead of five separate content chores.",
  },
]

const FAQS = [
  {
    q: "Can you guarantee ChatGPT will cite me?",
    a: "No, and you should distrust anyone who does. No assistant sells placement, and none of them publish a ranking mechanism. What we can do is make your material eligible and legible, publish it consistently, and show you the crawler evidence so you are never guessing. If someone offers you a guarantee here, they are either misinformed or selling you something they cannot deliver.",
  },
  {
    q: "What exactly can you prove, then?",
    a: "Two things, both from a server log rather than an inference. First, that indexing crawlers fetched your pages — which ones, which URLs, on which days. Second, and this is the interesting one, that assistants retrieved specific articles while answering somebody in real time: ChatGPT-User, OAI-SearchBot and Perplexity-User only appear when a live conversation is underway. What we cannot prove is how often you are chosen across every question in your field, or that a given answer quoted you word for word.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "An SEO agency optimises for a crawler that, on our own server logs, is now a rounding error next to the answer engines. We are not claiming Google stopped mattering — we are pointing out that the traffic mix changed and almost nobody adjusted. We also publish, not just advise: there is no deck and no list of recommendations for your team to implement.",
  },
  {
    q: "Is this just AI-generated blog spam on my domain?",
    a: "That is the correct thing to be afraid of, because most of this category is exactly that. Two things stop it here, and neither is magic: you define the positions the writing has to argue, and nothing publishes without your approval. If you would not put your name on it, it does not go out — enforced by a queue you control, not by a promise about the model. We would rather you rejected a draft than that we pretended a score could tell good thinking from fluent filler.",
  },
  {
    q: "How long before anything happens?",
    a: "Crawlers typically find new material within a week or two of publication. Becoming a source an assistant reaches for repeatedly is a matter of months and a body of work, not a single article. If you need attributable revenue this quarter, buy ads instead — we will tell you that on the call rather than after your third invoice.",
  },
  {
    q: "What do you need from me each month?",
    a: "Roughly an hour up front to set the territory, then approvals. Most customers spend fifteen minutes a week in the queue. If you want to write or heavily edit, you can; if you want to hand it over entirely after the first month, you can do that too.",
  },
  {
    q: "Who is this wrong for?",
    a: "Anyone without genuine expertise to publish — the engine amplifies a point of view, it cannot invent one. Also anyone who needs a signed guarantee of citations, and anyone looking for a $50/month tool: at $499 this is priced against a fractional content hire, not against a writing app.",
  },
]

const INCLUDED = [
  "Up to 12 published articles a month, on your own domain",
  "An original cover image for every article",
  "Article structure built for machine reading, and a complete sitemap",
  "LinkedIn, X and Instagram repurposing of every piece",
  "Blog hosting on your own domain — one DNS record, nothing to maintain",
  "A monthly evidence report read from the server log: which engines crawled you, and which retrieved you during live answers",
  "Approval queue with full edit and veto rights",
  "Direct access to a human who knows your account",
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
          "Research-grade articles published to a customer's own domain, structured so AI assistants can quote them, with server-side measurement of answer-engine crawler activity.",
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
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">How it works</a>
            <a href="#evidence" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Evidence</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</a>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Blog</Link>
          </div>
          <a href="#apply" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            Request access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-14 sm:pt-20 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-violet-200 bg-white shadow-sm text-sm font-semibold text-violet-700">
            ItGrows for Business
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            When someone asks an AI about your field,
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              it should be naming you
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            We publish serious articles to <span className="text-violet-600 font-semibold">your own domain</span>, shaped so
            answer engines can quote them — and we show you which engines actually came for them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="#apply" className="w-full sm:w-auto rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 text-base font-semibold shadow-lg shadow-violet-600/30 transition-colors">
              Request access — $499/mo
            </a>
            <a href="#evidence" className="w-full sm:w-auto rounded-xl border border-black/15 bg-white hover:bg-white/70 px-8 py-3.5 text-base font-semibold transition-colors">
              See the numbers first
            </a>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 mt-7 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-black/10 rounded-full px-3 py-1.5"><span className="text-green-600">✓</span> Published on your domain</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-black/10 rounded-full px-3 py-1.5"><span className="text-green-600">✓</span> You approve every word</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-black/10 rounded-full px-3 py-1.5"><span className="text-green-600">✓</span> Measured, not promised</span>
          </div>
        </div>
      </section>

      {/* Evidence */}
      <section id="evidence" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 tracking-tight">The audience moved. Almost nobody moved with it.</h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
            These are real crawler counts from the server log of a site we operate, over the fifteen days from 28 July
            to 11 August 2026. Not a study, not a forecast — one log archive, counted on the day we wrote this.
          </p>

          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            {CRAWLERS.map((c) => {
              const width = Math.max(1.5, (c.n / CRAWLERS[0].n) * 100)
              return (
                <div key={c.name} className="px-5 py-4 border-b border-black/5 last:border-0">
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <span className="font-semibold text-sm flex items-center gap-2 min-w-0">
                      <span className="truncate">{c.name}</span>
                      {c.ai && <span className="text-[10px] uppercase tracking-wide font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 shrink-0">AI</span>}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0">{c.hits}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${c.ai ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-slate-400"}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mt-8">
            In a fortnight, one answer engine alone hit that site <strong>roughly 370 times harder than Google
            did</strong>. Every agency in your inbox is still optimising for the grey bar. We are not claiming Google
            stopped mattering — we are pointing out that the mix changed, and that being absent from the machines
            people now ask first is a slow, quiet, compounding kind of invisible.
          </p>

          {/* The stronger fact: not indexing traffic, but live retrieval during someone's conversation. */}
          <div className="mt-12 bg-white border border-black/10 rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-extrabold mb-4 tracking-tight">
              And it is already happening on a customer&apos;s blog
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 text-center">
              <div className="bg-[#f8f7f6] rounded-xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-violet-600">56</div>
                <div className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-tight">live retrievals</div>
              </div>
              <div className="bg-[#f8f7f6] rounded-xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-violet-600">24</div>
                <div className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-tight">different articles</div>
              </div>
              <div className="bg-[#f8f7f6] rounded-xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-violet-600">2</div>
                <div className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-tight">weeks</div>
              </div>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              There is a difference between a crawler and a reader. <strong>ChatGPT-User</strong>,{" "}
              <strong>OAI-SearchBot</strong> and <strong>Perplexity-User</strong> are not indexing robots — they are
              what an assistant sends <em>while it is answering somebody</em>. Someone asked a question, and the
              assistant went out and fetched that specific article to answer it.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              On articles this engine wrote and published for one customer — a company in industrial 3D scanning — that
              happened 56 times across 24 different articles in a fortnight, on most days of it. Their blog is a few
              dozen pages, not a few hundred thousand: this rung is not reserved for large sites. We are showing you a
              server log rather than a case study, so
              here is the honest limit of it: a retrieval proves the assistant reached for the article, not that the
              final answer quoted it, and a user-agent string can be faked. It is still the closest thing to evidence
              anyone in this category can put in front of you.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-4">
              It also scales with how much you have published. On the larger site above, the same three agents
              retrieved real content pages <strong>1,918 times</strong> in that same fortnight. More material on more
              questions means more moments where you are the thing worth fetching — which is the entire argument for
              publishing steadily instead of occasionally.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">How the engine runs</h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12 text-base sm:text-lg">
            Six steps. One of them needs you for an hour; the rest is our problem.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white border border-black/10 rounded-2xl p-6">
                <div className="text-xs font-bold text-violet-600 mb-2 tracking-widest">{s.n}</div>
                <h3 className="font-bold text-lg mb-2 leading-snug">{s.t}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The ladder */}
      <section className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 tracking-tight">What progress actually looks like</h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-10">
            Authority with answer engines is earned in rungs, not switched on. Here is the honest state of each one —
            including which we can prove today and which we cannot.
          </p>

          <div className="space-y-3">
            {[
              { icon: "🤖", t: "Crawled", w: "Weeks 1–2", d: "GPTBot, ClaudeBot and PerplexityBot fetch your new material and add it to what they know.", proof: "measured" },
              { icon: "💬", t: "Retrieved in live answers", w: "Weeks 3–5", d: "Assistants start fetching your pages while answering real people — the rung our own customer log shows above.", proof: "measured" },
              { icon: "📚", t: "Regular source", w: "Weeks 6–10", d: "You are reached for consistently, across a spread of related questions rather than one lucky article.", proof: "partial" },
              { icon: "⭐", t: "Authority source", w: "Month 3+", d: "You are a default reference for your topic.", proof: "partial" },
            ].map((r) => (
              <div key={r.t} className="bg-white border border-black/10 rounded-2xl p-5 flex gap-4 items-start">
                <div className="text-2xl shrink-0 leading-none mt-0.5">{r.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                    <h3 className="font-bold text-base">{r.t}</h3>
                    <span className="text-xs text-slate-500 font-medium">{r.w}</span>
                    {r.proof === "measured" ? (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                        We measure this
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                        Not yet measurable
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{r.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white border-l-4 border-violet-500 rounded-r-2xl p-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Why we label it that way.</strong> The first two rungs are read from a server log — which machine
              asked, for what, and when — so they are fact. The upper two are about <em>how often</em> you are chosen
              across the whole space of questions in your field, and no log can tell you that. We would rather show you
              an amber label than a confident chart we invented. Measurement there is what we are building next, and
              you will get it at no extra cost when it works.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">One plan</h2>
          <p className="text-slate-600 text-center mb-10 text-base sm:text-lg">
            No tiers, no upsell path, no annual lock-in.
          </p>

          <div className="bg-white border-2 border-violet-200 rounded-3xl p-7 sm:p-10 shadow-xl shadow-violet-600/5">
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">$499</span>
                <span className="text-slate-500 text-lg font-medium">/month</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">Month to month. Cancel whenever you like.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {INCLUDED.map((f) => (
                <li key={f} className="flex gap-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                  <span className="text-violet-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a href="#apply" className="block w-full text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 text-base font-semibold shadow-lg shadow-violet-600/30 transition-colors">
              Request access
            </a>
            <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
              We onboard a small number of accounts at a time, because the first hour is a real conversation about your
              positions and we do it ourselves.
            </p>
          </div>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-8 text-center max-w-2xl mx-auto">
            For context: a content agency doing this properly runs $2,000–$5,000 a month, and a junior writer costs more
            than both. We are cheaper because the writing is machine-assisted and the judgement is not.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-10 tracking-tight text-center">Questions worth asking</h2>
          <div className="space-y-3">
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
      <section id="apply" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Request access</h2>
          <p className="text-slate-600 text-center mb-8 text-base leading-relaxed">
            Tell us the domain and what you would want to be known for. We reply within a day, and if we do not think
            this fits your situation we will say so.
          </p>
          <LeadForm />
        </div>
      </section>

      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-6xl mx-auto">
          © 2026 ItGrows.ai. All rights reserved. ·{" "}
          <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy Policy</Link>{" · "}
          <Link href="/terms" className="hover:text-[#1b1916] transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
