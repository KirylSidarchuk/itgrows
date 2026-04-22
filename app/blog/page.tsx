import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

// itgrows.ai internal blog owner — only their posts appear on the public blog
const ITGROWS_OWNER_USER_ID = "7cd0011c-fadd-4ff5-bd1e-6445fea70b22"

export const revalidate = 0 // always fetch fresh from DB

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function BlogPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.userId, ITGROWS_OWNER_USER_ID))
    .orderBy(desc(blogPosts.publishedAt))

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
            <a href="/#features" className="hover:text-[#1b1916] transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-[#1b1916] transition-colors">How it works</a>
            <a href="/#pricing" className="hover:text-[#1b1916] transition-colors">Pricing</a>
            <Link href="/blog" className="text-[#1b1916] font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-slate-600 hover:text-[#1b1916] text-sm transition-colors">Login</button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">Get Started</button>
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
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-slate-600 text-lg">Useful insights on growing your personal brand on LinkedIn, Instagram, and X</p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="px-6 pb-24 pt-16">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <p className="text-slate-600 text-lg text-center py-16">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt = stripHtml(post.content).slice(0, 150)
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block bg-white border border-black/10 rounded-2xl overflow-hidden hover:border-violet-400/60 hover:shadow-md transition-all"
                  >
                    {post.coverImageUrl && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={`/api/blog/image/${post.id}`}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs text-slate-400 mb-3">{formatDate(post.publishedAt)}</p>
                      <h2 className="text-lg font-bold text-[#1b1916] mb-3 group-hover:text-violet-600 transition-colors leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {excerpt}{excerpt.length >= 150 ? "…" : ""}
                      </p>
                      <span className="inline-block mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-500 transition-colors">
                        Read more →
                      </span>
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
