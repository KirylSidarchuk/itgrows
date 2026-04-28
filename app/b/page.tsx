"use client"

import { useState } from "react"
import Link from "next/link"

// LinkedIn Analytics SVG Mockup
const LinkedInAnalyticsMockup = () => (
  <svg viewBox="0 0 480 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
    <rect width="480" height="220" rx="12" fill="#ffffff" />
    {/* Header */}
    <rect width="480" height="44" rx="12" fill="#f9fafb" />
    <rect x="0" y="32" width="480" height="12" fill="#f9fafb" />
    <circle cx="22" cy="22" r="10" fill="#0077b5" />
    <text x="22" y="27" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" fontFamily="sans-serif">in</text>
    <text x="42" y="27" fontSize="11" fill="#0f0f0f" fontWeight="600" fontFamily="sans-serif">Post Analytics</text>
    {/* Stat boxes */}
    <rect x="16" y="56" width="96" height="56" rx="8" fill="#f3f4f6" />
    <text x="64" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f0f0f" fontFamily="sans-serif">1,367</text>
    <text x="64" y="98" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Impressions</text>
    <rect x="124" y="56" width="96" height="56" rx="8" fill="#f3f4f6" />
    <text x="172" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f0f0f" fontFamily="sans-serif">84</text>
    <text x="172" y="98" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Reactions</text>
    <rect x="232" y="56" width="96" height="56" rx="8" fill="#f3f4f6" />
    <text x="280" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f0f0f" fontFamily="sans-serif">23</text>
    <text x="280" y="98" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Comments</text>
    <rect x="340" y="56" width="96" height="56" rx="8" fill="#f3f4f6" />
    <text x="388" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f0f0f" fontFamily="sans-serif">6.1%</text>
    <text x="388" y="98" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Eng. Rate</text>
    {/* Chart bars */}
    <text x="16" y="132" fontSize="9" fill="#9ca3af" fontFamily="sans-serif">Impressions over 7 days</text>
    {[
      { x: 16, h: 32, day: "M" },
      { x: 76, h: 52, day: "T" },
      { x: 136, h: 44, day: "W" },
      { x: 196, h: 68, day: "T" },
      { x: 256, h: 48, day: "F" },
      { x: 316, h: 56, day: "S" },
      { x: 376, h: 40, day: "S" },
    ].map((bar) => (
      <g key={bar.day}>
        <rect x={bar.x} y={196 - bar.h} width="44" height={bar.h} rx="4" fill="#7c3aed" opacity="0.75" />
        <text x={bar.x + 22} y="212" textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="sans-serif">{bar.day}</text>
      </g>
    ))}
  </svg>
)

