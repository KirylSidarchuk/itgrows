"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUser } from "@/lib/auth"
import { Trash2, ExternalLink } from "lucide-react"
import type { BlogPost } from "@/app/api/blog/posts/route"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export default function DashboardBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push("/login"); return }
    loadPosts()
  }, [router])

  async function loadPosts() {
    setLoading(true)
    let all: BlogPost[] = []
    try {
      const res = await fetch("/api/blog/posts")
      const data = (await res.json()) as { posts: BlogPost[]; storage: string }
      if (data.storage === "none") {
        const local = localStorage.getItem("itgrows_published_posts")
        if (local) all = JSON.parse(local) as BlogPost[]
      } else {
        all = data.posts
      }
    } catch {
      const local = localStorage.getItem("itgrows_published_posts")
      if (local) {
        try { all = JSON.parse(local) as BlogPost[] } catch { /* ignore */ }
      }
    }
    setPosts(all)
    setLoading(false)
  }

  async function handleDelete(post: BlogPost) {
    if (deletingIds.has(post.id)) return
    if (!confirm(`Delete "${post.title}"?`)) return

    setDeletingIds(prev => new Set(prev).add(post.id))

    try {
      await fetch(`/api/blog/posts/${post.slug}`, { method: "DELETE" })
    } catch { /* ignore - always remove locally */ }

    // Remove from localStorage too
    try {
      const local = localStorage.getItem("itgrows_published_posts")
      if (local) {
        const arr = JSON.parse(local) as BlogPost[]
        localStorage.setItem("itgrows_published_posts", JSON.stringify(arr.filter(p => p.id !== post.id)))
      }
    } catch { /* ignore */ }

    setPosts(prev => prev.filter(p => p.id !== post.id))
    setDeletingIds(prev => { const s = new Set(prev); s.delete(post.id); return s })
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Blog Articles</h1>
            <p className="text-slate-500">Manage your published articles</p>
          </div>
          <Link href="/dashboard/seo">
            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
              + New Article
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 text-lg mb-4">No articles published yet</p>
            <Link href="/dashboard/seo">
              <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
                Generate First Article
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/8">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {posts.map((post) => {
                  const href = post.siteSlug
                    ? `/blog/sites/${post.siteSlug}/${post.slug}`
                    : `/blog/${post.slug}`
                  const excerpt = stripHtml(post.content).slice(0, 80)
                  return (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[#1b1916] font-medium text-sm leading-snug">{post.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs">{excerpt}…</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-md font-medium">
                          {post.keyword || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {post.siteSlug
                          ? post.siteSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
                          : "ItGrows.ai Blog"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(post.publishedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={href} target="_blank">
                            <button className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors" title="View article">
                              <ExternalLink size={15} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(post)}
                            disabled={deletingIds.has(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Delete article"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
