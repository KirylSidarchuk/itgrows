import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: "✍️",
    title: "AI Content Creation",
    desc: "Generate SEO-optimized articles, blog posts, and social media content in seconds with our advanced AI.",
  },
  {
    icon: "📱",
    title: "Auto-Publishing",
    desc: "Automatically publish to your website, Instagram, Twitter, LinkedIn, and Facebook on your schedule.",
  },
  {
    icon: "🎯",
    title: "Google Ads on Autopilot",
    desc: "AI configures and optimizes your Google Ads campaigns continuously for maximum ROI.",
  },
  {
    icon: "🖼️",
    title: "AI Image & Video Generation",
    desc: "Create stunning visuals for your content automatically — no designer needed.",
  },
  {
    icon: "📊",
    title: "Growth Analytics",
    desc: "Track traffic, engagement, and conversions in one dashboard. Know exactly what's working.",
  },
  {
    icon: "🔄",
    title: "Fully Automated Workflows",
    desc: "Set your goals once. itgrows.ai handles research, creation, publishing, and reporting.",
  },
]

const steps = [
  {
    num: "01",
    title: "Tell Us Your Goals",
    desc: "Share your niche, audience, and business objectives. Takes 5 minutes.",
  },
  {
    num: "02",
    title: "AI Gets to Work",
    desc: "Our AI generates content, schedules posts, and configures ad campaigns automatically.",
  },
  {
    num: "03",
    title: "Watch Your Traffic Grow",
    desc: "Sit back as organic traffic, social followers, and leads increase month over month.",
  },
]

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "Perfect for solo entrepreneurs",
    features: [
      "10 AI articles/month",
      "30 social posts/month",
      "1 Google Ads campaign",
      "5 AI images/month",
      "1 website integration",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    desc: "For growing businesses",
    features: [
      "50 AI articles/month",
      "Unlimited social posts",
      "5 Google Ads campaigns",
      "50 AI images/month",
      "5 website integrations",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$399",
    period: "/month",
    desc: "For agencies & power users",
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
    cta: "Contact Sales",
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            itgrows.ai
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-violet-900/60 text-violet-300 border-violet-700 text-sm px-4 py-1">
            AI-Powered Content Automation
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Your Business Grows
            <span className="block bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              While You Sleep
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            itgrows.ai creates SEO articles, social posts, and images — then automatically publishes them and runs your Google Ads. Full content marketing on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl">
                Start Free 14-Day Trial
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="bg-white border-white text-black hover:bg-gray-100 px-8 py-6 text-lg rounded-xl">
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-500">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-900/40 text-cyan-400 border-cyan-800">Powerful Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Dominate Your Niche</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              One platform. Unlimited content. Real growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="bg-slate-800/60 border-white/10 hover:border-violet-500/50 transition-all hover:bg-slate-800">
                <CardHeader>
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <CardTitle className="text-white text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-pink-900/40 text-pink-400 border-pink-800">Simple Process</Badge>
            <h2 className="text-4xl font-bold mb-4">Up and Running in Minutes</h2>
            <p className="text-slate-400 text-lg">Three steps to automated content growth</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-black mx-auto mb-6">
                  {s.num}
                </div>
                <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-900/40 text-violet-400 border-violet-800">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((p, i) => (
              <Card
                key={i}
                className={`relative border ${
                  p.highlight
                    ? "border-violet-500 bg-gradient-to-b from-violet-950/80 to-slate-800/80 shadow-2xl shadow-violet-500/20"
                    : "border-white/10 bg-slate-800/60"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <p className="text-slate-400 text-sm">{p.desc}</p>
                  <CardTitle className="text-white text-2xl">{p.name}</CardTitle>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-5xl font-extrabold">{p.price}</span>
                    <span className="text-slate-400 mb-2">{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/signup">
                    <Button
                      className={`w-full ${
                        p.highlight
                          ? "bg-violet-600 hover:bg-violet-500 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {p.cta}
                    </Button>
                  </Link>
                  <ul className="space-y-3 pt-2">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-green-400 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Put Your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Growth on Autopilot?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join thousands of businesses already growing with itgrows.ai.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 itgrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
