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
    ? siteSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : ""

  useEffect(() => {
    if (!slug || !siteSlug) return

    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/posts/${slug}`)
        if (res.ok) {
          const data = (await res.json()) as { post: BlogPost }
          if (data.post.siteSlug === siteSlug) {
            setPost(data.post)
            return
          }
        }
      } catch { /* fall through */ }

      setNotFound(true)
    }

    fetchPost().finally(() => setLoading(false))
  }, [slug, siteSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#f3f2f1] flex flex-col items-center justify-center gap-4">
        <p className="text-[#1b1916]/60 text-lg">Article not found.</p>
        <Link
          href={`/blog/sites/${siteSlug}`}
          className="text-violet-600 hover:text-violet-500 hover:underline text-sm transition-colors"
        >
          ← Back to {displayName} Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      {/* Header */}
      <header className="border-b border-black/10 px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"
          >
            itgrows.ai
          </Link>
          <Link
            href={`/blog/sites/${siteSlug}`}
            className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors"
          >
            ← Back to {displayName} Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Cover Image */}
          {post.coverImageUrl && (
            <div className="w-full h-64 md:h-96 overflow-hidden rounded-2xl mb-8">
              <img src={`/api/blog/image/${post.id}`} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-[#1b1916]">
            {post.title}
          </h1>
          <p className="text-[#1b1916]/60 text-sm mb-10">{formatDate(post.publishedAt)}</p>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className="mt-12 pt-8 border-t border-black/10">
            <Link
              href={`/blog/sites/${siteSlug}`}
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-500 font-medium text-sm transition-colors"
            >
              ← Back to {displayName} Blog
            </Link>
          </div>
        </div>
      </main>

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
