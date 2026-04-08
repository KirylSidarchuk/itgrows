"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { getConnectedSites, getDefaultSite } from "@/lib/connectedSites"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

type Language = "en" | "ru" | "uk"
type Tone = "Professional" | "Casual" | "Friendly" | "Authoritative" | "Educational" | "Conversational"
type PostStatus = "scheduled" | "generating" | "published" | "failed"

const TONE_OPTIONS: Tone[] = ["Professional", "Casual", "Friendly", "Authoritative", "Educational", "Conversational"]

interface ScheduledPost {
  id: string
  keyword: string
  language: Language
  tone: Tone
  scheduledDate: string
  status: PostStatus
  taskId?: string
  blogPostSlug?: string
  articleData?: {
    keyword?: string
    title?: string
    content?: string
    metaDescription?: string
    keywords?: string[]
  } | null
}

interface TopicSuggestion {
  title: string
  description: string
  keyword: string
}

type ModalStep = "no-site" | "analyzing" | "topics" | "configure"

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

function getWeekDates(offset = 0): string[] {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = (day === 0 ? -6 : 1 - day) + offset * 7
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    return d.toISOString().split("T")[0]
  })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

const STATUS_STYLES: Record<PostStatus, string> = {
  scheduled: "bg-slate-100 text-slate-700 border border-slate-300",
  generating: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  published: "bg-green-100 text-green-800 border border-green-300",
  failed: "bg-red-100 text-red-800 border border-red-300",
}

const STATUS_LABELS: Record<PostStatus, string> = {
  scheduled: "Scheduled",
  generating: "Generating...",
  published: "Published",
  failed: "Failed",
}

const LANG_LABELS: Record<Language, string> = {
  en: "EN",
  ru: "RU",
  uk: "UK",
}

function sortPosts(posts: ScheduledPost[]): ScheduledPost[] {
  return [...posts].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}

