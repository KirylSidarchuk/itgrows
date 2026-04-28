"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AI_IMAGE_ICON = (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <rect width="56" height="56" rx="12" fill="url(#bg)" />
    <rect x="8" y="10" width="32" height="28" rx="4" fill="url(#frame)" />
    <ellipse cx="16" cy="30" rx="6" ry="4" fill="#3b2f8a" opacity="0.7" />
    <ellipse cx="28" cy="28" rx="8" ry="5" fill="#4c3aa3" opacity="0.7" />
    <circle cx="22" cy="18" r="4" fill="#fbbf24" />
    <path d="M8 30 Q16 22 24 26 Q32 30 40 24" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
    <circle cx="38" cy="38" r="10" fill="url(#badge)" />
    <text x="38" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="sans-serif">AI</text>
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
    icon: "📅",
    title: "7 posts per week, every week",
    desc: "One post every day, Monday through Sunday. Consistent presence that brings inbound leads.",
  },
  {
    icon: "🎯",
    title: "Written in your voice (not generic AI)",
    desc: "We analyze your professional profile and write in your unique tone — not generic AI filler.",
  },
  {
    icon: "💼",
    title: "Designed to attract clients, not likes",
    desc: "Every post is crafted to generate inbound interest, not just engagement vanity metrics.",
  },
  {
    icon: "⚡",
    title: "Fully automated — no thinking, no effort",
    desc: "Posts go live automatically. No scheduling, no copywriting, no thinking about what to post.",
  },
  {
    icon: AI_IMAGE_ICON,
    title: "Custom AI images for every post",
    desc: "Every post comes with a custom AI-generated image that matches your content.",
  },
]

const steps = [
  {
    num: "01",
    title: "Connect LinkedIn",
    desc: "Secure OAuth — no passwords.",
  },
  {
    num: "02",
    title: "Tell us about yourself",
    desc: "2-minute input \u2192 your content DNA.",
  },
  {
    num: "03",
    title: "We post for you",
    desc: "Daily posts, fully automated.",
  },
]

const faqs = [
  {
    q: "Is it safe?",
    a: "Yes. We use LinkedIn's official OAuth — no passwords, ever.",
  },
  {
    q: "Can I edit posts?",
    a: "Yes. Review and edit every post before it goes live.",
  },
  {
    q: "Can I cancel?",
    a: "Anytime. No contracts, no questions asked.",
  },
  {
    q: "Is this generic AI?",
    a: "No. Posts are written in your voice, based on your profile and niche.",
  },
]

