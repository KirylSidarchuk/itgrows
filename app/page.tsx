"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AI_IMAGE_ICON = (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <rect width="56" height="56" rx="12" fill="url(#bg)" />
    {/* landscape image */}
    <rect x="8" y="10" width="32" height="28" rx="4" fill="url(#frame)" />
    <ellipse cx="16" cy="30" rx="6" ry="4" fill="#3b2f8a" opacity="0.7" />
    <ellipse cx="28" cy="28" rx="8" ry="5" fill="#4c3aa3" opacity="0.7" />
    <circle cx="22" cy="18" r="4" fill="#fbbf24" />
    <path d="M8 30 Q16 22 24 26 Q32 30 40 24" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
    {/* AI badge */}
    <circle cx="38" cy="38" r="10" fill="url(#badge)" />
    <text x="38" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="sans-serif">AI</text>
    {/* sparkles */}
    <path d="M44 10 L45 13 L48 14 L45 15 L44 18 L43 15 L40 14 L43 13Z" fill="white" opacity="0.7" />
    <path d="M6 8 L6.7 10 L9 10.7 L6.7 11.4 L6 13.4 L5.3 11.4 L3 10.7 L5.3 10Z" fill="white" opacity="0.5" />
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e1b4b" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
      <linearGradient id="frame" x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#c026d3" />
      </linearGradient>
      <linearGradient id="badge" x1="28" y1="28" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
  </svg>
)

const features = [
  {
    icon: "🎯",
    title: "Posts Tailored to Your Voice & Niche",
    desc: "We analyze your professional profile and write in your unique tone — not generic AI filler.",
  },
  {
    icon: "📅",
    title: "7 Posts Scheduled Weekly",
    desc: "One post every day, Monday through Sunday. Consistent presence without the effort.",
  },
  {
    icon: AI_IMAGE_ICON,
    title: "Images Generated Automatically",
    desc: "Every post comes with a custom AI-generated image that matches your content.",
  },
  {
    icon: "⏰",
    title: "Publishes at Peak Time",
    desc: "Posts go live at 10am UTC — when LinkedIn engagement is highest.",
  },
  {
    icon: "🧬",
    title: "Built on Your Professional DNA",
    desc: "We study your niche, goals, and audience before writing a single word. Nothing generic.",
  },
]

const steps = [
  {
    num: "01",
    title: "Connect LinkedIn",
    desc: "One click. No passwords shared. We use LinkedIn's secure OAuth connection.",
  },
  {
    num: "02",
    title: "Tell Us About You",
    desc: "Fill a 2-minute brief: your niche, audience, and goals. That's your content DNA.",
  },
  {
    num: "03",
    title: "We Post for You",
    desc: "AI-crafted posts publish daily to your profile. Review, edit, or let them run on autopilot.",
  },
]

const faqs = [
  {
    q: "Is this generic AI content?",
    a: "No. Before writing anything, we analyze your LinkedIn profile, your niche, and your professional goals. Every post is written specifically for you — in your voice, for your audience.",
  },
  {
    q: "Do I need to do anything after setup?",
    a: "Just connect LinkedIn and fill a 2-minute brief. After that, posts are generated and scheduled automatically. You can review and edit before they go live if you'd like.",
  },
  {
    q: "Can I edit posts before they publish?",
    a: "Yes. Every post appears in your dashboard before it goes live. Approve as-is, tweak the wording, or regenerate entirely — you're always in control.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no lock-ins. Cancel from your account settings in seconds. Your subscription ends at the current billing period.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. You get 7 days completely free — no credit card required. Explore the full product, see your LinkedIn posts go live, and only subscribe once you've experienced the results. After 7 days, choose monthly ($15/mo) or annual ($144/yr, save 20%).",
  },
  {
    q: "What happens after my trial ends?",
    a: "Your scheduled posts will pause. You'll see a clear prompt to subscribe in your dashboard. No charges, no surprises — just a simple decision to continue or walk away.",
  },
]

