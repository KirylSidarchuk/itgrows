import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import AuditForm from "./business/AuditForm"
import ContactForm from "./business/ContactForm"
import HashForward from "./_home/HashForward"
import SignIn from "./_home/SignIn"
import SiteFooter from "./_home/SiteFooter"
import { ENTITY_ABOUT, OG_GEO, ORGANIZATION } from "@/lib/entity"
import { FoundOnSites, GEO_INCLUDED, VersusArticles, WorkSystem } from "./business/GeoSections"
import PricingPlans from "./business/PricingPlans"
import { CREDIT_DAYS, GEO_PRICES, SAMPLE_PATH } from "@/lib/geo-pricing"

// The front door says what ItGrows is first: AI visibility for companies. The LinkedIn/X product
// lives at /personal, one click away from here and from the sign-in menu. Since 22 Oct 2026 this is
// also the AI-visibility page: /business redirects here (next.config.ts), so its contact form (#apply)
// and its questions live on this page.

const BASE = "https://www.itgrows.ai"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "AI visibility for businesses: get named by ChatGPT | ItGrows",
  description:
    "ItGrows makes companies visible in AI answers and drafts LinkedIn and X posts for founders. Check your site in about 30 seconds, no signup.",
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

const CASES: { site: string; href?: string; kind: string; n: string; l: string }[] = [
  { site: "freightsizer.ai", kind: "B2B SaaS", n: "2", l: "new B2B customers in one month, both from ChatGPT" },
  { site: "magiscan.app", kind: "iOS app", n: "Hundreds", l: "of installs a month from ChatGPT, Claude and Gemini" },
  {
    site: "pickaclass.com",
    href: "https://www.pickaclass.com",
    kind: "Course marketplace",
    n: "1,918",
    l: "times AI assistants opened its pages while answering someone, in two weeks",
  },
]

const R = GEO_PRICES.research

const ICON = "h-6 w-6"
const QUICK_CHECKS = [
  {
    href: "/business/ai-visibility-checker",
    title: "Does ChatGPT name you?",
    line: "Five questions your buyers would ask, put live to ChatGPT and Perplexity.",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.4a8.5 8.5 0 1 1 15.6-4.6z" />
        <path d="M8.5 11.8l2.4 2.4 4.6-4.6" />
      </svg>
    ),
  },
  {
    href: "/business/ai-crawler-checker",
    title: "Can AI crawlers read your site?",
    line: "Your sitemap pages against robots.txt for GPTBot, ClaudeBot, PerplexityBot and more.",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="8" width="14" height="11" rx="3" />
        <path d="M12 8V5" />
        <circle cx="12" cy="4" r="1" />
        <path d="M2.5 12.5v3M21.5 12.5v3M9.5 16h5" />
        <circle cx="9.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

const FAQ = [
  { q: "What is ItGrows?", a: ENTITY_ABOUT[0] },
  {
    q: "Is ItGrows a LinkedIn tool or an AI visibility service?",
    a: "Both, as two products. For companies, ItGrows is an AI visibility (GEO) service. For founders and experts, it drafts LinkedIn and X posts in their own voice; that product is at itgrows.ai/personal.",
  },
  { q: "Which assistants do you measure?", a: "ChatGPT, Claude, Gemini and Perplexity, through their own APIs with web search on, three asks per question, because their answers vary." },
  { q: "Can you guarantee that ChatGPT will name us?", a: "No, and distrust anyone who does. No assistant sells organic placement or publishes how it chooses. We do the work that makes you findable and quotable, and we show you every week what changed." },
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
    a: "That is the right thing to fear — most of this category is exactly that. Two things stop it, neither magic: you define the positions, and you see every article 2 days before it goes live, and can edit or stop it. If you would not put your name on it, it does not go out.",
  },
  {
    q: "How long before anything happens?",
    a: "Once a page is in the right indexes, crawlers usually arrive within a week or two, and we test findability every week so a gap is caught. Becoming a source an assistant reaches for repeatedly takes months and a body of work. If you need attributable revenue this quarter, buy ads — we will say so on the call rather than after your third invoice.",
  },
  {
    q: "Do you give us a guide to do it ourselves, or do the work?",
    a: `We do the work. The detailed report (${R.label}) is the diagnosis and our plan: where you stand in all four assistants, who is named instead of you, and what we will do about it, step by step. On the plan we do that work: we publish answer pages on your domain, fix crawler access and indexing, and measure every week. The report's price comes off the plan within ${CREDIT_DAYS} days.`,
  },
  {
    q: "What does the detailed report cost?",
    a: `${R.label}, one payment per site. The quick check on this page needs no signup and takes about 30 seconds: 5 questions to ChatGPT and Perplexity. Create an account and we build the detailed report for your site — 20 questions to ChatGPT, Claude, Gemini and Perplexity, 3 asks each — with its totals and the 5 questions of the quick check open. The whole report is ${R.label}: every answer, everyone named instead of you, the sites the assistants quote, and our plan for your site. If you start the plan within ${CREDIT_DAYS} days, the ${R.label} comes off your first payment. A real one: itgrows.ai${SAMPLE_PATH}.`,
  },
  {
    q: "What does the plan cost?",
    a: `${GEO_PRICES.month.label} a month, month to month, plus a one-time ${GEO_PRICES.setup.label} setup: your site and its indexes made ready, delivered as a launch report. The setup is free when you pay ${GEO_PRICES.quarter.label} for 3 months upfront or ${GEO_PRICES.year.label} for a year (${GEO_PRICES.year.perMonth} a month, 20% off). The detailed report is included.`,
  },
  {
    q: "Who is this wrong for?",
    a: `Anyone without real expertise to publish — the engine amplifies a point of view, it cannot invent one. Anyone needing a signed guarantee. And anyone who wants the work done for the price of a software tool: at ${GEO_PRICES.month.label} a month the plan is priced against a fractional content hire. To see the full picture before deciding, the ${R.label} report shows where you stand and what we will do, and its price comes off the plan.`,
  },
  { q: "Will this send us traffic from ChatGPT?", a: "Often little: assistants usually answer in place. We count whether you are named and cited. Some clients report customers, installs and leads that came from assistants." },
  { q: "I use ItGrows for LinkedIn. Where is my cabinet?", a: "Where it always was: Sign in, then LinkedIn & X cabinet. Nothing changed for your posts, plan or billing." },
]

