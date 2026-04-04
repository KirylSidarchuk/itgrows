"use client"

import { useEffect, useState } from "react"
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/blog/posts")
        const data = (await res.json()) as { posts: BlogPost[]; storage: string }

        if (data.storage === "none") {
          // Fallback: read from localStorage
          try {
            const local = localStorage.getItem("itgrows_published_posts")
            if (local) {
              setPosts(JSON.parse(local) as BlogPost[])
            }
          } catch {
            // ignore
          }
        } else {
          setPosts(data.posts)
        }
      } catch {
        // On error, try localStorage
        try {
          const local = localStorage.getItem("itgrows_published_posts")
          if (local) {
            setPosts(JSON.parse(local) as BlogPost[])
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

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
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="/#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="/#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <Link href="/blog" className="text-white font-medium">
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors">
                Login
              </button>
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
            itgrows.ai{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            AI-generated insights for growing businesses
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">
                No articles yet. Be the first to generate one!
              </p>
              <Link href="/dashboard/seo">
                <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors text-sm font-medium">
                  Generate Article
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt = stripHtml(post.content).slice(0, 150)
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
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
        <p>© 2026 itgrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