export default function CalendarPage() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [view, setView] = useState<"list" | "calendar">("list")
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Auto-publish / batch scheduling state
  const [batchStatus, setBatchStatus] = useState<"idle" | "loading" | "success" | "no-site">("idle")
  const [batchTone, setBatchTone] = useState<Tone>("Professional")
  const [defaultSiteUrl, setDefaultSiteUrl] = useState<string | null>(null)
  const [sitesChecked, setSitesChecked] = useState(false)

  // Modal state
  const [modalStep, setModalStep] = useState<ModalStep>("analyzing")
  const [analyzeError, setAnalyzeError] = useState("")
  const [topics, setTopics] = useState<TopicSuggestion[]>([])
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null)

  // Configure step state
  const [language, setLanguage] = useState<Language>("en")
  const [tone, setTone] = useState<Tone>("Professional")
  const [scheduledDate, setScheduledDate] = useState(getTodayString())
  const [scheduling, setScheduling] = useState(false)

  // Publishing state: postId -> boolean
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [updatingToneIds, setUpdatingToneIds] = useState<Set<string>>(new Set())

  // Preview modal state
  const [previewPost, setPreviewPost] = useState<ScheduledPost | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewGenerating, setPreviewGenerating] = useState(false)
  const [previewError, setPreviewError] = useState("")
  const [previewTitle, setPreviewTitle] = useState("")
  const [previewContent, setPreviewContent] = useState("")
  const [previewMeta, setPreviewMeta] = useState("")
  const [previewArticle, setPreviewArticle] = useState<{
    keyword: string
    title: string
    content: string
    metaDescription: string
    keywords: string[]
  } | null>(null)
  const [previewPublishing, setPreviewPublishing] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/schedule/posts")
      if (res.ok) {
        const data = (await res.json()) as { posts: ScheduledPost[] }
        setPosts(sortPosts(data.posts.map((p: any) => ({
          ...p,
          blogPostSlug: p.blogPostSlug || p.articleData?.blogPostSlug,
        }))))
      }
    } catch {
      // ignore — leave posts empty
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // Fetch default site URL for auto-publish card
  useEffect(() => {
    async function checkSites() {
      try {
        const res = await fetch("/api/sites")
        if (res.ok) {
          const data = (await res.json()) as {
            sites: Array<{ url: string; isDefault: boolean }>
          }
          const sites = data.sites ?? []
          const def = sites.find((s) => s.isDefault) ?? sites[0] ?? null
          setDefaultSiteUrl(def ? def.url : null)
          setBatchStatus(def ? "idle" : "no-site")
        } else {
          setBatchStatus("no-site")
        }
      } catch {
        setBatchStatus("no-site")
      } finally {
        setSitesChecked(true)
      }
    }
    checkSites()
  }, [])

  const handleBatchSchedule = useCallback(async () => {
    if (!defaultSiteUrl) return
    setBatchStatus("loading")
    try {
      const res = await fetch("/api/schedule/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: defaultSiteUrl, tone: batchTone }),
      })
      if (res.ok) {
        setBatchStatus("success")
        await loadPosts()
      } else {
        setBatchStatus("idle")
      }
    } catch {
      setBatchStatus("idle")
    }
  }, [defaultSiteUrl, batchTone, loadPosts])

  const openModal = useCallback(async () => {
    // Reset modal state
    setAnalyzeError("")
    setTopics([])
    setSelectedTopic(null)
    setLanguage("en")
    setTone("Professional")
    setScheduledDate(getTodayString())
    setScheduling(false)

    const sites = getConnectedSites()
    const defaultSite = getDefaultSite()

    if (sites.length === 0 || !defaultSite) {
      setModalStep("no-site")
      setShowModal(true)
      return
    }

    // Has a default site — start analyzing
    setModalStep("analyzing")
    setShowModal(true)

    // Collect already used keywords from scheduled posts to avoid repeating
    const usedKeywords = posts.map((p) => p.keyword).filter(Boolean)

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: defaultSite.url, usedKeywords }),
      })
      const data = (await res.json()) as { topics?: TopicSuggestion[]; error?: string }
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? "Failed to analyze website")
        setTopics([])
      } else {
        setTopics(data.topics ?? [])
      }
      setModalStep("topics")
    } catch {
      setAnalyzeError("Network error. Please try again.")
      setModalStep("topics")
    }
  }, [posts])

  const handleSelectTopic = (topic: TopicSuggestion) => {
    setSelectedTopic(topic)
    setModalStep("configure")
  }

  const handleSchedule = async () => {
    if (!selectedTopic) return

    setScheduling(true)
    try {
      const res = await fetch("/api/schedule/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: selectedTopic.keyword,
          language,
          tone,
          scheduledDate,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as { post: ScheduledPost }
        setPosts((prev) => sortPosts([...prev, data.post]))
      }

      setShowModal(false)
    } catch {
      setShowModal(false)
    } finally {
      setScheduling(false)
    }
  }

  const handlePublishNow = async (post: ScheduledPost) => {
    if (publishingIds.has(post.id)) return

    setPublishingIds((prev) => new Set(prev).add(post.id))

    const updatePost = (id: string, updates: Partial<ScheduledPost>) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      fetch(`/api/schedule/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch(() => {})
    }

    updatePost(post.id, { status: "generating" })

    try {
      const genRes = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: post.keyword, language: post.language, tone: post.tone }),
      })
      if (!genRes.ok) {
        const err = (await genRes.json()) as { error?: string }
        throw new Error(err.error ?? "Generation failed")
      }
      const article = (await genRes.json()) as {
        keyword: string
        title: string
        content: string
        metaDescription: string
        keywords: string[]
      }

      const pubRes = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      })

      let slug = ""
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as { post?: { slug?: string } }
        slug = pubData.post?.slug ?? ""
      }

      updatePost(post.id, { status: "published", blogPostSlug: slug || undefined })
      // Persist blogPostSlug to DB
      if (slug) {
        await fetch(`/api/schedule/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleData: { blogPostSlug: slug }, status: "published" }),
        })
      }
    } catch {
      updatePost(post.id, { status: "failed" })
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
    }
  }

  const handleDelete = async (post: ScheduledPost) => {
    if (!confirm(`Delete "${post.keyword}"?`)) return
    setDeletingIds(prev => new Set(prev).add(post.id))
    try {
      await fetch(`/api/schedule/posts/${post.id}`, { method: "DELETE" })
      setPosts(prev => prev.filter(p => p.id !== post.id))
    } catch {
      // ignore
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(post.id); return s })
    }
  }

  const handleToneChange = async (post: ScheduledPost, newTone: Tone) => {
    if (updatingToneIds.has(post.id)) return
    setUpdatingToneIds((prev) => new Set(prev).add(post.id))
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, tone: newTone } : p)))
    try {
      await fetch(`/api/schedule/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: newTone }),
      })
    } catch {
      // revert on error
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, tone: post.tone } : p)))
    } finally {
      setUpdatingToneIds((prev) => { const s = new Set(prev); s.delete(post.id); return s })
    }
  }

  const handlePreview = async (post: ScheduledPost) => {
    setPreviewPost(post)
    setPreviewOpen(true)
    setPreviewError("")

    // If articleData already exists on the post, use it directly without regenerating
    if (post.articleData?.content && post.articleData?.title) {
      const cached = {
        keyword: post.articleData.keyword ?? post.keyword,
        title: post.articleData.title,
        content: post.articleData.content,
        metaDescription: post.articleData.metaDescription ?? "",
        keywords: post.articleData.keywords ?? [],
      }
      setPreviewArticle(cached)
      setPreviewTitle(cached.title)
      setPreviewContent(cached.content)
      setPreviewMeta(cached.metaDescription)
      setPreviewGenerating(false)
      return
    }

    setPreviewGenerating(true)
    setPreviewTitle("")
    setPreviewContent("")
    setPreviewMeta("")
    setPreviewArticle(null)

    try {
      const genRes = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: post.keyword, language: post.language, tone: post.tone }),
      })
      if (!genRes.ok) {
        const err = (await genRes.json()) as { error?: string }
        throw new Error(err.error ?? "Generation failed")
      }
      const article = (await genRes.json()) as {
        keyword: string
        title: string
        content: string
        metaDescription: string
        keywords: string[]
      }
      setPreviewArticle(article)
      setPreviewTitle(article.title)
      setPreviewContent(article.content)
      setPreviewMeta(article.metaDescription)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setPreviewGenerating(false)
    }
  }

  const handlePreviewPublish = async () => {
    if (!previewPost || !previewArticle) return
    setPreviewPublishing(true)

    const post = previewPost
    const article = { ...previewArticle, title: previewTitle, content: previewContent, metaDescription: previewMeta }

    const updatePost = (id: string, updates: Partial<ScheduledPost>) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      fetch(`/api/schedule/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch(() => {})
    }

    try {
      const pubRes = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      })

      let slug = ""
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as { post?: { slug?: string } }
        slug = pubData.post?.slug ?? ""
      }

      updatePost(post.id, { status: "published", blogPostSlug: slug || undefined })
      // Persist blogPostSlug to DB
      if (slug) {
        await fetch(`/api/schedule/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleData: { blogPostSlug: slug }, status: "published" }),
        })
      }
      setPreviewOpen(false)
    } catch {
      updatePost(post.id, { status: "failed" })
      setPreviewError("Publishing failed. Please try again.")
    } finally {
      setPreviewPublishing(false)
    }
  }

  // Group posts by date for list view
  const groupedByDate = posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const d = post.scheduledDate
    if (!acc[d]) acc[d] = []
    acc[d].push(post)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort()

  // Calendar weeks
  const weeks = [getWeekDates(0), getWeekDates(1), getWeekDates(2)]
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Content Calendar
            </h1>
            <p className="text-slate-600">Plan and auto-publish SEO articles on a schedule</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* View toggle */}
            <div className="flex rounded-lg border border-black/10 overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === "list"
                    ? "bg-violet-600/30 text-violet-900"
                    : "text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-black/10 ${
                  view === "calendar"
                    ? "bg-violet-600/30 text-violet-900"
                    : "text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
                }`}
              >
                Calendar
              </button>
            </div>
            <Button
              onClick={openModal}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
            >
              + Schedule Article
            </Button>
          </div>
        </div>

        {/* Auto-Publish Card */}
        {sitesChecked && (
          <Card className="mb-8 bg-white border-black/10">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1b1916] mb-1">Auto-Publishing</h2>
                    <p className="text-sm text-slate-600">
                      Generate and publish 1 article per day automatically. We&apos;ll plan 15 articles based on your site.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {batchStatus === "no-site" && (
                      <p className="text-sm text-amber-600 font-medium">
                        Connect a site in Settings first
                      </p>
                    )}
                    {batchStatus === "loading" && (
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-violet-400 rounded-full animate-spin" />
                        Scheduling...
                      </span>
                    )}
                    {batchStatus === "success" && (
                      <p className="text-sm text-green-600 font-medium">
                        15 articles scheduled! First one publishes tomorrow.
                      </p>
                    )}
                  </div>
                </div>
                {batchStatus === "idle" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tone for all 15 articles</p>
                      <div className="flex flex-wrap gap-2">
                        {TONE_OPTIONS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setBatchTone(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              batchTone === t
                                ? "bg-green-100 border-green-400 text-green-700"
                                : "border-black/10 text-slate-600 hover:border-black/20 hover:text-[#1b1916]"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleBatchSchedule}
                      className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white whitespace-nowrap shrink-0"
                    >
                      Schedule 15 Articles
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <span className="inline-block w-5 h-5 border-2 border-black/20 border-t-violet-400 rounded-full animate-spin mr-3" />
            Loading schedule...
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-[#1b1916] mb-2">No articles scheduled</h3>
            <p className="text-slate-600 mb-6">
              Schedule your first article to get started with content automation.
            </p>
            <Button
              onClick={openModal}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
            >
              + Schedule Article
            </Button>
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && posts.length > 0 && view === "list" && (
          <Card className="bg-white border-black/10">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Language
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Tone
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {sortedDates.map((date) => (
                    <>
                      {/* Date group header */}
                      <tr key={`group-${date}`} className="bg-[#ebe9e5]/20">
                        <td
                          colSpan={6}
                          className="px-6 py-2 text-xs font-semibold text-[#1b1916] uppercase tracking-wider"
                        >
                          {formatDateFull(date)}
                          {date === getTodayString() && (
                            <span className="ml-2 text-violet-400">(Today)</span>
                          )}
                        </td>
                      </tr>
                      {groupedByDate[date].map((post) => (
                        <tr key={post.id} className="hover:bg-[#ebe9e5] transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-700">{formatDate(date)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {post.status === "published" && post.blogPostSlug ? (
                                <img
                                  src={`/api/blog/image/by-slug/${post.blogPostSlug}`}
                                  className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                                  alt=""
                                />
                              ) : (
                                <div className="w-14 h-10 bg-slate-100 rounded-lg flex-shrink-0" />
                              )}
                              <span className="text-sm text-[#1b1916] font-medium">{post.keyword}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono bg-[#ebe9e5] text-slate-700 px-2 py-1 rounded">
                              {LANG_LABELS[post.language as Language] ?? post.language.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(post.status === "scheduled" || post.status === "failed") ? (
                              <select
                                value={post.tone}
                                disabled={updatingToneIds.has(post.id)}
                                onChange={(e) => handleToneChange(post, e.target.value as Tone)}
                                className="text-xs border border-black/10 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {TONE_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-[#1b1916]">{post.tone}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[post.status]}`}
                            >
                              {post.status === "generating" && (
                                <span className="inline-block w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              )}
                              {STATUS_LABELS[post.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {post.status === "scheduled" && (
                                <>
                                  <Button size="sm" disabled={publishingIds.has(post.id)} onClick={() => handlePreview(post)} className="text-xs bg-slate-100 hover:bg-slate-200 text-[#1b1916] border border-slate-300">Preview</Button>
                                  <Button size="sm" disabled={publishingIds.has(post.id)} onClick={() => handlePublishNow(post)} className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-800 border border-violet-300">Publish Now</Button>
                                </>
                              )}
                              {post.status === "failed" && (
                                <>
                                  <Button size="sm" disabled={publishingIds.has(post.id)} onClick={() => handlePreview(post)} className="text-xs bg-slate-100 hover:bg-slate-200 text-[#1b1916] border border-slate-300">Preview</Button>
                                  <Button size="sm" disabled={publishingIds.has(post.id)} onClick={() => handlePublishNow(post)} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 border border-red-300">Retry</Button>
                                </>
                              )}
                              {post.status === "published" && post.blogPostSlug && (
                                <a href={`/blog/${post.blogPostSlug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:text-violet-800 underline font-medium">View Post</a>
                              )}
                              <button
                                disabled={deletingIds.has(post.id)}
                                onClick={() => handleDelete(post)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* CALENDAR VIEW */}
        {!loading && view === "calendar" && (
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-[#1b1916] uppercase py-2">
                  {d}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((dateStr) => {
                  const dayPosts = posts.filter((p) => p.scheduledDate === dateStr)
                  const isToday = dateStr === getTodayString()
                  const isPast = dateStr < getTodayString()

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[100px] rounded-lg border p-2 transition-colors ${
                        isToday
                          ? "border-violet-500/50 bg-violet-600/10"
                          : isPast
                          ? "border-black/5 bg-[#ebe9e5]"
                          : "border-black/10 bg-white"
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold mb-1.5 ${
                          isToday ? "text-violet-600" : isPast ? "text-[#1b1916]" : "text-[#1b1916]"
                        }`}
                      >
                        {formatDate(dateStr)}
                        {isToday && <span className="ml-1 text-violet-400">•</span>}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.map((post) => (
                          <div
                            key={post.id}
                            className={`text-[10px] px-1.5 py-1 rounded font-medium truncate cursor-default ${STATUS_STYLES[post.status]}`}
                            title={`${post.keyword} (${post.tone}, ${post.language.toUpperCase()})`}
                          >
                            {post.keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-white border-black/10 shadow-2xl">
            <CardHeader className="border-b border-black/10">
              <CardTitle className="text-[#1b1916]">Schedule Article</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">

              {/* Step: no connected site */}
              {modalStep === "no-site" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-600/10 p-4">
                    <p className="text-amber-300 text-sm leading-relaxed">
                      Connect your website in Settings first to auto-generate topics
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1 border-black/10 text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard/settings")}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
                    >
                      Go to Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: analyzing */}
              {modalStep === "analyzing" && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <span className="inline-block w-8 h-8 border-2 border-black/20 border-t-violet-400 rounded-full animate-spin" />
                  <p className="text-slate-700 text-sm">Analyzing your site...</p>
                </div>
              )}

              {/* Step: topic suggestions */}
              {modalStep === "topics" && (
                <div className="space-y-4">
                  {analyzeError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-600/10 p-4">
                      <p className="text-red-300 text-sm">{analyzeError}</p>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">Choose a topic to schedule:</p>
                  )}

                  {topics.length > 0 && (
                    <div className="space-y-3">
                      {topics.map((topic, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectTopic(topic)}
                          className="w-full text-left rounded-xl border border-black/10 bg-white p-4 hover:border-violet-500/50 hover:bg-white transition-all"
                        >
                          <h3 className="text-[#1b1916] font-semibold text-sm mb-1">{topic.title}</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">{topic.description}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {topics.length === 0 && !analyzeError && (
                    <p className="text-slate-600 text-sm">No topics returned. Please try again.</p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="w-full border-black/10 text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: configure language / tone / date */}
              {modalStep === "configure" && selectedTopic && (
                <div className="space-y-5">
                  {/* Selected topic summary */}
                  <div className="rounded-xl border border-violet-500/30 bg-violet-600/10 p-4">
                    <p className="text-xs text-violet-400 uppercase tracking-wider mb-1">Selected topic</p>
                    <p className="text-[#1b1916] font-semibold text-sm">{selectedTopic.title}</p>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Language</Label>
                    <div className="flex gap-2">
                      {(["en", "ru", "uk"] as Language[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          disabled={scheduling}
                          onClick={() => setLanguage(l)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                            language === l
                              ? "bg-violet-600/30 border-violet-500 text-violet-900"
                              : "border-black/10 text-slate-600 hover:border-black/20 hover:text-[#1b1916]"
                          }`}
                        >
                          {l === "en" ? "English" : l === "ru" ? "Russian" : "Ukrainian"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Tone</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {TONE_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={scheduling}
                          onClick={() => setTone(t)}
                          className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                            tone === t
                              ? "bg-green-100 border-green-400 text-green-700"
                              : "border-black/10 text-slate-600 hover:border-black/20 hover:text-[#1b1916]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Publish Date */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Publish Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      disabled={scheduling}
                      min={getTodayString()}
                      className="bg-white border-black/10 text-[#1b1916] focus:border-violet-500 [color-scheme:dark]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalStep("topics")}
                      disabled={scheduling}
                      className="flex-1 border-black/10 text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSchedule}
                      disabled={scheduling || !scheduledDate}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
                    >
                      {scheduling ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Scheduling...
                        </span>
                      ) : (
                        "Schedule"
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}
      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-black/10 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-black/10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#1b1916]">Article Preview</h2>
                {previewPost && (
                  <p className="text-sm text-[#1b1916] mt-0.5">
                    Keyword: <span className="text-[#1b1916] font-medium">{previewPost.keyword}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                disabled={previewPublishing}
                className="text-slate-600 hover:text-[#1b1916] transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6 space-y-6">
              {/* Spinner while generating */}
              {previewGenerating && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <span className="inline-block w-10 h-10 border-2 border-black/20 border-t-violet-400 rounded-full animate-spin" />
                  <p className="text-slate-700 text-sm">Generating article...</p>
                </div>
              )}

              {/* Error */}
              {!previewGenerating && previewError && (
                <div className="rounded-xl border border-red-500/30 bg-red-600/10 p-4">
                  <p className="text-red-300 text-sm">{previewError}</p>
                </div>
              )}

              {/* Article fields */}
              {!previewGenerating && previewArticle && (
                <>
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1b1916] uppercase tracking-wider">Title</label>
                    <input
                      type="text"
                      value={previewTitle}
                      onChange={(e) => setPreviewTitle(e.target.value)}
                      disabled={previewPublishing}
                      className="w-full bg-white border border-black/10 rounded-lg px-4 py-3 text-[#1b1916] text-lg font-semibold focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Meta description */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1b1916] uppercase tracking-wider">
                      Meta Description
                    </label>
                    <input
                      type="text"
                      value={previewMeta}
                      onChange={(e) => setPreviewMeta(e.target.value)}
                      disabled={previewPublishing}
                      className="w-full bg-white border border-black/10 rounded-lg px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1b1916] uppercase tracking-wider">Content</label>
                    <textarea
                      value={previewContent}
                      onChange={(e) => setPreviewContent(e.target.value)}
                      disabled={previewPublishing}
                      rows={20}
                      className="w-full bg-white border border-black/10 rounded-lg px-4 py-3 text-[#1b1916] text-sm font-mono leading-relaxed focus:outline-none focus:border-violet-500 transition-colors resize-y"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            {!previewGenerating && (
              <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-black/10 shrink-0">
                <button
                  onClick={() => setPreviewOpen(false)}
                  disabled={previewPublishing}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-black/10 text-[#1b1916] hover:text-[#1b1916] hover:bg-[#ebe9e5] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {previewArticle && (
                  <button
                    onClick={handlePreviewPublish}
                    disabled={previewPublishing}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {previewPublishing ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
