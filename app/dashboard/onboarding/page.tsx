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
  const [connectSubStep, setConnectSubStep] = useState<'experience' | 'blog-advanced' | 'blog-simple' | 'detecting' | 'platform' | 'setup'>('experience')
  const [selectedPlatform, setSelectedPlatform] = useState<'wordpress' | 'shopify' | 'webflow' | 'other' | 'php' | null>(null)
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)
  const [wpToken, setWpToken] = useState("")
  const [shopifyToken, setShopifyToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")
  const [webflowToken, setWebflowToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [existingBlogUrl, setExistingBlogUrl] = useState("")
  const [genTimer, setGenTimer] = useState(0)

  const [placeholderToken] = useState(() => `onb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`)

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

      // Save site with integration data
      const sitePayload: Record<string, string | boolean> = {
        name: siteUrl.trim(),
        url: siteUrl.trim(),
        isDefault: true,
      }
      if (blogDomain.trim()) {
        sitePayload.platform = "custom"
        sitePayload.blogDomain = blogDomain.trim()
      } else if (selectedPlatform === 'wordpress' && wpToken.trim()) {
        sitePayload.platform = "wordpress"
        sitePayload.siteToken = wpToken.trim()
        sitePayload.existingBlogUrl = existingBlogUrl.trim()
      } else if (selectedPlatform === 'shopify' && shopifyToken.trim()) {
        sitePayload.platform = "shopify"
        sitePayload.siteToken = shopifyToken.trim()
        sitePayload.shopifyToken = shopifyToken.trim()
        sitePayload.shopifyBlogId = shopifyBlogId.trim()
        sitePayload.existingBlogUrl = existingBlogUrl.trim()
      } else if (selectedPlatform === 'webflow' && webflowToken.trim()) {
        sitePayload.platform = "webflow"
        sitePayload.siteToken = webflowToken.trim()
        sitePayload.webflowToken = webflowToken.trim()
        sitePayload.webflowCollectionId = webflowCollectionId.trim()
        sitePayload.existingBlogUrl = existingBlogUrl.trim()
      } else if ((selectedPlatform === 'other' || selectedPlatform === 'php') && webhookUrl.trim()) {
        sitePayload.platform = "php"
        sitePayload.siteToken = placeholderToken
        sitePayload.webhookUrl = webhookUrl.trim()
        sitePayload.existingBlogUrl = existingBlogUrl.trim()
      }

      if (Object.keys(sitePayload).length > 3) {
        await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sitePayload),
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

  async function handleDetectPlatform() {
    setBlogOption('existing')
    setConnectSubStep('detecting')
    try {
      const res = await fetch("/api/detect-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl.trim() }),
      })
      const data = await res.json() as { platform?: string }
      const p = data.platform ?? "custom"
      setDetectedPlatform(p)
      const mapped =
        p === "wordpress" ? "wordpress" :
        p === "shopify" ? "shopify" :
        p === "webflow" ? "webflow" :
        (p === "octobercms" || p === "php") ? "php" :
        "other"
      setSelectedPlatform(mapped)
      setConnectSubStep('setup')
    } catch {
      setDetectedPlatform(null)
      setConnectSubStep('platform')
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
                    <div className="w-full h-32 rounded-t-xl mb-3 bg-gradient-to-br from-violet-50 to-slate-100 flex flex-col items-center justify-center gap-1 border-b border-black/5">
                      <span className="text-violet-400 text-xl animate-spin">⟳</span>
                      <span className="text-violet-500 text-xs font-semibold tracking-wide">Generating image…</span>
                    </div>
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
            {connectSubStep === 'experience' && (
              <button
                onClick={() => setStep(3)}
                className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
              >
                ← Back
              </button>
            )}

            {/* Sub-step: how do you want to publish? */}
            {connectSubStep === 'experience' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">How would you like to publish?</h2>
                  <p className="text-slate-600 text-sm">
                    Choose the setup that fits you best.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { setIntegrationMode('advanced'); setConnectSubStep('blog-advanced') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">🛠️ I'm technical</p>
                    <p className="text-slate-500 text-sm">I can edit code, use APIs, and install plugins. Show me the advanced setup.</p>
                  </button>
                  <button
                    onClick={() => { setIntegrationMode('simple'); setConnectSubStep('blog-simple') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">👋 Guide me step by step</p>
                    <p className="text-slate-500 text-sm">I'm not a developer. Walk me through a simple copy-paste setup.</p>
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

            {/* Sub-step: blog check for advanced/technical path */}
            {connectSubStep === 'blog-advanced' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Does your site have a blog?</h2>
                  <p className="text-slate-600 text-sm">
                    This determines where your AI-generated articles will be published.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleDetectPlatform}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">📝 Yes, I have a blog</p>
                    <p className="text-slate-500 text-sm">I already have a blog or articles section on my site (WordPress, Webflow, custom, etc.)</p>
                  </button>
                  <button
                    onClick={() => { setBlogOption('new'); setConnectSubStep('setup') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">☁️ No, create one for me</p>
                    <p className="text-slate-500 text-sm">No problem — we'll create a blog section on your site automatically</p>
                  </button>
                </div>

                <button
                  onClick={() => setConnectSubStep('experience')}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* Sub-step: blog check for simple/non-technical path */}
            {connectSubStep === 'blog-simple' && (
              <>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Does your website have a blog?</h2>
                  <p className="text-slate-600 text-sm">
                    We need to know where to publish your articles.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleDetectPlatform}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">📝 Yes, I have a blog</p>
                    <p className="text-slate-500 text-sm">I already have a blog page on my website.</p>
                  </button>
                  <button
                    onClick={() => { setBlogOption('new'); setConnectSubStep('setup') }}
                    className="w-full text-left rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 p-5 transition-all"
                  >
                    <p className="font-semibold text-[#1b1916] mb-1">✨ No, create one for me</p>
                    <p className="text-slate-500 text-sm">No problem — we'll create a blog section on your site automatically</p>
                  </button>
                </div>

                <button
                  onClick={() => setConnectSubStep('experience')}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  ← Back
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

                <button
                  onClick={() => {
                    if (integrationMode === 'advanced') setConnectSubStep('blog-advanced')
                    else if (integrationMode === 'simple') setConnectSubStep('blog-simple')
                    else setConnectSubStep('experience')
                  }}
                  className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* Detecting spinner */}
            {connectSubStep === 'detecting' && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-spin inline-block">⟳</div>
                <p className="text-[#1b1916] font-semibold">Detecting your platform…</p>
                <p className="text-slate-500 text-sm mt-1">Scanning {siteUrl}</p>
              </div>
            )}

            {/* Platform selector (fallback if not detected) */}
            {connectSubStep === 'platform' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🔌</div>
                  <h2 className="text-2xl font-bold text-[#1b1916] mb-2">What platform is your blog on?</h2>
                  <p className="text-slate-600 text-sm">We'll show you exactly how to connect it in 2 minutes</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { id: 'wordpress', label: 'WordPress', icon: '🟦' },
                    { id: 'shopify', label: 'Shopify', icon: '🟢' },
                    { id: 'webflow', label: 'Webflow', icon: '🔵' },
                    { id: 'other', label: 'Other / Custom', icon: '⚙️' },
                  ] as const).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPlatform(p.id); setConnectSubStep('setup') }}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-black/10 hover:border-violet-400 bg-[#f9f8f7] hover:bg-violet-50 transition-all text-left"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="font-semibold text-[#1b1916] text-sm">{p.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Skip for now →
                </button>

                <button
                  onClick={() => setConnectSubStep(integrationMode === 'simple' ? 'blog-simple' : 'blog-advanced')}
                  className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* Platform-specific setup */}
            {connectSubStep === 'setup' && blogOption === 'existing' && (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-[#1b1916] mb-2">
                    {selectedPlatform === 'wordpress' && '🟦 Connect WordPress'}
                    {selectedPlatform === 'shopify' && '🟢 Connect Shopify'}
                    {selectedPlatform === 'webflow' && '🔵 Connect Webflow'}
                    {selectedPlatform === 'php' && '🐘 Connect October CMS / PHP'}
                    {selectedPlatform === 'other' && '⚙️ Connect your blog'}
                  </h2>
                  {detectedPlatform && detectedPlatform !== 'custom' ? (
                    <span className="inline-block text-xs bg-green-100 text-green-700 border border-green-300 rounded-full px-3 py-1">
                      ✓ Auto-detected from {siteUrl}
                    </span>
                  ) : null}
                  <button
                    onClick={() => setConnectSubStep('platform')}
                    className="block mx-auto mt-2 text-xs text-violet-500 hover:text-violet-700"
                  >
                    Wrong platform? Change →
                  </button>
                </div>

                {selectedPlatform === 'wordpress' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-[#1b1916]">How to connect WordPress:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>In your WordPress admin, go to <strong>Users → Profile</strong></li>
                        <li>Scroll to <strong>Application Passwords</strong></li>
                        <li>Enter a name (e.g. "ItGrows") and click <strong>Add New</strong></li>
                        <li>Copy the password shown and paste it below</li>
                      </ol>
                    </div>
                    <input
                      type="text"
                      placeholder="Your blog URL (e.g. https://myblog.com)"
                      value={existingBlogUrl}
                      onChange={e => setExistingBlogUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="WordPress Application Password"
                      value={wpToken}
                      onChange={e => setWpToken(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                  </div>
                )}

                {selectedPlatform === 'shopify' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-[#1b1916]">How to connect Shopify:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Shopify Admin → <strong>Settings → Apps → Develop apps</strong></li>
                        <li>Create an app, set API scope: <code className="bg-slate-100 px-1 rounded">write_content</code></li>
                        <li>Install the app and copy the <strong>Admin API access token</strong></li>
                        <li>Find your Blog ID: <strong>Online Store → Blog Posts</strong> → check URL</li>
                      </ol>
                    </div>
                    <input
                      type="text"
                      placeholder="Your Shopify store URL (e.g. mystore.myshopify.com)"
                      value={existingBlogUrl}
                      onChange={e => setExistingBlogUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Shopify Admin API Access Token"
                      value={shopifyToken}
                      onChange={e => setShopifyToken(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Blog ID (number from URL)"
                      value={shopifyBlogId}
                      onChange={e => setShopifyBlogId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                  </div>
                )}

                {selectedPlatform === 'webflow' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-[#1b1916]">How to connect Webflow:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Webflow → <strong>Site Settings → Integrations → API Access</strong></li>
                        <li>Generate a new API token and copy it</li>
                        <li>Find Collection ID: <strong>CMS → your blog collection → settings</strong></li>
                      </ol>
                    </div>
                    <input
                      type="text"
                      placeholder="Your blog URL (e.g. https://mysite.webflow.io/blog)"
                      value={existingBlogUrl}
                      onChange={e => setExistingBlogUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Webflow API Token"
                      value={webflowToken}
                      onChange={e => setWebflowToken(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Blog Collection ID"
                      value={webflowCollectionId}
                      onChange={e => setWebflowCollectionId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                  </div>
                )}

                {selectedPlatform === 'php' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-3">
                      <p className="font-semibold text-[#1b1916]">Step 1: Create a webhook file on your server</p>
                      <p className="text-xs">Create a file at <code className="bg-white/60 px-1 rounded text-violet-700">/itgrows-webhook.php</code> in your site root with the following content:</p>
                      <pre className="text-xs text-slate-700 bg-white/60 rounded-lg p-3 overflow-auto font-mono whitespace-pre-wrap border border-black/10">{`<?php
$secret = '${placeholderToken}'; // Your site token
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || $input['token'] !== $secret) { http_response_code(401); exit; }

// Save article to your CMS database
// Example for October CMS (RainLab Blog):
// $post = new \\RainLab\\Blog\\Models\\Post;
// $post->title = $input['title'];
// $post->content = $input['content'];
// $post->meta_description = $input['metaDescription'];
// $post->published = true;
// $post->save();

http_response_code(200);
echo json_encode(['success' => true]);
?>`}</pre>
                    </div>
                    <input
                      type="text"
                      placeholder="Your blog URL (e.g. https://myblog.com)"
                      value={existingBlogUrl}
                      onChange={e => setExistingBlogUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Step 2: Webhook URL (e.g. https://yoursite.com/itgrows-webhook.php)"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                  </div>
                )}

                {selectedPlatform === 'other' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-[#1b1916]">Connect via Webhook</p>
                      <p>Works with any CMS or custom site. When an article is ready, we'll send it to your URL as a POST request with the full article content (JSON).</p>
                      <p>Your developer can set this up in minutes — share the URL below with them.</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Your blog URL (e.g. https://myblog.com/articles)"
                      value={existingBlogUrl}
                      onChange={e => setExistingBlogUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Webhook URL (where we send articles)"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono"
                    />
                  </div>
                )}

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
          </div>
        )}
      </div>
    </div>
  )
}
