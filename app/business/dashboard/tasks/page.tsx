"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Trash2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  articleData: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

type TaskStatus = "pending" | "in_progress" | "done"

const typeLabels: Record<string, string> = {
  seo_article: "SEO Article",
  social_post: "Social Post",
  google_ads: "Google Ads",
  image_generation: "Image Generation",
}

const typeIcons: Record<string, string> = {
  seo_article: "✍️",
  social_post: "📱",
  google_ads: "🎯",
  image_generation: "🖼️",
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks")
      if (!res.ok) return
      const data = await res.json() as { tasks?: Task[] }
      setTasks(data.tasks ?? [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false))

    // Poll every 3s to pick up background generation updates
    const interval = setInterval(fetchTasks, 3000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
      }
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch {
      // ignore
    }
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-[#1b1916] dashboard-heading">Tasks</h1>
            <p className="text-slate-600">Manage your content automation tasks</p>
          </div>
          <Link href="/business/dashboard/new-task">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
              <span>+</span> New Task
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "in_progress", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-black/10 text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
              }`}
            >
              {f === "all" ? "Total Tasks" : f === "in_progress" ? "In Progress" : "Completed"}
              <span className="ml-2 text-xs opacity-70">
                {f === "all" ? tasks.length : tasks.filter((t) => t.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* SEO Ranking Progress Tracker */}
        {tasks.some((t) => t.type === "seo_article") && (
          <RankingProgressTracker seoTasks={tasks.filter((t) => t.type === "seo_article")} />
        )}

        {/* Task list */}
        <div className="space-y-3">
          {!loading && filtered.length === 0 && (
            <Card className="dashboard-glass-card border-0">
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-[#1b1916] font-medium text-lg mb-1">No tasks yet</p>
                <p className="text-slate-600 text-sm mb-6">Generate your first SEO article to get started</p>
                <Link href="/business/dashboard/new-task">
                  <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                    New Task
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {filtered.map((task) => {
            const isDone = task.type === "seo_article" && task.status === "done" && !!task.articleData
            const isInProgress = task.status === "in_progress"

            const handleCardClick = () => {
              if (isDone && task.articleData) {
                sessionStorage.setItem("seo_result", JSON.stringify(task.articleData))
                router.push("/business/dashboard/seo/results")
              }
            }

            return (
              <Card
                key={task.id}
                className={`dashboard-glass-card border-0 hover:border-slate-300 transition-colors ${isDone ? "cursor-pointer" : ""}`}
                onClick={isDone ? handleCardClick : undefined}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl mt-0.5">{typeIcons[task.type]}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#1b1916] font-medium truncate">{task.title}</h3>
                        <p className="text-slate-600 text-sm mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge className="bg-[#ebe9e5] text-slate-700 border-0 text-xs">
                            {typeLabels[task.type]}
                          </Badge>
                          <span className="text-[#1b1916] text-xs">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          {isDone && (
                            <span className="text-violet-600 text-xs">Click to view article →</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex flex-col items-end gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusBadge status={task.status} spinning={isInProgress} />

                      {isDone && (
                        <Button
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1 h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (task.articleData) {
                              sessionStorage.setItem("seo_result", JSON.stringify(task.articleData))
                              router.push("/business/dashboard/seo/results")
                            }
                          }}
                        >
                          View
                        </Button>
                      )}

                      {!isDone && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs bg-white border border-slate-200 text-slate-600 rounded px-2 py-1 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }}
                        className="ml-2 p-1 text-slate-600 hover:text-red-500 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface RankingStage {
  label: string
  detail: string
  weekStart: number
  weekEnd: number | null
}

const RANKING_STAGES: RankingStage[] = [
  { label: "Search Indexing", detail: "Google, Bing, ChatGPT discover it", weekStart: 1, weekEnd: 2 },
  { label: "Page 3-5", detail: "Initial ranking", weekStart: 3, weekEnd: 4 },
  { label: "Page 2", detail: "Gaining authority", weekStart: 5, weekEnd: 8 },
  { label: "Top 10", detail: "Competitive zone", weekStart: 9, weekEnd: 12 },
  { label: "Top 5", detail: "High authority", weekStart: 13, weekEnd: 16 },
  { label: "Top 3", detail: "Goal achieved", weekStart: 17, weekEnd: null },
]

interface AIStage {
  label: string
  icon: string
  weekStart: number
  weekEnd: number | null
  desc: string
}

const AI_STAGES: AIStage[] = [
  { label: "AI Crawling", icon: "🤖", weekStart: 1, weekEnd: 2, desc: "GPTBot & PerplexityBot discover your article" },
  { label: "First Citations", icon: "💬", weekStart: 3, weekEnd: 5, desc: "Article appears in occasional AI answers" },
  { label: "Regular Source", icon: "📚", weekStart: 6, weekEnd: 10, desc: "Consistently cited for related queries" },
  { label: "Authority Source", icon: "⭐", weekStart: 11, weekEnd: null, desc: "Top AI source for your topic" },
]

function getWeeksSince(dateStr: string): number {
  const created = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24 * 7)))
}

function getCurrentStageIndex(weeks: number): number {
  for (let i = RANKING_STAGES.length - 1; i >= 0; i--) {
    if (weeks >= RANKING_STAGES[i].weekStart) return i
  }
  return -1 // not yet indexed
}

function getCurrentAIStageIndex(weeks: number): number {
  for (let i = AI_STAGES.length - 1; i >= 0; i--) {
    if (weeks >= AI_STAGES[i].weekStart) return i
  }
  return -1
}

function getProjectedDate(dateStr: string, weekStart: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + weekStart * 7)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function RankingProgressTracker({ seoTasks }: { seoTasks: Task[] }) {
  // Use the most recent SEO article task
  const latestTask = seoTasks.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  if (!latestTask) return null

  const weeks = getWeeksSince(latestTask.createdAt)
  const currentStageIdx = getCurrentStageIndex(weeks)
  const aiCurrentStageIdx = getCurrentAIStageIndex(weeks)
  const publishDate = latestTask.createdAt

  return (
    <div className="mb-8 dashboard-glass-card border-0 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[#1b1916] font-semibold text-base flex items-center gap-2">
          <span>📈</span> Expected Ranking Progress
        </h2>
        <span className="text-[#1b1916] text-xs">
          Week {weeks > 0 ? weeks : "< 1"} since publish
        </span>
      </div>
      <p className="text-[#1b1916] text-xs mb-5 truncate">
        {latestTask.title}
      </p>

      {/* Timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
        {/* Progress fill */}
        {currentStageIdx >= 0 && (
          <div
            className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
            style={{
              width: `calc(${(currentStageIdx / (RANKING_STAGES.length - 1)) * 100}% - 0px)`,
              maxWidth: "calc(100% - 2rem)",
            }}
          />
        )}

        <div className="relative flex justify-between">
          {RANKING_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIdx > idx
            const isCurrent = currentStageIdx === idx
            const isFuture = currentStageIdx < idx

            return (
              <div
                key={stage.label}
                className="flex flex-col items-center gap-2"
                style={{ width: `${100 / RANKING_STAGES.length}%` }}
              >
                {/* Dot */}
                <div
                  className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                    isCompleted
                      ? "bg-violet-600 border-violet-600"
                      : isCurrent
                      ? "bg-white border-violet-500 animate-pulse"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center px-0.5">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isCompleted || isCurrent ? "text-violet-700" : "text-slate-700"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p
                    className={`text-xs leading-tight mt-0.5 hidden sm:block ${
                      isFuture ? "text-slate-700" : "text-[#1b1916]"
                    }`}
                  >
                    Wk {stage.weekEnd ? `${stage.weekStart}-${stage.weekEnd}` : `${stage.weekStart}+`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current status callout */}
      <div className={`mt-5 p-3 rounded-xl text-sm ${
        currentStageIdx >= 5
          ? "bg-green-50 text-green-700 border border-green-200"
          : currentStageIdx >= 0
          ? "bg-violet-50 text-violet-700 border border-violet-200"
          : "bg-slate-50 text-slate-600 border border-slate-200"
      }`}>
        {currentStageIdx < 0
          ? "Your article was just published. Google, Bing, ChatGPT & Perplexity will start indexing it within days."
          : currentStageIdx === RANKING_STAGES.length - 1
          ? "Your article is in the Top 3 zone — excellent authority achieved!"
          : `Currently in: ${RANKING_STAGES[currentStageIdx].label} — ${RANKING_STAGES[currentStageIdx].detail}. Next milestone: ${RANKING_STAGES[currentStageIdx + 1].label} (Week ${RANKING_STAGES[currentStageIdx + 1].weekStart}).`
        }
      </div>

      {/* AI Search Visibility Tracker */}
      <div className="mt-6 border-t border-black/5 pt-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#1b1916] font-semibold text-sm flex items-center gap-2">
            <span>🤖</span> AI Search Visibility
            <span className="flex items-center gap-1 ml-1">
              <span className="text-xs opacity-50" title="ChatGPT">💬</span>
              <span className="text-xs opacity-50" title="Perplexity">🔵</span>
            </span>
          </h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            aiCurrentStageIdx >= 3 ? "bg-cyan-100 text-cyan-700" :
            aiCurrentStageIdx >= 0 ? "bg-cyan-50 text-cyan-600" :
            "bg-slate-100 text-slate-500"
          }`}>
            {aiCurrentStageIdx < 0 ? "Not yet crawled" : AI_STAGES[aiCurrentStageIdx].icon + " " + AI_STAGES[aiCurrentStageIdx].label}
          </span>
        </div>
        <p className="text-slate-400 text-xs mb-4">ChatGPT & Perplexity citation timeline</p>

        {/* AI Timeline */}
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
          {aiCurrentStageIdx >= 0 && (
            <div
              className="absolute top-4 left-4 h-0.5 transition-all duration-700"
              style={{
                background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
                width: `calc(${(aiCurrentStageIdx / (AI_STAGES.length - 1)) * 100}% - 0px)`,
                maxWidth: "calc(100% - 2rem)",
              }}
            />
          )}

          <div className="relative flex justify-between">
            {AI_STAGES.map((stage, idx) => {
              const isCompleted = aiCurrentStageIdx > idx
              const isCurrent = aiCurrentStageIdx === idx
              const isFuture = aiCurrentStageIdx < idx

              return (
                <div
                  key={stage.label}
                  className="flex flex-col items-center gap-2"
                  style={{ width: `${100 / AI_STAGES.length}%` }}
                >
                  {/* Dot */}
                  <div
                    className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                      isCompleted
                        ? "bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-500"
                        : isCurrent
                        ? "bg-white border-cyan-500 animate-pulse"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <span className="text-sm">{stage.icon}</span>
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isFuture ? "bg-slate-200" : "bg-slate-200"}`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center px-0.5">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        isCompleted || isCurrent ? "text-cyan-700" : "text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p
                      className={`text-xs leading-tight mt-0.5 hidden sm:block ${
                        isFuture ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      Wk {stage.weekEnd ? `${stage.weekStart}-${stage.weekEnd}` : `${stage.weekStart}+`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Status callout */}
        <div className={`mt-5 p-3 rounded-xl text-sm ${
          aiCurrentStageIdx >= 3
            ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200"
            : aiCurrentStageIdx >= 0
            ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200"
            : "bg-slate-50 text-slate-600 border border-slate-200"
        }`}>
          {aiCurrentStageIdx < 0
            ? "Your article hasn't been crawled by AI bots yet. This usually happens within days of publishing."
            : aiCurrentStageIdx === AI_STAGES.length - 1
            ? "Your content is an authority source for AI search — excellent!"
            : `Currently: ${AI_STAGES[aiCurrentStageIdx].label} — ${AI_STAGES[aiCurrentStageIdx].desc}. Next: ${AI_STAGES[aiCurrentStageIdx + 1].label} (~${getProjectedDate(publishDate, AI_STAGES[aiCurrentStageIdx + 1].weekStart)})`
          }
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, spinning }: { status: string; spinning?: boolean }) {
  const styles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600 border-0",
    in_progress: "bg-yellow-100 text-yellow-700 border-0",
    done: "bg-green-100 text-green-700 border-0",
  }
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    done: "Done",
  }
  return (
    <Badge className={`text-xs flex items-center gap-1.5 ${styles[status]}`}>
      {spinning && (
        <span className="w-3 h-3 rounded-full border border-yellow-600 border-t-transparent animate-spin inline-block" />
      )}
      {labels[status]}
    </Badge>
  )
}
