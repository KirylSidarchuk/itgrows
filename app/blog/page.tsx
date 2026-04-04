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

interface ClientBlog {
  siteSlug: string
  displayName: string
  count: number
}

function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [clientBlogs, setClientBlogs] = useState<ClientBlog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      let allPosts: BlogPost[] = []
      try {
        const res = await fetch("/api/blog/posts")
        const data = (await res.json()) as { posts: BlogPost[]; storage: string }

        if (data.storage === "none") {
          // Fallback: read from localStorage
          try {
            const local = localStorage.getItem("itgrows_published_posts")
            if (local) {
              allPosts = JSON.parse(local) as BlogPost[]
            }
          } catch {
            // ignore
          }
        } else {
          allPosts = data.posts
        }
      } catch {
        // On error, try localStorage
        try {
          const local = localStorage.getItem("itgrows_published_posts")
          if (local) {
            allPosts = JSON.parse(local) as BlogPost[]
          }
        } catch {
          // ignore
        }
      } finally {
        // Build client blog list from unique siteSlug values
        const slugMap = new Map<string, number>()
        for (const p of allPosts) {
          if (p.siteSlug) {
            slugMap.set(p.siteSlug, (slugMap.get(p.siteSlug) ?? 0) + 1)
          }
        }
        const blogs: ClientBlog[] = []
        slugMap.forEach((count, siteSlug) => {
          blogs.push({ siteSlug, displayName: slugToDisplayName(siteSlug), count })
        })
        setClientBlogs(blogs)
        setPosts(allPosts)
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"
          >
            ItGrows.ai
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/#features" className="hover:text-[#1b1916] transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="hover:text-[#1b1916] transition-colors">
              How it works
            </a>
            <a href="/#pricing" className="hover:text-[#1b1916] transition-colors">
              Pricing
            </a>
            <Link href="/blog" className="text-[#1b1916] font-medium">
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-slate-600 hover:text-[#1b1916] text-sm transition-colors">
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
      <section className="px-6 py-20 text-center relative overflow-hidden bg-[#ebe9e5]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-[#1b1916]">
            ItGrows.ai{" "}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-slate-600 text-lg">
            AI-generated insights for growing businesses
          </p>
        </div>
      </section>

      {/* Featured Client Blogs */}
      {!loading && clientBlogs.length > 0 && (
        <section className="px-6 pb-12 pt-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1b1916] mb-6">Featured Blogs</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {clientBlogs.map((blog) => (
                <Link
                  key={blog.siteSlug}
                  href={`/blog/sites/${blog.siteSlug}`}
                  className="block group"
                >
                  <div className="bg-white border border-black/10 rounded-2xl p-5 hover:shadow-sm hover:border-violet-300 transition-all">
                    <h3 className="text-[#1b1916] font-semibold text-base mb-1 group-hover:text-violet-600 transition-colors">
                      {blog.displayName} Blog
                    </h3>
                    <p className="text-slate-500 text-xs">
                      {blog.count} {blog.count === 1 ? "article" : "articles"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="px-6 pb-24 pt-12">
        <div className="max-w-6xl mx-auto">
          {clientBlogs.length > 0 && !loading && (
            <h2 className="text-2xl font-bold text-[#1b1916] mb-6">Latest Articles</h2>
          )}
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-600 text-lg">Coming soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt = stripHtml(post.content).slice(0, 150)
                const href = post.siteSlug
                  ? `/blog/sites/${post.siteSlug}/${post.slug}`
                  : `/blog/${post.slug}`
                return (
                  <Link key={post.id} href={href} className="block group">
                    <div className="h-full bg-white border border-black/10 rounded-2xl p-6 hover:shadow-sm hover:border-violet-300 transition-all">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-md bg-violet-100 border border-violet-200 text-violet-700 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-[#1b1916] font-semibold text-lg mb-3 group-hover:text-violet-600 transition-colors leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {excerpt}
                        {excerpt.length >= 150 ? "…" : ""}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-xs">{formatDate(post.publishedAt)}</p>
                        {post.siteSlug && (
                          <span className="text-xs text-violet-600">{slugToDisplayName(post.siteSlug)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5]">
        <p>© 2026 ItGrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
