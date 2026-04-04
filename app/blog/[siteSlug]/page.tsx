"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import type { BlogPost } from "@/app/api/blog/posts/route"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function SiteBlogPage() {
  const { siteSlug } = useParams<{ siteSlug: string }>()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  // Derive a display name from the slug (capitalize, replace hyphens with spaces)
  const displayName = siteSlug
    ? siteSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : ""

  useEffect(() => {
    if (!siteSlug) return

    async function fetchPosts() {
      try {
        // First try to find posts by siteSlug via the global list
        const res = await fetch("/api/blog/posts")
        const data = (await res.json()) as { posts: BlogPost[]; storage: string }

        let all: BlogPost[] = []
        if (data.storage === "none") {
          try {
            const local = localStorage.getItem("itgrows_published_posts")
            if (local) all = JSON.parse(local) as BlogPost[]
          } catch {
            // ignore
          }
        } else {
          all = data.posts
        }

        setPosts(all.filter((p) => p.siteSlug === siteSlug))
      } catch {
        try {
          const local = localStorage.getItem("itgrows_published_posts")
          if (local) {
            const all = JSON.parse(local) as BlogPost[]
            setPosts(all.filter((p) => p.siteSlug === siteSlug))
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [siteSlug])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"
          >
            itgrows.ai
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              ← All Blogs
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {displayName}
            </span>{" "}
            Blog
          </h1>
          <p className="text-slate-400 text-lg">Powered by itgrows.ai</p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">No articles yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt = stripHtml(post.content).slice(0, 150)
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${siteSlug}/${post.slug}`}
                    className="block group"
                  >
                    <div className="h-full bg-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 hover:bg-slate-800 transition-all">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-md bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-white font-semibold text-lg mb-3 group-hover:text-violet-300 transition-colors leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {excerpt}
                        {excerpt.length >= 150 ? "…" : ""}
                      </p>
                      <p className="text-slate-500 text-xs">{formatDate(post.publishedAt)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm">
        <p>
          Powered by{" "}
          <Link href="/" className="text-violet-400 hover:text-violet-300 transition-colors">
            itgrows.ai
          </Link>{" "}
          &mdash; &copy; 2026
        </p>
      </footer>
    </div>
  )
}