export default function LandingPageB() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [ghostThoughts, setGhostThoughts] = useState("")
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
  const [resultsTab, setResultsTab] = useState<"week" | "month" | "3months">("week")

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
    if (ghostThoughts.trim().length < 10) return
    setGhostLoading(true)
    setGhostError("")
    setGhostPosts([])
    setGhostImages([])
    try {
      const res = await fetch("/api/public/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thoughts: ghostThoughts }),
      })
      const data = await res.json() as { posts?: string[]; images?: (string | null)[]; error?: string }
      if (data.posts && data.posts.length > 0) {
        setGhostPosts(data.posts)
        setGhostImages(data.images ?? [])
      } else if (res.status === 429) {
        setGhostError("You've used your 2 free previews. Sign up to generate unlimited LinkedIn posts →")
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
    const sessionRes = await fetch("/api/auth/session")
    const sessionData = await sessionRes.json() as { user?: { id: string } }
    if (!sessionData?.user?.id) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    const res = await fetch("/api/trial/start", { method: "POST" })
    if (res.status === 401) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    window.location.href = "/cabinet"
  }

  async function handleCheckout(planType: "monthly" | "annual") {
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
            <a href="#results" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Results</a>
            <a href="#features" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">FAQ</a>
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
                  <Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Cabinet &#8594;</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?callbackUrl=/cabinet">
                  <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button>
                </Link>
                <Button onClick={handleStartTrial} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">
                  Try Free &#8212; No Card
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
              href="#results"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Results
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
            <a
              href="#faq"
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
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
                    <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm">Cabinet &#8594;</Button>
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
                    Try Free &#8212; No Card
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
            LinkedIn Automation &#183; $29/month
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-[#1b1916]">
            Turn your LinkedIn into a
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              client acquisition machine
            </span>
            &#8212; on autopilot
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            We write and publish posts that bring you inbound leads &#8212; in your voice, every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <div className="relative w-full sm:w-auto">
              <span className="absolute inset-0 rounded-xl animate-pulse bg-violet-400/30 pointer-events-none" style={{ margin: "-4px" }} />
              <Button size="lg" onClick={handleStartTrial} className="relative bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 text-base sm:text-lg rounded-xl w-full sm:w-auto font-semibold shadow-lg shadow-violet-600/30">
                Generate My First Post &#8212; takes 30 sec &#8594;
              </Button>
            </div>
            <Button size="lg" onClick={handleStartTrial} variant="outline" className="border-[#1b1916] text-[#1b1916] hover:bg-[#1b1916] hover:text-[#f3f2f1] px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto">
              Start Free &#8212; No Card
            </Button>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 font-medium">No credit card required &#183; Cancel anytime</p>

          {/* Ghost Mode — inline in hero */}
          <div className="mt-10 max-w-xl mx-auto text-left">
            <div className="bg-white/80 backdrop-blur border border-black/10 rounded-2xl p-5 sm:p-6 shadow-sm">
              <label className="block text-sm font-semibold text-[#1b1916] mb-2">
                Try it now &#8212; no signup
              </label>
              <textarea
                value={ghostThoughts}
                onChange={(e) => setGhostThoughts(e.target.value)}
                placeholder="E.g. I'm a B2B consultant helping SaaS companies close more deals. I specialize in outbound strategy and have helped 30+ clients generate inbound from LinkedIn."
                className="w-full h-24 resize-none rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <div className="flex items-center justify-between mt-3 gap-3">
                <span className="text-xs text-slate-400">{ghostThoughts.length}/500 chars</span>
                <button
                  onClick={handleGhostGenerate}
                  disabled={ghostLoading || ghostThoughts.trim().length < 10}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {ghostLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate My Posts \u2192"
                  )}
                </button>
              </div>
            </div>

            {ghostError && (
              <p className="mt-3 text-sm text-red-500">{ghostError}</p>
            )}

            {ghostPosts.length > 0 && (
              <div className="mt-6 space-y-4">
                {ghostPosts.map((post, i) => (
                  <div key={i} className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                    {ghostImages[i] && (
                      <img src={ghostImages[i]!} alt="Post cover" className="w-full h-48 object-cover" />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          Y
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#1b1916]">You</div>
                          <div className="text-xs text-slate-400">LinkedIn &#183; Just now</div>
                        </div>
                      </div>
                      <p className="text-sm text-[#1b1916] whitespace-pre-wrap leading-relaxed">{post}</p>
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>&#128077; Like</span>
                          <span>&#128172; Comment</span>
                          <span>&#128260; Repost</span>
                        </div>
                        <a
                          href="/signup"
                          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                          style={{ backgroundColor: "#7C3AED" }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                        >
                          Automate This &#8594;
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl p-6 text-center text-white">
                  <div className="text-xl font-extrabold mb-2">Want these posted for you every day?</div>
                  <p className="text-white/80 text-sm mb-4">Start free. No card required.</p>
                  <a
                    href="/signup"
                    className="inline-block px-8 py-3 rounded-xl bg-white text-violet-600 font-bold text-sm hover:bg-violet-50 transition-colors"
                  >
                    Start Free &#8594;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-center">
        <p className="text-white text-base font-medium">
          Join <span className="font-extrabold">2,400+ professionals</span> growing their LinkedIn presence with ItGrows.ai
        </p>
      </div>

      {/* Pain Section */}
      <section id="ghost-mode" className="px-4 sm:px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 text-[#1b1916] leading-tight tracking-tight">
            If you&apos;re not posting,{" "}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">you&apos;re invisible</span>
          </h2>
          <div className="space-y-4 mb-8 text-left max-w-xl mx-auto">
            {[
              "Your competitors show up daily \u2014 you don\u2019t",
              "Decision-makers check LinkedIn before buying",
              "The one who posts \u2192 gets the deal",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-violet-600 font-bold text-lg flex-shrink-0">&#10003;</span>
                <span className="text-slate-700 text-base leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-2xl px-6 py-5">
            <p className="text-[#1b1916] font-semibold text-base sm:text-lg">
              Every day you stay silent, someone else takes your clients
            </p>
          </div>
        </div>
      </section>

      {/* Real Results tabbed */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{background: "linear-gradient(135deg, #f0eeff 0%, #e8f4ff 50%, #f0eeff 100%)"}}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-200 text-violet-700 bg-white/70 tracking-[0.12em] uppercase shadow-sm">
              <span className="text-violet-500">&#9646;</span> Real LinkedIn Data
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1b1916] mb-2 tracking-tight">
              From invisible &#8594; to <span className="text-violet-600">inbound</span>
            </h2>
            <p className="text-slate-500 text-base mt-2">Consistent content. Real visibility. New opportunities.</p>
          </div>

          {/* Before / After cards */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6 relative">
            {/* BEFORE */}
            <div className="flex-1 bg-white/80 border border-red-100 rounded-2xl p-6 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest mb-5">Before</div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-lg">&#9998;</span>
                  <span className="text-slate-700">0&#8211;1 posts/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-lg">&#128065;</span>
                  <span className="text-slate-700">~200&#8211;500 views</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-lg">&#128100;</span>
                  <span className="text-slate-700">no inbound</span>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center z-10">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-violet-500 text-xl font-bold">&#8594;</div>
            </div>
            {/* AFTER */}
            <div className="flex-1 bg-white/80 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-5">After 2 Weeks</div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 text-lg">&#128197;</span>
                  <span className="text-slate-700 font-medium">7 posts/week</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 text-lg">&#128065;</span>
                  <span className="text-slate-700 font-medium">10,000+ views</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 text-lg">&#128172;</span>
                  <span className="text-slate-700 font-medium">5&#8211;15 inbound messages</span>
                </div>
              </div>
            </div>
          </div>

          {/* Callout */}
          <div className="bg-white/80 border border-violet-100 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm mb-8">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-600 text-xl">&#127919;</span>
            </div>
            <div>
              <div className="font-bold text-[#1b1916] text-base">One post can close a deal.</div>
              <div className="text-slate-500 text-sm">Visibility brings trust. Trust brings business.</div>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mb-4">Select a time period to see real analytics</p>

          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white border border-black/10 rounded-full p-1 gap-1 shadow-sm">
              {(["week", "month", "3months"] as const).map((tab) => {
                const label = tab === "week" ? "1 Week" : tab === "month" ? "1 Month" : "3 Months"
                return (
                  <button
                    key={tab}
                    onClick={() => setResultsTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      resultsTab === tab
                        ? "bg-[#1b1916] text-white shadow"
                        : "text-slate-500 hover:text-[#1b1916]"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6 sm:p-8">
            {resultsTab === "week" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#1b1916]">Content performance</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">7 days</span>
                </div>
                <div className="mt-3 mb-1">
                  <span className="text-4xl font-black text-[#1b1916]">1,367</span>
                  <span className="text-sm text-slate-500 ml-2">Impressions</span>
                </div>
                <div className="flex items-center gap-1 mb-5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 9L5 5.5L8 7.5L10 4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-emerald-600 text-xs font-bold">+1,354%</span>
                  <span className="text-slate-400 text-xs">vs. prior 7 days</span>
                </div>
                <div className="relative h-28 mb-5">
                  <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="33" x2="300" y2="33" stroke="#f1f5f9" strokeWidth="1"/>
                    <line x1="0" y1="66" x2="300" y2="66" stroke="#f1f5f9" strokeWidth="1"/>
                    <defs>
                      <linearGradient id="chartGradW" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 98 L40 96 L80 88 L120 70 L160 42 L200 25 L240 16 L300 8 L300 100 L0 100 Z" fill="url(#chartGradW)"/>
                    <path d="M0 98 L40 96 L80 88 L120 70 L160 42 L200 25 L240 16 L300 8" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="300" cy="8" r="4" fill="#0d9488"/>
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-1">
                    <span>Day 1</span><span>Day 3</span><span>Day 5</span><span>Day 7</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><div className="text-xl font-black text-[#1b1916]">1,367</div><div className="text-xs text-slate-500">Impressions</div></div>
                  <div><div className="text-xl font-black text-[#1b1916]">447</div><div className="text-xs text-slate-500">Members reached</div></div>
                  <div><div className="text-xl font-black text-emerald-600">7</div><div className="text-xs text-slate-500">Posts published</div></div>
                  <div><div className="text-xl font-black text-violet-600">+89%</div><div className="text-xs text-slate-500">Profile views</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0"><circle cx="8" cy="8" r="7" stroke="#059669" strokeWidth="1.5"/><path d="M8 5v3.5l2 1.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="text-xs text-emerald-700 font-semibold">0 min spent writing &#8212; fully automated</span>
                </div>
              </>
            )}

            {resultsTab === "month" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#1b1916]">Content performance</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">30 days</span>
                </div>
                <div className="mt-3 mb-1">
                  <span className="text-4xl font-black text-[#1b1916]">9,240</span>
                  <span className="text-sm text-slate-500 ml-2">Impressions</span>
                </div>
                <div className="flex items-center gap-1 mb-5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 9L5 5.5L8 7.5L10 4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-emerald-600 text-xs font-bold">+847%</span>
                  <span className="text-slate-400 text-xs">vs. prior month</span>
                </div>
                <div className="relative h-28 mb-5">
                  <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="33" x2="300" y2="33" stroke="#f1f5f9" strokeWidth="1"/>
                    <line x1="0" y1="66" x2="300" y2="66" stroke="#f1f5f9" strokeWidth="1"/>
                    <defs>
                      <linearGradient id="chartGradM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 95 L60 85 L120 68 L180 40 L240 20 L300 6 L300 100 L0 100 Z" fill="url(#chartGradM)"/>
                    <path d="M0 95 L60 85 L120 68 L180 40 L240 20 L300 6" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="300" cy="6" r="4" fill="#0d9488"/>
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-1">
                    <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><div className="text-xl font-black text-[#1b1916]">3,180</div><div className="text-xs text-slate-500">Members reached</div></div>
                  <div><div className="text-xl font-black text-emerald-600">28</div><div className="text-xs text-slate-500">Posts published</div></div>
                  <div><div className="text-xl font-black text-violet-600">+47</div><div className="text-xs text-slate-500">Inbound connections</div></div>
                  <div><div className="text-xl font-black text-violet-600">+312%</div><div className="text-xs text-slate-500">Profile views</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0"><circle cx="8" cy="8" r="7" stroke="#059669" strokeWidth="1.5"/><path d="M8 5v3.5l2 1.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="text-xs text-emerald-700 font-semibold">0 min spent writing &#8212; fully automated</span>
                </div>
              </>
            )}

            {resultsTab === "3months" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#1b1916]">Content performance</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">90 days</span>
                </div>
                <div className="mt-3 mb-1">
                  <span className="text-4xl font-black text-[#1b1916]">38,500</span>
                  <span className="text-sm text-slate-500 ml-2">Impressions</span>
                </div>
                <div className="flex items-center gap-1 mb-5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 9L5 5.5L8 7.5L10 4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-emerald-600 text-xs font-bold">+2,140%</span>
                  <span className="text-slate-400 text-xs">vs. prior 3 months</span>
                </div>
                <div className="relative h-28 mb-5">
                  <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="33" x2="300" y2="33" stroke="#f1f5f9" strokeWidth="1"/>
                    <line x1="0" y1="66" x2="300" y2="66" stroke="#f1f5f9" strokeWidth="1"/>
                    <defs>
                      <linearGradient id="chartGrad3M" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 97 L75 88 L150 62 L225 28 L300 4 L300 100 L0 100 Z" fill="url(#chartGrad3M)"/>
                    <path d="M0 97 L75 88 L150 62 L225 28 L300 4" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="300" cy="4" r="4" fill="#0d9488"/>
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-1">
                    <span>Month 1</span><span>Month 2</span><span>Month 3</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><div className="text-xl font-black text-[#1b1916]">12,400</div><div className="text-xs text-slate-500">Members reached</div></div>
                  <div><div className="text-xl font-black text-emerald-600">84</div><div className="text-xs text-slate-500">Posts published</div></div>
                  <div><div className="text-xl font-black text-violet-600">23</div><div className="text-xs text-slate-500">Inbound DMs / leads</div></div>
                  <div><div className="text-xl font-black text-violet-600">+890%</div><div className="text-xs text-slate-500">Profile views</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0"><circle cx="8" cy="8" r="7" stroke="#059669" strokeWidth="1.5"/><path d="M8 5v3.5l2 1.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="text-xs text-emerald-700 font-semibold">0 min spent writing &#8212; fully automated</span>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            * Based on real user data. Individual results may vary.
          </p>
          <p className="text-center text-xs text-slate-400 mt-1 italic">
            &#8212; K.S., Startup Founder (real account, shared with permission)
          </p>
        </div>
      </section>

      {/* Results / Outcomes */}
      <section id="results" className="px-4 sm:px-6 py-16 sm:py-28" style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0f0f23 50%, #0d1117 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-xs font-bold border border-violet-500/50 text-violet-400 bg-violet-500/10 tracking-[0.2em] uppercase">
              Results
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight tracking-tight">
              What consistent posting gets you:
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              LinkedIn rewards consistency &#8212; not effort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
                    +3.8x
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">profile views</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Professionals who post consistently get 3.8&#215; more profile views and 5&#215; more connection requests.
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-2 h-14 pt-2">
                <div className="flex-1 rounded-t-md bg-slate-700/60" style={{ height: "30%" }} />
                <div className="flex-1 rounded-t-md bg-slate-600/70" style={{ height: "50%" }} />
                <div className="flex-1 rounded-t-md bg-violet-500/60" style={{ height: "70%" }} />
                <div className="flex-1 rounded-t-md" style={{ height: "100%", background: "linear-gradient(180deg, #a78bfa, #7c3aed)" }} />
                <div className="text-xs text-slate-500 self-end pb-0.5 ml-1 whitespace-nowrap">You &#8594;</div>
              </div>
            </div>

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
                    +280%
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">inbound messages</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    A strong content presence turns cold outreach into warm conversations &#8212; before you even say hello.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="rounded-sm h-5 bg-pink-500/50" style={{ width: "90%" }} />
                <div className="rounded-sm h-5 bg-pink-500/35" style={{ width: "62%" }} />
                <div className="rounded-sm h-5 bg-pink-500/55" style={{ width: "36%" }} />
                <div className="text-xs text-slate-500 mt-1">Leads &#8594; Prospects &#8594; Clients</div>
              </div>
            </div>

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
                    More visibility
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">&#8594; more deals</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Thought leaders on LinkedIn receive 2.8&#215; more inbound partnership and collaboration requests.
                  </p>
                </div>
              </div>
              <div className="relative h-14 mt-1">
                <div className="absolute w-4 h-4 rounded-full bg-cyan-400" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                {[
                  { top: "10%", left: "20%" },
                  { top: "10%", left: "75%" },
                  { top: "75%", left: "12%" },
                  { top: "75%", left: "82%" },
                  { top: "40%", left: "88%" },
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

            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl sm:text-5xl font-black mb-1" style={{ background: "linear-gradient(90deg, #fcd34d, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Visibility
                  </div>
                  <div className="text-white font-semibold text-base leading-snug">&#8594; trust &#8594; clients</div>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    People buy from those they see often. Your LinkedIn is your digital first impression.
                  </p>
                </div>
              </div>
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

          <div className="text-center mt-12 sm:mt-16">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-violet-700/30"
            >
              Start attracting clients today
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-[#1b1916] leading-tight tracking-tight">
            LinkedIn rewards consistency &#8212; not effort
          </h2>
          <div className="space-y-4 mb-8 text-left max-w-xl mx-auto">
            {[
              "Posting daily = algorithm boost",
              "Visibility \u2192 trust \u2192 clients",
              "People buy from those they see often",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-violet-600 font-bold text-lg flex-shrink-0">&#10003;</span>
                <span className="text-slate-700 text-base leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="bg-[#1b1916] text-white text-sm font-semibold px-6 py-3 rounded-full">
              It&apos;s not about writing better
            </div>
            <div className="bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full">
              It&apos;s about showing up more
            </div>
          </div>
        </div>
      </section>

      {/* FOMO */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#07071a" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-red-500/40 text-red-400 bg-red-500/10 tracking-widest uppercase">
              The Hard Truth
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              While you stay silent,{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                someone else takes your deals
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
            {[
              { number: "99%", label: "of people don\u2019t post", sub: "yet the 1% who do capture all attention", source: "Buffer, 2025", sourceUrl: "https://buffer.com/resources/linkedin-statistics/" },
              { number: "1%", label: "capture all attention", sub: "the 1% who post consistently dominate their niche", source: "Foundation Inc, 2025", sourceUrl: "https://foundationinc.co/lab/b2b-marketing-linkedin-stats/" },
              { number: "100%", label: "buyers choose visible experts", sub: "people buy from those they see in their feed", source: "Edelman x LinkedIn, 2024", sourceUrl: "https://www.edelman.com/expertise/Business-Marketing/2024-b2b-thought-leadership-report" },
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

          <div className="rounded-2xl border border-red-500/20 p-5 sm:p-8 mb-8" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.02) 100%)" }}>
            <h3 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">Every week without posting, you miss:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[
                "inbound leads",
                "partnership opportunities",
                "visibility in your niche",
                "trust before the first message",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5 text-lg flex-shrink-0">&#10005;</span>
                  <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-red-300 text-sm font-semibold">Algorithm forgets inactive profiles</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <div className="bg-white/10 text-white text-sm font-semibold px-6 py-3 rounded-full text-center">
              You don&apos;t need to be better
            </div>
            <div className="bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-full text-center">
              You just need to show up
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={handleStartTrial}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-4 rounded-xl text-base font-semibold transition-all"
            >
              Start Free &#8212; No Credit Card
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-pink-100 text-pink-700 border-pink-200">Simple Setup</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1b1916]">Up and running in 3 minutes</h2>
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
              We don&apos;t help you &apos;grow&apos; &#8212;{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                we bring you inbound
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              One subscription. Daily posts. Real inbound leads.
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

      {/* Remove AI Fear */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-[#1b1916] leading-tight tracking-tight">
            This doesn&apos;t sound like AI
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Matches your tone",
              "Based on your profile &amp; niche",
              "No templates, no generic content",
              "People think you wrote it",
            ].map((item, i) => (
              <div key={i} className="bg-white border border-black/10 rounded-2xl px-6 py-4 flex items-center gap-3 text-left">
                <span className="text-violet-600 font-bold text-lg flex-shrink-0">&#10003;</span>
                <span className="text-[#1b1916] text-sm font-medium" dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Posts */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Real Output</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#1b1916]">
              See what AI writes for your audience
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
              Real posts, generated in seconds. Scheduled automatically. Clients come to you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md border border-black/8 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    AK
                  </div>
                  <div>
                    <div className="font-semibold text-[#1b1916] text-sm leading-tight">Alex Kim</div>
                    <div className="text-slate-400 text-xs">LinkedIn Member &#183; B2B Consultant</div>
                  </div>
                </div>
                <div className="text-[#1b1916] text-sm leading-relaxed space-y-2">
                  <p>I closed a $40k deal last month. The client messaged me first.</p>
                  <p>They&apos;d been reading my posts for 3 weeks. By the time they reached out, they were already sold.</p>
                  <p>Inbound is the new outbound. But only if you&apos;re visible.</p>
                </div>
                <div className="mt-3 text-violet-600 text-xs font-medium">#B2B #Consulting #LinkedInGrowth</div>
              </div>
              <div className="mx-5 mb-4 rounded-xl h-32 overflow-hidden">
                <img src="/landing-post-1.jpg" alt="Example post" className="w-full h-full object-cover" />
              </div>
              <div className="px-5 pb-4 flex items-center gap-4 border-t border-black/5 pt-3">
                <span className="text-slate-400 text-xs">&#128077; 63 likes</span>
                <span className="text-slate-400 text-xs">&#128172; 18 comments</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-black/8 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #db2777, #e11d48)" }}>
                    SR
                  </div>
                  <div>
                    <div className="font-semibold text-[#1b1916] text-sm leading-tight">Sofia Rodriguez</div>
                    <div className="text-slate-400 text-xs">LinkedIn Member &#183; Sales Director</div>
                  </div>
                </div>
                <div className="text-[#1b1916] text-sm leading-relaxed space-y-2">
                  <p>Cold outreach used to take 8 hours a week. Now my pipeline fills itself.</p>
                  <p>Posting consistently on LinkedIn turned my profile into a lead magnet. 3 inbound demo requests this week alone.</p>
                  <p>You don&apos;t need more cold calls. You need more visibility.</p>
                </div>
                <div className="mt-3 text-pink-600 text-xs font-medium">#Sales #LeadGeneration #LinkedIn</div>
              </div>
              <div className="mx-5 mb-4 rounded-xl h-32 overflow-hidden">
                <img src="/landing-post-2.jpg" alt="Example post" className="w-full h-full object-cover" />
              </div>
              <div className="px-5 pb-4 flex items-center gap-4 border-t border-black/5 pt-3">
                <span className="text-slate-400 text-xs">&#128077; 147 likes</span>
                <span className="text-slate-400 text-xs">&#128172; 29 comments</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-black/8 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #0891b2, #0284c7)" }}>
                    MT
                  </div>
                  <div>
                    <div className="font-semibold text-[#1b1916] text-sm leading-tight">Marcus Taylor</div>
                    <div className="text-slate-400 text-xs">LinkedIn Member &#183; Agency Owner</div>
                  </div>
                </div>
                <div className="text-[#1b1916] text-sm leading-relaxed space-y-2">
                  <p>My agency doubled its retainer clients in 6 months. Zero paid ads.</p>
                  <p>The only thing that changed: I started posting on LinkedIn every day. Decision-makers saw my thinking before they ever got on a call.</p>
                  <p>Content is the best sales call you never have to make.</p>
                </div>
                <div className="mt-3 text-cyan-600 text-xs font-medium">#Agency #ClientAcquisition #ContentMarketing</div>
              </div>
              <div className="mx-5 mb-4 rounded-xl h-32 overflow-hidden">
                <img src="/landing-post-3.jpg" alt="Example post" className="w-full h-full object-cover" />
              </div>
              <div className="px-5 pb-4 flex items-center gap-4 border-t border-black/5 pt-3">
                <span className="text-slate-400 text-xs">&#128077; 88 likes</span>
                <span className="text-slate-400 text-xs">&#128172; 16 comments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#faf9f7" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            <div className="w-full md:w-2/5 flex-shrink-0">
              <img
                src="/founder-kiryl.jpg"
                alt="Kiryl Sidarchuk"
                className="rounded-2xl object-cover w-full shadow-lg"
                style={{ height: "400px" }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-violet-600 mb-3">From the Founder</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1b1916] mb-6 leading-snug">
                Built by an entrepreneur, for entrepreneurs
              </h2>
              <div className="space-y-4 text-slate-600 text-base leading-relaxed mb-6">
                <p className="text-lg italic text-[#1b1916]">
                  &ldquo;I built this because staying visible on LinkedIn felt like a second job. Now it runs on autopilot.&rdquo;
                </p>
              </div>
              <p className="text-lg font-bold text-[#1b1916]">Kiryl Sidarchuk</p>
              <p className="text-violet-600 font-semibold text-sm mb-4">Serial IT Entrepreneur &#183; 3&#215; Founder &#183; Exit in 2022 &#183; Angel Investor</p>
              <a
                href="https://www.linkedin.com/in/kiryl-sidarchuk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{ color: "#0a66c2" }}
              >
                Connect on LinkedIn &#8594;
              </a>
              <div className="mt-3">
                <a href="#pricing" className="text-sm text-violet-600 underline underline-offset-2 hover:text-violet-500 transition-colors">
                  See pricing and start free &#8594;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">One client pays for years of this tool</h2>
            <p className="text-slate-600 text-lg">No upsells. No tiers. Just inbound leads.</p>
          </div>

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
              <CardTitle className="text-[#1b1916] text-2xl">Client Acquisition Autopilot</CardTitle>
              <p className="text-slate-500 text-sm mt-1">Everything you need to get inbound leads from LinkedIn</p>
              <div className="flex items-end gap-1 mt-4 justify-center">
                <span className="text-6xl font-extrabold text-[#1b1916]">{annual ? "$24" : "$29"}</span>
                <span className="text-slate-500 mb-2 text-lg">/month</span>
              </div>
              {annual && (
                <>
                  <p className="text-sm text-green-600 font-medium mt-1">Billed $288/year &#183; Save $60</p>
                  <p className="text-xs text-slate-500 mt-1">7-day money-back guarantee &#8212; cancel anytime</p>
                </>
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
                {annual ? "Start Annual Plan" : "Start Free \u2014 No Card"}
              </Button>
              <p className="text-center text-xs text-slate-500">Cancel anytime</p>
              <ul className="space-y-3 pt-2">
                {[
                  "7 AI-written posts per week",
                  "Custom images",
                  "Auto-posting at peak time",
                  "Profile-based personalization",
                  "Edit anytime",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-violet-600 font-bold text-base">&#10003;</span>
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
                    &#9660;
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
            Ready to get clients from LinkedIn &#8212;{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              without posting?
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8 sm:mb-10">
            Join professionals who turned visibility into inbound.
          </p>
          <Button
            size="lg"
            onClick={handleStartTrial}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto"
          >
            Generate My First Post &#8212; 30 sec &#8594;
          </Button>
          <p className="mt-4 text-xs sm:text-sm text-slate-500">No signup required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <p>
          &#169; 2026 ItGrows.ai. All rights reserved. &#183;{" "}
          <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy Policy</Link>
          {" "}&#183;{" "}
          <Link href="/terms" className="hover:text-[#1b1916] transition-colors">Terms of Service</Link>
        </p>
        <p className="mt-2 text-xs text-slate-400">Magiscan Inc. &#183; 919 North Market Street, Wilmington, DE 19801, USA</p>
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
