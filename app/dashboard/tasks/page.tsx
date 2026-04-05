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
            <h1 className="text-3xl font-bold mb-1 text-[#1b1916]">Tasks</h1>
            <p className="text-slate-600">Manage your content automation tasks</p>
          </div>
          <Link href="/dashboard/new-task">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
              <span>+</span> New Task
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "pending", "in_progress", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-black/10 text-slate-600 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
              }`}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-70">
                {f === "all" ? tasks.length : tasks.filter((t) => t.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {!loading && filtered.length === 0 && (
            <Card className="bg-white border-black/10">
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-[#1b1916] font-medium text-lg mb-1">No tasks yet</p>
                <p className="text-slate-600 text-sm mb-6">Generate your first SEO article to get started</p>
                <Link href="/dashboard/new-task">
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
                router.push("/dashboard/seo/results")
              }
            }

            return (
              <Card
                key={task.id}
                className={`bg-white border-black/10 hover:border-slate-300 transition-colors ${isDone ? "cursor-pointer" : ""}`}
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
                          <span className="text-slate-500 text-xs">
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
                              router.push("/dashboard/seo/results")
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
                        className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
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
