"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type CaseStudy = {
  name: string
  role: string
  location: string
  plan: "Personal" | "Duo" | "All-in" | "Company"
  metric: string
  metricLabel: string
  timeframe: string
  quote: string
  results: string[]
  examplePost: string
  exampleEngagement: string
  isCompany?: boolean
}

const caseStudies: CaseStudy[] = [
  // Personal Plan
  {
    name: "Sarah Chen",
    role: "Marketing Consultant",
    location: "Singapore",
    plan: "Personal",
    metric: "412 → 8,247",
    metricLabel: "LinkedIn followers",
    timeframe: "Over 6 months",
    quote: "Honestly I didn't expect much — I'd tried posting consistently before and gave up after 3 weeks. But ItGrows just kept going. Two months in I got my first inbound DM from a potential client. Now I get 3-4 a week and I've had to build a proper waitlist.",
    results: [
      "LinkedIn followers grew from 412 to 8,247 in 6 months",
      "Inbound lead volume up 3.4x compared to the prior year",
      "Signed 2 enterprise retainers ($14K+ each) sourced directly from LinkedIn DMs",
    ],
    examplePost: "Most marketing audits identify the wrong problem. They measure what's easy to measure — traffic, CTR, open rates — and ignore the one thing that actually drives revenue: trust at the point of decision. Here's the 3-question framework I use instead.",
    exampleEngagement: "👍 1,203 · 💬 87 · 🔁 214",
    isCompany: false,
  },
  {
    name: "Marcus Webb",
    role: "Sales Director",
    location: "Manchester, UK",
    plan: "Personal",
    metric: "0 → 5,381",
    metricLabel: "X followers in under 5 months",
    timeframe: "Over 5 months",
    quote: "I literally had a locked account with zero followers. My manager thought I was wasting time when I said I was 'building a presence on X.' Four months later a podcast host with 80K listeners DMd me asking to come on the show. That changed a few opinions internally.",
    results: [
      "X account grew from 0 to 5,381 followers in under 5 months",
      "Invited as guest on 2 B2B sales podcasts with combined reach of 130K+",
      "Generated 14 qualified pipeline conversations from X content alone",
    ],
    examplePost: "Cold call pick-up rates dropped 34% industry-wide last year. But my team's did too — and we fixed it not by changing the script, but by changing what happens before the call. Warm social touchpoints first. Here's the exact sequence we use.",
    exampleEngagement: "👍 847 · 💬 61 · 🔁 139",
    isCompany: false,
  },
  {
    name: "Priya Sharma",
    role: "Executive Coach",
    location: "Vienna, Austria",
    plan: "Personal",
    metric: "4–6",
    metricLabel: "new client inquiries per month",
    timeframe: "Months 3–8",
    quote: "I was 100% referral dependent for seven years. Which sounds fine until you realize you have zero control. I started ItGrows half-skeptically and didn't tell anyone. By month three I had two people reach out who found me via LinkedIn posts. That's never happened to me before — ever.",
    results: [
      "Built consistent thought leadership presence in the executive coaching niche",
      "Weekly LinkedIn impressions stabilized at 17,400–23,800",
      "Now books 4–6 new discovery calls per month from content alone",
    ],
    examplePost: "The executives who burn out aren't the ones working the hardest. They're the ones who stopped asking themselves why they're working at all. I've coached 200+ senior leaders. The pattern is always the same — and it's fixable, but not in the way most people think.",
    exampleEngagement: "👍 2,341 · 💬 118 · 🔁 307",
    isCompany: false,
  },

  // Duo Plan
  {
    name: "Alex Rodriguez",
    role: "Startup Founder",
    location: "Berlin, Germany",
    plan: "Duo",
    metric: "11,842 + 7,109",
    metricLabel: "LinkedIn + X followers",
    timeframe: "Over 8 months",
    quote: "We raised a seed round and three of the five investors told me they'd been following our content for weeks before reaching out. One said she felt like she already knew us. I don't think we close that round without the social presence — the trust was already there.",
    results: [
      "LinkedIn grew to 11,842 followers, X to 7,109 in 8 months",
      "Raised $500K seed round — 3 of 5 investors cited online visibility as a factor",
      "Inbound partnership inquiries went from near-zero to 9–13 per month",
    ],
    examplePost: "We just hit 500 beta users with $0 in paid acquisition. Every single signup came from LinkedIn or X content. People keep asking about our 'growth strategy' — honestly it's just showing up with a point of view every day. Thread on what we actually posted:",
    exampleEngagement: "👍 3,187 · 💬 204 · 🔁 531",
    isCompany: false,
  },
  {
    name: "Nina Kowalski",
    role: "B2B SaaS Consultant",
    location: "Warsaw, Poland",
    plan: "Duo",
    metric: "15–19",
    metricLabel: "qualified inbound leads per month",
    timeframe: "Months 2–7",
    quote: "I cancelled my cold outreach subscription after month two. LinkedIn was bringing in warm leads who'd already read three or four of my posts, and X was building credibility with the operator crowd who then referred me. I'm closing bigger deals now because people arrive pre-sold.",
    results: [
      "Generates 15–19 qualified leads per month from LinkedIn + X combined",
      "Average project value increased as inbound prospects arrive more informed",
      "Replaced $1,900/mo cold outreach spend — ROI positive within 7 weeks",
    ],
    examplePost: "Your SaaS churn problem is almost never about the product. It's about who you let in during sales. I audited 11 SaaS companies last quarter — 9 of them had the same pattern: features are fine, ICP definition is broken. Here's what I found and how to fix it.",
    exampleEngagement: "👍 1,574 · 💬 93 · 🔁 248",
    isCompany: false,
  },
  {
    name: "James Okafor",
    role: "VC Partner",
    location: "London, UK",
    plan: "Duo",
    metric: "3.2x",
    metricLabel: "increase in inbound deal flow",
    timeframe: "Over 12 months",
    quote: "Something shifted around month four. Founders started tagging me in posts before reaching out. My inbox changed — fewer random cold decks, more 'I've been following your thinking on X and wanted to share what we're building.' That quality difference is hard to quantify but it's real.",
    results: [
      "Established consistent thought leadership across LinkedIn and X",
      "Inbound deal flow increased 3.2x over 12 months",
      "Mentioned or featured in 4 VC-focused newsletters after two posts went broadly viral",
    ],
    examplePost: "I passed on a $4M Series A last month that every other fund chased. Here's my framework for saying no to deals that look good on paper but have a subtle founder-market fit problem most people miss. This is the filter I wish I'd had five years ago.",
    exampleEngagement: "👍 4,812 · 💬 271 · 🔁 689",
    isCompany: false,
  },

  // All-in Plan
  {
    name: "Arkwright Labs",
    role: "15-person B2B SaaS Startup",
    location: "Amsterdam, Netherlands",
    plan: "All-in",
    metric: "3",
    metricLabel: "enterprise contracts via social inbound",
    timeframe: "Over 7 months",
    quote: "A prospect told us on the discovery call — unprompted — that they'd researched us on X before reaching out and felt confident we were legitimate. That's when it clicked. The social presence wasn't just marketing, it was due diligence material. It was closing deals before we even got on the call.",
    results: [
      "Company X account grew from 312 to 14,087 followers in 7 months",
      "Founders' combined LinkedIn reach exceeded 26,400 followers",
      "Closed 3 enterprise contracts directly attributed to inbound from social content",
    ],
    examplePost: "We've been building in public for 7 months. Here's what no one tells you: the posts that got us enterprise clients weren't the product updates. They were the ones where we admitted a mistake and showed how we fixed it. Buyers trust companies that can say 'we got that wrong.'",
    exampleEngagement: "👍 2,093 · 💬 147 · 🔁 312",
    isCompany: true,
  },
  {
    name: "Meridian Strategy Group",
    role: "Management Consulting Firm",
    location: "Zurich, Switzerland",
    plan: "All-in",
    metric: "63%",
    metricLabel: "reduction in content costs",
    timeframe: "Over 5 months",
    quote: "We were paying an agency $4,800 a month and getting about 12 posts across our accounts. ItGrows does more than double that output and it's actually consistent in tone and quality. I won't say the switch was instant — it took about 6 weeks to tune the voice — but after that it just worked.",
    results: [
      "Replaced $4,800/mo content agency — equivalent output at 63% lower cost",
      "LinkedIn and X maintained across 3 partners and the company page simultaneously",
      "Social-attributed pipeline share increased from 7% to 29% of new business",
    ],
    examplePost: "Most strategy projects fail in implementation, not diagnosis. After 200+ engagements, here's the one question we now ask in week one that predicts whether a client will actually execute the plan we build together — and most consultants never ask it.",
    exampleEngagement: "👍 1,847 · 💬 103 · 🔁 274",
    isCompany: true,
  },
  {
    name: "Volta Digital",
    role: "Digital Marketing Agency",
    location: "Barcelona, Spain",
    plan: "All-in",
    metric: "5",
    metricLabel: "new retainer clients citing social proof",
    timeframe: "Over 9 months",
    quote: "It became a conversation point in new business pitches almost immediately. We'd show our own follower growth, our engagement numbers, and say 'this is what we do for clients, and here's proof it works on us.' Two clients signed that week. It's awkward to sell social media growth if you can't demonstrate it yourself.",
    results: [
      "Used ItGrows across all 3 accounts: founder LinkedIn, personal X, and company X",
      "Combined following tripled in 9 months — used as live proof in business pitches",
      "Won 5 new retainer clients in a single quarter who cited social credibility as a deciding factor",
    ],
    examplePost: "We ran the same ad creative for a client across 6 audience segments. The CTR difference between the best and worst? 7.3x. Same budget. Same platform. Same product. The only variable was who saw it. Targeting is still the most underrated lever in paid social — thread:",
    exampleEngagement: "👍 1,129 · 💬 74 · 🔁 183",
    isCompany: true,
  },

  // Company Plan
  {
    name: "Payfields",
    role: "B2B Payments Startup",
    location: "Dublin, Ireland",
    plan: "Company",
    metric: "341 → 17,863",
    metricLabel: "X followers in 5 months",
    timeframe: "Over 5 months",
    quote: "A TechCrunch journalist DM'd us saying she'd been following our X account for about six weeks and wanted to include us in a piece she was writing. We hadn't pitched her. Hadn't sent a press release. She just found us through the content. That article brought more demo requests in 48 hours than our last email campaign did in a month.",
    results: [
      "Company X grew from 341 to 17,863 followers in 5 months",
      "Featured in TechCrunch after a journalist organically discovered the brand via X",
      "Demo request volume increased 43% in the 3 months following the TechCrunch feature",
    ],
    examplePost: "The average B2B payment still takes 47 days to clear. In 2025. We think that's embarrassing, and we built Payfields to fix it. Here's why the existing rails are slow (hint: it's not technical — it's incentives) and what actually needs to change.",
    exampleEngagement: "👍 2,754 · 💬 163 · 🔁 418",
    isCompany: true,
  },
  {
    name: "Greenpath Logistics",
    role: "Sustainable Supply Chain",
    location: "Copenhagen, Denmark",
    plan: "Company",
    metric: "$183K",
    metricLabel: "in partnership deals sourced via X",
    timeframe: "Over 9 months",
    quote: "Both partnerships started the same way — they'd been engaging with our posts for a while and eventually sent a DM saying they'd been thinking about reaching out for weeks. Neither came through ads, outbound, or referrals. Just consistent content. It's a different kind of pipeline and honestly a more pleasant one to work.",
    results: [
      "Established daily X presence in the sustainable logistics niche",
      "2 partnership deals worth $183K combined closed via direct X outreach",
      "Brand mentions in industry Slack communities increased roughly 8x over 9 months",
    ],
    examplePost: "Scope 3 emissions are where most supply chains hide their real footprint — and most companies report them in a way that's technically accurate but practically useless. Here's what we changed in our own tracking methodology and why it actually changed our carrier decisions.",
    exampleEngagement: "👍 986 · 💬 54 · 🔁 147",
    isCompany: true,
  },
  {
    name: "Clariva Analytics",
    role: "Data Analytics Platform",
    location: "Toronto, Canada",
    plan: "Company",
    metric: "$38,412",
    metricLabel: "saved annually vs. a social media manager",
    quote: "We'd had a part-time social media manager for about a year. She was great but $3,200 a month for two platforms was hard to justify as a 9-person team. We tried ItGrows mostly for cost reasons, but the output quality actually improved — more consistent, better-targeted, posted at better times. We haven't looked back.",
    results: [
      "Replaced $3,200/mo part-time hire with the $149/mo Company plan",
      "X posting frequency increased from 3 times per week to daily",
      "Engagement rate improved 2.8x due to more consistent cadence and sharper topic focus",
    ],
    timeframe: "Over 7 months",
    examplePost: "We analyzed 14 months of data across 6 mid-market retail clients. Every single one had the same blind spot: they were optimizing for their best-selling SKUs and ignoring the long tail that was quietly accounting for 38% of margin. Here's what the dashboard looks like when you fix that view.",
    exampleEngagement: "👍 743 · 💬 39 · 🔁 112",
    isCompany: true,
  },
]

