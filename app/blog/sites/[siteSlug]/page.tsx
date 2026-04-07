"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import type { BlogPost } from "@/app/api/blog/posts/route"

function getExcerpt(post: { metaDescription?: string | null; content: string }): string {
  if (post.metaDescription) return post.metaDescription.slice(0, 160)
  const stripped = post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return stripped.slice(0, 160)
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

  const displayName = siteSlug
    ? siteSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : ""

  useEffect(() => {
    if (!siteSlug) return

    async function fetchPosts() {
      try {
        const res = await fetch(`/api/blog/posts/public?siteSlug=${siteSlug}`)
        const data = (await res.json()) as { posts: BlogPost[] }
        setPosts(data.posts ?? [])
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [siteSlug])

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"
          >
            itgrows.ai
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors"
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
      <section className="px-6 py-20 text-center bg-[#ebe9e5]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-[#1b1916]">
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              {displayName}
            </span>{" "}
            Blog
          </h1>
          <p className="text-[#1b1916]/60 text-lg">Powered by ItGrows.ai</p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#1b1916]/60 text-lg">No articles yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt = getExcerpt(post)
                return (
                  <Link
                    key={post.id}
                    href={`/blog/sites/${siteSlug}/${post.slug}`}
                    className="block group"
                  >
                    <div className="h-full bg-white border border-black/10 rounded-2xl overflow-hidden hover:border-violet-600/30 hover:shadow-sm transition-all">
                      {post.coverImageUrl && (
                        <div className="w-full h-48 overflow-hidden">
                          <img src={`/api/blog/image/${post.id}`} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-6">
                      <h2 className="text-[#1b1916] font-semibold text-lg mb-3 group-hover:text-violet-600 transition-colors leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-[#1b1916]/60 text-sm leading-relaxed mb-4">
                        {excerpt}{excerpt.length >= 160 ? "…" : ""}
                      </p>
                      <p className="text-[#1b1916]/40 text-xs">{formatDate(post.publishedAt)}</p>
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
      <footer className="border-t border-black/10 px-6 py-8 text-center text-[#1b1916]/60 text-sm bg-[#ebe9e5]">
        <p>
          Powered by{" "}
          <Link href="/" className="text-violet-600 hover:text-violet-500 transition-colors">
            ItGrows.ai
          </Link>{" "}
          &mdash; &copy; 2026
        </p>
      </footer>
    </div>
  )
}
