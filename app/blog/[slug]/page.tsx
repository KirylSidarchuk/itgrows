import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))

  if (!post) {
    notFound()
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
            href="/blog"
            className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors flex items-center gap-1"
          >
            ← Back to Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-[#1b1916]">
            {post.title}
          </h1>

          {/* Date */}
          <p className="text-slate-500 text-sm mb-10">{formatDate(post.publishedAt)}</p>

          {/* Content */}
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-[#1b1916] prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-black/10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-500 font-medium text-sm transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5]">
        <p>© 2026 ItGrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