const plans = ["Personal", "Duo", "All-in", "Company"] as const
type Plan = (typeof plans)[number]

const planColors: Record<Plan, { bg: string; text: string; border: string; badge: string; badgeText: string }> = {
  Personal: {
    bg: "from-violet-50 to-purple-50",
    text: "text-violet-700",
    border: "border-violet-200",
    badge: "bg-violet-100",
    badgeText: "text-violet-700",
  },
  Duo: {
    bg: "from-pink-50 to-rose-50",
    text: "text-pink-700",
    border: "border-pink-200",
    badge: "bg-pink-100",
    badgeText: "text-pink-700",
  },
  "All-in": {
    bg: "from-cyan-50 to-teal-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    badge: "bg-cyan-100",
    badgeText: "text-cyan-700",
  },
  Company: {
    bg: "from-amber-50 to-orange-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badge: "bg-amber-100",
    badgeText: "text-amber-700",
  },
}

const planDescriptions: Record<Plan, string> = {
  Personal: "LinkedIn or X personal account",
  Duo: "LinkedIn + X personal accounts",
  "All-in": "LinkedIn + X personal + X company",
  Company: "X company account only",
}

export default function CaseStudiesPage() {
  const [activeTab, setActiveTab] = useState<Plan>("Personal")

  const filtered = caseStudies.filter((c) => c.plan === activeTab)
  const colors = planColors[activeTab]

  return (
    <div
      className="min-h-screen text-[#1b1916] scroll-smooth"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Nav */}
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-50" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">How It Works</Link>
            <Link href="/#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</Link>
            <Link href="/case-studies" className="text-sm text-[#1b1916] font-semibold transition-colors">Case Studies</Link>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login?callbackUrl=/cabinet">
              <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">
                Try Free 14 Days
              </Button>
            </Link>
          </div>
          {/* Mobile nav fallback */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/signup">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3">Try Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-300 text-violet-600 bg-violet-50 tracking-[0.12em] uppercase">
            Customer Stories
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-[#1b1916]">
            Real Results.{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Real Growth.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            See how consultants, founders, executives, and companies use ItGrows.ai to build authority, attract leads, and grow their business on social media — on autopilot.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><span className="text-violet-600 font-bold">2,400+</span> professionals</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5"><span className="text-violet-600 font-bold">4 plans</span> for every need</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5"><span className="text-violet-600 font-bold">14-day</span> free trial</span>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Plan tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10 sm:mb-14">
            {plans.map((plan) => {
              const c = planColors[plan]
              const isActive = plan === activeTab
              return (
                <button
                  key={plan}
                  onClick={() => setActiveTab(plan)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    isActive
                      ? `${c.badge} ${c.badgeText} ${c.border} shadow-sm scale-105`
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {plan} Plan
                  <span className={`ml-2 text-xs font-normal opacity-70 hidden sm:inline`}>
                    — {planDescriptions[plan]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active plan description */}
          <div className={`text-center mb-10 p-4 rounded-2xl bg-gradient-to-r ${colors.bg} border ${colors.border} max-w-xl mx-auto`}>
            <p className={`text-sm font-medium ${colors.text}`}>
              <span className="font-bold">{activeTab} Plan</span> — {planDescriptions[activeTab]}
            </p>
          </div>

          {/* Case study cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((cs, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-black/8 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${colors.badge} ${colors.badgeText}`}>
                      {cs.plan} Plan
                    </div>
                    <h3 className="text-lg font-bold text-[#1b1916] leading-tight">{cs.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{cs.role}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cs.location}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${colors.bg} flex-shrink-0`}>
                    {cs.isCompany ? "🏢" : "👤"}
                  </div>
                </div>

                {/* Key metric */}
                <div className={`rounded-xl p-4 mb-4 bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
                  <div className={`text-2xl font-extrabold ${colors.text} leading-none mb-1`}>{cs.metric}</div>
                  <div className="text-xs text-slate-600 font-medium">{cs.metricLabel}</div>
                  <div className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 ${colors.text}`}>
                    {cs.timeframe}
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-slate-600 italic leading-relaxed mb-4 border-l-2 border-slate-200 pl-3">
                  &ldquo;{cs.quote}&rdquo;
                </blockquote>

                {/* Example post preview */}
                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Example post</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{cs.examplePost}</p>
                  <p className="text-xs text-slate-400 font-medium">{cs.exampleEngagement}</p>
                </div>

                {/* Results */}
                <ul className="space-y-2 mt-auto">
                  {cs.results.map((r, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${colors.badge} ${colors.badgeText}`}>
                        ✓
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="px-4 sm:px-6 py-4 text-center text-sm text-white font-medium" style={{ backgroundColor: "#1b1916" }}>
        &ldquo;In 3 months on LinkedIn &amp; X: 38,500 impressions, 23 inbound DMs, +890% profile views.&rdquo; — K.S., Startup Founder
      </div>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24 overflow-hidden" style={{ backgroundColor: "#07071a" }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-400/30 text-violet-300 bg-violet-900/30 tracking-[0.12em] uppercase">
            Start Growing Today
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Your results could be{" "}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              next on this page.
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Join 2,400+ professionals who grow their social presence on autopilot. 14-day free trial, no card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 text-base sm:text-lg rounded-xl w-full sm:w-auto font-semibold shadow-lg shadow-violet-600/30"
              >
                Start Free 14-Day Trial
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-[#1b1916] bg-white hover:bg-white/90 px-8 py-4 text-base sm:text-lg rounded-xl w-full sm:w-auto"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">14-day free trial · No card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-black/10" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <Link href="/" className="font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            ItGrows.ai
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/#pricing" className="hover:text-[#1b1916] transition-colors">Pricing</Link>
            <Link href="/case-studies" className="hover:text-[#1b1916] transition-colors font-semibold text-[#1b1916]">Case Studies</Link>
            <Link href="/blog" className="hover:text-[#1b1916] transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1b1916] transition-colors">Terms</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} ItGrows.ai</p>
        </div>
      </footer>
    </div>
  )
}
