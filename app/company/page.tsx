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
    a: "Yes. ItGrows is approved by LinkedIn for the Community Management API — the official, vetted access that lets us publish to Company Pages on your behalf. Most AI content tools never get this approval, so they can only touch personal profiles.",
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
    a: "No. Start a 14-day free trial with no card. You only add a payment method when you decide to continue.",
  },
]

export default function CompanyPage() {
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => { if (data?.user?.id) setSessionUser(data.user) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f6] text-[#1b1916]">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#f8f7f6]/90 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">ItGrows.ai</Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">How It Works</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Pricing</a>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-2">
            {sessionUser ? (
              <Link href="/cabinet"><Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Cabinet →</Button></Link>
            ) : (
              <>
                <Link href="/login?callbackUrl=/cabinet" className="hidden sm:block"><Button variant="ghost" className="text-slate-600 hover:text-[#1b1916] text-sm px-3">Login</Button></Link>
                <Link href="/signup"><Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4">Try Free</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

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
          <p className="mt-4 text-xs sm:text-sm text-slate-500 font-medium">No card required · Official LinkedIn &amp; X API · You approve every post</p>

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
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Why companies <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">choose ItGrows</span></h2>
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

      {/* Pricing callout */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">One plan for the <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">whole brand</span></h2>
          <div className="bg-white rounded-3xl border border-violet-200 p-8 shadow-sm">
            <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">All-in</div>
            <div className="flex items-end justify-center gap-1 mb-2"><span className="text-5xl font-extrabold">$199</span><span className="text-slate-500 mb-1">/mo</span></div>
            <p className="text-slate-600 text-sm mb-6">Your company&apos;s LinkedIn Page &amp; X, plus your team&apos;s personal accounts — all managed together, with analytics.</p>
            <Link href="/signup"><Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white w-full py-4 text-base rounded-xl font-semibold">Start 14-day free trial</Button></Link>
            <p className="text-xs text-slate-500 mt-3">No card required · Cancel anytime</p>
          </div>
          <p className="text-sm text-slate-500 mt-5">Just need your own personal accounts? <Link href="/#pricing" className="text-violet-600 font-semibold hover:text-violet-500">See personal plans from $49 →</Link></p>
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
          <Link href="/signup"><Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 text-lg rounded-xl font-semibold shadow-lg shadow-violet-600/30">Start 14-day free trial — no card</Button></Link>
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
