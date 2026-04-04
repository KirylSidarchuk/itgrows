"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import type { BlogPost } from "@/app/api/blog/posts/route"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function SiteBlogPostPage() {
  const { siteSlug, slug } = useParams<{ siteSlug: string; slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const displayName = siteSlug
    ? siteSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : ""

  useEffect(() => {
    if (!slug || !siteSlug) return

    async function fetchPost() {
      try {
        // Try the dedicated slug endpoint first
        const res = await fetch(`/api/blog/posts/${slug}`)
        if (res.ok) {
          const data = (await res.json()) as { post: BlogPost }
          // Verify it belongs to this siteSlug
          if (data.post.siteSlug === siteSlug) {
            setPost(data.post)
            return
          }
        }
      } catch {
        // fall through
      }

      // Fallback: check localStorage
      try {
        const local = localStorage.getItem("itgrows_published_posts")
        if (local) {
          const posts = JSON.parse(local) as BlogPost[]
          const found = posts.find((p) => p.slug === slug && p.siteSlug === siteSlug)
          if (found) {
            setPost(found)
            return
          }
        }
      } catch {
        // ignore
      }

      setNotFound(true)
    }

    fetchPost().finally(() => setLoading(false))
  }, [slug, siteSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-lg">Article not found.</p>
        <Link href={`/blog/${siteSlug}`} className="text-violet-400 hover:underline text-sm">
          ← Back to {displayName} Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"
          >
            itgrows.ai
          </Link>
          <Link
            href={`/blog/${siteSlug}`}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back to {displayName} Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-md bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs font-medium"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-white">
            {post.title}
          </h1>

          {/* Date */}
          <p className="text-slate-400 text-sm mb-10">{formatDate(post.publishedAt)}</p>

          {/* Content */}
          <div
            className="prose prose-invert prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <Link
              href={`/blog/${siteSlug}`}
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium text-sm transition-colors"
            >
              ← Back to {displayName} Blog
            </Link>
          </div>
        </div>
      </main>

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
