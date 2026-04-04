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

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return
      try {
        const res = await fetch(`/api/blog/posts/${slug}`)
        if (res.ok) {
          const data = (await res.json()) as { post: BlogPost }
          setPost(data.post)
          return
        }
      } catch {
        // fall through to localStorage
      }

      // Fallback: check localStorage
      try {
        const local = localStorage.getItem("itgrows_published_posts")
        if (local) {
          const posts = JSON.parse(local) as BlogPost[]
          const found = posts.find((p) => p.slug === slug)
          if (found) {
            setPost(found)
            return
          }
        }
      } catch {
        // ignore
      }

      setNotFound(true)
      setLoading(false)
    }

    fetchPost().finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600 text-lg">Article not found.</p>
        <Link href="/blog" className="text-violet-600 hover:underline text-sm">
          ← Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent"
          >
            itgrows.ai
          </Link>
          <Link
            href="/blog"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            ← Back to Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Meta description (hidden, for SEO) */}
          <meta name="description" content={post.metaDescription} />

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-700 text-xs font-medium"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-slate-900">
            {post.title}
          </h1>

          {/* Date */}
          <p className="text-slate-400 text-sm mb-10">{formatDate(post.publishedAt)}</p>

          {/* Content */}
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium text-sm transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 text-center text-slate-400 text-sm">
        <p>© 2026 itgrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
