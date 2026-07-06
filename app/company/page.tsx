"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const LinkedInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="white" className={className}><path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
)
const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="white" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
)

const companyFaqs = [
  {
    q: "Can you really auto-publish to our company's LinkedIn Page?",
    a: "Yes. ItGrows is approved by LinkedIn for the Community Management API — the official, vetted access that lets us publish to Company Pages on your behalf. Most AI content tools never get this approval, so they can only touch personal profiles. Your company's X account is included in every plan too — we run it on the same autopilot.",
    defaultOpen: true,
  },
  {
    q: "Is this against LinkedIn's or X's Terms of Service?",
    a: "No. We use official, approved APIs from both platforms — the same standards behind Buffer, Hootsuite, and Sprout Social. No password sharing, no browser hacks, no risk to your accounts.",
    defaultOpen: true,
  },
  {
    q: "Who controls what gets posted?",
    a: "You do. Every post lands in an approval queue first — edit, reschedule, or delete before it goes live. Once you trust the output, switch on full autopilot. You can revoke access at any time.",
  },
  {
    q: "Can it manage our team's personal accounts too?",
    a: "Yes — your founders' and executives' personal LinkedIn & X accounts plus the company's accounts, all in one place, each in its own voice. That is what the All-in plan is built for.",
  },
  {
    q: "Do we need a credit card to start?",
    a: "You add a card to start your 14-day free trial, but you're not charged until it ends. Cancel anytime before then from your dashboard and you pay nothing.",
  },
]

