import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import AuditForm from "./business/AuditForm"
import HashForward from "./_home/HashForward"
import SignIn from "./_home/SignIn"
import SiteFooter from "./_home/SiteFooter"
import { ENTITY_ABOUT, OG_GEO, ORGANIZATION } from "@/lib/entity"
import { FoundOnSites, GEO_INCLUDED, VersusArticles, WorkSystem } from "./business/GeoSections"

// The front door says what ItGrows is first: AI visibility for companies. The LinkedIn/X product
// lives at /personal, one click away from here and from the sign-in menu.

const BASE = "https://www.itgrows.ai"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "AI visibility for businesses: get named by ChatGPT | ItGrows",
  description:
    "ItGrows makes companies visible in AI answers and drafts LinkedIn and X posts for founders. Check your site in about 30 seconds.",
  alternates: { canonical: `${BASE}/` },
  openGraph: {
    title: "Get your company named by ChatGPT, Claude, Gemini and Perplexity",
    description: "Answer pages on your own domain, crawler and indexing fixes, and a weekly check of four assistants.",
    url: `${BASE}/`,
    siteName: "ItGrows.ai",
    images: [OG_GEO],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get your company named by ChatGPT, Claude, Gemini and Perplexity",
    description: "Answer pages on your own domain, crawler and indexing fixes, and a weekly check of four assistants.",
    images: [OG_GEO.url],
  },
}

const CASES = [
  { site: "freightsizer.ai", kind: "B2B SaaS", n: "2", l: "new B2B customers in one month, both from ChatGPT" },
  { site: "magiscan.app", kind: "iOS app", n: "Hundreds", l: "of installs a month from ChatGPT, Claude and Gemini" },
  { site: "appslift.com", kind: "App store optimisation", n: "2–5", l: "leads a month from AI assistants" },
]

const FAQ = [
  { q: "What is ItGrows?", a: ENTITY_ABOUT[0] },
  {
    q: "Is ItGrows a LinkedIn tool or an AI visibility service?",
    a: "Both, as two products. For companies, ItGrows is an AI visibility (GEO) service. For founders and experts, it drafts LinkedIn and X posts in their own voice; that product is at itgrows.ai/personal.",
  },
  { q: "Which assistants do you measure?", a: "ChatGPT, Claude, Gemini and Perplexity, through their own APIs with web search on, three asks per question, because their answers vary." },
  { q: "Can you guarantee that ChatGPT will name us?", a: "No. No assistant sells organic placement or publishes how it chooses. We do the work that makes you findable and quotable, and we show you every week what changed." },
  { q: "Will this send us traffic from ChatGPT?", a: "Often little: assistants usually answer in place. We count whether you are named and cited. Some clients report customers, installs and leads that came from assistants." },
  { q: "I use ItGrows for LinkedIn. Where is my cabinet?", a: "Where it always was: Sign in, then LinkedIn & X cabinet. Nothing changed for your posts, plan or billing." },
]

async function guides() {
  try {
    return await db
      .select({ slug: blogPosts.slug, title: blogPosts.title })
      .from(blogPosts)
      .where(and(eq(blogPosts.siteSlug, "itgrows-business"), isNull(blogPosts.redirectTo)))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(6)
  } catch {
    return []
  }
}

