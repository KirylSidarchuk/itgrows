"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

const features = [
  {
    icon: "👤",
    title: "Personal LinkedIn",
    desc: "AI grows your founders' and executives' LinkedIn presence — daily posts, comments, and connection outreach on autopilot.",
  },
  {
    icon: "✖️",
    title: "Personal X (Twitter)",
    desc: "Your team's personal X accounts post consistently, engage with the right audience, and build thought leadership.",
  },
  {
    icon: "🏢",
    title: "Company X Account",
    desc: "Your brand's official X account stays active and relevant — AI generates on-brand content and schedules it automatically.",
  },
  {
    icon: "📈",
    title: "Growth Analytics",
    desc: "Track follower growth, engagement rates, and lead attribution across all accounts in one dashboard.",
  },
  {
    icon: "🎯",
    title: "Audience Targeting",
    desc: "AI identifies and engages your ideal buyers, partners, and investors — so your reach compounds over time.",
  },
  {
    icon: "⚡",
    title: "Zero Manual Work",
    desc: "Set your goals and brand voice once. ItGrows.ai handles content creation, posting, and engagement automatically.",
  },
]

const steps = [
  {
    num: "01",
    title: "Onboard Your Team",
    desc: "Connect LinkedIn and X accounts for your key people and company. Takes under 10 minutes.",
  },
  {
    num: "02",
    title: "AI Learns Your Brand",
    desc: "We analyse your niche, tone, and audience to generate content that sounds exactly like you.",
  },
  {
    num: "03",
    title: "Watch Inbound Grow",
    desc: "Leads, partnership requests, and investor attention start coming in — without anyone lifting a finger.",
  },
]

export default function ForCompaniesPage() {
  const [sessionUser, setSessionUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) setSessionUser(data.user)
      })
      .catch(() => {})
  }, [])

  async function handleCheckout(plan: "personal" | "duo" | "allin") {
    const sessionRes = await fetch("/api/auth/session")
    const sessionData = (await sessionRes.json()) as { user?: { id: string } }
    if (!sessionData?.user?.id) {
      window.location.href = `/signup?callbackUrl=${encodeURIComponent("/cabinet")}`
      return
    }
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
    const data = (await res.json()) as { url?: string }
    if (data?.url) {
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
      <nav className="border-b border-black/10 px-6 py-4" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer">
              ItGrows.ai
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-[#1b1916] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1b1916] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#1b1916] transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            {sessionUser ? (
              <Link href="/cabinet">
                <Button className="bg-violet-600 hover:bg-violet-500 text-white">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login?callbackUrl=/cabinet">
                  <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button>
                </Link>
                <Button
                  onClick={() => handleCheckout("allin")}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4"
                >
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 text-sm px-4 py-1">
            For Teams &amp; Companies
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-[#1b1916]">
            Your Whole Team Grows
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              On Social. Automatically.
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            One plan covers everything: personal LinkedIn, personal X, and your company X. AI manages all accounts so your team builds presence while they focus on the business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => handleCheckout("allin")}
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl"
            >
              Start Free Trial — All-in $199/mo
            </Button>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-[#1b1916] text-[#1b1916] hover:bg-[#1b1916] hover:text-[#f3f2f1] px-8 py-6 text-lg rounded-xl"
              >
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-500">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-28 overflow-hidden" style={{ backgroundColor: "#07071a" }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.12) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-violet-500/40 text-violet-400 bg-violet-500/10 tracking-widest uppercase">
              What&apos;s Included
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              Personal + Company Coverage.{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                All in One Plan.
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              The All-in plan is the only plan for businesses — because real growth requires presence across every channel.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-6 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.18),inset_0_0_30px_rgba(139,92,246,0.04)]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <div className="mb-5 text-4xl">{f.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-pink-100 text-pink-700 border-pink-200">Simple Process</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Up and Running in Under an Hour</h2>
            <p className="text-slate-600 text-lg">Three steps to full-company social automation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
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

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">One Plan. Everything Included.</h2>
            <p className="text-slate-600 text-lg">No tiers, no upsells. All accounts, all channels, all features.</p>
          </div>
          <Card className="relative border-2 border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-violet-600 text-white border-0 px-4 py-1">For Companies</Badge>
            </div>
            <CardHeader className="pb-2 pt-8">
              <CardTitle className="text-[#1b1916] text-3xl font-extrabold text-center">All-in</CardTitle>
              <div className="flex items-end gap-1 mt-3 justify-center">
                <span className="text-6xl font-extrabold text-[#1b1916]">$199</span>
                <span className="text-slate-500 mb-2 text-lg">/month</span>
              </div>
              <p className="text-slate-500 text-sm text-center mt-1">14-day free trial · cancel anytime</p>
            </CardHeader>
            <CardContent className="space-y-4 px-8 pb-8">
              <Button
                onClick={() => handleCheckout("allin")}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-6 text-base rounded-xl mt-4"
              >
                Start Free Trial — All-in $199/mo
              </Button>
              <ul className="space-y-3 pt-4">
                {[
                  "Personal LinkedIn — AI posts, comments & outreach",
                  "Personal X (Twitter) — thought leadership on autopilot",
                  "Company X account — brand content & engagement",
                  "Growth analytics across all accounts",
                  "Custom brand voice & audience targeting",
                  "Dedicated onboarding & priority support",
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="text-violet-600 font-bold mt-0.5">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-24 text-center" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#1b1916]">
            Ready to Put Your Team&apos;s{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              Social Growth on Autopilot?
            </span>
          </h2>
          <p className="text-slate-600 text-lg mb-10">
            One plan. Every account. Zero manual work.
          </p>
          <Button
            size="lg"
            onClick={() => handleCheckout("allin")}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl"
          >
            Start Free Trial — All-in $199/mo
          </Button>
          <p className="mt-4 text-sm text-slate-500">14-day free trial · No credit card required · Cancel anytime</p>
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
    </div>
  )
}
