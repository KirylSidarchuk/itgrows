"use client"

import { useState } from "react"
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const placeholderToken = `onb_${Math.random().toString(36).slice(2, 10)}`

  async function handleAnalyzeSite() {
    if (!siteUrl.trim()) return
    setLoading(true)
    setError("")
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
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch("/api/user/onboarding-complete", { method: "POST" })
      router.push("/dashboard")
    } catch {
      router.push("/dashboard")
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
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTopic?.title === topic.title
                      ? "border-violet-500 bg-violet-50"
                      : "border-black/10 hover:border-violet-300 bg-[#f9f8f7]"
                  }`}
                >
                  <p className="font-semibold text-[#1b1916] mb-1">{topic.title}</p>
                  <p className="text-slate-600 text-sm">{topic.description}</p>
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
                  <span className="animate-spin">⟳</span> Generating article…
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

            <div className="bg-[#f9f8f7] rounded-xl p-5 mb-4 border border-black/10">
              <h3 className="text-lg font-bold text-[#1b1916] mb-3">{article.title}</h3>
              <div
                className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: getPreview(article.content) }}
              />
              <p className="text-violet-500 text-xs mt-3 italic">… article continues</p>
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

            <button
              onClick={() => setStep(4)}
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

        {/* Step 4: Connect site */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/10">
            <button
              onClick={() => setStep(3)}
              className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔗</div>
              <h2 className="text-2xl font-bold text-[#1b1916] mb-2">Connect your site to publish</h2>
              <p className="text-slate-600 text-sm">Choose how you&apos;d like to publish your content</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setBlogOption("existing")}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  blogOption === "existing"
                    ? "border-violet-500 bg-violet-50"
                    : "border-black/10 hover:border-violet-300 bg-[#f9f8f7]"
                }`}
              >
                <div className="text-2xl mb-2">📝</div>
                <p className="font-semibold text-[#1b1916] text-sm">I have a blog</p>
                <p className="text-slate-500 text-xs mt-1">Connect your existing website</p>
              </button>

              <button
                onClick={() => setBlogOption("new")}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  blogOption === "new"
                    ? "border-violet-500 bg-violet-50"
                    : "border-black/10 hover:border-violet-300 bg-[#f9f8f7]"
                }`}
              >
                <div className="text-2xl mb-2">✨</div>
                <p className="font-semibold text-[#1b1916] text-sm">I don&apos;t have a blog yet</p>
                <p className="text-slate-500 text-xs mt-1">We&apos;ll create one on your site</p>
              </button>
            </div>

            {blogOption === "existing" && (
              <div className="mb-6">
                <label className="block">
                  <span className="text-sm font-medium text-[#1b1916] mb-1 block">Your blog URL</span>
                  <input
                    type="text"
                    placeholder="e.g. https://myblog.com"
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/15 bg-[#f9f8f7] focus:outline-none focus:ring-2 focus:ring-violet-400 text-[#1b1916] placeholder:text-slate-400"
                  />
                </label>
              </div>
            )}

            {blogOption && (
              <div className="mb-6 bg-[#f9f8f7] rounded-xl p-4 border border-black/10">
                <p className="text-sm font-medium text-[#1b1916] mb-2">Add this to your site&apos;s HTML:</p>
                <code className="text-xs text-violet-700 bg-violet-50 p-3 rounded-lg block overflow-x-auto whitespace-nowrap">
                  {`<script src="https://itgrows.ai/widget.js?token=${placeholderToken}" defer></script>`}
                </code>
              </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
