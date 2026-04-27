"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"

interface Task {
  id: string
  title: string
  type: string
  status: string
}

interface ConnectedSite {
  id: string
  url: string
  name: string
  isDefault: boolean
  lastCheckedAt: string | null
  lastCheckOk: boolean | null
}

interface ProfileData {
  user?: {
    onboardingCompleted?: boolean
    subscriptionStatus?: string
    articlesGenerated?: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [hasConnectedSites, setHasConnectedSites] = useState(true)
  const [failedSites, setFailedSites] = useState<ConnectedSite[]>([])
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive")
  const [articlesGenerated, setArticlesGenerated] = useState<number>(0)

  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "User",
        plan: (session.user as { plan?: string }).plan ?? "starter",
        planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    : null

  useEffect(() => {
    // Check onboarding status and redirect if not completed
    fetch("/api/user/profile", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch profile")
        return r.json()
      })
      .then((data: ProfileData) => {
        if (data.user && !data.user.onboardingCompleted) {
          router.replace("/business/dashboard/onboarding")
        }
        if (data.user?.subscriptionStatus) {
          setSubscriptionStatus(data.user.subscriptionStatus)
        }
        if (typeof data.user?.articlesGenerated === "number") {
          setArticlesGenerated(data.user.articlesGenerated)
        }
      })
      .catch(() => {})

    // Load tasks from API
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data: { tasks?: Task[] }) => {
        setTasks(data.tasks ?? [])
      })
      .catch(() => {})

    // Load sites from API, then run background connection checks
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: { sites?: ConnectedSite[] }) => {
        const sites = data.sites ?? []
        setHasConnectedSites(sites.length > 0)

        // Show already-known failed sites immediately (before re-checking)
        const alreadyFailed = sites.filter(
          (s) => s.lastCheckedAt !== null && s.lastCheckOk === false
        )
        setFailedSites(alreadyFailed)

        // Background: check each site that hasn't been checked in the last hour
        const ONE_HOUR_MS = 60 * 60 * 1000
        const sitesToCheck = sites.filter((s) => {
          if (!s.lastCheckedAt) return false // skip freshly added sites
          const elapsed = Date.now() - new Date(s.lastCheckedAt).getTime()
          return elapsed >= ONE_HOUR_MS
        })

        if (sitesToCheck.length === 0) return

        // Fire checks in parallel, update failedSites state as results arrive
        sitesToCheck.forEach((site) => {
          fetch("/api/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: site.id }),
          })
            .then((r) => r.json())
            .then((result: { success: boolean }) => {
              setFailedSites((prev) => {
                const withoutThis = prev.filter((s) => s.id !== site.id)
                if (!result.success) {
                  return [...withoutThis, site]
                }
                return withoutThis
              })
            })
            .catch(() => {})
        })
      })
      .catch(() => {})
  }, [router])

  if (!user) return null

  const done = tasks.filter((t) => t.status === "done").length
  const inProgress = tasks.filter((t) => t.status === "in_progress").length

  const planColors: Record<string, string> = {
    starter: "bg-blue-100 text-blue-700 border-blue-200",
    pro: "bg-violet-100 text-violet-700 border-violet-200",
    agency: "bg-amber-100 text-amber-700 border-amber-200",
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916] dashboard-heading">Good morning, {user.name} 👋</h1>
          <p className="text-slate-600">Here&apos;s what&apos;s happening with your content automation.</p>
        </div>

        {/* Connection warning banners */}
        {failedSites.map((site) => (
          <div
            key={site.id}
            className="flex items-center justify-between gap-3 mb-4 px-5 py-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium">
                Problem connecting site <span className="font-semibold">{site.url || site.name}</span>. Please check your settings.
              </span>
            </div>
            <Link href="/business/dashboard/settings?tab=sites" className="shrink-0">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
              >
                Settings
              </Button>
            </Link>
          </div>
        ))}

        {/* Trial paywall banner */}
        {subscriptionStatus !== "active" && articlesGenerated > 2 && (
          <div className="flex items-center justify-between gap-3 mb-6 px-5 py-4 rounded-xl border border-violet-300 bg-violet-50 text-violet-900">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-medium">
                You&apos;ve used <strong>{articlesGenerated}/15</strong> free articles. Subscribe to continue generating content.
              </span>
            </div>
            <Link href="/business/dashboard/billing" className="shrink-0">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs">
                Subscribe
              </Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="dashboard-glass-card border-0">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-[#1b1916]">{tasks.length}</p>
              <p className="text-slate-600 text-sm mt-1">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="dashboard-glass-card border-0">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-yellow-600">{inProgress}</p>
              <p className="text-slate-600 text-sm mt-1">In Progress</p>
            </CardContent>
          </Card>
          <Card className="dashboard-glass-card border-0">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-600">{done}</p>
              <p className="text-slate-600 text-sm mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="dashboard-glass-card border-0">
            <CardHeader>
              <CardTitle className="text-[#1b1916] text-lg">Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`capitalize ${planColors[user.plan]}`}>{user.plan}</Badge>
                <span className="text-[#1b1916] text-sm">
                  Renews {new Date(user.planExpiry).toLocaleDateString()}
                </span>
              </div>
              <Link href="/business/dashboard/subscription">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                  Upgrade Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="dashboard-glass-card border-0">
            <CardHeader>
              <CardTitle className="text-[#1b1916] text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/business/dashboard/seo">
                <Button className="w-full bg-gradient-to-r from-violet-600/20 to-pink-600/20 hover:from-violet-600/30 hover:to-pink-600/30 border border-violet-300 text-violet-700 justify-start gap-3">
                  <span>🔍</span> SEO Autopilot
                </Button>
              </Link>
              <Link href="/business/dashboard/new-task">
                <Button className="w-full bg-gradient-to-r from-violet-600/20 to-pink-600/20 hover:from-violet-600/30 hover:to-pink-600/30 border border-violet-300 text-violet-700 justify-start gap-3">
                  <span>➕</span> New Task
                </Button>
              </Link>
              <div className="relative">
                <Button disabled className="w-full bg-[#ebe9e5] text-slate-400 justify-start gap-3 border border-black/10 cursor-not-allowed opacity-60">
                  <span>📱</span> Schedule Social Posts
                </Button>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold bg-violet-100 text-violet-600 border border-violet-200 rounded-full px-2 py-0.5">
                  Coming Soon
                </span>
              </div>
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
              <Link href="/business/dashboard/settings?connect=1" className="shrink-0 ml-4">
                <Button className="bg-violet-600 hover:bg-violet-500 text-white text-sm">
                  Connect Site
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "📱", label: "Social Media Scheduling", desc: "Auto-post articles to Instagram, LinkedIn & more" },
            { icon: "📊", label: "Analytics & Reports", desc: "Track rankings, traffic and ROI in one place" },
            { icon: "🎯", label: "Google Ads Automation", desc: "AI-generated ads from your published articles" },
          ].map(f => (
            <div key={f.label} className="relative bg-white border border-black/10 rounded-2xl p-5 overflow-hidden">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                <span className="text-xs font-bold bg-violet-600 text-white rounded-full px-3 py-1 shadow-sm tracking-wide uppercase">
                  Coming Soon
                </span>
              </div>
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-semibold text-[#1b1916] text-sm mb-1">{f.label}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        <Card className="dashboard-glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#1b1916] text-lg">Recent Tasks</CardTitle>
            <Link href="/business/dashboard/tasks">
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
                  <p className="text-[#1b1916] text-xs mt-0.5">{task.type.replace("_", " ")}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-[#1b1916] text-sm text-center py-6">No tasks yet</p>
            )}
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
