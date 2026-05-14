"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type CaseStudy = {
  name: string
  role: string
  plan: "Personal" | "Duo" | "All-in" | "Company"
  metric: string
  metricLabel: string
  quote: string
  results: string[]
  isCompany?: boolean
}

const caseStudies: CaseStudy[] = [
  // Personal Plan
  {
    name: "Sarah Chen",
    role: "Marketing Consultant",
    plan: "Personal",
    metric: "20x",
    metricLabel: "follower growth in 6 months",
    quote: "I went from invisible to having a waitlist. ItGrows handled all my LinkedIn content while I focused on client work.",
    results: [
      "LinkedIn followers grew from 400 to 8,200 in 6 months",
      "3x increase in inbound leads from organic content",
      "Landed 2 enterprise retainers directly from LinkedIn DMs",
    ],
    isCompany: false,
  },
  {
    name: "Marcus Webb",
    role: "Sales Director",
    plan: "Personal",
    metric: "5,400",
    metricLabel: "X followers from scratch",
    quote: "I had zero presence on X. Within 4 months I was getting DMs from podcast hosts and industry journalists.",
    results: [
      "Built X audience from 0 to 5,400 in under 5 months",
      "Featured as a guest on 2 top B2B sales podcasts",
      "Generated 11 qualified pipeline conversations from X alone",
    ],
    isCompany: false,
  },
  {
    name: "Priya Sharma",
    role: "Executive Coach",
    plan: "Personal",
    metric: "4–6",
    metricLabel: "new clients/month from content",
    quote: "I used to rely entirely on referrals. Now my LinkedIn content brings in 4 to 6 new client inquiries every single month.",
    results: [
      "Established thought leadership in executive coaching niche on LinkedIn",
      "Content consistently reaches 15,000–25,000 impressions per week",
      "Books 4–6 new discovery calls per month from content alone",
    ],
    isCompany: false,
  },

  // Duo Plan
  {
    name: "Alex Rodriguez",
    role: "Startup Founder",
    plan: "Duo",
    metric: "19K",
    metricLabel: "combined followers across LinkedIn + X",
    quote: "Multiple investors told us they followed our journey online before reaching out. Social proof became a real fundraising asset.",
    results: [
      "LinkedIn grew to 12K followers, X to 7K in 8 months",
      "Raised $500K seed round — 3 investors cited online visibility",
      "Went from zero inbound to 8–12 partnership inquiries per month",
    ],
    isCompany: false,
  },
  {
    name: "Nina Kowalski",
    role: "B2B SaaS Consultant",
    plan: "Duo",
    metric: "15–20",
    metricLabel: "qualified leads/month",
    quote: "LinkedIn brought the warm leads, X built my reputation with builders and operators. Together they replaced my entire outbound motion.",
    results: [
      "Generates 15–20 qualified leads per month from LinkedIn + X combined",
      "Average deal size increased as inbound prospects arrive pre-sold",
      "Replaced $2,000/mo cold outreach spend — ROI positive within 6 weeks",
    ],
    isCompany: false,
  },
  {
    name: "James Okafor",
    role: "VC Partner",
    plan: "Duo",
    metric: "3x",
    metricLabel: "increase in inbound deal flow",
    quote: "Founders started tagging me in posts before reaching out. My inbox quality completely changed — fewer cold pitches, more warm introductions.",
    results: [
      "Established consistent thought leadership across LinkedIn and X",
      "3x increase in inbound deal flow within 12 months",
      "Featured in 4 VC-focused newsletters after content went viral twice",
    ],
    isCompany: false,
  },

  // All-in Plan
  {
    name: "TechForge Solutions",
    role: "15-person SaaS Startup",
    plan: "All-in",
    metric: "3",
    metricLabel: "enterprise deals closed via social inbound",
    quote: "Our company X became a credibility signal. When prospects Googled us, they saw an active, authoritative brand — that closed deals.",
    results: [
      "Company X account grew to 12K followers in 7 months",
      "Founders' combined LinkedIn reach exceeded 25K followers",
      "Closed 3 enterprise contracts directly attributed to social inbound",
    ],
    isCompany: true,
  },
  {
    name: "Meridian Consulting Group",
    role: "Management Consulting Firm",
    plan: "All-in",
    metric: "60%",
    metricLabel: "content cost reduction",
    quote: "We were paying a content agency $4,800 a month for less output than ItGrows delivers automatically. Switching was an easy decision.",
    results: [
      "Replaced $4,800/mo content agency — same output at 60% lower cost",
      "LinkedIn and X presence maintained across 3 partners and company page",
      "Pipeline attribution from social increased from 8% to 31% of new business",
    ],
    isCompany: true,
  },
  {
    name: "Apex Digital Agency",
    role: "Digital Marketing Agency",
    plan: "All-in",
    metric: "3x",
    metricLabel: "social proof to win more clients",
    quote: "We used ItGrows to manage our own social presence — and it became a selling point. Clients trust an agency that walks its own talk.",
    results: [
      "Used ItGrows for all 3 accounts: founder LinkedIn, personal X, and company X",
      "Tripled social following in 9 months — used as proof in new business pitches",
      "Won 5 new retainer clients in Q4 who cited social credibility as a deciding factor",
    ],
    isCompany: true,
  },

  // Company Plan
  {
    name: "NovaPay Fintech",
    role: "B2B Payments Startup",
    plan: "Company",
    metric: "18,000",
    metricLabel: "X followers in 5 months",
    quote: "We went from a ghost account to being featured in TechCrunch. Consistent posting built the kind of brand awareness money can't easily buy.",
    results: [
      "Company X grew from 200 to 18,000 followers in 5 months",
      "Featured in TechCrunch article after journalist discovered brand via X",
      "Demo request rate increased 40% after social credibility boost",
    ],
    isCompany: true,
  },
  {
    name: "GreenLogic Logistics",
    role: "Sustainable Supply Chain",
    plan: "Company",
    metric: "$180K",
    metricLabel: "in partnership deals via X",
    quote: "Two partners reached out after consistently engaging with our content on X. Neither came from ads, outbound, or referrals — just social.",
    results: [
      "Established daily X presence in sustainable logistics niche",
      "2 partnership deals worth $180K total closed via direct X outreach",
      "Brand mentions increased 8x in industry Slack communities",
    ],
    isCompany: true,
  },
  {
    name: "Bolt Analytics",
    role: "Data Analytics Platform",
    plan: "Company",
    metric: "$37K",
    metricLabel: "saved annually vs. social media manager",
    quote: "We were paying a part-time social media manager $3,200 a month. ItGrows Company plan does more at $149. It was a no-brainer.",
    results: [
      "Replaced $3,200/mo social media manager with $149/mo Company plan",
      "X posting frequency increased from 3x/week to daily",
      "Engagement rate improved 3x due to more consistent and targeted content",
    ],
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
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${colors.bg} flex-shrink-0`}>
                    {cs.isCompany ? "🏢" : "👤"}
                  </div>
                </div>

                {/* Key metric */}
                <div className={`rounded-xl p-4 mb-5 bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
                  <div className={`text-3xl font-extrabold ${colors.text} leading-none mb-1`}>{cs.metric}</div>
                  <div className="text-xs text-slate-600 font-medium">{cs.metricLabel}</div>
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-slate-600 italic leading-relaxed mb-5 border-l-2 border-slate-200 pl-3">
                  &ldquo;{cs.quote}&rdquo;
                </blockquote>

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
            Join 2,400+ professionals who grow their social presence on autopilot. 14-day free trial, no credit card surprises.
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
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-base sm:text-lg rounded-xl w-full sm:w-auto"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">No credit card required to start · Cancel anytime</p>
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