export default function CompanyPage() {
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Company ghost generator — the interactive "aha" hook, mirrored from the personal landing.
  const [coWhatYouDo, setCoWhatYouDo] = useState("")
  const [coLoading, setCoLoading] = useState(false)
  const [coPosts, setCoPosts] = useState<string[]>([])
  const [coImages, setCoImages] = useState<(string | null)[]>([])
  const [coError, setCoError] = useState("")
  const [coProgress, setCoProgress] = useState(0)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => { if (data?.user?.id) setSessionUser(data.user) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!coLoading) { setCoProgress(0); return }
    const id = setInterval(() => setCoProgress((p) => p + 1), 2600)
    return () => clearInterval(id)
  }, [coLoading])

  async function handleCompanyGenerate() {
    if (coWhatYouDo.trim().length < 5) return
    const thoughts = `Our company: ${coWhatYouDo}.`
    setCoLoading(true); setCoError(""); setCoPosts([]); setCoImages([])
    try {
      const res = await fetch("/api/public/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thoughts, mode: "company" }),
      })
      const data = await res.json() as { posts?: string[]; images?: (string | null)[]; error?: string }
      if (data.posts && data.posts.length > 0) {
        setCoPosts(data.posts)
        setCoImages(data.images ?? [])
        try {
          localStorage.setItem("itgrows_ghost_handoff", JSON.stringify({
            brief: { niche: coWhatYouDo, tone: "professional", goals: "Grow company brand", companyName: coWhatYouDo },
            posts: data.posts, images: data.images ?? [], mode: "company", ts: Date.now(),
          }))
        } catch { /* non-fatal */ }
      } else if (res.status === 429) {
        setCoError("You've used your 2 free previews. Start a free trial to generate unlimited posts.")
      } else {
        setCoError("Our AI is busy right now — please try again in a moment.")
      }
    } catch {
      setCoError("Something went wrong. Try again.")
    } finally {
      setCoLoading(false)
    }
  }

  async function handleCompanyPlan(tier: "single" | "two" | "unlimited") {
    try {
      const sres = await fetch("/api/auth/session")
      const sdata = await sres.json() as { user?: { id: string } }
      if (!sdata?.user?.id) { window.location.href = "/signup"; return }
      const r = await fetch("/api/stripe/company-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const j = await r.json() as { url?: string; error?: string }
      if (j.url) window.location.href = j.url
      else window.location.href = "/cabinet"
    } catch {
      window.location.href = "/signup"
    }
  }

  return (
    <div className="min-h-screen text-[#1b1916] scroll-smooth" style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-50" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">How It Works</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</a>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {sessionUser ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(sessionUser.name || sessionUser.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600 max-w-[140px] truncate">{sessionUser.name || sessionUser.email}</span>
                </div>
                <Link href="/cabinet"><Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Cabinet →</Button></Link>
              </>
            ) : (
              <>
                <Link href="/login?callbackUrl=/cabinet"><Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button></Link>
                <Link href="/signup"><Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Try Free</Button></Link>
              </>
            )}
          </div>
          <button className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-black/5 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#1b1916] transition-all duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/10 mt-4 pt-4 pb-2 flex flex-col gap-1">
            <a href="#how" className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/blog" className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:bg-black/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <div className="border-t border-black/10 mt-2 pt-3 flex flex-col gap-2">
              {sessionUser ? (
                <Link href="/cabinet" onClick={() => setMobileMenuOpen(false)}><Button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm">Cabinet →</Button></Link>
              ) : (
                <>
                  <Link href="/login?callbackUrl=/cabinet" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" className="w-full text-sm border-black/20">Login</Button></Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}><Button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm">Try Free</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-14 sm:pt-20 pb-14 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          {/* Persona switcher */}
          <div className="inline-flex items-center gap-1 mb-6 p-1 rounded-full border border-violet-200 bg-white shadow-sm">
            <Link href="/" className="px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-[#1b1916] transition-colors">For me — Personal</Link>
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-violet-600 text-white">For my company</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            Put your company on LinkedIn &amp; X —
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">on autopilot</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            ItGrows writes and publishes on-brand posts to your <span className="text-violet-600 font-semibold">company&apos;s LinkedIn Page</span> and X account — daily, in <span className="text-violet-600 font-semibold">your brand voice</span>. Your team&apos;s personal accounts too. <span className="text-violet-600 font-semibold">You approve</span>, or go full autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/signup"><Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-9 py-4 text-base sm:text-lg rounded-xl font-semibold shadow-lg shadow-violet-600/30">Start 14-day free trial</Button></Link>
            <a href="#how"><Button size="lg" variant="ghost" className="text-slate-600 hover:text-[#1b1916] px-6 py-4 text-base rounded-xl">See how it works</Button></a>
          </div>
          <div className="mt-5 flex flex-wrap justify-center items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-violet-900 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 shadow-sm">🛡️ Approved by LinkedIn — official API</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-black/10 rounded-full px-3 py-1.5"><span className="text-green-600">✓</span> Cancel anytime</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-black/10 rounded-full px-3 py-1.5"><span className="text-green-600">✓</span> You approve every post</span>
          </div>

          {/* Company ghost generator */}
          <div className="mt-10 max-w-3xl mx-auto text-left">
            <div className="bg-[#f8f7f6] border border-black/10 rounded-2xl p-5 sm:p-6">
              <p className="text-sm font-semibold text-[#1b1916] mb-1">See a post for your company — in your brand voice</p>
              <p className="text-xs text-slate-500 mb-4">One line about what your company does. No signup.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={coWhatYouDo}
                  onChange={(e) => setCoWhatYouDo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCompanyGenerate() }}
                  placeholder="e.g. We build fractional-CFO software for Series A startups"
                  className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  onClick={handleCompanyGenerate}
                  disabled={coLoading || coWhatYouDo.trim().length < 5}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {coLoading ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>) : "Generate posts →"}
                </button>
              </div>

              {coLoading && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-violet-600 font-medium flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                    {["Studying your brand…", "Writing your first company post…", "Writing a point-of-view post…", "Designing matching cover images…", "Almost there — polishing…"][Math.min(coProgress, 4)]}
                  </p>
                  {[0, 1].map((i) => (
                    <div key={i} className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-200" />
                        <div className="space-y-1.5"><div className="h-3 w-28 bg-slate-200 rounded" /><div className="h-2.5 w-16 bg-slate-100 rounded" /></div>
                      </div>
                      <div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-full" /><div className="h-3 bg-slate-200 rounded w-11/12" /><div className="h-3 bg-slate-100 rounded w-4/5" /></div>
                    </div>
                  ))}
                </div>
              )}

              {coError && (
                coError.includes("free previews") ? (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-center">
                    <p className="text-sm font-semibold text-[#1b1916] mb-2">You&apos;ve seen a taste — get unlimited posts, published daily.</p>
                    <Link href="/signup"><Button className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm">Start 14 days free →</Button></Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">{coError}</p>
                )
              )}

              {coPosts.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* First post — shown in full to prove the quality */}
                  <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                    {coImages[0] && (<img src={coImages[0]!} alt="Post cover" className="w-full h-48 object-cover" />)}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">Co</div>
                        <div><div className="font-semibold text-sm text-[#1b1916]">Your Company</div><div className="text-xs text-slate-400">LinkedIn Page · Just now</div></div>
                      </div>
                      <p className="text-sm text-[#1b1916] whitespace-pre-wrap leading-relaxed">{coPosts[0]}</p>
                    </div>
                  </div>

                  {/* Remaining posts — shown in FULL too (no blur). Keep the "see your posts,
                      no signup" promise honestly; signup is for auto-publishing them daily. */}
                  {coPosts.slice(1).map((post, i) => (
                    <div key={i} className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                      {coImages[i + 1] && (<img src={coImages[i + 1]!} alt="Post cover" className="w-full h-48 object-cover" />)}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">Co</div>
                          <div><div className="font-semibold text-sm text-[#1b1916]">Your Company</div><div className="text-xs text-slate-400">LinkedIn Page · Just now</div></div>
                        </div>
                        <p className="text-sm text-[#1b1916] whitespace-pre-wrap leading-relaxed">{post}</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl p-6 sm:p-8 text-center text-white">
                    <div className="text-2xl font-extrabold mb-2">These are yours — want them on your company page every day?</div>
                    <p className="text-white/80 text-sm mb-1">You just saw them free, no signup. Sign up to auto-write &amp; publish posts like these daily to your company&apos;s LinkedIn &amp; X — on autopilot.</p>
                    <p className="text-white/70 text-xs mb-5">✓ 14-day free trial · Cancel anytime &nbsp;·&nbsp; ✓ These posts are saved — waiting in your dashboard.</p>
                    <Link href="/signup"><Button className="bg-white text-violet-600 font-bold text-sm hover:bg-violet-50">Get 14 days free →</Button></Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Moat banner */}
          <div className="mt-10 max-w-2xl mx-auto flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-5 py-4 text-left">
            <svg className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p className="text-sm text-violet-900 leading-relaxed"><span className="font-semibold">Approved by LinkedIn to auto-publish to Company Pages.</span> That access is vetted and takes weeks to get — most AI content tools don&apos;t have it. We do.</p>
          </div>

          {/* Product visual */}
          <div className="mt-12 max-w-4xl mx-auto">
            <img src="/company-hero.jpg" alt="ItGrows keeps your company's social accounts active automatically" className="w-full rounded-3xl border border-black/10 shadow-2xl shadow-violet-300/40" />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-4 sm:px-6 py-14 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Your whole brand presence, <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">managed in one place</span></h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">The company&apos;s accounts and your team&apos;s personal accounts — all on autopilot, each in its own voice.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-3">
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-full">
                <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                LinkedIn-approved
              </span>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A66C2, #0077b6)" }}><LinkedInIcon /></div>
              <div className="font-bold text-base">LinkedIn — Company Page</div>
              <p className="text-slate-600 text-sm leading-relaxed">Auto-publish to your official Company Page via LinkedIn&apos;s approved Community Management API. We/Our brand voice, not I/My.</p>
            </div>
            <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-black"><XIcon /></div>
              <div className="font-bold text-base">X — Company</div>
              <p className="text-slate-600 text-sm leading-relaxed">Keep your brand&apos;s X account active with daily, on-brand posts — scheduled and published automatically.</p>
            </div>
            <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-pink-500"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div className="font-bold text-base">Your team&apos;s personal accounts</div>
              <p className="text-slate-600 text-sm leading-relaxed">Founders and executives post consistently on their own LinkedIn &amp; X — each in their own voice, amplifying the brand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 sm:px-6 py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest text-violet-500 uppercase bg-violet-50 px-4 py-1.5 rounded-full mb-4">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold">Live in under <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">10 minutes</span></h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg max-w-xl mx-auto">No agency retainer. No content calendar. No blank screen on Monday morning.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: "1", t: "Connect your accounts", d: "Securely connect your company's LinkedIn Page, X, and your team's accounts via official OAuth. Under 10 minutes." },
              { n: "2", t: "Set your brand voice", d: "Tell ItGrows your positioning, topics, and tone. It builds a brand voice profile — on-brand, not generic AI." },
              { n: "3", t: "Approve or autopilot", d: "Posts publish on schedule to every account. Review in the queue, or switch on full autopilot once you trust it." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center mb-5"><span className="text-violet-600 font-bold text-lg">{s.n}</span></div>
                <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why companies */}
      <section className="px-4 sm:px-6 py-14 sm:py-20" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Why ItGrows <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">beats an agency</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18.6M7 6h1v4M16.71 13.88l.7.7-2.83 2.83" strokeLinecap="round" strokeLinejoin="round"/></svg>, t: "A fraction of an agency", d: "A social agency runs $2,000+/mo. ItGrows keeps every account active for less than a single day of that." },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>, t: "Official & safe", d: "Approved LinkedIn & X APIs. No password sharing, no automation hacks that get accounts flagged." },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 3l2.1 4.9L19 9l-4.9 2.1L12 16l-2.1-4.9L5 9l4.9-1.1z" strokeLinecap="round" strokeLinejoin="round"/></svg>, t: "Always on-brand", d: "A dedicated brand voice profile keeps the company tone consistent — separate from each person's voice." },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>, t: "Your people amplify", d: "Company Page plus your founders and execs posting together — the reach that single accounts can't match." },
            ].map((b) => (
              <div key={b.t} className="bg-white rounded-2xl border border-black/10 p-6 hover:border-violet-300 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-4 text-white">{b.icon}</div>
                <h3 className="font-bold mb-2">{b.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOMO / outcome */}
      <section className="px-4 sm:px-6 py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-3">While you wait</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 leading-tight">Your competitors&apos; brands post every day. Does yours?</h2>
          <p className="text-lg text-white/85 max-w-2xl mx-auto mb-10">Buyers, partners, and talent size up a company by how alive it looks online. Silence reads as &ldquo;stalled&rdquo; — and the deal goes to the brand that showed up.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            <div className="rounded-2xl p-5 bg-white/10 border border-white/15">
              <div className="text-2xl mb-2">🟢</div>
              <h3 className="font-bold mb-1">Always-on presence</h3>
              <p className="text-sm text-white/75">Your brand looks alive and active — every single day.</p>
            </div>
            <div className="rounded-2xl p-5 bg-white/10 border border-white/15">
              <div className="text-2xl mb-2">📣</div>
              <h3 className="font-bold mb-1">Your whole team amplifies</h3>
              <p className="text-sm text-white/75">Founders + execs + Company Page = reach rivals can&apos;t match.</p>
            </div>
            <div className="rounded-2xl p-5 bg-white/10 border border-white/15">
              <div className="text-2xl mb-2">🤝</div>
              <h3 className="font-bold mb-1">Credibility that converts</h3>
              <p className="text-sm text-white/75">Show up where deals and hires are decided.</p>
            </div>
          </div>
          <Link href="/signup"><Button size="lg" className="bg-white text-violet-700 hover:bg-white/90 px-9 py-4 text-base sm:text-lg rounded-xl font-bold shadow-lg">Put your brand on autopilot — start free</Button></Link>
          <p className="text-sm text-white/70 mt-4">Every silent week is momentum handed to a competitor. Start today.</p>
        </div>
      </section>

      {/* Pricing callout */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-5xl mx-auto text-center">
          {/* Cost comparison: agency vs ItGrows (company) */}
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-violet-600 mb-2">The math is simple</p>
            <h3 className="text-center text-2xl sm:text-3xl font-bold text-[#1b1916] mb-8">Replace a $3,000/mo agency with <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">$99/mo</span></h3>
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
              <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-[#1b1916] text-white items-center justify-center font-extrabold text-sm shadow-lg">VS</div>
              <div className="bg-slate-50 rounded-2xl border border-black/10 p-6 sm:p-7">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Hiring an agency</div>
                <ul className="space-y-2.5 text-sm text-slate-500">
                  <li className="flex justify-between"><span>Social media agency</span><span className="font-semibold text-slate-600">$2,000+/mo</span></li>
                  <li className="flex justify-between"><span>Content &amp; design</span><span className="font-semibold text-slate-600">$1,000+/mo</span></li>
                  <li className="flex items-center gap-2 pt-1"><span className="text-red-400 font-bold">✕</span> Slow approvals &amp; handoffs</li>
                  <li className="flex items-center gap-2"><span className="text-red-400 font-bold">✕</span> Generic — not your brand voice</li>
                </ul>
                <div className="mt-5 pt-3 border-t border-black/10 flex justify-between items-end">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-3xl font-extrabold text-slate-400 line-through decoration-red-400/70 decoration-2">$3,000+<span className="text-base font-medium">/mo</span></span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border-2 border-violet-500 p-6 sm:p-7 relative shadow-xl shadow-violet-300/40">
                <div className="absolute -top-3 right-5 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Save $2,900+/mo</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-4">With ItGrows</div>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-violet-600 font-bold">✓</span> Company Page &amp; X on autopilot</li>
                  <li className="flex items-center gap-2"><span className="text-violet-600 font-bold">✓</span> Approved by LinkedIn — official API</li>
                  <li className="flex items-center gap-2"><span className="text-violet-600 font-bold">✓</span> On-brand, in your company voice</li>
                  <li className="flex items-center gap-2"><span className="text-violet-600 font-bold">✓</span> 14-day free trial · Cancel anytime</li>
                </ul>
                <div className="mt-5 pt-3 border-t border-violet-100 flex justify-between items-end">
                  <span className="text-sm text-slate-500">From</span>
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">$99<span className="text-base font-medium text-slate-400">/mo</span></span>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Pricing for your <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">company</span></h2>
          <p className="text-slate-600 text-base mb-10">Run your company&apos;s LinkedIn Page and X account on autopilot — pick how many companies.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left items-stretch">
            <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-1">Single</div>
              <div className="flex items-end gap-1 mb-2"><span className="text-4xl font-extrabold">$99</span><span className="text-slate-500 mb-1">/mo</span></div>
              <p className="text-slate-600 text-sm mb-6 flex-1">One company — LinkedIn Company Page + X account, fully automated.</p>
              <Button onClick={() => handleCompanyPlan("single")} className="w-full bg-white border border-violet-300 text-violet-700 hover:bg-violet-50 py-3 rounded-xl font-semibold">Start free trial</Button>
            </div>
            <div className="relative bg-white rounded-2xl border-2 border-violet-400 p-6 flex flex-col shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Best value</div>
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-1">Two pages</div>
              <div className="flex items-end gap-1 mb-2"><span className="text-4xl font-extrabold">$149</span><span className="text-slate-500 mb-1">/mo</span></div>
              <p className="text-slate-600 text-sm mb-6 flex-1">Two companies — LinkedIn Page + X each. Less than two singles.</p>
              <Button onClick={() => handleCompanyPlan("two")} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-semibold">Start free trial</Button>
            </div>
            <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-1">Unlimited</div>
              <div className="flex items-end gap-1 mb-2"><span className="text-4xl font-extrabold">$299</span><span className="text-slate-500 mb-1">/mo</span></div>
              <p className="text-slate-600 text-sm mb-6 flex-1">Any number of companies — LinkedIn Page + X each, one flat price.</p>
              <Button onClick={() => handleCompanyPlan("unlimited")} className="w-full bg-white border border-violet-300 text-violet-700 hover:bg-violet-50 py-3 rounded-xl font-semibold">Start free trial</Button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-8">14-day free trial · Cancel anytime · Want your team&apos;s personal accounts too? <Link href="/#pricing" className="text-violet-600 font-semibold hover:text-violet-500">See All-in &amp; personal plans →</Link></p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-violet-700">Frequently asked questions</h2>
          <div className="flex flex-col gap-3">
            {companyFaqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-semibold text-[#1b1916]">{f.q}</span>
                  <span className="text-violet-600 text-xl flex-shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 text-center" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Your company should be posting. <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">Today.</span></h2>
          <p className="text-slate-600 text-base sm:text-lg mb-8">Set up your brand voice once. ItGrows keeps every account active — on autopilot.</p>
          <Link href="/signup"><Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 text-lg rounded-xl font-semibold shadow-lg shadow-violet-600/30">Start 14-day free trial</Button></Link>
        </div>
      </section>

      {/* Footer */}
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