const price = (cents: number) => (cents / 100).toFixed(2)

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
      {
        "@type": "WebApplication",
        name: "ItGrows AI visibility check",
        url: `${BASE}/`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited. No signup.",
        provider: { "@id": ORGANIZATION["@id"] },
      },
      {
        "@type": "Service",
        name: "ItGrows — AI visibility (GEO)",
        serviceType: "Generative engine optimisation and content publishing",
        description:
          "Articles published to a customer's own domain that answer the questions buyers ask AI assistants, fixes for crawler access and indexing, and a weekly measurement across ChatGPT, Claude, Gemini and Perplexity of whether the business is named.",
        provider: { "@id": ORGANIZATION["@id"] },
        offers: [
          { "@type": "Offer", name: "Detailed AI visibility report", price: price(R.cents), priceCurrency: "USD", url: `${BASE}/#geo-pricing` },
          {
            "@type": "Offer",
            name: "AI visibility plan, monthly",
            price: price(GEO_PRICES.month.cents),
            priceCurrency: "USD",
            url: `${BASE}/#geo-pricing`,
            priceSpecification: { "@type": "UnitPriceSpecification", price: price(GEO_PRICES.month.cents), priceCurrency: "USD", unitText: "MONTH" },
          },
        ],
      },
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
              <a key={c.site} href={c.href ?? `https://${c.site}`} target="_blank" rel="noopener" className="block rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] p-6">
                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">{c.kind}</p>
                <p className="text-xl font-extrabold text-white mt-1">{c.site} ↗</p>
                <div className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{c.n}</div>
                <p className="text-sm text-slate-300 mt-2">{c.l}</p>
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">As reported by the clients; pickaclass.com from its server log, August 2026.</p>
        </div>
      </section>

      <WorkSystem id="geo-how" />

      <FoundOnSites id="geo-found" />

      <VersusArticles id="geo-versus" />

      <section id="geo-pricing" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <PricingPlans checkHref="#geo-check" planHref="#apply" planLabel="Or talk to us first →" included={GEO_INCLUDED} />
        <p className="text-center text-xs text-slate-500 mt-2">LinkedIn &amp; X ghostwriting: Personal $49 · Duo $99 · All-in $199 — <Link href="/personal#pricing" className="underline">see plans</Link></p>
      </section>

      {/* The contact form: any question before paying. The id stays "apply": the pricing cards and
          the crawler result link here. */}
      <section id="apply" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">Write to us</h2>
          <p className="text-slate-600 text-center mb-8 text-sm sm:text-base">
            Questions about your site, the plan or anything else. We reply within a day.
          </p>
          <ContactForm />
        </div>
      </section>

      <section id="geo-faq" className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center mb-8">Questions</h2>
          <div className="space-y-2.5">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-white border border-black/10 rounded-2xl overflow-hidden group">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 py-4 font-semibold text-sm sm:text-base flex items-center justify-between gap-4">
                  <h3>{f.q}</h3>
                  <span className="text-violet-600 text-xl shrink-0 leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="geo-tools" className="px-4 sm:px-6 py-12 sm:py-14 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">Two quick checks</h2>
          <p className="text-sm sm:text-base text-slate-600 text-center mt-2">Enter your site, see the answer. No signup.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {QUICK_CHECKS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex items-start gap-4 rounded-2xl bg-white border border-black/10 p-5 sm:p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 ring-4 ring-violet-50">
                  {c.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-base sm:text-lg leading-snug">{c.title}</span>
                  <span className="block text-sm text-slate-600 mt-1 leading-relaxed">{c.line}</span>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-violet-700">
                    Run it <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="px-4 sm:px-6 py-14">
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
