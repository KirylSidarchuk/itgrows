"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"
import { getConnectedSites, getDefaultSite } from "@/lib/connectedSites"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Language = "en" | "ru" | "uk"
type Tone = "Professional" | "Casual" | "Expert"
type PostStatus = "scheduled" | "generating" | "published" | "failed"

interface ScheduledPost {
  id: string
  keyword: string
  language: Language
  tone: Tone
  scheduledDate: string
  status: PostStatus
  taskId?: string
  blogPostSlug?: string
}

interface TopicSuggestion {
  title: string
  description: string
  keyword: string
}

type ModalStep = "no-site" | "analyzing" | "topics" | "configure"

const STORAGE_KEY = "itgrows_schedule"

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
  scheduled: "bg-slate-600/40 text-slate-300 border border-slate-500/40",
  generating: "bg-yellow-600/30 text-yellow-300 border border-yellow-500/40",
  published: "bg-green-600/30 text-green-300 border border-green-500/40",
  failed: "bg-red-600/30 text-red-300 border border-red-500/40",
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

function mergePosts(local: ScheduledPost[], remote: ScheduledPost[]): ScheduledPost[] {
  const map = new Map<string, ScheduledPost>()
  for (const p of local) map.set(p.id, p)
  for (const p of remote) map.set(p.id, p)
  return Array.from(map.values()).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}

function readLocalPosts(): ScheduledPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScheduledPost[]
  } catch {
    return []
  }
}

