"use client"

import { useState } from "react"
import Link from "next/link"

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

  function handleStartTrial() {
    window.location.href = "/signup"
  }

  const faqs = [
    {
      q: "Is it safe?",
      a: "Yes, we use LinkedIn's official OAuth. We never see your password.",
    },
    {
      q: "Can I edit posts?",
      a: "Yes, you can review and edit every post before it goes live.",
    },
    {
      q: "Can I cancel?",
      a: "Anytime, no questions asked.",
    },
    {
      q: "Is this generic AI?",
      a: "No. We analyze your profile, niche, and writing style to generate posts in your voice.",
    },
  ]

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#ffffff", color: "#0f0f0f", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* NAV */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-lg font-bold tracking-tight" style={{ color: "#0f0f0f" }}>
          ItGrows
        </Link>
        <Link href="/login?callbackUrl=/cabinet" className="text-sm font-medium" style={{ color: "#6b7280" }}>
          Sign in
        </Link>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-12 pb-10 max-w-3xl mx-auto">
        <h1
          className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-5"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          Turn your LinkedIn into a client acquisition machine — on autopilot
        </h1>

        <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: "#6b7280", maxWidth: "560px" }}>
          We write and publish posts that bring you inbound leads — in your voice, every day.
        </p>

        <button
          onClick={handleStartTrial}
          className="px-8 py-4 rounded-xl font-bold text-base text-white transition-all mb-2"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
          }}
        >
          Generate My First Post — takes 30 sec
        </button>

        <p className="text-xs mb-10" style={{ color: "#9ca3af" }}>No signup required</p>

        {/* Ghost Mode Demo */}
        <div className="w-full">
          <p className="text-sm font-semibold mb-2" style={{ color: "#374151" }}>
            Write 2–3 lines about yourself → get 3 real LinkedIn posts instantly
          </p>
          <textarea
            value={ghostThoughts}
            onChange={(e) => setGhostThoughts(e.target.value)}
            placeholder="I'm a [role] helping [audience] with [problem]..."
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

      {/* GENERATED RESULTS */}
      {ghostPosts.length > 0 && (
        <section className="px-6 pb-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ghostPosts.map((post, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
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
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#374151", whiteSpace: "pre-wrap" }}>
                    {post.length > 220 ? post.slice(0, 220) + "…" : post}
                  </p>
                  <Link
                    href="/signup"
                    className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-all block"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
                  >
                    Start Free Trial to Publish This →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm" style={{ color: "#9ca3af" }}>
            7-day free trial · No credit card
          </p>
        </section>
      )}

      {/* PAIN SECTION */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          If you&apos;re not posting, you&apos;re invisible
        </h2>
        <ul className="space-y-4 mb-8">
          {[
            "Your competitors show up daily — you don't",
            "Decision-makers check LinkedIn before buying",
            "The one who posts → gets the deal",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>•</span>
              <span className="font-bold text-lg" style={{ color: "#0f0f0f" }}>{point}</span>
            </li>
          ))}
        </ul>
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#0f0f0f", borderLeft: "4px solid #7c3aed" }}
        >
          <p className="font-bold text-lg" style={{ color: "#ffffff" }}>
            Every day you stay silent, someone else takes your clients
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-16 max-w-3xl mx-auto" style={{ backgroundColor: "#fafafa", borderRadius: "24px" }}>
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          We don&apos;t help you &apos;grow&apos; — we bring you inbound
        </h2>
        <ul className="space-y-4">
          {[
            "7 posts per week, every week",
            "Written in your voice (not generic AI)",
            "Designed to attract clients, not likes",
            "Fully automated — no thinking, no effort",
            "Custom AI images for every post",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>✓</span>
              <span className="text-base font-medium" style={{ color: "#374151" }}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* REAL PROOF — Before / After */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          From invisible → to inbound
        </h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Before */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: "#f3f4f6", border: "1.5px solid #e5e7eb" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>BEFORE</p>
            <ul className="space-y-3">
              {["0–1 posts/month", "~200–500 views", "no inbound"].map((s) => (
                <li key={s} className="text-base font-semibold" style={{ color: "#6b7280" }}>{s}</li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #86efac" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#16a34a" }}>AFTER 2 WEEKS</p>
            <ul className="space-y-3">
              {["7 posts/week", "10,000+ views", "5–15 inbound messages"].map((s) => (
                <li key={s} className="text-base font-semibold" style={{ color: "#15803d" }}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: "#ede9fe", border: "1.5px solid #c4b5fd" }}
        >
          <p className="font-bold text-base" style={{ color: "#7c3aed" }}>One post can close a deal</p>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          LinkedIn rewards consistency — not effort
        </h2>
        <ul className="space-y-4 mb-8">
          {[
            "Posting daily = algorithm boost",
            "Visibility → trust → clients",
            "People buy from those they see often",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>•</span>
              <span className="text-base font-medium" style={{ color: "#374151" }}>{point}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <p className="text-lg font-bold" style={{ color: "#0f0f0f" }}>It&apos;s not about writing better</p>
          <p className="text-lg font-bold" style={{ color: "#7c3aed" }}>It&apos;s about showing up more</p>
        </div>
      </section>

      {/* RESULTS */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          What consistent posting gets you:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { stat: "+3.8x", label: "profile views" },
            { stat: "+280%", label: "inbound messages" },
            { stat: "More visibility", label: "→ more deals" },
          ].map(({ stat, label }) => (
            <div
              key={stat}
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: "#fafafa", border: "1.5px solid #e5e7eb" }}
            >
              <p
                className="text-4xl font-extrabold tracking-tight mb-2"
                style={{ color: "#7c3aed", letterSpacing: "-0.03em" }}
              >
                {stat}
              </p>
              <p className="text-sm font-medium" style={{ color: "#6b7280" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REMOVE AI FEAR */}
      <section
        className="px-6 py-16 max-w-3xl mx-auto rounded-2xl"
        style={{ backgroundColor: "#fafafa", border: "1.5px solid #f3f4f6" }}
      >
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          This doesn&apos;t sound like AI
        </h2>
        <ul className="space-y-4 mb-8">
          {[
            "Matches your tone",
            "Based on your profile & niche",
            "No templates, no generic content",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>✓</span>
              <span className="text-base font-medium" style={{ color: "#374151" }}>{item}</span>
            </li>
          ))}
        </ul>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#ede9fe", border: "1.5px solid #c4b5fd" }}
        >
          <p className="font-bold text-base" style={{ color: "#7c3aed" }}>People think you wrote it</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          Up and running in 3 minutes
        </h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Connect LinkedIn", desc: "Secure OAuth — no passwords" },
            { step: "2", title: "Tell us about yourself", desc: "2-minute input → your content DNA" },
            { step: "3", title: "We post for you", desc: "Daily posts, fully automated" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-5">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}
              >
                {step}
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: "#0f0f0f" }}>{title}</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-20 max-w-3xl mx-auto" id="pricing">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-12 text-center"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          One client pays for years of this tool
        </h2>

        <div
          className="rounded-2xl p-8 md:p-10 max-w-md mx-auto"
          style={{ border: "2px solid #7c3aed", boxShadow: "0 8px 32px rgba(124,58,237,0.12)" }}
        >
          <div className="mb-6">
            <span
              className="text-6xl font-extrabold tracking-tight"
              style={{ color: "#0f0f0f", letterSpacing: "-0.04em" }}
            >
              $29
            </span>
            <span className="text-xl font-medium ml-1" style={{ color: "#6b7280" }}> / month</span>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "7 AI-written posts per week",
              "Custom images for every post",
              "Auto-posting at peak time",
              "Profile-based personalization",
              "Edit anytime",
              "7-day free trial",
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
            Start Free — No Card
          </button>

          <p className="mt-3 text-center text-xs" style={{ color: "#9ca3af" }}>
            Cancel anytime
          </p>
        </div>
      </section>

      {/* FOMO BLOCK */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          While you stay silent, someone else takes your deals
        </h2>
        <ul className="space-y-4 mb-8">
          {[
            "99% of people don't post",
            "The 1% capture all attention",
            "Buyers choose visible experts",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>•</span>
              <span className="text-base font-medium" style={{ color: "#374151" }}>{point}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <p className="text-lg font-bold" style={{ color: "#0f0f0f" }}>You don&apos;t need to be better</p>
          <p className="text-lg font-bold" style={{ color: "#7c3aed" }}>You just need to show up</p>
        </div>
      </section>

      {/* WHAT YOU'RE LOSING */}
      <section
        className="px-6 py-16 max-w-3xl mx-auto rounded-2xl"
        style={{ backgroundColor: "#fff7f7", border: "1.5px solid #fecaca" }}
      >
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          Every week without posting, you miss:
        </h2>
        <ul className="space-y-4 mb-8">
          {[
            "inbound leads",
            "partnership opportunities",
            "visibility in your niche",
            "trust before the first message",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>•</span>
              <span className="text-base font-medium" style={{ color: "#991b1b" }}>{item}</span>
            </li>
          ))}
        </ul>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#fee2e2", border: "1.5px solid #fca5a5" }}
        >
          <p className="font-bold text-base" style={{ color: "#dc2626" }}>Algorithm forgets inactive profiles</p>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-extrabold tracking-tight mb-4"
          style={{ color: "#0f0f0f", letterSpacing: "-0.02em" }}
        >
          Built by an entrepreneur, for entrepreneurs
        </h2>
        <p className="text-base leading-relaxed mb-4" style={{ color: "#6b7280", maxWidth: "520px" }}>
          I built this because staying visible on LinkedIn felt like a second job. Now it runs on autopilot.
        </p>
        <p className="font-bold text-sm" style={{ color: "#374151" }}>Kiryl Sidarchuk</p>
      </section>

      {/* FAQ */}
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

      {/* FINAL CTA */}
      <section
        className="px-6 py-20 max-w-3xl mx-auto text-center rounded-2xl"
        style={{ backgroundColor: "#ede9fe", border: "1.5px solid #c4b5fd" }}
      >
        <h2
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
          style={{ color: "#0f0f0f", letterSpacing: "-0.03em" }}
        >
          Ready to get clients from LinkedIn — without posting?
        </h2>
        <p className="text-base mb-8" style={{ color: "#6b7280" }}>
          Join professionals who turned visibility into inbound.
        </p>
        <button
          onClick={handleStartTrial}
          className="px-10 py-4 rounded-xl font-bold text-base text-white transition-all mb-3"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
          }}
        >
          Generate My First Post — 30 sec
        </button>
        <p className="text-xs" style={{ color: "#9ca3af" }}>No signup required</p>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-8 border-t mt-12"
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
