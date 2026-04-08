"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Topic {
  title: string
  description: string
}

interface ArticleData {
  title: string
  content: string
  keywords: string[]
  seoScore: number
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`w-3 h-3 rounded-full transition-all ${
            s === step
              ? "bg-violet-600 scale-125"
              : s < step
              ? "bg-violet-300"
              : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [siteUrl, setSiteUrl] = useState("")
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [blogOption, setBlogOption] = useState<"existing" | "new" | null>(null)
  const [blogUrl, setBlogUrl] = useState("")
  const [blogDomain, setBlogDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingMsg, setLoadingMsg] = useState("")
  const [showFullArticle, setShowFullArticle] = useState(false)
  const [topicImages, setTopicImages] = useState<Record<number, string>>({})
  const [integrationMode, setIntegrationMode] = useState<'simple' | 'advanced' | null>(null)
  const [connectSubStep, setConnectSubStep] = useState<'experience' | 'setup'>('experience')
  const [genTimer, setGenTimer] = useState(0)

  const placeholderToken = `onb_${Math.random().toString(36).slice(2, 10)}`

  // Restore site URL from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_siteUrl")
    if (saved) setSiteUrl(saved)
  }, [])

  async function handleAnalyzeSite() {
    if (!siteUrl.trim()) return
    setLoading(true)
    setError("")
    localStorage.setItem("onboarding_siteUrl", siteUrl.trim())
    try {
      const res = await fetch("/api/onboarding/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: siteUrl.trim() }),
      })
      const data = await res.json() as { topics?: Topic[]; error?: string }
      if (!res.ok || !data.topics) throw new Error(data.error ?? "Failed to get topics")
      setTopics(data.topics)
      setStep(2)
      // Generate images for all 3 topics in parallel (non-blocking)
      data.topics.forEach((topic: Topic, idx: number) => {
        fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: topic.title, keywords: [] }),
        })
          .then(r => r.json())
          .then((d: { url?: string }) => {
            if (d.url) setTopicImages(prev => ({ ...prev, [idx]: d.url! }))
          })
          .catch(() => {}) // silent fail
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateArticle() {
    if (!selectedTopic) return
    setLoading(true)
    setError("")
    setGenTimer(30)
    const timerRef = { id: null as ReturnType<typeof setInterval> | null }
    timerRef.id = setInterval(() => {
      setGenTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.id ?? undefined); return 0 }
        return t - 1
      })
    }, 1000)
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: selectedTopic.title, siteUrl, tone: "Professional" }),
      })
      const data = await res.json() as { title?: string; content?: string; keywords?: string[]; seoScore?: number; error?: string }
      if (!res.ok || !data.content) throw new Error(data.error ?? "Failed to generate article")
      const wordCount = (data.content ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
      const fallbackScore = Math.min(100, Math.max(50, Math.round(40 + wordCount / 40)))
      setArticle({
        title: data.title ?? selectedTopic.title,
        content: data.content,
        keywords: data.keywords ?? [],
        seoScore: data.seoScore ?? fallbackScore,
      })
      clearInterval(timerRef.id)
      setStep(3)
    } catch (e) {
      clearInterval(timerRef.id)
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    setLoading(true)
    setError("")
    setLoadingMsg("")
    try {
      await fetch("/api/user/onboarding-complete", { method: "POST" })

      // Save the site first (step 4 flow with blogDomain)
      if (blogDomain.trim()) {
        await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: siteUrl.trim(),
            url: siteUrl.trim(),
            platform: "custom",
            isDefault: true,
            blogDomain: blogDomain.trim(),
          }),
        })
      }

      // Schedule 15-article content calendar
      setLoadingMsg("Setting up your 15-day content calendar...")
      await fetch("/api/schedule/batch", { method: "POST" })

      router.push("/dashboard/calendar")
    } catch {
      router.push("/dashboard/calendar")
    }
  }

  // Extract first 3 paragraphs from HTML content
  function getPreview(html: string): string {
    const matches = html.match(/<p>.*?<\/p>/g) ?? []
    return matches.slice(0, 3).join("\n")
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <ProgressDots step={step} />

        {/* Step 1: Enter site URL */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🌱</div>
              <h1 className="text-2xl font-bold text-[#1b1916] mb-2">
                Welcome to ItGrows.ai!
              </h1>
              <p className="text-slate-600">
                Let&apos;s set up your automated blog. First, tell us about your website.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#1b1916] mb-1 block">
                  Your website URL
                </span>
                <input
                  type="text"
                  placeholder="e.g. mysite.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzeSite()}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400"
                />
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleAnalyzeSite}
                disabled={loading || !siteUrl.trim()}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span> Analyzing…
                  </>
                ) : (
                  "Analyze my site →"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose a topic */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center mb-8">
              <div className="text-4xl mb-4">💡</div>
              <h2 className="text-2xl font-bold text-[#1b1916] mb-2">
                Here are 3 article ideas for your site
              </h2>
              <p className="text-slate-600 text-sm">Click one to select it</p>
            </div>

            <div className="space-y-3 mb-6">
              {topics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTopic(topic)}
                  className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${
                    selectedTopic?.title === topic.title
                      ? "border-violet-500 bg-violet-50"
                      : "border-black/10 hover:border-violet-300 bg-[#f9f8f7]"
                  }`}
                >
                  {topicImages[i] ? (
                    <img src={topicImages[i]} className="w-full h-32 object-cover rounded-t-xl mb-3" alt={topic.title} />
                  ) : (
                    <div className="w-full h-32 rounded-t-xl mb-3 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
                  )}
                  <div className="px-4 pb-4">
                    <p className="font-semibold text-[#1b1916] mb-1">{topic.title}</p>
                    <p className="text-slate-600 text-sm">{topic.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleGenerateArticle}
              disabled={loading || !selectedTopic}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>{" "}
                  {genTimer === 0 ? "Almost ready…" : `Generating article… ~${genTimer}s`}
                </>
              ) : (
                "Generate article →"
              )}
            </button>
          </div>
        )}

        {/* Step 3: Article preview */}
        {step === 3 && article && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Your article is ready!</h2>
              <p className="text-slate-600 text-sm">Here&apos;s a preview of what we generated</p>
            </div>

            {/* Keywords */}
            {article.keywords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.slice(0, 8).map((kw, i) => (
                    <span
                      key={i}
                      className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-full animate-[fadeIn_0.4s_ease_both]"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Score */}
            <div className="mb-6 bg-[#f9f8f7] rounded-xl p-4 border border-black/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">SEO Score ✨</p>
                <span className={`text-sm font-bold ${article.seoScore >= 80 ? "text-green-600" : article.seoScore >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                  {article.seoScore} / 100
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${article.seoScore >= 80 ? "bg-gradient-to-r from-green-400 to-green-500" : article.seoScore >= 60 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : "bg-gradient-to-r from-red-400 to-red-500"}`}
                  style={{ width: `${article.seoScore}%` }}
                />
              </div>
            </div>

            <div className="bg-[#f9f8f7] rounded-xl p-5 mb-4 border border-black/10">
              <h3 className="text-lg font-bold text-[#1b1916] mb-3">{article.title}</h3>
              <div
                className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: getPreview(article.content) }}
              />
              <p className="text-violet-500 text-xs mt-3 italic">… article continues</p>
            </div>

            {/* Read full article toggle */}
            <button
              onClick={() => setShowFullArticle((v) => !v)}
              className="w-full py-2 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors mb-4 flex items-center justify-center gap-1"
            >
              {showFullArticle ? "Collapse ↑" : "Read full article ↓"}
            </button>

            {showFullArticle && (
              <div className="bg-white rounded-xl p-6 mb-4 border border-black/10 shadow-sm">
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            )}

            <button
              onClick={() => { setConnectSubStep('experience'); setStep(4) }}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors mb-3"
            >
              Publish this article →
            </button>

            <button
              onClick={handleComplete}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}

        {/* Step 4: Connect blog */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">
            <button
              onClick={() => setStep(3)}
              className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            {/* Sub-step: do you have a blog? */}
            {connectSubStep === 'experience' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Where should we publish?</h2>
                  <p className="text-slate-600 text-sm">
                    Do you already have a blog section on your website?
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { setBlogOption('existing'); setConnectSubStep('setup') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">Yes, I have a blog</p>
                    <p className="text-slate-500 text-sm">I already have a blog or articles section on my site (WordPress, Webflow, custom, etc.)</p>
                  </button>
                  <button
                    onClick={() => { setBlogOption('new'); setConnectSubStep('setup') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">No, I don't have a blog yet</p>
                    <p className="text-slate-500 text-sm">I want ItGrows.ai to create and host my blog — just one DNS record</p>
                  </button>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Skip for now →
                </button>
              </>
            )}

            {/* Sub-step: setup based on choice */}
            {connectSubStep === 'setup' && blogOption === 'new' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🔗</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Create your blog in 2 minutes</h2>
                  <p className="text-slate-600 text-sm">
                    We&apos;ll host your blog for you. You just need to tell your domain where to find it — one small setting at your hosting provider.
                  </p>
                </div>

                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 mb-4">
                  <p className="text-sm text-violet-800 font-medium mb-1">What is this?</p>
                  <p className="text-sm text-violet-700">
                    Think of it like forwarding mail. You&apos;re telling your domain (<strong>yoursite.com</strong>) that anyone going to <strong>blog.yoursite.com</strong> should be sent to our servers. We handle everything else.
                  </p>
                </div>

                <div className="bg-[#f9f8f7] rounded-xl p-5 border border-black/10 mb-4">
                  <p className="text-sm font-semibold text-[#1b1916] mb-1">Step 1 — Log in to your domain registrar</p>
                  <p className="text-slate-500 text-xs mb-4">That&apos;s the service where you bought your domain (e.g. GoDaddy, Namecheap, Cloudflare). Find the DNS settings.</p>
                  <p className="text-sm font-semibold text-[#1b1916] mb-1">Step 2 — Add a new CNAME record</p>
                  <p className="text-slate-500 text-xs mb-3">Copy these exact values:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs uppercase tracking-wide">
                          <th className="text-left pb-2 pr-6 font-semibold">Type</th>
                          <th className="text-left pb-2 pr-6 font-semibold">Name (subdomain)</th>
                          <th className="text-left pb-2 font-semibold">Value (points to)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="pr-6 py-1 font-mono text-violet-700 font-bold text-sm">CNAME</td>
                          <td className="pr-6 py-1 font-mono text-[#1b1916] text-sm">blog</td>
                          <td className="py-1 font-mono text-[#1b1916] text-xs">blogs.itgrows.ai</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-slate-500 text-xs mt-3">
                    The "Name" is the prefix before your domain — so <code className="bg-violet-50 text-violet-700 px-1 rounded">blog</code> means the blog will live at <strong>blog.yoursite.com</strong>. You can change it to anything you like (e.g. <code className="bg-violet-50 text-violet-700 px-1 rounded">news</code> → news.yoursite.com).
                  </p>
                  <p className="text-slate-500 text-xs mt-2 text-violet-600 font-medium">Changes take effect in 5–30 minutes.</p>
                </div>

                <div className="mb-6">
                  <label className="block">
                    <span className="text-sm font-medium text-[#1b1916] mb-1 block">
                      Step 3 — Enter your blog address below:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. blog.yoursite.com"
                      value={blogDomain}
                      onChange={(e) => setBlogDomain(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 font-mono text-sm"
                    />
                    <span className="text-slate-500 text-xs mt-1 block">The full address you&apos;ll use (same prefix as "Name" above + your domain)</span>
                  </label>
                </div>

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span> Setting up…
                    </>
                  ) : (
                    "Done! Take me to my dashboard →"
                  )}
                </button>

                <button
                  onClick={handleComplete}
                  className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Skip for now →
                </button>
              </>
            )}

            {connectSubStep === 'setup' && blogOption === 'existing' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Great, you're all set!</h2>
                  <p className="text-slate-600 text-sm">
                    Articles will be queued in your calendar. Connect your existing blog in Settings to auto-publish directly to your site.
                  </p>
                </div>

                <div className="bg-violet-50 rounded-xl p-5 border border-violet-200 mb-6">
                  <p className="text-sm font-semibold text-violet-800 mb-2">How it works:</p>
                  <ol className="text-sm text-violet-700 space-y-2 list-decimal list-inside">
                    <li>Your 15-day content calendar will be generated now</li>
                    <li>Each day, one article is published automatically</li>
                    <li>Go to <strong>Settings → Sites</strong> to connect your existing blog (WordPress, Webflow, Shopify, or any platform with a webhook)</li>
                  </ol>
                </div>

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span> Setting up…
                    </>
                  ) : (
                    "Go to my dashboard →"
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
