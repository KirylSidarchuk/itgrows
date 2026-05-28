"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { track } from "@vercel/analytics"

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
    q: "Will my followers know my posts are AI-generated?",
    a: "Only if you tell them. ItGrows writes in your voice based on your profile, niche, and communication style — not generic AI copy. Most followers can't tell the difference. That said, many of our users choose to disclose AI assistance. The FTC recommends transparency about AI-assisted content, which we support.",
    defaultOpen: true,
  },
  {
    q: "Can I edit posts before they go live?",
    a: "Yes, always. Every post sits in your approval queue before publishing. You can edit the text, change the image, reschedule, or delete it. You can also enable full autopilot once you're comfortable with the output quality — but you're always in control.",
    defaultOpen: true,
  },
  {
    q: "Is it safe to connect my LinkedIn and X accounts?",
    a: "Absolutely. We use LinkedIn's official OAuth and X's official API — the same secure standards used by tools like Salesforce, HubSpot, and Buffer. You log in directly on each platform's website, not on ours. We never see or store your passwords. You can revoke access at any time.",
  },
  {
    q: "Is this generic AI content?",
    a: "No. Before writing anything, we analyze your profile, your niche, and your professional goals. Every post is written specifically for you — in your voice, for your audience. LinkedIn posts and X tweets have different styles and we tailor both accordingly.",
  },
  {
    q: "Is this against LinkedIn's or X's Terms of Service?",
    a: "No. We use official, approved APIs from both platforms. Posting via third-party tools is explicitly allowed by both LinkedIn and X. Thousands of businesses use tools like Buffer, Hootsuite, and Sprout Social — ItGrows operates the same way.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "Yes, a card is required to start your 14-day free trial. You won't be charged until the trial ends. After 14 days, you can choose a plan to keep publishing or cancel anytime. We use Stripe for secure payment processing.",
  },
  {
    q: "What happens to my content if I cancel?",
    a: "Your account and all your posts remain accessible. You can export your content at any time. If you cancel, we stop publishing new posts, but nothing is deleted. You can reactivate your subscription whenever you want.",
  },
]