export default async function Home() {
  const latest = await guides()
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION,
      { "@type": "WebSite", "@id": `${BASE}/#website`, url: `${BASE}/`, name: "ItGrows", publisher: { "@id": ORGANIZATION["@id"] } },
      { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  }

  return (
    <div className="min-h-screen text-[#1b1916] scroll-smooth" style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <HashForward />

      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-40" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm text-slate-600 font-medium">
            <a href="#geo-how" className="hover:text-[#1b1916]">How it works</a>
            <a href="#geo-results" className="hover:text-[#1b1916]">Results</a>
            <a href="#geo-pricing" className="hover:text-[#1b1916]">Pricing</a>
            <a href="#geo-tools" className="hover:text-[#1b1916]">Tools</a>
            <Link href="/business/blog" className="hover:text-[#1b1916]">Guides</Link>
            <Link href="/personal" className="hover:text-[#1b1916]">LinkedIn &amp; X posts</Link>
          </div>
          <div className="flex items-center gap-4">
            <SignIn />
            <a href="#geo-check" className="hidden sm:inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5">
              Check my site
            </a>
          </div>
        </div>
      </nav>

      <section id="geo-check" className="relative px-4 sm:px-6 pt-12 sm:pt-16 pb-10 overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight">
            Get your company named when buyers ask{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">ChatGPT, Claude, Gemini and Perplexity.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mt-5 mb-8">
            We measure what four assistants answer about your field, fix what stops their crawlers and search indexes from reading your site, publish answer pages on your own domain, and count every week whether each one names you.
          </p>
          <AuditForm />
          <p className="text-xs text-slate-500 mt-3">No signup · about 30 seconds</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-10">
        <div className="max-w-4xl mx-auto rounded-2xl border border-violet-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-slate-700 flex-1">
            <b>Founder or expert?</b> ItGrows also drafts your LinkedIn and X posts in your own voice — from $49/month, 14-day free trial.
          </p>
          <div className="flex gap-2 shrink-0">
            <Link href="/personal" className="rounded-xl bg-[#1b1916] text-white px-4 py-2.5 text-sm font-semibold">LinkedIn &amp; X posts →</Link>
            <Link href="/cabinet" rel="nofollow" className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold">Open your cabinet</Link>
          </div>
        </div>
      </section>

      <section id="geo-results" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-center">What clients report</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mt-10">
            {CASES.map((c) => (
              <a key={c.site} href={`https://${c.site}`} target="_blank" rel="noopener" className="block rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] p-6">
                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">{c.kind}</p>
                <p className="text-xl font-extrabold text-white mt-1">{c.site} ↗</p>
                <div className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{c.n}</div>
                <p className="text-sm text-slate-300 mt-2">{c.l}</p>
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">As reported by the clients. <Link href="/business#cases" className="underline">Cases and evidence →</Link></p>
        </div>
      </section>

      <WorkSystem id="geo-how" />

      <FoundOnSites id="geo-found" />

      <VersusArticles id="geo-versus" />

      <section id="geo-pricing" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">One plan, month to month</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            <div className="rounded-2xl bg-white border border-black/10 p-6">
              <p className="font-bold text-lg">Quick check</p>
              <p className="text-sm text-slate-500 mt-2">No signup · about 30 seconds</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>✓ Five questions your buyers ask</li>
                <li>✓ Answered live by ChatGPT and Perplexity</li>
                <li>✓ Who they name instead of you</li>
              </ul>
              <a href="#geo-check" className="mt-6 block text-center rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold">Check my site</a>
            </div>
            <div className="rounded-2xl bg-[#1b1916] text-white p-6">
              <p className="font-bold text-lg">Done for you</p>
              <p className="text-3xl font-extrabold mt-2">$499<span className="text-base text-white/60 font-semibold"> / month</span></p>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                {GEO_INCLUDED.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link href="/business#apply" className="mt-6 block text-center rounded-xl bg-white text-[#1b1916] px-5 py-3 text-sm font-semibold">Start the plan</Link>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-5">No one can guarantee that an assistant will name a business. We measure and show you every week.</p>
          <p className="text-center text-xs text-slate-500 mt-2">LinkedIn &amp; X ghostwriting: Personal $49 · Duo $99 · All-in $199 — <Link href="/personal#pricing" className="underline">see plans</Link></p>
        </div>
      </section>

      <section id="geo-tools" className="px-4 sm:px-6 py-14 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">Check your site</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <Link href="/business/ai-visibility-checker" className="rounded-2xl bg-white border border-black/10 p-5 hover:border-violet-300">
              <p className="font-bold">AI visibility checker</p>
              <p className="text-sm text-slate-600 mt-2">Does ChatGPT name your business? Five of your buyers&apos; questions, answered live.</p>
            </Link>
            <Link href="/business/ai-crawler-checker" className="rounded-2xl bg-white border border-black/10 p-5 hover:border-violet-300">
              <p className="font-bold">AI crawler checker</p>
              <p className="text-sm text-slate-600 mt-2">Can GPTBot, ClaudeBot and PerplexityBot read your pages? Including robots.txt rules that block more than you meant.</p>
            </Link>
            <Link href="/signup?from=ai-check&callbackUrl=%2Fbusiness%2Fdashboard%2Fvisibility" className="rounded-2xl bg-white border border-black/10 p-5 hover:border-violet-300">
              <p className="font-bold">Detailed report</p>
              <p className="text-sm text-slate-600 mt-2">20 questions × ChatGPT, Claude, Gemini and Perplexity × 3 asks: who is named, who is quoted instead, and the plan. After sign-up.</p>
            </Link>
          </div>
        </div>
      </section>

      <section id="geo-faq" className="px-4 sm:px-6 py-14 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Questions</h2>
          <div className="mt-8 space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold">{f.q}</h3>
                <p className="text-slate-700 mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="px-4 sm:px-6 py-14" style={{ backgroundColor: "#ebe9e5" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Guides on AI visibility</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {latest.map((g) => (
                <Link key={g.slug} href={`/business/blog/${g.slug}`} className="rounded-2xl bg-white border border-black/10 p-5 hover:border-violet-300 font-semibold text-sm leading-snug">
                  {g.title}
                </Link>
              ))}
            </div>
            <p className="mt-5 text-sm">
              <Link href="/business/blog" className="text-violet-700 font-semibold hover:underline">All guides →</Link>
              <span className="mx-2 text-slate-400">·</span>
              <Link href="/blog" className="text-violet-700 font-semibold hover:underline">How AI assistants find and name experts →</Link>
            </p>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}
