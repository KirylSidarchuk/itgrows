"use client"

import Link from "next/link"

const features = [
  {
    title: "AI Content Creation",
    desc: "Generate SEO-optimized articles, blog posts, and social media content in seconds with our advanced AI models trained on top-performing content.",
  },
  {
    title: "Auto-Publishing",
    desc: "Automatically publish to your website, Instagram, Twitter, LinkedIn, and Facebook on a schedule you define. No manual work required.",
  },
  {
    title: "Google Ads on Autopilot",
    desc: "AI configures and continuously optimizes your Google Ads campaigns for maximum ROI — without a single hour of manual management.",
  },
  {
    title: "AI Image Generation",
    desc: "Create on-brand visuals for every piece of content automatically. No designer, no stock photos, no delays.",
  },
]

const steps = [
  {
    num: "01",
    title: "Tell us your goals",
    desc: "Share your niche, audience, and objectives. Takes five minutes. Our AI builds a full growth strategy from there.",
  },
  {
    num: "02",
    title: "AI gets to work",
    desc: "Content is generated, scheduled, and published. Ad campaigns launch and self-optimize. Everything runs without you.",
  },
  {
    num: "03",
    title: "Watch your traffic grow",
    desc: "Organic traffic rises. Social following builds. Leads come in. You review the dashboard and focus on what matters.",
  },
]

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "For solo entrepreneurs",
    features: [
      "10 AI articles per month",
      "30 social posts per month",
      "1 Google Ads campaign",
      "5 AI images per month",
      "1 website integration",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    desc: "For growing businesses",
    features: [
      "50 AI articles per month",
      "Unlimited social posts",
      "5 Google Ads campaigns",
      "50 AI images per month",
      "5 website integrations",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$399",
    period: "/month",
    desc: "For agencies and power users",
    features: [
      "Unlimited AI articles",
      "Unlimited social posts",
      "Unlimited Google Ads",
      "Unlimited AI images",
      "Unlimited integrations",
      "Dedicated account manager",
      "White-label reports",
      "API access",
    ],
    cta: "Contact sales",
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2f1", color: "#1b1916", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(27,25,22,0.1)", padding: "0 2rem", backgroundColor: "#f3f2f1" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1b1916" }}>
            itgrows.ai
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <a href="#features" style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.55)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1b1916")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(27,25,22,0.55)")}>
                Features
              </a>
              <a href="#pricing" style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.55)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1b1916")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(27,25,22,0.55)")}>
                Pricing
              </a>
              <Link href="/blog" style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.55)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1b1916")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(27,25,22,0.55)")}>
                Blog
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link href="/login" style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.55)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1b1916")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(27,25,22,0.55)")}>
                Sign in
              </Link>
              <Link href="/signup" style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#f3f2f1",
                backgroundColor: "#1b1916",
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "background-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#333028")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1b1916")}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "7rem 2rem 8rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ maxWidth: "820px" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c6af7", marginBottom: "2rem" }}>
            AI Growth Platform
          </p>
          <h1 style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1b1916", margin: "0 0 2rem 0" }}>
            We help ambitious<br />brands grow with AI.
          </h1>
          <p style={{ fontSize: "1.25rem", lineHeight: 1.6, color: "rgba(27,25,22,0.55)", maxWidth: "560px", margin: "0 0 3rem 0" }}>
            itgrows.ai creates SEO content, social posts, and ad campaigns — then publishes and optimizes everything automatically. Full-stack content marketing, on autopilot.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <Link href="/signup" style={{
              display: "inline-block",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "#f3f2f1",
              backgroundColor: "#1b1916",
              padding: "0.875rem 2rem",
              borderRadius: "6px",
              textDecoration: "none",
            }}>
              Start free — no card needed
            </Link>
            <a href="#how-it-works" style={{
              display: "inline-block",
              fontSize: "0.9375rem",
              color: "rgba(27,25,22,0.55)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(27,25,22,0.25)",
              paddingBottom: "1px",
            }}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(27,25,22,0.1)" }} />

      {/* Features */}
      <section id="features" style={{ padding: "6rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#1b1916", margin: "0 0 1rem 0" }}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "rgba(27,25,22,0.5)", maxWidth: "440px", lineHeight: 1.65 }}>
            One platform handles content creation, publishing, advertising, and analytics — end to end.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1px", border: "1px solid rgba(27,25,22,0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: "2.5rem 2rem",
              backgroundColor: "#f3f2f1",
              borderRight: "1px solid rgba(27,25,22,0.1)",
              borderBottom: "1px solid rgba(27,25,22,0.1)",
              transition: "background-color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eae9e6")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#f3f2f1")}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1b1916", margin: "0 0 0.875rem 0", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.5)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(27,25,22,0.1)" }} />

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "6rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#1b1916", margin: "0 0 1rem 0" }}>
            Up and running in minutes.
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "rgba(27,25,22,0.5)", lineHeight: 1.65 }}>
            Three steps. Then it runs itself.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "3rem" }}>
          {steps.map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", color: "#7c6af7", margin: "0 0 1.25rem 0" }}>{s.num}</p>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1b1916", margin: "0 0 0.75rem 0", letterSpacing: "-0.015em" }}>{s.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(27,25,22,0.5)", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(27,25,22,0.1)" }} />

      {/* Pricing */}
      <section id="pricing" style={{ padding: "6rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#1b1916", margin: "0 0 1rem 0" }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "rgba(27,25,22,0.5)", lineHeight: 1.65 }}>
            Start free. Scale when you&apos;re ready.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              border: p.highlight ? "1px solid rgba(124,106,247,0.6)" : "1px solid rgba(27,25,22,0.12)",
              borderRadius: "12px",
              padding: "2.5rem 2rem",
              backgroundColor: p.highlight ? "rgba(124,106,247,0.04)" : "transparent",
              position: "relative",
            }}>
              {p.highlight && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "2rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#f3f2f1",
                  backgroundColor: "#7c6af7",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "4px",
                }}>
                  Most popular
                </div>
              )}
              <p style={{ fontSize: "0.8125rem", color: "rgba(27,25,22,0.45)", margin: "0 0 0.5rem 0" }}>{p.desc}</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b1916", margin: "0 0 1rem 0", letterSpacing: "-0.01em" }}>{p.name}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#1b1916", lineHeight: 1 }}>{p.price}</span>
                <span style={{ fontSize: "0.875rem", color: "rgba(27,25,22,0.45)" }}>{p.period}</span>
              </div>
              <Link href="/signup" style={{
                display: "block",
                textAlign: "center",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: p.highlight ? "#f3f2f1" : "#1b1916",
                backgroundColor: p.highlight ? "#7c6af7" : "rgba(27,25,22,0.08)",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                textDecoration: "none",
                marginBottom: "2rem",
                transition: "background-color 0.15s",
              }}>
                {p.cta}
              </Link>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "0.875rem", color: "rgba(27,25,22,0.6)" }}>
                    <span style={{ color: "#7c6af7", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(27,25,22,0.1)" }} />

      {/* Bottom CTA */}
      <section style={{ padding: "7rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ maxWidth: "640px" }}>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#1b1916", margin: "0 0 1.5rem 0", lineHeight: 1.1 }}>
            Ready to put your growth on autopilot?
          </h2>
          <p style={{ fontSize: "1.125rem", color: "rgba(27,25,22,0.5)", margin: "0 0 2.5rem 0", lineHeight: 1.65 }}>
            Join thousands of businesses already growing with itgrows.ai. Start free, no credit card required.
          </p>
          <Link href="/signup" style={{
            display: "inline-block",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#f3f2f1",
            backgroundColor: "#1b1916",
            padding: "0.875rem 2rem",
            borderRadius: "6px",
            textDecoration: "none",
          }}>
            Start free today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(27,25,22,0.1)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1b1916" }}>itgrows.ai</span>
          <div style={{ display: "flex", gap: "2rem" }}>
            <a href="#features" style={{ fontSize: "0.8125rem", color: "rgba(27,25,22,0.4)", textDecoration: "none" }}>Features</a>
            <a href="#pricing" style={{ fontSize: "0.8125rem", color: "rgba(27,25,22,0.4)", textDecoration: "none" }}>Pricing</a>
            <Link href="/blog" style={{ fontSize: "0.8125rem", color: "rgba(27,25,22,0.4)", textDecoration: "none" }}>Blog</Link>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "rgba(27,25,22,0.3)", margin: 0 }}>
            &copy; 2026 itgrows.ai. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  )
}