export default function LandingPageB() {
  const [ghostThoughts, setGhostThoughts] = useState("")
  const [ghostLoading, setGhostLoading] = useState(false)
  const [ghostPosts, setGhostPosts] = useState<string[]>([])
  const [ghostImages, setGhostImages] = useState<(string | null)[]>([])
  const [ghostError, setGhostError] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
        setGhostError("You've used your 2 free previews. Sign up →")
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

  const faqs = [
    {
      q: "Is my LinkedIn account safe?",
      a: "Yes. We use LinkedIn's official OAuth — the same secure standard used by tools like Salesforce and HubSpot. You log in directly on LinkedIn's website. We never see or store your password, and you can revoke access from your LinkedIn settings at any time.",
    },
    {
      q: "How does it actually work?",
      a: "You fill a short brief about yourself — your role, audience, and goals. Our AI writes 7 LinkedIn posts per week in your voice, generates matching cover images, and schedules everything to publish at peak engagement time. Zero writing time on your end.",
    },
    {
      q: "What happens after the trial?",
      a: "After 7 days, your scheduled posts pause. You'll see a simple prompt to subscribe — monthly ($15/mo) or annual ($144/yr). No charges during the trial, no surprises. Cancel anytime from account settings.",
    },
  ]

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#ffffff", color: "#0f0f0f", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* ── NAV ── */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-lg font-bold tracking-tight" style={{ color: "#0f0f0f" }}>
          ItGrows
        </Link>
        <Link href="/login?callbackUrl=/cabinet" className="text-sm font-medium" style={{ color: "#6b7280" }}>
          Sign in
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="px-6 pt-12 pb-16 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="mb-6">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}
          >
            No signup required
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-5"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          Your LinkedIn posts,
          <br />
          written by AI.
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: "#6b7280", maxWidth: "540px" }}>
          Type 2–3 sentences about yourself. Get 3 ready-to-post LinkedIn posts in 30 seconds.
        </p>

        {/* ── INLINE GHOST MODE DEMO ── */}
        <div className="w-full">
          <textarea
            value={ghostThoughts}
            onChange={(e) => setGhostThoughts(e.target.value)}
            placeholder="I'm a [role] who helps [audience] with [what you do]..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-base resize-none outline-none transition-all"
            style={{
              border: "1.5px solid #e5e7eb",
              backgroundColor: "#fafafa",
              color: "#0f0f0f",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)" }}
          />
          <button
            onClick={handleGhostGenerate}
            disabled={ghostLoading || ghostThoughts.trim().length < 10}
            className="mt-3 w-full md:w-auto px-7 py-3.5 rounded-xl font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: ghostLoading || ghostThoughts.trim().length < 10
                ? "#a78bfa"
                : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow: ghostLoading || ghostThoughts.trim().length < 10 ? "none" : "0 4px 14px rgba(124,58,237,0.35)",
            }}
          >
            {ghostLoading ? "Generating…" : "Generate My Posts →"}
          </button>

          {/* Social proof */}
          <p className="mt-4 text-sm" style={{ color: "#9ca3af" }}>
            2,400+ professionals already using ItGrows
          </p>

          {/* Error */}
          {ghostError && (
            <div className="mt-4 text-sm font-medium" style={{ color: "#dc2626" }}>
              {ghostError.includes("Sign up") ? (
                <>
                  {"You've used your 2 free previews. "}
                  <Link href="/signup" style={{ color: "#7c3aed", textDecoration: "underline" }}>Sign up →</Link>
                </>
              ) : ghostError}
            </div>
          )}
        </div>
      </section>

      {/* ── GENERATED RESULTS ── */}
      {ghostPosts.length > 0 && (
        <section className="px-6 pb-20 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ghostPosts.map((post, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                {/* Post image */}
                {ghostImages[i] ? (
                  <img
                    src={ghostImages[i]!}
                    alt={`Post ${i + 1} cover`}
                    className="w-full object-cover"
                    style={{ height: "140px" }}
                  />
                ) : (
                  <div
                    className="w-full flex items-center justify-center"
                    style={{ height: "140px", background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" }}
                  >
                    <span style={{ fontSize: "28px" }}>✨</span>
                  </div>
                )}
                {/* Post text */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#374151", whiteSpace: "pre-wrap" }}>
                    {post.length > 220 ? post.slice(0, 220) + "…" : post}
                  </p>
                  <button
                    onClick={handleStartTrial}
                    className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
                  >
                    Start Free Trial to Publish This
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm" style={{ color: "#9ca3af" }}>
            7-day free trial · No credit card
          </p>
        </section>
      )}

      {/* ── SOCIAL PROOF STAT ── */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{ backgroundColor: "#fafafa", border: "1.5px solid #f3f4f6" }}
        >
          <div className="mb-8">
            <p
              className="text-6xl md:text-7xl font-extrabold tracking-tight mb-2"
              style={{ color: "#0f0f0f", letterSpacing: "-0.04em" }}
            >
              1,367
            </p>
            <p className="text-lg font-medium" style={{ color: "#6b7280" }}>
              impressions in the first week, zero writing time
            </p>
          </div>
          <LinkedInAnalyticsMockup />
          <p className="mt-5 text-sm" style={{ color: "#9ca3af" }}>
            — K.S., Startup Founder
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="px-6 py-20 max-w-3xl mx-auto" id="pricing">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-12 text-center"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          One plan. Everything included.
        </h2>

        <div
          className="rounded-2xl p-8 md:p-10 max-w-md mx-auto"
          style={{ border: "2px solid #7c3aed", boxShadow: "0 8px 32px rgba(124,58,237,0.12)" }}
        >
          <div className="mb-6">
            <span
              className="text-5xl font-extrabold tracking-tight"
              style={{ color: "#0f0f0f", letterSpacing: "-0.04em" }}
            >
              $15
            </span>
            <span className="text-xl font-medium ml-1" style={{ color: "#6b7280" }}> / month</span>
            <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>or $144/year <span style={{ color: "#7c3aed", fontWeight: 600 }}>(save 20%)</span></p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "7 AI-written posts per week",
              "AI cover images for each post",
              "Auto-scheduled publishing",
              "LinkedIn profile optimization",
              "Cancel anytime",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium" style={{ color: "#374151" }}>
                <span style={{ color: "#7c3aed", fontSize: "16px", flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={handleStartTrial}
            className="w-full py-4 rounded-xl font-bold text-base text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            Start 7-Day Free Trial →
          </button>

          <p className="mt-3 text-center text-xs" style={{ color: "#9ca3af" }}>
            No credit card required to start
          </p>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-8 tracking-tight"
          style={{ color: "#0f0f0f", letterSpacing: "-0.02em" }}
        >
          Questions
        </h2>

        <div className="space-y-1">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ border: "1.5px solid #f3f4f6" }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                style={{
                  backgroundColor: openFaq === i ? "#fafafa" : "#ffffff",
                  color: "#0f0f0f",
                }}
              >
                <span className="font-medium text-sm">{faq.q}</span>
                <span
                  className="ml-4 text-lg transition-transform duration-200 flex-shrink-0"
                  style={{
                    color: "#7c3aed",
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 pt-1">
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-6 py-8 border-t"
        style={{ borderColor: "#f3f4f6" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            © 2026 ItGrows
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm transition-colors" style={{ color: "#9ca3af" }}>
              Privacy
            </Link>
            <Link href="/terms" className="text-sm transition-colors" style={{ color: "#9ca3af" }}>
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