export default function PersonalPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
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

  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [showLandingPlanModal, setShowLandingPlanModal] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  // Feedback form state
  const [showCaseStudies, setShowCaseStudies] = useState(false)
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
    track("generate_preview_clicked", { tone: ghostTone, goal: goalStr })
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
        track("preview_posts_shown")
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

  async function handleCheckout(plan: "personal" | "duo" | "allin" | "personal_annual" | "duo_annual" | "allin_annual" | "company" | "company_annual") {
    track("start_trial_clicked", { plan })
    const sessionRes = await fetch("/api/auth/session")
    const sessionData = await sessionRes.json() as { user?: { id: string } }
    if (!sessionData?.user?.id) {
      window.location.href = `/signup?plan=${plan}`
      return
    }
    // Already logged in → go to cabinet to start trial
    window.location.href = "/cabinet"
  }

  function handleCheckoutWithPlatform(plan: string) {
    const actualPlan = billingCycle === "annual"
      ? (plan === "personal" ? "personal_annual" : plan === "duo" ? "duo_annual" : "allin_annual")
      : plan
    if (plan === "allin") {
      handleCheckout(actualPlan as "allin" | "allin_annual")
      return
    }
    setPendingPlan(actualPlan)
    setSelectedPlatforms([])
    setShowPlatformModal(true)
  }

  function togglePlatform(platform: string) {
    if (pendingPlan === "personal") {
      setSelectedPlatforms([platform])
    } else {
      setSelectedPlatforms((prev) =>
        prev.includes(platform)
          ? prev.filter((p) => p !== platform)
          : prev.length < 2
          ? [...prev, platform]
          : prev
      )
    }
  }

  function handlePlatformContinue() {
    if (!pendingPlan) return
    sessionStorage.setItem("itgrows_selected_platforms", selectedPlatforms.join(","))
    setShowPlatformModal(false)
    handleCheckout(pendingPlan as "personal" | "duo" | "allin")
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
            <Link href="/case-studies" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Case Studies</Link>
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
                <Button onClick={() => { document.getElementById("ghost-mode")?.scrollIntoView({ behavior: "smooth" }) }} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">
                  Try Free — See Your Posts
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
              href="/case-studies"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Case Studies
            </Link>
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
                    onClick={() => { setMobileMenuOpen(false); document.getElementById("ghost-mode")?.scrollIntoView({ behavior: "smooth" }) }}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm"
                  >
                    Try Free — See Your Posts
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="ghost-mode" className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-300 text-violet-600 bg-violet-50 tracking-[0.12em] uppercase">
            X (Twitter) &amp; LinkedIn Autopilot
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-[#1b1916]">
            Turn Your Expertise Into Thought Leadership —
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              AI Drafts, You Approve in 30 Seconds
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Every day, ItGrows drafts LinkedIn and X posts in your voice. Review in 30 seconds, publish with one tap — or set to full autopilot once you trust it. Try it below, no signup needed.
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
          <p className="mt-4 text-xs sm:text-sm text-slate-500 font-medium">14-day free trial · Card required · Cancel anytime</p>

          {/* Generator form — embedded in hero */}
          <div className="mt-10 max-w-3xl mx-auto text-left">
            <div className="bg-[#f8f7f6] border border-black/10 rounded-2xl p-5 sm:p-6">
              <p className="text-sm font-semibold text-[#1b1916] mb-4">Tell us about yourself</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">What do you do? <span className="text-violet-500">*</span></label>
                  <input
                    type="text"
                    value={ghostWhatYouDo}
                    onChange={(e) => setGhostWhatYouDo(e.target.value)}
                    placeholder="e.g. I'm an organizational transformation consultant helping Fortune 500 companies navigate change"
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
              <div className="mt-8 space-y-4">
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
                        <button
                          onClick={() => setShowLandingPlanModal(true)}
                          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                          style={{ backgroundColor: "#7C3AED" }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                        >
                          Automate This Post →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-center text-white">
                  <div className="text-2xl font-extrabold mb-2">Want these posted for you every day?</div>
                  <p className="text-white/80 text-sm mb-5">Start your 14-day free trial. Card required.</p>
                  <button
                    onClick={() => setShowLandingPlanModal(true)}
                    className="inline-block px-8 py-3 rounded-xl bg-white text-violet-600 font-bold text-sm hover:bg-violet-50 transition-colors"
                  >
                    Get 14 Days Free →
                  </button>
                  <p className="mt-3 text-white/60 text-xs">🔒 OAuth secure · No password stored · Cancel anytime</p>
                </div>
              </div>
            )}
          </div>

          {/* Hero video */}
          <div className="mt-10 sm:mt-14 relative max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-violet-200 border border-violet-100">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
              poster="/og-image.png"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1b1916]">Two platforms. One brand. 5 minutes a day.</h2>
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

      {/* Results / Outcomes */}
      <section id="results" className="px-4 sm:px-6 py-16 sm:py-28" style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0f0f23 50%, #0d1117 100%)" }}>
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight tracking-tight">
              Here&apos;s what happened when I used my own product
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              I built ItGrows for myself first. This is my real data from LinkedIn &amp; X — used by executives, consultants, and advisors building influence.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/10 p-8 sm:p-10 flex flex-col gap-6 text-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="flex justify-center gap-8">
                <div>
                  <div className="text-5xl sm:text-6xl font-black" style={{ background: "linear-gradient(90deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>38,500</div>
                  <div className="text-slate-300 text-sm mt-1">impressions</div>
                </div>
                <div>
                  <div className="text-5xl sm:text-6xl font-black" style={{ background: "linear-gradient(90deg, #f472b6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>23</div>
                  <div className="text-slate-300 text-sm mt-1">inbound DMs</div>
                </div>
                <div>
                  <div className="text-5xl sm:text-6xl font-black" style={{ background: "linear-gradient(90deg, #67e8f9, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>3</div>
                  <div className="text-slate-300 text-sm mt-1">months</div>
                </div>
              </div>
              <p className="text-slate-300 text-lg italic leading-relaxed">
                &ldquo;I was posting manually maybe once a week. With ItGrows I went daily — and in 3 months hit 38,500 impressions on LinkedIn and X. 23 people reached out to me inbound. 3 turned into advisory conversations. The tool pays for itself in one client.&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">K</div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Kiryl S.</p>
                  <p className="text-slate-400 text-xs">B2B Consultant &amp; Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-4 sm:px-6 py-14 sm:py-20" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1b1916] mb-3">Built for people who have expertise worth sharing</h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto">Used by executives, consultants, and founders building influence on LinkedIn and X.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-black/10 p-6">
              <div className="text-2xl mb-3">🏛️</div>
              <h3 className="font-bold text-[#1b1916] mb-2">Executives</h3>
              <p className="text-sm text-slate-500 leading-relaxed">VPs, C-suite, and Managing Directors building thought leadership to attract board, advisory, and speaking opportunities.</p>
            </div>
            <div className="bg-white rounded-2xl border border-black/10 p-6">
              <div className="text-2xl mb-3">💼</div>
              <h3 className="font-bold text-[#1b1916] mb-2">Consultants &amp; Advisors</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Independent consultants growing their inbound pipeline by publishing expertise — without hiring a content team.</p>
            </div>
            <div className="bg-white rounded-2xl border border-black/10 p-6">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-bold text-[#1b1916] mb-2">Founders</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Early-stage founders establishing credibility and attracting investors, customers, and talent through consistent personal brand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Expandable */}
      <section className="px-4 sm:px-6 py-10 sm:py-14" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-base sm:text-lg font-semibold text-[#1b1916]">Built by a founder who uses it every day</p>
            <button
              onClick={() => setShowCaseStudies(!showCaseStudies)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-300 bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-colors shadow-sm"
            >
              {showCaseStudies ? "Hide Case Studies ↑" : "See Case Studies ↓"}
            </button>
          </div>

          {showCaseStudies && (
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm mb-4">Real results from our early users — documented and growing.</p>
              <a href="/case-studies" className="inline-flex items-center gap-1 text-violet-700 font-semibold text-sm hover:text-violet-500 transition-colors">
                View case studies →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 text-lg">14-day free trial. Cancel anytime.</p>
            {/* Pricing anchor */}
            <p className="text-slate-500 text-sm mt-4 max-w-md mx-auto">A social media manager costs $2,000+/month. A copywriter costs $500+/month. ItGrows: from $49/month — and it never calls in sick.</p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "bg-[#1b1916] text-white" : "text-slate-500 hover:text-slate-800"}`}
              >Monthly</button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === "annual" ? "bg-[#1b1916] text-white" : "text-slate-500 hover:text-slate-800"}`}
              >
                Annual
                <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${billingCycle === "annual" ? "bg-green-400 text-slate-900" : "bg-green-100 text-green-700"}`}>−30%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">

            {/* Personal Plan */}
            <Card className="relative border-black/10 bg-white shadow-sm">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">or</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">Personal</CardTitle>
                <p className="text-slate-500 text-sm mt-1">1 platform account · LinkedIn or X</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{billingCycle === "annual" ? "$34" : "$49"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {billingCycle === "annual" && <p className="text-xs text-green-600 font-semibold mt-0.5">$411 billed annually · save $177</p>}
                <p className="text-sm text-slate-400 mt-1">14-day free trial · card required</p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                <Button
                  onClick={() => handleCheckoutWithPlatform("personal")}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 text-sm rounded-xl mt-2"
                >
                  Get 14 Days Free →
                </Button>
                <p className="text-center text-xs text-slate-400">🔒 OAuth secure · Card required · Cancel anytime</p>
                <ul className="space-y-2 pt-1">
                  {["1 account: LinkedIn OR X personal OR X company", "Daily posts in your voice", "Custom images for every post", "Auto-scheduling at peak time", "Profile DNA analysis"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-blue-600 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Duo — Most Popular */}
            <Card className="relative border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">+</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">Duo</CardTitle>
                <p className="text-slate-500 text-sm mt-1">Any 2 accounts · LinkedIn + X</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{billingCycle === "annual" ? "$69" : "$99"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {billingCycle === "annual" && <p className="text-xs text-green-600 font-semibold mt-0.5">$831 billed annually · save $357</p>}
                <p className="text-sm text-slate-400 mt-1">14-day free trial · card required</p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                <Button
                  onClick={() => handleCheckoutWithPlatform("duo")}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-5 text-sm rounded-xl mt-2"
                >
                  Get 14 Days Free →
                </Button>
                <p className="text-center text-xs text-slate-400">🔒 OAuth secure · Card required · Cancel anytime</p>
                <ul className="space-y-2 pt-1">
                  {["Any 2 accounts from LinkedIn, X personal, X company", "Daily posts in your voice", "Platform-specific voice & style", "Unified dashboard for both platforms", "Custom images for every post"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-violet-600 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* All-in Plan */}
            <Card className="relative border-black/10 bg-white shadow-sm">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-amber-500 text-white border-0 px-4 py-1">Best Value</Badge>
              </div>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="flex justify-center gap-1 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-900">
                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-700">
                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-[#1b1916] text-xl">All-in</CardTitle>
                <p className="text-slate-500 text-sm mt-1">All 3 accounts · LinkedIn + X personal + X company</p>
                <div className="flex items-end gap-1 mt-4 justify-center">
                  <span className="text-5xl font-extrabold text-[#1b1916]">{billingCycle === "annual" ? "$139" : "$199"}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                {billingCycle === "annual" && <p className="text-xs text-green-600 font-semibold mt-0.5">$1,671 billed annually · save $717</p>}
                <p className="text-sm text-slate-400 mt-1">14-day free trial · card required</p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                <Button
                  onClick={() => handleCheckout("allin")}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-white py-5 text-sm rounded-xl mt-2"
                >
                  Get 14 Days Free →
                </Button>
                <p className="text-center text-xs text-slate-400">🔒 OAuth secure · Card required · Cancel anytime</p>
                <ul className="space-y-2 pt-1">
                  {["All 3 accounts: LinkedIn + X personal + X company", "Daily posts in your voice", "Analytics & strategic session included", "Platform-specific voice & style", "Unified dashboard for all platforms"].map((item, i) => (
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
            onClick={() => handleCheckoutWithPlatform("personal")}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto"
          >
            Start Building Your Executive Presence — Free for 14 Days
          </Button>
          <p className="mt-4 text-xs sm:text-sm text-slate-500">14-day free trial · Card required · From $49/month · Cancel anytime</p>
          <p className="mt-2 text-xs text-slate-400">🔒 OAuth secure · No password stored</p>
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

      {/* Platform Selection Modal */}
      {showPlatformModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-violet-700 mb-1">Choose your platform</h2>
            <p className="text-sm text-slate-500 mb-5">
              {pendingPlan === "personal" ? "Select 1 platform to post on." : "Select any 2 platforms to post on."}
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { id: "linkedin", label: "LinkedIn", sub: "Personal account", icon: (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                    <rect width="24" height="24" rx="4" fill="#0A66C2" />
                    <path d="M7.5 9.5H5.5V18H7.5V9.5Z" fill="white" />
                    <circle cx="6.5" cy="7" r="1.25" fill="white" />
                    <path d="M18.5 18H16.5V13.5C16.5 12.4 15.8 11.75 14.9 11.75C14 11.75 13.5 12.4 13.5 13.5V18H11.5V9.5H13.5V10.6C13.9 9.9 14.8 9.4 15.8 9.4C17.3 9.4 18.5 10.6 18.5 12.5V18Z" fill="white" />
                  </svg>
                )},
                { id: "x_personal", label: "X / Twitter", sub: "Personal account", icon: (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                    <rect width="24" height="24" rx="4" fill="#000000" />
                    <path d="M13.6 10.9L18.4 5.5H17.2L13.1 10.1L9.8 5.5H6L11.1 12.7L6 18.5H7.2L11.6 13.6L15.1 18.5H19L13.6 10.9ZM12.2 12.9L11.7 12.2L7.7 6.4H9.2L12.7 11.2L13.2 11.9L17.4 17.9H15.9L12.2 12.9Z" fill="white" />
                  </svg>
                )},
              ].map((opt) => {
                const isSelected = selectedPlatforms.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={() => togglePlatform(opt.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={{ borderColor: isSelected ? "#7c3aed" : "#e5e7eb", backgroundColor: isSelected ? "#f5f3ff" : "#fff" }}
                  >
                    {opt.icon}
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-800">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.sub}</div>
                    </div>
                    {isSelected && (
                      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-600 shrink-0">
                        <circle cx="10" cy="10" r="10" fill="#7c3aed" />
                        <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPlatformModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlatformContinue}
                disabled={pendingPlan === "personal" ? selectedPlatforms.length !== 1 : selectedPlatforms.length !== 2}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: (pendingPlan === "personal" ? selectedPlatforms.length === 1 : selectedPlatforms.length === 2) ? "#7c3aed" : "#e5e7eb",
                  color: (pendingPlan === "personal" ? selectedPlatforms.length === 1 : selectedPlatforms.length === 2) ? "#fff" : "#9ca3af",
                  cursor: (pendingPlan === "personal" ? selectedPlatforms.length === 1 : selectedPlatforms.length === 2) ? "pointer" : "not-allowed",
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Plan Picker Modal */}
      {showLandingPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLandingPlanModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowLandingPlanModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-[#1b1916] mb-1">Choose your plan</h2>
            <p className="text-slate-500 text-sm mb-5">14-day free trial on all plans. Card required.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-black/10 rounded-xl p-5 flex flex-col gap-3 hover:border-violet-400 transition-colors cursor-pointer" onClick={() => { setShowLandingPlanModal(false); handleCheckoutWithPlatform("personal") }}>
                <div className="font-bold text-[#1b1916]">Personal</div>
                <div className="text-2xl font-extrabold text-violet-600">$49<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-600">1 platform · 1 account</div>
                <button className="mt-auto w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Start Free Trial</button>
              </div>
              <div className="border-2 border-violet-500 rounded-xl p-5 flex flex-col gap-3 cursor-pointer relative" onClick={() => { setShowLandingPlanModal(false); handleCheckoutWithPlatform("duo") }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
                <div className="font-bold text-[#1b1916]">Duo</div>
                <div className="text-2xl font-extrabold text-violet-600">$99<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-600">2 platforms · 2 accounts</div>
                <button className="mt-auto w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Start Free Trial</button>
              </div>
              <div className="border border-black/10 rounded-xl p-5 flex flex-col gap-3 hover:border-violet-400 transition-colors cursor-pointer" onClick={() => { setShowLandingPlanModal(false); handleCheckoutWithPlatform("allin") }}>
                <div className="font-bold text-[#1b1916]">All-in</div>
                <div className="text-2xl font-extrabold text-violet-600">$199<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-600">All platforms · Unlimited</div>
                <button className="mt-auto w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Start Free Trial</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
