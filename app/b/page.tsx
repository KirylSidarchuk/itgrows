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
    <div style={{ backgroundColor: "#0A0A0A", color: "#ffffff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* HERO SECTION */}
      <section style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* NAV */}
        <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          <Link href="/" style={{ color: "#ffffff", fontWeight: 800, fontSize: "20px", textDecoration: "none", letterSpacing: "-0.02em" }}>
            ItGrows
          </Link>
          <Link href="/login?callbackUrl=/cabinet" style={{ color: "#d1d5db", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </Link>
        </nav>

        {/* HERO CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 80px", textAlign: "center" }}>
          <div style={{ maxWidth: "900px", width: "100%" }}>
            {/* Badge */}
            <div style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "9999px", padding: "6px 16px", marginBottom: "32px" }}>
              <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>✦ NO SIGNUP REQUIRED</span>
            </div>

            {/* H1 */}
            <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: "24px" }}>
              Turn your LinkedIn into a<br />
              <span style={{ color: "#7C3AED" }}>client acquisition machine</span><br />
              — on autopilot
            </h1>

            {/* Sub */}
            <p style={{ fontSize: "20px", color: "#9ca3af", lineHeight: 1.6, marginBottom: "40px", maxWidth: "560px", margin: "0 auto 40px" }}>
              We write and publish posts that bring you inbound leads — in your voice, every day.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleStartTrial}
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                color: "#ffffff",
                padding: "18px 40px",
                borderRadius: "9999px",
                fontSize: "18px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                marginBottom: "12px",
                display: "inline-block",
                boxShadow: "0 8px 32px rgba(124,58,237,0.5)",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9" }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "1" }}
            >
              Generate My First Post — takes 30 sec →
            </button>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "12px" }}>No signup required</p>
          </div>
        </div>
      </section>

      {/* GHOST MODE DEMO — floating card */}
      <section style={{ backgroundColor: "#0A0A0A", padding: "0 24px 80px" }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          maxWidth: "640px",
          margin: "0 auto",
          padding: "40px",
        }}>
          <p style={{ color: "#4b5563", fontWeight: 600, fontSize: "15px", marginBottom: "16px", textAlign: "center" }}>
            Write 2–3 lines about yourself → get 3 real LinkedIn posts instantly
          </p>
          <textarea
            value={ghostThoughts}
            onChange={(e) => setGhostThoughts(e.target.value)}
            placeholder="I'm a [role] helping [audience] with [problem]..."
            rows={4}
            style={{
              width: "100%",
              border: "1.5px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "15px",
              color: "#111827",
              backgroundColor: "#ffffff",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none" }}
          />
          <button
            onClick={handleGhostGenerate}
            disabled={ghostLoading || ghostThoughts.trim().length < 10}
            style={{
              marginTop: "16px",
              width: "100%",
              background: ghostLoading || ghostThoughts.trim().length < 10
                ? "#a78bfa"
                : "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
              color: "#ffffff",
              padding: "18px",
              borderRadius: "12px",
              fontSize: "17px",
              fontWeight: 700,
              border: "none",
              cursor: ghostLoading || ghostThoughts.trim().length < 10 ? "not-allowed" : "pointer",
              boxShadow: ghostLoading || ghostThoughts.trim().length < 10 ? "none" : "0 4px 16px rgba(124,58,237,0.4)",
              opacity: ghostLoading || ghostThoughts.trim().length < 10 ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {ghostLoading ? "Generating…" : "Generate My Posts →"}
          </button>

          {ghostError && (
            <div style={{ marginTop: "16px", fontSize: "14px", fontWeight: 600, color: "#dc2626" }}>
              {ghostError.includes("Sign up") ? (
                <>
                  {"You've used your 2 free previews. "}
                  <Link href="/signup" style={{ color: "#7C3AED", textDecoration: "underline" }}>Sign up →</Link>
                </>
              ) : ghostError}
            </div>
          )}
        </div>
      </section>

      {/* GENERATED RESULTS */}
      {ghostPosts.length > 0 && (
        <section style={{ backgroundColor: "#0A0A0A", padding: "0 24px 80px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {ghostPosts.map((post, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  {ghostImages[i] ? (
                    <img
                      src={ghostImages[i]!}
                      alt={`Post ${i + 1} cover`}
                      style={{ width: "100%", height: "140px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "140px",
                        background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                      }}
                    >
                      ✨
                    </div>
                  )}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#374151", flex: 1, whiteSpace: "pre-wrap" }}>
                      {post.length > 220 ? post.slice(0, 220) + "…" : post}
                    </p>
                    <Link
                      href="/signup"
                      style={{
                        marginTop: "16px",
                        display: "block",
                        textAlign: "center",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "14px",
                        textDecoration: "none",
                      }}
                    >
                      Start Free Trial to Publish This →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
              7-day free trial · No credit card
            </p>
          </div>
        </section>
      )}

      {/* PAIN SECTION — white */}
      <section style={{ backgroundColor: "#ffffff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: "48px", lineHeight: 1.1 }}>
            If you&apos;re not posting, <span style={{ color: "#EF4444" }}>you&apos;re invisible</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px", margin: "0 auto 48px", textAlign: "left" }}>
            {[
              "Your competitors show up daily — you don't",
              "Decision-makers check LinkedIn before buying",
              "The one who posts → gets the deal",
            ].map((point) => (
              <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <span style={{ color: "#EF4444", fontSize: "22px", flexShrink: 0, lineHeight: 1.3 }}>❌</span>
                <span style={{ fontWeight: 700, fontSize: "20px", color: "#0A0A0A", lineHeight: 1.4 }}>{point}</span>
              </div>
            ))}
          </div>
          <div style={{
            backgroundColor: "#0A0A0A",
            borderRadius: "20px",
            padding: "40px 48px",
            textAlign: "center",
          }}>
            <p style={{ color: "#ffffff", fontSize: "24px", fontWeight: 700, lineHeight: 1.3 }}>
              Every day you stay silent, someone else takes your clients
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET — light gray */}
      <section style={{ backgroundColor: "#F8F8F8", padding: "96px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: "48px", textAlign: "center", lineHeight: 1.2 }}>
            We don&apos;t help you &apos;grow&apos; —<br />we bring you <span style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>inbound</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {[
              { title: "7 posts per week", desc: "Every week, no gaps, no excuses" },
              { title: "Written in your voice", desc: "Not generic AI — your tone, your style" },
              { title: "Designed for clients", desc: "Not likes. Not followers. Inbound leads." },
              { title: "Fully automated", desc: "No thinking, no effort, no writing" },
              { title: "Custom AI images", desc: "Professional cover image for every post" },
            ].map(({ title, desc }) => (
              <div key={title} style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "15px",
                }}>
                  ✓
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#0A0A0A", marginBottom: "4px" }}>{title}</p>
                  <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER — dark */}
      <section style={{ backgroundColor: "#0A0A0A", padding: "96px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", textAlign: "center", marginBottom: "48px" }}>
            From invisible → to inbound
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>
            {/* Before */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "40px",
            }}>
              <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "24px" }}>BEFORE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {["0–1 posts/month", "~200–500 views", "no inbound"].map((s) => (
                  <p key={s} style={{ color: "#6b7280", fontSize: "18px", fontWeight: 600 }}>{s}</p>
                ))}
              </div>
            </div>
            {/* After */}
            <div style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
              borderRadius: "20px",
              padding: "40px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "24px" }}>AFTER 2 WEEKS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {["7 posts/week", "10,000+ views", "5–15 inbound messages"].map((s) => (
                  <p key={s} style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700 }}>{s}</p>
                ))}
              </div>
            </div>
          </div>
          <p style={{ color: "#ffffff", fontSize: "22px", fontStyle: "italic", textAlign: "center", opacity: 0.85 }}>
            &ldquo;One post can close a deal&rdquo;
          </p>
        </div>
      </section>

      {/* WHY IT WORKS — white */}
      <section style={{ backgroundColor: "#ffffff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: "48px", lineHeight: 1.15 }}>
            LinkedIn rewards consistency —{" "}
            <span style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>not effort</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "56px" }}>
            {[
              { n: "1", text: "Posting daily = algorithm boost" },
              { n: "2", text: "Visibility → trust → clients" },
              { n: "3", text: "People buy from those they see often" },
            ].map(({ n, text }) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "18px",
                  flexShrink: 0,
                }}>
                  {n}
                </div>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "#0A0A0A", textAlign: "left" }}>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "#0A0A0A" }}>It&apos;s not about writing better.</p>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "#7C3AED" }}>It&apos;s about showing up more.</p>
          </div>
        </div>
      </section>

      {/* RESULTS — light gray */}
      <section style={{ backgroundColor: "#F8F8F8", padding: "96px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", textAlign: "center", marginBottom: "48px" }}>
            What consistent posting gets you:
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {[
              { stat: "+3.8x", label: "profile views" },
              { stat: "+280%", label: "inbound messages" },
              { stat: "More deals", label: "from visibility" },
            ].map(({ stat, label }) => (
              <div key={stat} style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "40px 24px",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              }}>
                <p style={{ fontSize: stat.length > 5 ? "40px" : "56px", fontWeight: 900, color: "#7C3AED", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "8px" }}>{stat}</p>
                <p style={{ fontSize: "15px", color: "#6b7280", fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REMOVE AI FEAR — white */}
      <section style={{ backgroundColor: "#ffffff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", textAlign: "center", marginBottom: "48px" }}>
            This doesn&apos;t sound like AI
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px", margin: "0 auto 40px" }}>
            {[
              "Matches your tone",
              "Based on your profile & niche",
              "No templates, no generic content",
              "Every post reads like you wrote it",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13px",
                  flexShrink: 0,
                }}>
                  ✓
                </div>
                <p style={{ fontSize: "17px", fontWeight: 600, color: "#0A0A0A" }}>{item}</p>
              </div>
            ))}
          </div>
          <div style={{
            backgroundColor: "#0A0A0A",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}>
            <p style={{ color: "#ffffff", fontSize: "22px", fontWeight: 800 }}>People think you wrote it</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — dark */}
      <section style={{ backgroundColor: "#111111", padding: "96px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", textAlign: "center", marginBottom: "56px" }}>
            Up and running in 3 minutes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "32px" }}>
            {[
              { step: "1", title: "Connect LinkedIn", desc: "Secure OAuth — no passwords" },
              { step: "2", title: "Tell us about yourself", desc: "2-minute input → your content DNA" },
              { step: "3", title: "We post for you", desc: "Daily posts, fully automated" },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "22px",
                  margin: "0 auto 20px",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}>
                  {step}
                </div>
                <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>{title}</p>
                <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING — white */}
      <section style={{ backgroundColor: "#ffffff", padding: "96px 24px" }} id="pricing">
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: "56px" }}>
            One client pays for years of this tool
          </h2>
          <div style={{
            border: "2px solid #7C3AED",
            borderRadius: "28px",
            padding: "56px 48px",
            maxWidth: "420px",
            margin: "0 auto",
            boxShadow: "0 12px 48px rgba(124,58,237,0.15)",
          }}>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "80px", fontWeight: 900, color: "#7C3AED", letterSpacing: "-0.05em", lineHeight: 1 }}>$29</span>
              <span style={{ fontSize: "20px", color: "#9ca3af", fontWeight: 500, marginLeft: "4px" }}> / month</span>
            </div>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "32px" }}>or $203/year (save 30%)</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px", textAlign: "left" }}>
              {[
                "7 AI-written posts per week",
                "Custom images for every post",
                "Auto-posting at peak time",
                "Profile-based personalization",
                "Edit anytime",
                "7-day free trial",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#7C3AED", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "15px", color: "#374151", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartTrial}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                color: "#ffffff",
                padding: "18px",
                borderRadius: "14px",
                fontSize: "17px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                fontFamily: "inherit",
              }}
            >
              Start Free — No Card
            </button>
            <p style={{ marginTop: "12px", color: "#9ca3af", fontSize: "13px" }}>Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOMO + WHAT YOU'RE LOSING — dark */}
      <section style={{ backgroundColor: "#0A0A0A", padding: "96px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", marginBottom: "40px", textAlign: "center" }}>
            While you stay silent, someone else takes your deals
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
            {[
              "99% of people don't post",
              "The 1% capture all attention",
              "Buyers choose visible experts",
            ].map((point) => (
              <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <span style={{ color: "#7C3AED", fontSize: "20px", flexShrink: 0, lineHeight: 1.4 }}>•</span>
                <p style={{ color: "#d1d5db", fontSize: "18px", fontWeight: 500 }}>{point}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>You don&apos;t need to be better</p>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#7C3AED" }}>You just need to show up</p>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "56px" }}>
            <h3 style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, textAlign: "center", marginBottom: "32px" }}>
              Every week without posting, you miss:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              {[
                "inbound leads",
                "partnership opportunities",
                "visibility in your niche",
                "trust before the first message",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ color: "#f87171", fontSize: "18px", flexShrink: 0 }}>•</span>
                  <p style={{ color: "#f87171", fontSize: "17px", fontWeight: 600 }}>{item}</p>
                </div>
              ))}
            </div>
            <p style={{ color: "#ef4444", fontSize: "16px", fontStyle: "italic", textAlign: "center", fontWeight: 600 }}>
              Algorithm forgets inactive profiles
            </p>
          </div>
        </div>
      </section>

      {/* FOUNDER — white */}
      <section style={{ backgroundColor: "#ffffff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "80px", color: "#e5e7eb", lineHeight: 0.7, marginBottom: "24px", fontFamily: "Georgia, serif" }}>&ldquo;</div>
          <p style={{ fontSize: "20px", lineHeight: 1.7, color: "#374151", marginBottom: "28px", fontStyle: "italic" }}>
            I built this because staying visible on LinkedIn felt like a second job. Now it runs on autopilot.
          </p>
          <p style={{ fontWeight: 800, fontSize: "16px", color: "#0A0A0A", marginBottom: "20px" }}>Kiryl Sidarchuk</p>
          <Link
            href="/signup"
            style={{ color: "#7C3AED", fontWeight: 700, fontSize: "16px", textDecoration: "none", borderBottom: "2px solid #7C3AED", paddingBottom: "2px" }}
          >
            See pricing and start free →
          </Link>
        </div>
      </section>

      {/* FAQ — light gray */}
      <section style={{ backgroundColor: "#F8F8F8", padding: "96px 24px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: "40px", textAlign: "center" }}>
            Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "22px 28px",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "16px", color: "#0A0A0A" }}>{faq.q}</span>
                  <span style={{
                    color: "#7C3AED",
                    fontSize: "24px",
                    fontWeight: 300,
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                    marginLeft: "16px",
                  }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 28px 24px" }}>
                    <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — violet gradient dark */}
      <section style={{
        background: "linear-gradient(135deg, #4C1D95 0%, #3730A3 100%)",
        padding: "96px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", marginBottom: "20px", lineHeight: 1.15 }}>
            Ready to get clients from LinkedIn — without posting?
          </h2>
          <p style={{ color: "#d1d5db", fontSize: "18px", marginBottom: "40px" }}>
            Join professionals who turned visibility into inbound.
          </p>
          <button
            onClick={handleStartTrial}
            style={{
              backgroundColor: "#ffffff",
              color: "#4C1D95",
              padding: "18px 48px",
              borderRadius: "9999px",
              fontSize: "18px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              fontFamily: "inherit",
              marginBottom: "16px",
            }}
          >
            Generate My First Post — 30 sec
          </button>
          <br />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>No signup required</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#0A0A0A", padding: "32px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>© 2026 ItGrows</p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/privacy" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
