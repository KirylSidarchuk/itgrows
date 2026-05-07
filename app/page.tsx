"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  {
    num: "01",
    title: "Tell us about you",
    desc: "Fill in your brief: topics, tone, and goals. Works for personal accounts and company profiles.",
  },
  {
    num: "02",
    title: "AI writes in your voice",
    desc: "We generate LinkedIn posts and tweets that sound exactly like you (or your brand). Every day.",
  },
  {
    num: "03",
    title: "Stay visible, grow your audience",
    desc: "Posts go live automatically on LinkedIn and X. Watch followers, leads, and opportunities come to you.",
  },
]

const faqs = [
  {
    q: "Is it safe to connect my LinkedIn and X accounts?",
    a: "Absolutely. We use LinkedIn's official OAuth and X's official API — the same secure standards used by tools like Salesforce, HubSpot, and Buffer. You log in directly on each platform's website, not on ours. We never see or store your passwords. You can revoke access at any time.",
  },
  {
    q: "Is this generic AI content?",
    a: "No. Before writing anything, we analyze your profile, your niche, and your professional goals. Every post is written specifically for you — in your voice, for your audience. LinkedIn posts and X tweets have different styles and we tailor both accordingly.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. You get 7 days completely free — no credit card required. Explore the full product, see your posts go live on LinkedIn and X, and only subscribe once you've experienced the results. After 7 days, choose the plan that fits you.",
  },
  {
    q: "Can I use this for a company brand, not just a personal profile?",
    a: "Yes. The platform works for both personal accounts (founders, executives, consultants) and company profiles. Just tell us your brand's voice and goals during the brief setup.",
  },
]