function writeLocalPosts(posts: ScheduledPost[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // ignore
  }
}

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    const u = getUser()
    if (!u) router.push("/login")
  }, [router])

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [view, setView] = useState<"list" | "calendar">("list")
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const local = readLocalPosts()
    try {
      const res = await fetch("/api/schedule")
      if (res.ok) {
        const data = (await res.json()) as { posts: ScheduledPost[] }
        const merged = mergePosts(local, data.posts)
        setPosts(merged)
        writeLocalPosts(merged)
      } else {
        setPosts(local)
      }
    } catch {
      setPosts(local)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

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

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: defaultSite.url }),
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
  }, [])

  const handleSelectTopic = (topic: TopicSuggestion) => {
    setSelectedTopic(topic)
    setModalStep("configure")
  }

  const handleSchedule = async () => {
    if (!selectedTopic) return

    setScheduling(true)
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: selectedTopic.keyword,
          language,
          tone,
          scheduledDate,
        }),
      })

      let newPost: ScheduledPost
      if (res.ok) {
        const data = (await res.json()) as { post: ScheduledPost }
        newPost = data.post
      } else {
        newPost = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          keyword: selectedTopic.keyword,
          language,
          tone,
          scheduledDate,
          status: "scheduled",
        }
      }

      const updated = mergePosts(readLocalPosts(), [newPost])
      setPosts(updated)
      writeLocalPosts(updated)
      setShowModal(false)
    } catch {
      const newPost: ScheduledPost = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        keyword: selectedTopic.keyword,
        language,
        tone,
        scheduledDate,
        status: "scheduled",
      }
      const updated = mergePosts(readLocalPosts(), [newPost])
      setPosts(updated)
      writeLocalPosts(updated)
      setShowModal(false)
    } finally {
      setScheduling(false)
    }
  }

  const handlePublishNow = async (post: ScheduledPost) => {
    if (publishingIds.has(post.id)) return

    setPublishingIds((prev) => new Set(prev).add(post.id))

    const updateLocal = (id: string, updates: Partial<ScheduledPost>) => {
      setPosts((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        writeLocalPosts(updated)
        return updated
      })
    }

    updateLocal(post.id, { status: "generating" })

    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status: "generating" }),
    }).catch(() => {})

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

      const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      try {
        const existingTasks = JSON.parse(localStorage.getItem("itgrows_tasks_v2") || "[]") as unknown[]
        existingTasks.unshift({
          id: taskId,
          title: `Scheduled: ${article.title || post.keyword}`,
          description: `Scheduled article targeting "${post.keyword}"`,
          type: "seo_article",
          status: "done",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          articleData: article,
        })
        localStorage.setItem("itgrows_tasks_v2", JSON.stringify(existingTasks))
      } catch {
        // ignore
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

      updateLocal(post.id, { status: "published", taskId, blogPostSlug: slug || undefined })
      await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status: "published", taskId, blogPostSlug: slug || undefined }),
      }).catch(() => {})
    } catch {
      updateLocal(post.id, { status: "failed" })
      await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status: "failed" }),
      }).catch(() => {})
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
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
            <p className="text-slate-400">Plan and auto-publish SEO articles on a schedule</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* View toggle */}
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === "list"
                    ? "bg-violet-600/30 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-white/10 ${
                  view === "calendar"
                    ? "bg-violet-600/30 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin mr-3" />
            Loading schedule...
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">No articles scheduled</h3>
            <p className="text-slate-400 mb-6">
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
          <Card className="bg-slate-800/60 border-white/10">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Tone
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedDates.map((date) => (
                    <>
                      {/* Date group header */}
                      <tr key={`group-${date}`} className="bg-slate-700/20">
                        <td
                          colSpan={6}
                          className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >
                          {formatDateFull(date)}
                          {date === getTodayString() && (
                            <span className="ml-2 text-violet-400">(Today)</span>
                          )}
                        </td>
                      </tr>
                      {groupedByDate[date].map((post) => (
                        <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-300">{formatDate(date)}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-white font-medium">{post.keyword}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono bg-slate-700/60 text-slate-300 px-2 py-1 rounded">
                              {LANG_LABELS[post.language as Language] ?? post.language.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{post.tone}</td>
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
                            {post.status === "scheduled" && (
                              <Button
                                size="sm"
                                disabled={publishingIds.has(post.id)}
                                onClick={() => handlePublishNow(post)}
                                className="text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 hover:border-violet-400/50"
                              >
                                Publish Now
                              </Button>
                            )}
                            {post.status === "failed" && (
                              <Button
                                size="sm"
                                disabled={publishingIds.has(post.id)}
                                onClick={() => handlePublishNow(post)}
                                className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30"
                              >
                                Retry
                              </Button>
                            )}
                            {post.status === "published" && post.blogPostSlug && (
                              <a
                                href={`/blog/${post.blogPostSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-400 hover:text-green-300 underline"
                              >
                                View Post
                              </a>
                            )}
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
                <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase py-2">
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
                          ? "border-white/5 bg-slate-800/20"
                          : "border-white/10 bg-slate-800/40"
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold mb-1.5 ${
                          isToday ? "text-violet-300" : isPast ? "text-slate-600" : "text-slate-400"
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
          <Card className="w-full max-w-lg bg-slate-900 border-white/10 shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Schedule Article</CardTitle>
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
                      className="flex-1 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
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
                  <span className="inline-block w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
                  <p className="text-slate-300 text-sm">Analyzing your site...</p>
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
                    <p className="text-slate-400 text-sm">Choose a topic to schedule:</p>
                  )}

                  {topics.length > 0 && (
                    <div className="space-y-3">
                      {topics.map((topic, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectTopic(topic)}
                          className="w-full text-left rounded-xl border border-white/10 bg-slate-800/60 p-4 hover:border-violet-500/50 hover:bg-slate-800/80 transition-all"
                        >
                          <h3 className="text-white font-semibold text-sm mb-1">{topic.title}</h3>
                          <p className="text-slate-400 text-xs leading-relaxed">{topic.description}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {topics.length === 0 && !analyzeError && (
                    <p className="text-slate-400 text-sm">No topics returned. Please try again.</p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="w-full border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
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
                    <p className="text-white font-semibold text-sm">{selectedTopic.title}</p>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Language</Label>
                    <div className="flex gap-2">
                      {(["en", "ru", "uk"] as Language[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          disabled={scheduling}
                          onClick={() => setLanguage(l)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                            language === l
                              ? "bg-violet-600/30 border-violet-500 text-violet-300"
                              : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                          }`}
                        >
                          {l === "en" ? "English" : l === "ru" ? "Russian" : "Ukrainian"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tone</Label>
                    <div className="flex gap-2">
                      {(["Professional", "Casual", "Expert"] as Tone[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={scheduling}
                          onClick={() => setTone(t)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                            tone === t
                              ? "bg-pink-600/30 border-pink-500 text-pink-300"
                              : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Publish Date */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Publish Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      disabled={scheduling}
                      min={getTodayString()}
                      className="bg-slate-800 border-white/10 text-white focus:border-violet-500 [color-scheme:dark]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalStep("topics")}
                      disabled={scheduling}
                      className="flex-1 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
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
    </div>
  )
}
