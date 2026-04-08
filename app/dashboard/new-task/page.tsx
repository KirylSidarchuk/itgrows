"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addTask, updateTaskArticle, type TaskType } from "@/lib/tasks"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicSuggestion {
  title: string
  description: string
  keyword: string
}

interface SiteInfo {
  title: string
  metaDescription: string
  h1: string
  mainText: string
}

// ─── Channel cards ────────────────────────────────────────────────────────────

const channelCards = [
  { value: "seo_article", label: "SEO Article", icon: "✍️", desc: "AI writes and publishes an SEO-optimized blog post", active: true },
  { value: "google_ads", label: "Google Ads", icon: "🎯", desc: "Configure and launch a Google Ads campaign", active: false },
  { value: "linkedin_posts", label: "LinkedIn Posts", icon: "💼", desc: "Create and schedule LinkedIn content", active: false },
  { value: "instagram_posts", label: "Instagram Posts", icon: "📸", desc: "Generate and schedule Instagram posts", active: false },
  { value: "twitter_x", label: "Twitter / X", icon: "𝕏", desc: "Compose and schedule tweets", active: false },
]

// ─── SEO Multi-step flow ───────────────────────────────────────────────────────

type SeoStep = "url" | "topics" | "confirmation"

function SeoArticleFlow() {
  const router = useRouter()
  const [step, setStep] = useState<SeoStep>("url")
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState("")
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [topics, setTopics] = useState<TopicSuggestion[]>([])

  async function handleAnalyze() {
    if (!url.trim()) return
    setAnalyzing(true)
    setAnalyzeError("")
    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json() as { siteInfo?: SiteInfo; topics?: TopicSuggestion[]; error?: string }
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? "Failed to analyze website")
        return
      }
      setSiteInfo(data.siteInfo ?? null)
      setTopics(data.topics ?? [])
      setStep("topics")
    } catch {
      setAnalyzeError("Network error. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  function handleChooseTopic(topic: TopicSuggestion) {
    // Create task as in_progress
    const task = addTask({
      title: topic.title,
      description: topic.description,
      type: "seo_article",
    })
    // Update status to in_progress immediately
    updateTaskArticle(task.id, { keyword: topic.keyword, title: topic.title, content: "", metaDescription: "", keywords: [] })
    // Flip status back since updateTaskArticle sets done — we need in_progress
    // Use localStorage directly for in_progress
    const stored = localStorage.getItem("itgrows_tasks_v2")
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as Array<{ id: string; status: string; articleData?: unknown; updatedAt: string }>
        const idx = tasks.findIndex((t) => t.id === task.id)
        if (idx !== -1) {
          tasks[idx].status = "in_progress"
          tasks[idx].articleData = undefined
          tasks[idx].updatedAt = new Date().toISOString()
          localStorage.setItem("itgrows_tasks_v2", JSON.stringify(tasks))
        }
      } catch {
        // ignore
      }
    }

    setStep("confirmation")

    // Background generation
    fetch("/api/seo/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: topic.keyword }),
    })
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json() as { keyword?: string; title?: string; content?: string; metaDescription?: string; keywords?: string[] }
        if (data.title && data.content) {
          updateTaskArticle(task.id, {
            keyword: data.keyword ?? topic.keyword,
            title: data.title,
            content: data.content,
            metaDescription: data.metaDescription ?? "",
            keywords: data.keywords ?? [],
          })
        }
      })
      .catch(() => {
        // generation failed silently — user can retry from tasks
      })
  }

  // ── Step: URL input ──────────────────────────────────────────────────────────
  if (step === "url") {
    return (
      <Card className="bg-white border-black/10">
        <CardHeader>
          <CardTitle className="text-[#1b1916]">Website Analysis</CardTitle>
          <p className="text-slate-600 text-sm mt-1">
            Enter your website URL and we&apos;ll suggest the best article topics for your audience
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-700">Your website URL</Label>
            <Input
              placeholder="https://yoursite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze() }}
              className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>

          {analyzeError && (
            <p className="text-red-400 text-sm">{analyzeError}</p>
          )}

          {analyzing ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <span className="text-slate-700 text-sm">Analyzing your website...</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="border-black/10 text-slate-700 hover:bg-[#ebe9e5]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!url.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
              >
                Analyze Website
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Step: Topic suggestions ──────────────────────────────────────────────────
  if (step === "topics") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1b1916] mb-1">Topic Suggestions</h2>
          <p className="text-slate-600 text-sm">
            Based on{" "}
            <span className="text-violet-300">{siteInfo?.title || url}</span>
            {" "}— choose an article to generate
          </p>
        </div>
        <div className="grid gap-4">
          {topics.map((topic, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/10 bg-white p-5 hover:border-violet-500/50 hover:bg-white transition-all"
            >
              <h3 className="text-[#1b1916] font-semibold text-base mb-2">{topic.title}</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{topic.description}</p>
              <Button
                onClick={() => handleChooseTopic(topic)}
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916] text-sm"
              >
                Generate Article
              </Button>
            </div>
          ))}
          {topics.length === 0 && (
            <p className="text-slate-600 text-sm">No topics returned. Please try again.</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => { setStep("url"); setAnalyzeError("") }}
          className="border-black/10 text-slate-700 hover:bg-[#ebe9e5]"
        >
          ← Try another URL
        </Button>
      </div>
    )
  }

  // ── Step: Confirmation ───────────────────────────────────────────────────────
  return (
    <Card className="bg-green-900/20 border-green-500/30">
      <CardContent className="py-12 text-center">
        <p className="text-4xl mb-4">✓</p>
        <h3 className="text-[#1b1916] text-xl font-semibold mb-2">Your article is being written</h3>
        <p className="text-slate-600 mb-6">Track the progress in the Tasks section</p>
        <Button
          onClick={() => router.push("/dashboard/tasks")}
          className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
        >
          Go to Tasks
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Generic Task Form (non-SEO types) ────────────────────────────────────────

function GenericTaskForm({ type, onBack }: { type: TaskType; onBack: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    addTask({ title, description, type })
    setSuccess(true)
    setTimeout(() => {
      router.push("/dashboard/tasks")
    }, 1200)
  }

  if (success) {
    return (
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="py-12 text-center">
          <p className="text-4xl mb-4">✅</p>
          <h3 className="text-[#1b1916] text-xl font-semibold mb-2">Task created!</h3>
          <p className="text-slate-600">Redirecting to your tasks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-black/10">
      <CardHeader>
        <CardTitle className="text-[#1b1916]">Task Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g. Write article about AI marketing trends"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you need — target keywords, audience, tone, length, platforms, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-black/10 text-slate-700 hover:bg-[#ebe9e5]"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !title}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
            >
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("seo_article")

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">New Task</h1>
          <p className="text-slate-600">Choose what you want to create</p>
        </div>

        {/* Channel selector */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mb-8">
          {channelCards.map((card) => {
            const isSelected = selectedChannel === card.value
            if (!card.active) {
              return (
                <div
                  key={card.value}
                  className="relative p-5 rounded-2xl border border-black/10 bg-white opacity-60 cursor-not-allowed"
                >
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-violet-100 text-violet-500 rounded-full px-1.5 leading-4">
                    Soon
                  </span>
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-[#1b1916] text-sm font-medium">{card.label}</div>
                  <div className="text-slate-500 text-xs mt-1 leading-snug">{card.desc}</div>
                </div>
              )
            }
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => setSelectedChannel(card.value)}
                className={`relative p-5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-violet-400 bg-violet-50 shadow-sm"
                    : "border-black/10 bg-white hover:border-violet-300 hover:shadow-sm"
                }`}
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-sm font-medium ${isSelected ? "text-violet-700" : "text-[#1b1916]"}`}>
                  {card.label}
                </div>
                <div className="text-slate-500 text-xs mt-1 leading-snug">{card.desc}</div>
              </button>
            )
          })}
        </div>

        {/* SEO Article flow shown when SEO Article is selected */}
        {selectedChannel === "seo_article" && <SeoArticleFlow />}
      </div>
    </div>
  )
}
