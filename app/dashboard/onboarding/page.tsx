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

type ConnectStep = "detecting" | "wordpress" | "shopify" | "webflow" | "cname"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [siteUrl, setSiteUrl] = useState("")
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [blogDomain, setBlogDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingMsg, setLoadingMsg] = useState("")
  const [showFullArticle, setShowFullArticle] = useState(false)
  const [topicImages, setTopicImages] = useState<Record<number, string>>({})
  const [genTimer, setGenTimer] = useState(0)

  // Connect step state
  const [connectStep, setConnectStep] = useState<ConnectStep>("detecting")
  const [detectedPlatform, setDetectedPlatform] = useState<string>("custom")
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // WordPress fields
  const [wpToken, setWpToken] = useState("")

  // Shopify fields
  const [shopifyToken, setShopifyToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")

  // Webflow fields
  const [webflowToken, setWebflowToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")

  const [placeholderToken] = useState(() => `onb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`)

  // Restore site URL from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_siteUrl")
    if (saved) setSiteUrl(saved)
  }, [])

  // Derive domain from URL
  const derivedDomain = (() => {
    try {
      const u = siteUrl.trim().startsWith("http") ? siteUrl.trim() : "https://" + siteUrl.trim()
      return new URL(u).hostname
    } catch {
      return siteUrl.trim()
    }
  })()

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
          .catch(() => {})
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

  async function handleComplete(sitePayload?: Record<string, string | boolean>) {
    setLoading(true)
    setError("")
    setLoadingMsg("")
    try {
      await fetch("/api/user/onboarding-complete", { method: "POST" })

      interface SavedSite {
        id: string
        siteToken: string
        platform: string
        url: string
        blogDomain?: string | null
      }
      let savedSite: SavedSite | null = null

      if (sitePayload && Object.keys(sitePayload).length > 0) {
        const siteRes = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sitePayload, isDefault: true }),
        })
        if (siteRes.ok) {
          const siteData = await siteRes.json() as { site?: SavedSite }
          savedSite = siteData.site ?? null
        }
      }

      // Auto-publish the selected article to the connected site
      if (savedSite && article) {
        setLoadingMsg("Publishing your first article...")
        try {
          const publishRes = await fetch("/api/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteUrl: savedSite.url,
              siteToken: savedSite.siteToken,
              platform: savedSite.platform,
              title: article.title,
              content: article.content,
              keywords: article.keywords,
              siteId: savedSite.id,
            }),
          })
          if (publishRes.ok) {
            const publishData = await publishRes.json() as { url?: string }
            const blogUrl = publishData.url ?? (savedSite.blogDomain ? `https://${savedSite.blogDomain}` : savedSite.url)
            setPublishedUrl(blogUrl)
            setLoading(false)
            setShowSuccess(true)
            // Set up calendar in background
            fetch("/api/schedule/batch", { method: "POST" }).catch(() => {})
            return
          }
        } catch {
          // Non-fatal — fall through to redirect
        }
      }

      setLoadingMsg("Setting up your 15-day content calendar...")
      await fetch("/api/schedule/batch", { method: "POST" })

      router.push("/dashboard/calendar")
    } catch {
      router.push("/dashboard/calendar")
    }
  }

  async function handleStartConnect() {
    setConnectStep("detecting")
    setStep(4)
    try {
      const res = await fetch("/api/detect-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl.trim() }),
      })
      const data = await res.json() as { platform?: string }
      const p = data.platform ?? "custom"
      setDetectedPlatform(p)
      if (p === "wordpress") {
        setConnectStep("wordpress")
      } else if (p === "shopify") {
        setConnectStep("shopify")
      } else if (p === "webflow") {
        setConnectStep("webflow")
      } else {
        setBlogDomain(`blog.${derivedDomain}`)
        setConnectStep("cname")
      }
    } catch {
      setDetectedPlatform("custom")
      setBlogDomain(`blog.${derivedDomain}`)
      setConnectStep("cname")
    }
  }

  // Extract first 3 paragraphs from HTML content
  function getPreview(html: string): string {
    const matches = html.match(/<p>.*?<\/p>/g) ?? []
    return matches.slice(0, 3).join("\n")
  }

  const detectionLabel = (() => {
    if (detectedPlatform === "wordpress") return "WordPress detected"
    if (detectedPlatform === "shopify") return "Shopify detected"
    if (detectedPlatform === "webflow") return "Webflow detected"
    if (detectedPlatform === "nextjs") return "Next.js / React detected"
    if (detectedPlatform === "octobercms") return "October CMS detected"
    if (detectedPlatform === "php") return "PHP / Custom CMS detected"
    return "Custom website detected"
  })()

  // Success screen after article published
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-black/10 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-[#1b1916] mb-3">Your first article has been published!</h1>
            <p className="text-slate-600 mb-6">
              {article?.title && (
                <span className="block font-medium text-[#1b1916] mb-2">&quot;{article.title}&quot;</span>
              )}
              Your article is now live on your site. New articles will be published automatically every day.
            </p>
            {publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mb-6 text-violet-600 underline text-sm break-all"
              >
                View article at {publishedUrl}
              </a>
            )}
            <button
              onClick={() => router.push("/dashboard/calendar")}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
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
              onClick={handleStartConnect}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors mb-3"
            >
              Publish this article →
            </button>

            <button
              onClick={() => handleComplete()}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}

        {/* Step 4: Connect blog */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">

            {/* Detecting spinner */}
            {connectStep === "detecting" && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-spin inline-block">⟳</div>
                <p className="text-[#1b1916] font-semibold">Detecting your platform…</p>
                <p className="text-slate-500 text-sm mt-1">Scanning {siteUrl}</p>
              </div>
            )}

            {/* Detection badge — shown on all non-detecting sub-steps */}
            {connectStep !== "detecting" && (
              <div className="rounded-xl bg-[#f9f8f7] border border-black/10 p-3 flex items-center gap-3 mb-6">
                <span className="text-green-500 font-bold text-lg">✓</span>
                <div>
                  <p className="text-[#1b1916] font-semibold text-sm">{detectionLabel}</p>
                  <p className="text-slate-500 text-xs">{siteUrl}</p>
                </div>
              </div>
            )}

            {/* WordPress */}
            {connectStep === "wordpress" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#1b1916] mb-1">Connect WordPress</h2>
                  <p className="text-slate-600 text-sm">Install the plugin and paste your Site Token.</p>
                </div>

                <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2 mb-5">
                  <ol className="list-decimal list-inside space-y-2">
                    <li><a href="/api/wp-plugin/download" className="text-violet-600 underline font-medium">Download ItGrows WordPress Plugin</a></li>
                    <li>Go to <strong>WP Admin → Plugins → Add New → Upload Plugin → Install → Activate</strong></li>
                    <li>Go to <strong>Settings → ItGrows.ai</strong> and copy your <strong>Site Token</strong></li>
                    <li>Paste the Site Token in the field below</li>
                  </ol>
                </div>

                <input
                  type="text"
                  placeholder="Site Token (igt_...)"
                  value={wpToken}
                  onChange={e => setWpToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono mb-4"
                />

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={() => handleComplete({
                    name: siteUrl.trim(),
                    url: siteUrl.trim(),
                    platform: "wordpress",
                    siteToken: wpToken.trim(),
                  })}
                  disabled={loading || !wpToken.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="animate-spin">⟳</span> Connecting…</> : "Connect WordPress →"}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* Shopify */}
            {connectStep === "shopify" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#1b1916] mb-1">Connect Shopify</h2>
                  <p className="text-slate-600 text-sm">Create a private app and enter your credentials.</p>
                </div>

                <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2 mb-5">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Shopify Admin → <strong>Settings → Apps → Develop apps</strong></li>
                    <li>Create an app, set API scope: <code className="bg-slate-100 px-1 rounded">write_content</code></li>
                    <li>Install the app and copy the <strong>Admin API access token</strong></li>
                    <li>Find your Blog ID: <strong>Online Store → Blog Posts</strong> → check the URL</li>
                  </ol>
                </div>

                <input
                  type="text"
                  placeholder="Shopify Admin API Access Token"
                  value={shopifyToken}
                  onChange={e => setShopifyToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono mb-3"
                />
                <input
                  type="text"
                  placeholder="Blog ID (number from URL)"
                  value={shopifyBlogId}
                  onChange={e => setShopifyBlogId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono mb-4"
                />

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={() => handleComplete({
                    name: siteUrl.trim(),
                    url: siteUrl.trim(),
                    platform: "shopify",
                    siteToken: shopifyToken.trim(),
                    shopifyToken: shopifyToken.trim(),
                    shopifyBlogId: shopifyBlogId.trim(),
                  })}
                  disabled={loading || !shopifyToken.trim() || !shopifyBlogId.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="animate-spin">⟳</span> Connecting…</> : "Connect Shopify →"}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* Webflow */}
            {connectStep === "webflow" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#1b1916] mb-1">Connect Webflow</h2>
                  <p className="text-slate-600 text-sm">Generate an API token and enter your Collection ID.</p>
                </div>

                <div className="bg-[#f9f8f7] rounded-xl p-4 border border-black/10 text-sm text-slate-600 space-y-2 mb-5">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Webflow → <strong>Site Settings → Integrations → API Access</strong></li>
                    <li>Generate a new API token and copy it</li>
                    <li>Find Collection ID: <strong>CMS → your blog collection → settings</strong></li>
                  </ol>
                </div>

                <input
                  type="text"
                  placeholder="Webflow API Token"
                  value={webflowToken}
                  onChange={e => setWebflowToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono mb-3"
                />
                <input
                  type="text"
                  placeholder="Blog Collection ID"
                  value={webflowCollectionId}
                  onChange={e => setWebflowCollectionId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 text-sm font-mono mb-4"
                />

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={() => handleComplete({
                    name: siteUrl.trim(),
                    url: siteUrl.trim(),
                    platform: "webflow",
                    siteToken: webflowToken.trim(),
                    webflowToken: webflowToken.trim(),
                    webflowCollectionId: webflowCollectionId.trim(),
                  })}
                  disabled={loading || !webflowToken.trim() || !webflowCollectionId.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="animate-spin">⟳</span> Connecting…</> : "Connect Webflow →"}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}

            {/* CNAME — custom / Next.js / PHP / OctoberCMS / unknown */}
            {connectStep === "cname" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#1b1916] mb-1">Set up your blog</h2>
                  <p className="text-slate-600 text-sm">
                    We&apos;ll create a blog at <strong>blog.{derivedDomain}</strong>. Just add one DNS record.
                  </p>
                </div>

                <div className="bg-[#f9f8f7] rounded-xl p-5 border border-black/10 mb-5">
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
                    DNS changes take effect in 5–30 minutes.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block">
                    <span className="text-sm font-medium text-[#1b1916] mb-1 block">
                      Your blog URL after DNS:
                    </span>
                    <input
                      type="text"
                      placeholder={`blog.${derivedDomain}`}
                      value={blogDomain}
                      onChange={(e) => setBlogDomain(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400 font-mono text-sm"
                    />
                    <span className="text-slate-500 text-xs mt-1 block">Pre-filled with suggested subdomain — change if needed</span>
                  </label>
                </div>

                {loadingMsg && (
                  <p className="text-violet-600 text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> {loadingMsg}
                  </p>
                )}

                <button
                  onClick={() => handleComplete({
                    name: siteUrl.trim(),
                    url: siteUrl.trim(),
                    platform: "custom",
                    siteToken: placeholderToken,
                    blogDomain: blogDomain.trim(),
                  })}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="animate-spin">⟳</span> Setting up…</>
                  ) : (
                    "I've added the DNS record →"
                  )}
                </button>

                <button
                  onClick={() => handleComplete()}
                  className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Skip for now →
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
