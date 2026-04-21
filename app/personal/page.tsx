import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: "🎯",
    title: "Posts Tailored to Your Voice & Niche",
    desc: "We analyze your professional profile and write in your unique tone — not generic AI filler.",
  },
  {
    icon: "📅",
    title: "7 Posts Scheduled Weekly",
    desc: "One post every day, Monday through Sunday. Consistent presence without the effort.",
  },
  {
    icon: "🖼️",
    title: "Images Generated Automatically",
    desc: "Every post comes with a custom AI-generated image that matches your content.",
  },
  {
    icon: "⏰",
    title: "Publishes at Peak Time",
    desc: "Posts go live at 9am UTC — when LinkedIn engagement is highest.",
  },
  {
    icon: "🧬",
    title: "Built on Your Professional DNA",
    desc: "We study your niche, goals, and audience before writing a single word. Nothing generic.",
  },
]

const steps = [
  {
    num: "01",
    title: "Connect LinkedIn",
    desc: "One click. No passwords shared. We use LinkedIn's secure OAuth connection.",
  },
  {
    num: "02",
    title: "Tell Us About You",
    desc: "Fill a 2-minute brief: your niche, audience, and goals. That's your content DNA.",
  },
  {
    num: "03",
    title: "We Post for You",
    desc: "AI-crafted posts publish daily to your profile. Review, edit, or let them run on autopilot.",
  },
]

const faqs = [
  {
    q: "Is this generic AI content?",
    a: "No. Before writing anything, we analyze your LinkedIn profile, your niche, and your professional goals. Every post is written specifically for you — in your voice, for your audience.",
  },
  {
    q: "Do I need to do anything after setup?",
    a: "Just connect LinkedIn and fill a 2-minute brief. After that, posts are generated and scheduled automatically. You can review and edit before they go live if you'd like.",
  },
  {
    q: "Can I edit posts before they publish?",
    a: "Yes. Every post appears in your dashboard before it goes live. Approve as-is, tweak the wording, or regenerate entirely — you're always in control.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no lock-ins. Cancel from your account settings in seconds. Your subscription ends at the current billing period.",
  },
]

export default function PersonalPage() {
  return (
    <div
      className="min-h-screen text-[#1b1916]"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            ItGrows.ai
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916]">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/60 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 text-sm px-4 py-1">
            LinkedIn Automation · $15/month
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-[#1b1916]">
            Your LinkedIn on
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Autopilot
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            We write and publish 7 AI-crafted LinkedIn posts every week — tailored to your voice, your niche, and your audience. Set it up once. Grow forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl">
                Start Free Trial
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border-[#1b1916] text-[#1b1916] hover:bg-[#1b1916] hover:text-[#f3f2f1] px-8 py-6 text-lg rounded-xl">
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-500">No credit card required · Cancel anytime · $15/month</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-center">
        <p className="text-white text-base font-medium">
          Join <span className="font-extrabold">200+ professionals</span> growing their LinkedIn presence with ItGrows Personal
        </p>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-pink-100 text-pink-700 border-pink-200">Simple Setup</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Up and Running in 3 Minutes</h2>
            <p className="text-slate-600 text-lg">No copywriting. No scheduling. No thinking about what to post.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
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
      <section id="features" className="relative px-6 py-28 overflow-hidden" style={{ backgroundColor: "#07071a" }}>
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
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-violet-500/40 text-violet-400 bg-violet-500/10 tracking-widest uppercase">
              What You Get
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Own Your LinkedIn
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              One subscription. Daily posts. Real professional growth.
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

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">One Plan. Everything Included.</h2>
            <p className="text-slate-600 text-lg">No upsells. No tiers. Just LinkedIn growth.</p>
          </div>

          <Card className="relative border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-[#1b1916] text-2xl">Personal Autopilot</CardTitle>
              <p className="text-slate-500 text-sm mt-1">Everything you need to grow your LinkedIn</p>
              <div className="flex items-end gap-1 mt-4 justify-center">
                <span className="text-6xl font-extrabold text-[#1b1916]">$15</span>
                <span className="text-slate-500 mb-2 text-lg">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-8 pb-8">
              <Link href="/signup">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white py-6 text-base rounded-xl mt-2">
                  Start Free Trial
                </Button>
              </Link>
              <p className="text-center text-xs text-slate-500">No credit card required · Cancel anytime</p>
              <ul className="space-y-3 pt-2">
                {[
                  "7 AI-written posts per week",
                  "Custom images for every post",
                  "Auto-scheduling at peak time (9am UTC)",
                  "Profile DNA analysis",
                  "Review & edit before publishing",
                  "Cancel anytime, no commitment",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-violet-600 font-bold text-base">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-100 text-cyan-700 border-cyan-200">FAQ</Badge>
            <h2 className="text-4xl font-bold mb-4 text-violet-700">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-lg">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/10 p-6 hover:border-violet-300 transition-colors">
                <h3 className="text-violet-700 font-semibold text-base mb-3 leading-snug">{item.q}</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-24 text-center" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#1b1916]">
            Ready to Grow Your LinkedIn{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              While You Sleep?
            </span>
          </h2>
          <p className="text-slate-600 text-lg mb-10">
            Join 200+ professionals who stopped worrying about what to post.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl"
            >
              Start Free Trial — $15/month
            </Button>
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required · Cancel anytime</p>
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
