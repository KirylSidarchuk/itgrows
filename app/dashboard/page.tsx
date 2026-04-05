"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<{ id: string; title: string; type: string; status: string }[]>([])
  const [hasConnectedSites, setHasConnectedSites] = useState(true)

  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "User",
        plan: (session.user as { plan?: string }).plan ?? "starter",
        planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    : null

  if (!user) return null

  const done = tasks.filter((t) => t.status === "done").length
  const inProgress = tasks.filter((t) => t.status === "in_progress").length
  const pending = tasks.filter((t) => t.status === "pending").length

  const planColors: Record<string, string> = {
    starter: "bg-blue-100 text-blue-700 border-blue-200",
    pro: "bg-violet-100 text-violet-700 border-violet-200",
    agency: "bg-amber-100 text-amber-700 border-amber-200",
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916]">Good morning, {user.name} 👋</h1>
          <p className="text-slate-600">Here&apos;s what&apos;s happening with your content automation.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-black/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-[#1b1916]">{tasks.length}</p>
              <p className="text-slate-600 text-sm mt-1">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-black/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-600">{done}</p>
              <p className="text-slate-600 text-sm mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-black/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-yellow-600">{inProgress}</p>
              <p className="text-slate-600 text-sm mt-1">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-black/10">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-slate-500">{pending}</p>
              <p className="text-slate-600 text-sm mt-1">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border-black/10">
            <CardHeader>
              <CardTitle className="text-[#1b1916] text-lg">Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`capitalize ${planColors[user.plan]}`}>{user.plan}</Badge>
                <span className="text-slate-500 text-sm">
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

          <Card className="bg-white border-black/10">
            <CardHeader>
              <CardTitle className="text-[#1b1916] text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/seo">
                <Button className="w-full bg-gradient-to-r from-violet-600/20 to-pink-600/20 hover:from-violet-600/30 hover:to-pink-600/30 border border-violet-300 text-violet-700 justify-start gap-3">
                  <span>🔍</span> SEO Autopilot
                </Button>
              </Link>
              <Link href="/dashboard/new-task">
                <Button className="w-full bg-[#ebe9e5] hover:bg-[#dedad4] text-[#1b1916] justify-start gap-3 border border-black/10">
                  <span>✍️</span> Create SEO Article
                </Button>
              </Link>
              <Link href="/dashboard/new-task">
                <Button className="w-full bg-[#ebe9e5] hover:bg-[#dedad4] text-[#1b1916] justify-start gap-3 border border-black/10">
                  <span>📱</span> Schedule Social Posts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Connect website hint */}
        {!hasConnectedSites && (
          <Card className="bg-gradient-to-r from-violet-50 to-cyan-50 border border-violet-200 mb-8">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="text-[#1b1916] font-medium text-sm">Connect your website to start publishing</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Link your WordPress, Shopify, Webflow or ItGrows.ai Blog for one-click article publishing.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/settings" className="shrink-0 ml-4">
                <Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm">
                  Go to Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent Tasks */}
        <Card className="bg-white border-black/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#1b1916] text-lg">Recent Tasks</CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" className="text-violet-600 hover:text-violet-500 text-sm">
                View all →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                <div>
                  <p className="text-[#1b1916] text-sm font-medium">{task.title}</p>
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
    pending: "bg-slate-100 text-slate-600",
    in_progress: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
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
