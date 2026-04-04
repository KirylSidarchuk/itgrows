"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUser, type User } from "@/lib/auth"
import { getTasks, type Task } from "@/lib/tasks"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setUser(u)
    setTasks(getTasks())
  }, [router])

  if (!user) return null

  const done = tasks.filter((t) => t.status === "done").length
  const inProgress = tasks.filter((t) => t.status === "in_progress").length
  const pending = tasks.filter((t) => t.status === "pending").length

  const planColors: Record<string, string> = {
    starter: "bg-blue-900/40 text-blue-300 border-blue-700",
    pro: "bg-violet-900/40 text-violet-300 border-violet-700",
    agency: "bg-amber-900/40 text-amber-300 border-amber-700",
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Good morning, {user.name} 👋</h1>
          <p className="text-slate-400">Here&apos;s what&apos;s happening with your content automation.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/60 border-white/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-white">{tasks.length}</p>
              <p className="text-slate-400 text-sm mt-1">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-white/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-400">{done}</p>
              <p className="text-slate-400 text-sm mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-white/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-yellow-400">{inProgress}</p>
              <p className="text-slate-400 text-sm mt-1">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-white/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-slate-400">{pending}</p>
              <p className="text-slate-400 text-sm mt-1">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`capitalize ${planColors[user.plan]}`}>{user.plan}</Badge>
                <span className="text-slate-400 text-sm">
                  Renews {new Date(user.planExpiry).toLocaleDateString()}
                </span>
              </div>
              <Link href="/dashboard/subscription">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                  Upgrade Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/new-task">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white justify-start gap-3">
                  <span>✍️</span> Create SEO Article
                </Button>
              </Link>
              <Link href="/dashboard/new-task">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white justify-start gap-3">
                  <span>📱</span> Schedule Social Posts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card className="bg-slate-800/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">Recent Tasks</CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" className="text-violet-400 hover:text-violet-300 text-sm">
                View all →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{task.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{task.type.replace("_", " ")}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-slate-700 text-slate-300",
    in_progress: "bg-yellow-900/50 text-yellow-400",
    done: "bg-green-900/50 text-green-400",
  }
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    done: "Done",
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