export default function PersonalPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [ghostWhatYouDo, setGhostWhatYouDo] = useState("")
  const [ghostAudience, setGhostAudience] = useState("")
  const [ghostTone, setGhostTone] = useState("Professional")
  const [ghostGoals, setGhostGoals] = useState<string[]>([])
  const [ghostLoading, setGhostLoading] = useState(false)
  const [ghostPosts, setGhostPosts] = useState<string[]>([])
  const [ghostImages, setGhostImages] = useState<(string | null)[]>([])
  const [ghostError, setGhostError] = useState("")

  // Feedback form state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState("Question")
  const [feedbackEmail, setFeedbackEmail] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [feedbackError, setFeedbackError] = useState("")

  async function handleFeedbackSubmit() {
    if (feedbackMessage.trim().length < 10) {
      setFeedbackError("Please enter at least 10 characters.")
      return
    }
    setFeedbackLoading(true)
    setFeedbackError("")
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: feedbackType, email: feedbackEmail, message: feedbackMessage }),
      })
      if (res.ok) {
        setFeedbackDone(true)
        setTimeout(() => {
          setFeedbackOpen(false)
          setFeedbackDone(false)
          setFeedbackType("Question")
          setFeedbackEmail("")
          setFeedbackMessage("")
        }, 3000)
      } else {
        setFeedbackError("Something went wrong. Please try again.")
      }
    } catch {
      setFeedbackError("Something went wrong. Please try again.")
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function handleGhostGenerate() {
    if (ghostWhatYouDo.trim().length < 5) return
    const goalStr = ghostGoals.length > 0 ? ghostGoals.join(", ") : "Build personal brand"
    const thoughts = `${ghostWhatYouDo}. Audience: ${ghostAudience || "general professionals"}. Tone: ${ghostTone}. Goal: ${goalStr}.`
    setGhostLoading(true)
    setGhostError("")
    setGhostPosts([])
    setGhostImages([])
    try {
      const res = await fetch("/api/public/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thoughts }),
      })
      const data = await res.json() as { posts?: string[]; images?: (string | null)[]; error?: string }
      if (data.posts && data.posts.length > 0) {
        setGhostPosts(data.posts)
        setGhostImages(data.images ?? [])
      } else if (res.status === 429) {
        setGhostError("You've used your 2 free previews. Sign up to generate unlimited posts →")
      } else if (data.error) {
        setGhostError(data.error)
      } else {
        setGhostError("Something went wrong. Try again.")
      }
    } catch {
      setGhostError("Something went wrong. Try again.")
    } finally {
      setGhostLoading(false)
    }
  }

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
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-300 text-violet-600 bg-violet-50 tracking-[0.12em] uppercase">
            Personal &amp; Company Brand Autopilot
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-[#1b1916]">
            Your Brand on LinkedIn &amp; X —
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Built by AI, Sounds Like You
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            We publish daily content on LinkedIn and X in your voice. You stay visible, build authority, and attract clients — without spending hours on content.
          </p>
          <div className="flex justify-center items-center">
            <div className="relative w-full sm:w-auto">
              {/* Pulse ring behind the primary CTA button */}
              <span className="absolute inset-0 rounded-xl animate-pulse bg-violet-400/30 pointer-events-none" style={{ margin: "-4px" }} />
              <Button
                size="lg"
                onClick={() => { document.getElementById("ghost-mode")?.scrollIntoView({ behavior: "smooth" }) }}
                className="relative bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 text-base sm:text-lg rounded-xl w-full sm:w-auto font-semibold shadow-lg shadow-violet-600/30"
              >
                See Your Posts in 30 Seconds — No Signup
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-slate-500 font-medium">No credit card required · Trusted by 2,400+ professionals</p>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="px-4 sm:px-6 py-4 text-center text-sm text-white font-medium" style={{ backgroundColor: "#1b1916" }}>
        &ldquo;In 3 months on LinkedIn &amp; X: 38,500 impressions, 23 inbound DMs, +890% profile views.&rdquo; — K.S., Startup Founder
      </div>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1b1916]">Up and running in 3 steps</h2>
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
          {/* Result callout */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-2xl px-8 py-4">
              <span className="text-2xl">🎯</span>
              <span className="text-[#1b1916] font-semibold text-lg">Result: Opportunities come to you</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1b1916]">Two platforms. One brand. Zero effort.</h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">We handle your presence on both LinkedIn and X — so you show up everywhere your audience is.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* LinkedIn card */}
            <div className="bg-white rounded-2xl border border-black/10 p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#1b1916] text-base">LinkedIn</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Professional Authority</div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">Thought leadership posts, career positioning, and B2B lead generation — published daily in your professional voice.</p>
              <ul className="space-y-2">
                {["Thought leadership & expertise", "Career growth & job opportunities", "B2B leads & client outreach"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-blue-600 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* X (Twitter) card */}
            <div className="bg-white rounded-2xl border border-black/10 p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-black">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#1b1916] text-base">X (Twitter)</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Real-Time Presence</div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">Daily tweets and threads that keep you in trending conversations, grow followers, and build brand awareness in real time.</p>
              <ul className="space-y-2">
                {["Daily engagement & trending topics", "Brand awareness & follower growth", "Real-time presence in your niche"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-slate-800 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ghost Mode — try without signup */}
      <section id="ghost-mode" className="px-4 sm:px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block mb-4 px-4 py-1 rounded-full text-xs font-bold border border-violet-300 text-violet-600 bg-violet-50 tracking-[0.15em] uppercase">
            No signup required
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#1b1916] leading-tight tracking-tight">
            See your posts in{" "}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">30 seconds</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Fill in a quick brief. We&apos;ll generate 3 real posts — no account needed.
          </p>

          <div className="bg-[#f8f7f6] border border-black/10 rounded-2xl p-5 sm:p-6 text-left">
            <p className="text-sm font-semibold text-[#1b1916] mb-4">Tell us about yourself</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">What do you do? <span className="text-violet-500">*</span></label>
                <input
                  type="text"
                  value={ghostWhatYouDo}
                  onChange={(e) => setGhostWhatYouDo(e.target.value)}
                  placeholder="e.g. I'm a sales consultant helping B2B startups close more deals"
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Who is your audience?</label>
                <input
                  type="text"
                  value={ghostAudience}
                  onChange={(e) => setGhostAudience(e.target.value)}
                  placeholder="e.g. Founders, sales managers at SaaS companies"
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Your tone</label>
                  <select
                    value={ghostTone}
                    onChange={(e) => setGhostTone(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#1b1916] focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option>Professional</option>
                    <option>Bold &amp; Contrarian</option>
                    <option>Inspiring</option>
                    <option>Conversational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Your goal</label>
                  <div className="flex flex-wrap gap-2">
                    {["Get clients", "Build personal brand", "Network", "Share expertise"].map((goal) => {
                      const selected = ghostGoals.includes(goal)
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setGhostGoals(selected ? ghostGoals.filter((g) => g !== goal) : [...ghostGoals, goal])}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-black/15 text-slate-600 hover:border-violet-400 hover:text-violet-600"}`}
                        >
                          {goal}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 gap-3">
              <button
                onClick={handleGhostGenerate}
                disabled={ghostLoading || ghostWhatYouDo.trim().length < 5}
                className="ml-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {ghostLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating posts & images...
                  </>
                ) : (
                  "Generate My Posts →"
                )}
              </button>
            </div>
          </div>

          {ghostError && (
            <p className="mt-4 text-sm text-red-500">{ghostError}</p>
          )}

          {ghostPosts.length > 0 && (
            <div className="mt-8 space-y-4 text-left">
              {ghostPosts.map((post, i) => (
                <div key={i} className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                  {ghostImages[i] && (
                    <img src={ghostImages[i]!} alt="Post cover" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      Y
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#1b1916]">You</div>
                      <div className="text-xs text-slate-400">LinkedIn · Just now</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#1b1916] whitespace-pre-wrap leading-relaxed">{post}</p>
                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>👍 Like</span>
                      <span>💬 Comment</span>
                      <span>🔁 Repost</span>
                    </div>
                    <a
                      href="/signup"
                      className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: "#7C3AED" }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                    >
                      Automate This Post →
                    </a>
                  </div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-center text-white">
                <div className="text-2xl font-extrabold mb-2">Want these posted for you every day?</div>
                <p className="text-white/80 text-sm mb-5">Start your 7-day free trial. No card required.</p>
                <a
                  href="/signup"
                  className="inline-block px-8 py-3 rounded-xl bg-white text-violet-600 font-bold text-sm hover:bg-violet-50 transition-colors"
                >
                  Start Free Trial →
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results / Outcomes */}
      <section id="results" className="px-4 sm:px-6 py-16 sm:py-28" style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0f0f23 50%, #0d1117 100%)" }}>
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight tracking-tight">
              What happens when you show up every day
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Real data from professionals who post consistently on LinkedIn
            </p>
          </div>

          {/* 2×2 cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

            {/* Card 1 — Profile Growth */}
            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-violet-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl sm:text-5xl font-black mb-1" style={{ background: "linear-gradient(90deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    3.8×
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">more profile views</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Professionals who post consistently get 3.8× more profile views and 5× more connection requests.
                  </p>
                </div>
              </div>
              {/* Bar chart visual */}
              <div className="flex items-end gap-2 h-14 pt-2">
                <div className="flex-1 rounded-t-md bg-slate-700/60" style={{ height: "30%" }} />
                <div className="flex-1 rounded-t-md bg-slate-600/70" style={{ height: "50%" }} />
                <div className="flex-1 rounded-t-md bg-violet-500/60" style={{ height: "70%" }} />
                <div className="flex-1 rounded-t-md" style={{ height: "100%", background: "linear-gradient(180deg, #a78bfa, #7c3aed)" }} />
                <div className="text-xs text-slate-500 self-end pb-0.5 ml-1 whitespace-nowrap">You →</div>
              </div>
            </div>

            {/* Card 2 — Business Opportunities */}
            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-pink-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="10" y1="14" x2="14" y2="14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl sm:text-4xl font-black mb-1" style={{ background: "linear-gradient(90deg, #f472b6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    73%
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">of B2B buyers check LinkedIn before meeting</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    A strong content presence turns cold outreach into warm conversations — before you even say hello.
                  </p>
                </div>
              </div>
              {/* Funnel visual */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="rounded-sm h-5 bg-pink-500/50" style={{ width: "90%" }} />
                <div className="rounded-sm h-5 bg-pink-500/35" style={{ width: "62%" }} />
                <div className="rounded-sm h-5 bg-pink-500/55" style={{ width: "36%" }} />
                <div className="text-xs text-slate-500 mt-1">Leads → Prospects → Clients</div>
              </div>
            </div>

            {/* Card 3 — Partnership & Network */}
            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-cyan-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="4" cy="19" r="2" />
                    <circle cx="20" cy="19" r="2" />
                    <line x1="12" y1="7" x2="4" y2="17" />
                    <line x1="12" y1="7" x2="20" y2="17" />
                    <line x1="6" y1="19" x2="18" y2="19" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl sm:text-5xl font-black mb-1" style={{ background: "linear-gradient(90deg, #67e8f9, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    +280%
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">inbound messages</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Thought leaders on LinkedIn receive 2.8× more inbound partnership and collaboration requests.
                  </p>
                </div>
              </div>
              {/* Network dots visual */}
              <div className="relative h-14 mt-1">
                {/* Center node */}
                <div className="absolute w-4 h-4 rounded-full bg-cyan-400" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                {/* Connecting lines + outer nodes */}
                {[
                  { top: "10%", left: "20%"  },
                  { top: "10%", left: "75%"  },
                  { top: "75%", left: "12%"  },
                  { top: "75%", left: "82%"  },
                  { top: "40%", left: "88%"  },
                ].map((pos, idx) => (
                  <div key={idx}>
                    <div
                      className="absolute w-2.5 h-2.5 rounded-full bg-slate-500"
                      style={{ top: pos.top, left: pos.left, transform: "translate(-50%,-50%)" }}
                    />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-slate-500 mt-8">Your network expands</div>
                </div>
              </div>
            </div>

            {/* Card 4 — Investment & Credibility */}
            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl sm:text-5xl font-black mb-1" style={{ background: "linear-gradient(90deg, #fcd34d, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    89%
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">of investors Google you first</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Your LinkedIn is your digital first impression. Make it count before the pitch meeting.
                  </p>
                </div>
              </div>
              {/* 5-star rating visual */}
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="flex-1 h-3 rounded-full"
                    style={{ background: star <= 4 ? "linear-gradient(90deg, #fcd34d, #f59e0b)" : "rgba(255,255,255,0.1)" }}
                  />
                ))}
                <span className="text-xs text-slate-500 ml-1 whitespace-nowrap">4.8 / 5</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 text-lg">Pick your platform — or go all-in on both.</p>
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
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Save ~30%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* LinkedIn Plan */}
            <Card className="relative border-black/10 bg-white shadow-sm">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">LinkedIn</CardTitle>
                <p className="text-slate-500 text-sm mt-1">Professional authority &amp; B2B leads</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{annual ? "$16.90" : "$29"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {annual && <p className="text-sm text-green-600 font-medium mt-1">Billed $203/year</p>}
                {!annual && <p className="text-sm text-slate-400 mt-1">or <button onClick={() => setAnnual(true)} className="underline text-violet-600">save with annual</button></p>}
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                <Button
                  onClick={annual ? () => handleCheckout("annual") : handleStartTrial}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 text-sm rounded-xl mt-2"
                >
                  {annual ? "Start Annual Plan" : "Start Free Trial"}
                </Button>
                <ul className="space-y-2 pt-1">
                  {["7 AI-written LinkedIn posts/week", "Custom images for every post", "Auto-scheduling at peak time", "Profile DNA analysis", "Review & edit before publishing"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-blue-600 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Both Platforms — Most Popular */}
            <Card className="relative border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200 md:-mt-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">Both Platforms</CardTitle>
                <p className="text-slate-500 text-sm mt-1">LinkedIn + X · Personal + company</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{annual ? "$28.58" : "$49"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {annual && <p className="text-sm text-green-600 font-medium mt-1">Billed $343/year · Save 30%</p>}
                {!annual && <p className="text-sm text-slate-400 mt-1">or <button onClick={() => setAnnual(true)} className="underline text-violet-600">save 30% with annual</button></p>}
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                {/* TODO: add Both-platforms Stripe checkout link when prices are confirmed */}
                <Button
                  onClick={handleStartTrial}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-5 text-sm rounded-xl mt-2"
                >
                  Start Free Trial
                </Button>
                <p className="text-center text-xs text-slate-500">Twitter plan includes 2 accounts: personal + company</p>
                <ul className="space-y-2 pt-1">
                  {["Everything in LinkedIn plan", "7 AI-written tweets/threads per week", "Dual account posting (personal + company)", "Platform-specific voice & style", "Unified dashboard for both platforms"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-violet-600 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* X (Twitter) Plan */}
            <Card className="relative border-black/10 bg-white shadow-sm">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">X (Twitter)</CardTitle>
                <p className="text-slate-500 text-sm mt-1">Real-time presence &amp; brand awareness</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{annual ? "$16.90" : "$29"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {annual && <p className="text-sm text-green-600 font-medium mt-1">Billed $203/year</p>}
                {!annual && <p className="text-sm text-slate-400 mt-1">or <button onClick={() => setAnnual(true)} className="underline text-violet-600">save with annual</button></p>}
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                {/* TODO: add X/Twitter Stripe checkout link when prices are confirmed */}
                <Button
                  onClick={handleStartTrial}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-white py-5 text-sm rounded-xl mt-2"
                >
                  Start Free Trial
                </Button>
                <ul className="space-y-2 pt-1">
                  {["7 AI-written tweets/threads per week", "Personal + company account posting", "Trending topic integration", "Brand voice analysis", "Review & edit before publishing"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-800 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>
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
              <div
                key={i}
                className="bg-white rounded-2xl border border-black/10 hover:border-violet-300 transition-colors overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  aria-expanded={openFaq === i}
                >
                  <h3 className="text-violet-700 font-semibold text-base leading-snug">{item.q}</h3>
                  <span className="flex-shrink-0 text-violet-400 text-sm transition-transform duration-200" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▼
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-900 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 text-center" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-[#1b1916]">
            Ready to Build a Brand That Works{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              While You Sleep?
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 sm:mb-10">
            Join professionals who attract clients, partners and opportunities on LinkedIn and X — on autopilot.
          </p>
          <Button
            size="lg"
            onClick={handleStartTrial}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto"
          >
            Try Free for 7 Days — No Card Required
          </Button>
          <p className="mt-4 text-xs sm:text-sm text-slate-500">No credit card required · From $29/month · Cancel anytime</p>
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

      {/* Floating Feedback Button */}
      <button
        onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); setFeedbackError("") }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #7C3AED, #6d28d9)" }}
        aria-label="Open feedback form"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setFeedbackOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {feedbackDone ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#1b1916] mb-2">Thank you!</h3>
                <p className="text-slate-500 text-sm">We&apos;ll get back to you soon.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[#1b1916] mb-1">Share your thoughts</h2>
                <p className="text-slate-500 text-sm mb-5">We read every message and use it to improve.</p>

                {/* Type selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1b1916] mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Question", "Bug Report", "Idea", "Other"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFeedbackType(t)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          feedbackType === t
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-violet-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1b1916] mb-1.5">
                    Email <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1b1916] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  />
                </div>

                {/* Message textarea */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Message</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1b1916] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition resize-none"
                  />
                  {feedbackError && <p className="text-red-500 text-xs mt-1">{feedbackError}</p>}
                </div>

                {/* Submit */}
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackLoading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #6d28d9)" }}
                >
                  {feedbackLoading ? "Sending..." : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