export default function PersonalPage() {
  const [annual, setAnnual] = useState(false)
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { user?: { id?: string; name?: string; email?: string } }) => {
        if (data?.user?.id) setSessionUser(data.user)
      })
      .catch(() => {})
  }, [])

  async function handleStartTrial() {
    // Check if logged in first
    const sessionRes = await fetch("/api/auth/session")
    const sessionData = await sessionRes.json() as { user?: { id: string } }
    if (!sessionData?.user?.id) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    // Start no-card trial
    const res = await fetch("/api/trial/start", { method: "POST" })
    if (res.status === 401) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    // Whether trial started or already used/subscribed, go to cabinet
    window.location.href = "/cabinet"
  }

  async function handleCheckout(planType: "monthly" | "annual") {
    // First check if logged in
    const sessionRes = await fetch("/api/auth/session")
    const sessionData = await sessionRes.json() as { user?: { id: string } }
    if (!sessionData?.user?.id) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType }),
    })
    if (res.status === 401) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      // Stripe not configured yet — go to cabinet directly
      window.location.href = "/cabinet"
    }
  }

  return (
    <div
      className="min-h-screen text-[#1b1916] scroll-smooth"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Nav */}
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-50" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>

          {/* Desktop center nav links */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">How It Works</a>
            <a href="#features" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</a>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Blog</Link>
          </div>

          {/* Desktop right side: auth */}
          <div className="hidden md:flex items-center gap-2">
            {sessionUser ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(sessionUser.name || sessionUser.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600 max-w-[140px] truncate">
                    {sessionUser.name || sessionUser.email}
                  </span>
                </div>
                <Link href="/cabinet">
                  <Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Cabinet →</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?callbackUrl=/cabinet">
                  <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button>
                </Link>
                <Button onClick={handleStartTrial} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">
                  Try Free — No Card
                </Button>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-black/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/10 mt-4 pt-4 pb-2 flex flex-col gap-1">
            <a
              href="#how-it-works"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#features"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <Link
              href="/blog"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <div className="border-t border-black/10 mt-2 pt-3 flex flex-col gap-2">
              {sessionUser ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(sessionUser.name || sessionUser.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-600 truncate">
                      {sessionUser.name || sessionUser.email}
                    </span>
                  </div>
                  <Link href="/cabinet" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm">Cabinet →</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login?callbackUrl=/cabinet" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-sm border-black/20">Login</Button>
                  </Link>
                  <Button
                    onClick={() => { setMobileMenuOpen(false); handleStartTrial() }}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm"
                  >
                    Try Free — No Card
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-4 sm:mb-6 bg-violet-100 text-violet-700 border-violet-200 text-xs sm:text-sm px-3 sm:px-4 py-1">
            LinkedIn Automation · $15/month
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-[#1b1916]">
            Your LinkedIn on
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Autopilot
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            We write and publish 7 AI-crafted LinkedIn posts every week — tailored to your voice, your niche, and your audience. Set it up once. Grow forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" onClick={handleStartTrial} className="bg-violet-600 hover:bg-violet-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto">
              Try Free for 7 Days — No Card Required
            </Button>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="border-[#1b1916] text-[#1b1916] hover:bg-[#1b1916] hover:text-[#f3f2f1] px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full">
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-slate-500">7-day free trial · No credit card required · Cancel anytime · $15/month after</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-center">
        <p className="text-white text-base font-medium">
          Join <span className="font-extrabold">200+ professionals</span> growing their LinkedIn presence with ItGrows Personal
        </p>
      </div>

      {/* FOMO — What you're missing */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#07071a" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-red-500/40 text-red-400 bg-red-500/10 tracking-widest uppercase">
              The Hard Truth
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              While You Stay Silent,{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Someone Else Takes Your Deals
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              LinkedIn isn't a social network — it's where business decisions get made. Every day you don't post, you're invisible to the people who would hire, buy from, or partner with you.
            </p>
          </div>

          {/* Big stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
            {[
              { number: "99%", label: "of LinkedIn users never post", sub: "yet the 1% who do get 9 billion impressions per week", source: "Buffer, 2025", sourceUrl: "https://buffer.com/resources/linkedin-statistics/" },
              { number: "80%", label: "of all B2B leads on social come from LinkedIn", sub: "it's not Instagram or Facebook — it's here", source: "Foundation Inc, 2025", sourceUrl: "https://foundationinc.co/lab/b2b-marketing-linkedin-stats/" },
              { number: "23%", label: "of decision-makers bought after reading a post", sub: "thought leadership directly turns readers into clients", source: "Edelman × LinkedIn, 2024", sourceUrl: "https://www.edelman.com/expertise/Business-Marketing/2024-b2b-thought-leadership-report" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-8 border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-5xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-3">{s.number}</div>
                <div className="text-white font-semibold text-base mb-2">{s.label}</div>
                <div className="text-slate-500 text-sm leading-relaxed mb-3">{s.sub}</div>
                <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition-colors">
                  Source: {s.source}
                </a>
              </div>
            ))}
          </div>

          {/* What you're losing list */}
          <div className="rounded-2xl border border-red-500/20 p-5 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.02) 100%)" }}>
            <h3 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">Every week without posting, you miss:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[
                "65 million decision-makers who could see your name — but don't",
                "Inbound leads that go to the person who showed up in their feed last week",
                "Job offers and partnership requests that flow to visible experts",
                "Algorithm visibility: inactive profiles get 50%+ less reach over time",
                "Deals worth paying a premium for — 60% of buyers pay more for thought leaders",
                "Your position as the go-to expert in your niche, taken by someone else",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5 text-lg flex-shrink-0">✕</span>
                  <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-slate-400 text-base mb-6">The good news? The bar is on the floor — 99% of people don't post. You just need to show up.</p>
            <button
              onClick={handleStartTrial}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-4 rounded-xl text-base font-semibold transition-all"
            >
              Start Free — No Credit Card
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-pink-100 text-pink-700 border-pink-200">Simple Setup</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1b1916]">Up and Running in 3 Minutes</h2>
            <p className="text-slate-600 text-base sm:text-lg">No copywriting. No scheduling. No thinking about what to post.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[-50%] h-px bg-gradient-to-r from-violet-300 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-black mx-auto mb-6 text-white">
                  {s.num}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#1b1916]">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-4 sm:px-6 py-16 sm:py-28 overflow-hidden" style={{ backgroundColor: "#07071a" }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-700/15 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.12) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-violet-500/40 text-violet-400 bg-violet-500/10 tracking-widest uppercase">
              What You Get
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Own Your LinkedIn
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              One subscription. Daily posts. Real professional growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-6 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.18),inset_0_0_30px_rgba(139,92,246,0.04)]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">One Plan. Everything Included.</h2>
            <p className="text-slate-600 text-lg">No upsells. No tiers. Just LinkedIn growth.</p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-medium ${!annual ? "text-[#1b1916]" : "text-slate-400"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${annual ? "bg-violet-600" : "bg-slate-300"}`}
              aria-label="Toggle annual billing"
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${annual ? "translate-x-7" : ""}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-[#1b1916]" : "text-slate-400"}`}>
              Annual
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Save 20%</span>
            </span>
          </div>

          <Card className="relative border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-[#1b1916] text-2xl">Personal Autopilot</CardTitle>
              <p className="text-slate-500 text-sm mt-1">Everything you need to grow your LinkedIn</p>
              <div className="flex items-end gap-1 mt-4 justify-center">
                <span className="text-6xl font-extrabold text-[#1b1916]">{annual ? "$12" : "$15"}</span>
                <span className="text-slate-500 mb-2 text-lg">/month</span>
              </div>
              {annual && (
                <p className="text-sm text-green-600 font-medium mt-1">Billed $144/year · Save $36</p>
              )}
              {!annual && (
                <p className="text-sm text-slate-400 mt-1">or <button onClick={() => setAnnual(true)} className="underline text-violet-600">save 20% with annual</button></p>
              )}
            </CardHeader>
            <CardContent className="space-y-5 px-8 pb-8">
              <Button
                onClick={annual ? () => handleCheckout("annual") : handleStartTrial}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-6 text-base rounded-xl mt-2"
              >
                {annual ? "Start Annual Plan" : "Start Free Trial — No Credit Card"}
              </Button>
              <p className="text-center text-xs text-slate-500">{annual ? "Billed $144/year · Cancel anytime" : "7-day free trial · No credit card required · $15/month after"}</p>
              <ul className="space-y-3 pt-2">
                {[
                  "7 AI-written posts per week",
                  "Custom images for every post",
                  "Auto-scheduling at peak time (10am UTC)",
                  "Profile DNA analysis",
                  "Review & edit before publishing",
                  "Cancel anytime, no commitment",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-violet-600 font-bold text-base">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-cyan-100 text-cyan-700 border-cyan-200">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-violet-700">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-base sm:text-lg">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/10 p-6 hover:border-violet-300 transition-colors">
                <h3 className="text-violet-700 font-semibold text-base mb-3 leading-snug">{item.q}</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 text-center" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-[#1b1916]">
            Ready to Grow Your LinkedIn{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              While You Sleep?
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 sm:mb-10">
            Join 200+ professionals who stopped worrying about what to post.
          </p>
          <Button
            size="lg"
            onClick={handleStartTrial}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto"
          >
            Try Free for 7 Days — No Card Required
          </Button>
          <p className="mt-4 text-xs sm:text-sm text-slate-500">No credit card required · $15/month after · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <p>
          © 2026 ItGrows.ai. All rights reserved. ·{" "}
          <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy Policy</Link>
          {" "}·{" "}
          <Link href="/terms" className="hover:text-[#1b1916] transition-colors">Terms of Service</Link>
        </p>
        <p className="mt-2 text-xs text-slate-400">Magiscan Inc. · 919 North Market Street, Wilmington, DE 19801, USA</p>
      </footer>
    </div>
  )
}
