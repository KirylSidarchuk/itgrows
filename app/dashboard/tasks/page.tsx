"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUser } from "@/lib/auth"
import { getTasks, updateTaskStatus, type Task, type TaskStatus } from "@/lib/tasks"
import { FileText } from "lucide-react"

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

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setTasks(getTasks())
  }, [router])

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTaskStatus(id, status)
    setTasks(getTasks())
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Tasks</h1>
            <p className="text-slate-400">Manage your content automation tasks</p>
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
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
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
          {filtered.length === 0 && (
            <Card className="bg-slate-800/60 border-white/10">
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white font-medium text-lg mb-1">No tasks yet</p>
                <p className="text-slate-400 text-sm mb-6">Generate your first SEO article to get started</p>
                <Link href="/dashboard/seo">
                  <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                    Go to SEO Autopilot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {filtered.map((task) => {
            const isClickable = task.type === "seo_article" && task.status === "done" && task.articleData
            const handleClick = () => {
              if (isClickable) {
                sessionStorage.setItem("seo_result", JSON.stringify(task.articleData))
                router.push("/dashboard/seo/results")
              }
            }
            return (
            <Card
              key={task.id}
              className={`bg-slate-800/60 border-white/10 hover:border-white/20 transition-colors ${isClickable ? "cursor-pointer" : ""}`}
              onClick={isClickable ? handleClick : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl mt-0.5">{typeIcons[task.type]}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{task.title}</h3>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">
                          {typeLabels[task.type]}
                        </Badge>
                        <span className="text-slate-500 text-xs">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        {isClickable && (
                          <span className="text-violet-400 text-xs">Click to view article →</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={task.status} />
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs bg-slate-700 border border-white/10 text-slate-300 rounded px-2 py-1 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-slate-700 text-slate-300 border-0",
    in_progress: "bg-yellow-900/50 text-yellow-400 border-0",
    done: "bg-green-900/50 text-green-400 border-0",
  }
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    done: "Done",
  }
  return (
    <Badge className={`text-xs ${styles[status]}`}>
      {labels[status]}
    </Badge>
  )
}
