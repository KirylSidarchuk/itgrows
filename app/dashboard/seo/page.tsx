"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUser } from "@/lib/auth"
import { getDefaultSite } from "@/lib/connectedSites"

type Language = "en" | "ru" | "uk"
type Tone = "Professional" | "Casual" | "Expert"

interface TopicSuggestion {
  title: string
  description: string
  keyword: string
}

interface GeneratedArticle {
  keyword: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
}

export default function SeoAutopilotPage() {
  const router = useRouter()

  const [hasSite, setHasSite] = useState(false)
  const [analyzing, setAnalyzing] = useState(true)
  const [topics, setTopics] = useState<TopicSuggestion[]>([])
  const [analyzeError, setAnalyzeError] = useState("")
  const [selected, setSelected] = useState<TopicSuggestion | null>(null)
  const [language, setLanguage] = useState<Language>("en")
  const [tone, setTone] = useState<Tone>("Professional")
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState("")

  const analyze = useCallback(async (siteUrl: string) => {
    setAnalyzing(true)
    setAnalyzeError("")
    setTopics([])
    setSelected(null)

    const usedKeywords = (() => {
      try {
        const tasks = JSON.parse(localStorage.getItem("itgrows_tasks_v2") || "[]") as Array<{ title?: string }>
        const scheduled = JSON.parse(localStorage.getItem("itgrows_schedule") || "[]") as Array<{ keyword?: string }>
        return [
          ...tasks.map(t => t.title ?? ""),
          ...scheduled.map(s => s.keyword ?? ""),
        ].filter(Boolean)
      } catch { return [] }
    })()

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl, usedKeywords }),
      })
      const data = (await res.json()) as { topics?: TopicSuggestion[]; error?: string }
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? "Failed to analyze site")
      } else {
        setTopics(data.topics ?? [])
      }
    } catch {
      setAnalyzeError("Network error. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }, [])

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push("/login"); return }

    const site = getDefaultSite()
    if (!site) {
      setHasSite(false)
      setAnalyzing(false)
      return
    }
    setHasSite(true)
    analyze(site.url)
  }, [router, analyze])

  const handleGenerate = async () => {
    if (!selected || generating) return
    setGenerating(true)
    setGenerateError("")

    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: selected.keyword, language, tone }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? "Generation failed")
      }
      const article = (await res.json()) as GeneratedArticle

      // Save as task
      const taskData = {
        id: Date.now().toString(),
        title: `SEO Article: ${article.title || selected.keyword}`,
        description: `SEO article targeting "${selected.keyword}"`,
        type: "seo_article" as const,
        status: "done" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        articleData: {
          keyword: selected.keyword,
          title: article.title,
          content: article.content,
          metaDescription: article.metaDescription,
          keywords: article.keywords,
        },
      }
      try {
        const tasks = JSON.parse(localStorage.getItem("itgrows_tasks_v2") || "[]")
        tasks.unshift(taskData)
        localStorage.setItem("itgrows_tasks_v2", JSON.stringify(tasks))
      } catch { /* ignore */ }

      // Save for results page
      sessionStorage.setItem("seo_result", JSON.stringify(taskData.articleData))
      router.push("/dashboard/seo/results")
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unexpected error")
      setGenerating(false)
    }
  }

  // No site connected
  if (!hasSite && !analyzing) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">SEO Autopilot</h1>
          <p className="text-slate-600 mb-8">Generate and publish SEO-optimized articles automatically</p>
          <div className="bg-white border border-black/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-2">Connect your website first</h2>
            <p className="text-slate-500 text-sm mb-6">We'll analyze your site and suggest the best SEO topics for you</p>
            <Link href="/dashboard/settings">
              <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
                Go to Settings →
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">SEO Autopilot</h1>
            <p className="text-slate-600">Choose a topic and generate your article</p>
          </div>
          {!analyzing && !generating && (
            <button
              onClick={() => { const site = getDefaultSite(); if (site) analyze(site.url) }}
              className="text-sm text-violet-600 hover:text-violet-500 transition-colors"
            >
              ↻ Refresh topics
            </button>
          )}
        </div>

        {/* Analyzing */}
        {analyzing && (
          <div className="bg-white border border-black/10 rounded-2xl p-12 text-center">
            <span className="inline-block w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-600 text-sm">Analyzing your site and finding the best topics...</p>
          </div>
        )}

        {/* Error */}
        {!analyzing && analyzeError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <p className="text-red-600 text-sm mb-4">{analyzeError}</p>
            <button
              onClick={() => { const site = getDefaultSite(); if (site) analyze(site.url) }}
              className="text-sm text-violet-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Topic cards */}
        {!analyzing && topics.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Suggested topics</p>
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => setSelected(selected?.keyword === topic.keyword ? null : topic)}
                disabled={generating}
                className={`w-full text-left rounded-2xl border p-5 transition-all ${
                  selected?.keyword === topic.keyword
                    ? "border-violet-400 bg-violet-50 shadow-sm"
                    : "border-black/10 bg-white hover:border-violet-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    selected?.keyword === topic.keyword ? "border-violet-500 bg-violet-500" : "border-slate-300"
                  }`}>
                    {selected?.keyword === topic.keyword && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[#1b1916] font-semibold text-sm mb-1">{topic.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{topic.description}</p>
                    <span className="inline-block mt-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md font-medium">
                      {topic.keyword}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Language + Tone (only when topic selected) */}
        {selected && !generating && (
          <div className="bg-white border border-black/10 rounded-2xl p-5 mb-6 space-y-4">
            <div className="flex gap-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Language</p>
                <div className="flex gap-2">
                  {(["en", "ru", "uk"] as Language[]).map(l => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        language === l ? "bg-violet-100 border-violet-400 text-violet-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {l === "en" ? "EN" : l === "ru" ? "RU" : "UK"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tone</p>
                <div className="flex gap-2">
                  {(["Professional", "Casual", "Expert"] as Tone[]).map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        tone === t ? "bg-pink-100 border-pink-400 text-pink-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate error */}
        {generateError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {generateError}
          </div>
        )}

        {/* Generate button */}
        {!analyzing && (
          <button
            onClick={handleGenerate}
            disabled={!selected || generating}
            className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating article...
              </>
            ) : (
              selected ? `Generate: ${selected.keyword}` : "Select a topic above"
            )}
          </button>
        )}
      </div>
    </div>
  )
}
