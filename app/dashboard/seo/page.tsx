"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ScheduledPost {
  id: string
  keyword: string
  scheduledDate: string
  status: string
}

interface BlogPost {
  id: string
  title: string
  publishedAt: string
  slug: string
}

export default function SeoAutopilotPage() {
  const router = useRouter()
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/schedule/posts").then(r => r.ok ? r.json() : { posts: [] }),
      fetch("/api/blog/posts").then(r => r.ok ? r.json() : { posts: [] }),
    ]).then(([sched, blog]) => {
      setScheduledPosts((sched.posts ?? []).slice(0, 4))
      setBlogPosts((blog.posts ?? []).slice(0, 4))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const upcoming = scheduledPosts.filter(p => p.status === "scheduled").slice(0, 3)
  const recent = blogPosts.slice(0, 3)

  const XLogoSvg = (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#000"/>
      <path d="M18.24 14.56L24.48 7h-1.48l-5.4 6.28L13.2 7H8l6.55 9.54L8 25h1.48l5.73-6.66L19.8 25H25l-6.76-10.44zm-2.03 2.36l-.66-.95-5.3-7.58H12.5l4.27 6.1.66.95 5.54 7.92h-2.26l-4.5-6.44z" fill="white"/>
    </svg>
  )

  const COMING_SOON = [
    // eslint-disable-next-line @next/next/no-img-element
    { logo: <img src="/logos/google-ads.jpg" width={32} height={32} className="rounded-lg object-contain" alt="Google Ads" />, label: "Google Ads", desc: "Auto-generate ads from your published articles" },
    // eslint-disable-next-line @next/next/no-img-element
    { logo: <img src="/logos/linkedin.png" width={32} height={32} className="rounded-lg object-contain" alt="LinkedIn" />, label: "LinkedIn", desc: "Schedule LinkedIn posts from your SEO content" },
    // eslint-disable-next-line @next/next/no-img-element
    { logo: <img src="/logos/instagram.jpg" width={32} height={32} className="rounded-xl" alt="Instagram" />, label: "Instagram", desc: "Turn articles into Instagram-ready visuals" },
    { logo: XLogoSvg, label: "Twitter / X", desc: "Auto-post threads from your blog content" },
  ]

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent dashboard-heading">
            SEO Autopilot
          </h1>
          <p className="text-slate-600">Your content engine — scheduled, published, and optimized automatically.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Calendar card */}
          <div className="dashboard-glass-card border-0 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h2 className="text-[#1b1916] font-semibold text-base">Content Calendar</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/calendar")}
                className="text-xs text-violet-600 hover:text-violet-500 transition-colors font-medium"
              >
                View all →
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-3">No scheduled posts yet</p>
                <button
                  onClick={() => router.push("/dashboard/calendar")}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Set up Calendar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-[#ebe9e5] rounded-lg">
                    <span className="text-sm text-[#1b1916] font-medium truncate flex-1">{post.keyword}</span>
                    <span className="text-xs text-slate-500 ml-3 shrink-0">
                      {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => router.push("/dashboard/calendar")}
                  className="w-full mt-2 py-2 border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Open Calendar
                </button>
              </div>
            )}
          </div>

          {/* Published Articles card */}
          <div className="dashboard-glass-card border-0 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h2 className="text-[#1b1916] font-semibold text-base">Published Articles</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/blog")}
                className="text-xs text-violet-600 hover:text-violet-500 transition-colors font-medium"
              >
                View all →
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-3">No published articles yet</p>
                <button
                  onClick={() => router.push("/dashboard/new-task")}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Article
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-[#ebe9e5] rounded-lg">
                    <span className="text-sm text-[#1b1916] font-medium truncate flex-1">{post.title}</span>
                    <span className="text-xs text-slate-500 ml-3 shrink-0">
                      {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => router.push("/dashboard/blog")}
                  className="w-full mt-2 py-2 border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors"
                >
                  View All Articles
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon channels */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-violet-200 to-transparent" />
            <span className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              More Channels — Coming Soon
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-violet-200 to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMING_SOON.map(item => (
              <div
                key={item.label}
                className="group relative rounded-2xl p-5 overflow-hidden cursor-default opacity-60 border border-black/10 bg-white/60"
              >
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                    Coming Soon
                  </span>
                </div>
                <div className="mb-3">{item.logo}</div>
                <p className="font-semibold text-[#1b1916] text-sm mb-1">{item.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
