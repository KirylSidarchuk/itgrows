import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/auth"

const features = [
  {
    icon: "/icons/ai-content.jpg",
    title: "AI Content Creation",
    desc: "Generate SEO-optimized articles, blog posts, and social media content in seconds with our advanced AI.",
  },
  {
    icon: "/icons/auto-publishing.jpg",
    title: "Auto-Publishing",
    desc: "Automatically publish to your website, Instagram, Twitter, LinkedIn, and Facebook on your schedule.",
  },
  {
    icon: "/icons/google-ads.jpg",
    title: "Google Ads on Autopilot",
    desc: "AI configures and optimizes your Google Ads campaigns continuously for maximum ROI.",
  },
  {
    icon: "/icons/ai-image.jpg",
    title: "AI Image & Video Generation",
    desc: "Create stunning visuals for your content automatically — no designer needed.",
  },
  {
    icon: "/icons/analytics.jpg",
    title: "Growth Analytics",
    desc: "Track traffic, engagement, and conversions in one dashboard. Know exactly what's working.",
  },
  {
    icon: "/icons/workflows.jpg",
    title: "Fully Automated Workflows",
    desc: "Set your goals once. ItGrows.ai handles research, creation, publishing, and reporting.",
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

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="min-h-screen text-[#1b1916]" style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            ItGrows.ai
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-[#1b1916] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1b1916] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#1b1916] transition-colors">Pricing</a>
            <a href="/#faq" className="hover:text-[#1b1916] transition-colors">FAQ</a>
            <Link href="/blog" className="hover:text-[#1b1916] transition-colors">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm text-slate-600 max-w-[140px] truncate">{user.name ?? user.email}</span>
                </div>
                <Link href="/dashboard">
                  <Button className="bg-violet-600 hover:bg-violet-500 text-white">Go to Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 hover:text-[#1b1916]">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#1b1916] hover:bg-[#333028] text-[#f3f2f1]">Get Started</Button>
                </Link>
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
            AI-Powered Content Automation
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-[#1b1916]">
            Your Business Grows
            <span className="block bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              While You Sleep
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            ItGrows.ai creates SEO articles, social posts, and images — then automatically publishes them and runs your Google Ads. Full content marketing on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl">
                Start Free 14-Day Trial
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border-[#1b1916] text-[#1b1916] hover:bg-[#1b1916] hover:text-[#f3f2f1] px-8 py-6 text-lg rounded-xl">
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-500">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-28 overflow-hidden" style={{ backgroundColor: "#07071a" }}>
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.12) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium border border-violet-500/40 text-violet-400 bg-violet-500/10 tracking-widest uppercase">
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Dominate Your Niche
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              One platform. Unlimited content. Real growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-6 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.18),inset_0_0_30px_rgba(139,92,246,0.04)]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <div className="mb-5">
                  <Image src={f.icon} alt={f.title} width={72} height={72} className="rounded-2xl" />
                </div>
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
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Up and Running in Minutes</h2>
            <p className="text-slate-600 text-lg">Three steps to automated content growth</p>
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

      {/* FAQ */}
      <section id="faq" className="px-6 py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-100 text-cyan-700 border-cyan-200">FAQ</Badge>
            <h2 className="text-4xl font-bold mb-4 text-violet-700">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-lg">Everything you need to know about how ItGrows.ai works.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Will articles published on my site actually rank on Google?",
                a: "Yes — unlike other AI content tools that use JavaScript widgets (which Google often ignores), ItGrows.ai publishes articles as real HTML pages on your domain. Google crawls and indexes them just like any manually written article.",
              },
              {
                q: "How is ItGrows.ai different from other AI blog tools?",
                a: "Most competitors publish articles through JavaScript embeds that aren't properly indexed by search engines. ItGrows.ai uses a CNAME-based approach — articles live on your domain as server-rendered HTML pages, fully crawlable and indexable by Google, Bing, and other search engines.",
              },
              {
                q: "Does the content match my website's niche?",
                a: "Yes. When you connect your site, we analyze your website to understand your niche, products, and target audience. Every article is generated specifically for your business — not generic content.",
              },
              {
                q: "How many articles can I publish per month?",
                a: "With the autopilot plan, we publish 1 article per day — 30 per month. Each is unique, SEO-optimized, and tailored to your site's topic.",
              },
              {
                q: "Do I need technical skills to set up?",
                a: "No. For non-technical users, setup takes 2 minutes: just add one DNS record (CNAME) in your domain registrar. We provide step-by-step instructions for GoDaddy, Namecheap, Cloudflare, and others.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/10 p-6 hover:border-violet-300 transition-colors">
                <h3 className="text-violet-700 font-semibold text-base mb-3 leading-snug">{item.q}</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24" style={{ backgroundColor: "#ebe9e5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4 text-[#1b1916]">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((p, i) => (
              <Card
                key={i}
                className={`relative border ${
                  p.highlight
                    ? "border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-2xl shadow-violet-200"
                    : "border-black/10 bg-white"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white border-0 px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <p className="text-slate-500 text-sm">{p.desc}</p>
                  <CardTitle className="text-[#1b1916] text-2xl">{p.name}</CardTitle>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-5xl font-extrabold text-[#1b1916]">{p.price}</span>
                    <span className="text-slate-500 mb-2">{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/signup">
                    <Button
                      className={`w-full ${
                        p.highlight
                          ? "bg-violet-600 hover:bg-violet-500 text-white"
                          : "bg-[#1b1916] hover:bg-[#333028] text-[#f3f2f1]"
                      }`}
                    >
                      {p.cta}
                    </Button>
                  </Link>
                  <ul className="space-y-3 pt-2">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="text-violet-600 font-bold">✓</span>
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
      <section className="px-6 py-24 text-center" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#1b1916]">
            Ready to Put Your{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              Growth on Autopilot?
            </span>
          </h2>
          <p className="text-slate-600 text-lg mb-10">
            Join thousands of businesses already growing with ItGrows.ai.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <p>© 2026 ItGrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
