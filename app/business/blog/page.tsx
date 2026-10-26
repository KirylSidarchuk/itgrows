import type { Metadata } from "next"
import Link from "next/link"
import { noteCrawler } from "@/lib/crawler-log"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { desc, eq, and, isNull } from "drizzle-orm"

// revalidate 0 rather than a static build: a prerendered page never executes on request, so the
// crawler telemetry below would record nothing — which is how the first attempt at measuring this
// silently returned zero for a day.
export const revalidate = 0

export const metadata: Metadata = {
  title: "AI visibility guides: get named by ChatGPT | ItGrows",
  description:
    "A working series on generative engine optimisation: how AI assistants find, read and cite a business, and how to tell whether yours is visible at all.",
  alternates: { canonical: "https://www.itgrows.ai/business/blog" },
  openGraph: {
    title: "AI visibility guides: how to get your business named by ChatGPT",
    description: "How ChatGPT, Claude, Gemini and Perplexity find, read and cite a business, from our own measurements.",
    url: "https://www.itgrows.ai/business/blog",
    type: "website",
  },
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(date: Date, lang: "de" | "en" = "en"): string {
  return date.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", { year: "numeric", month: "long", day: "numeric" })
}

export default async function BusinessBlogPage() {
  void noteCrawler("/business/blog")
  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.siteSlug, "itgrows-business"), isNull(blogPosts.redirectTo)))
    .orderBy(desc(blogPosts.publishedAt))
  // English guides first; the German ones in their own section below (the old posts without a
  // language are English), so the English list is not interleaved with German titles.
  const german = posts.filter((p) => p.lang === "de")
  const english = posts.filter((p) => p.lang !== "de")

  const card = (post: (typeof posts)[number], lang: "de" | "en") => {
    const excerpt = stripHtml(post.content).slice(0, 150)
    return (
      <Link
        key={post.id}
        href={`/business/blog/${post.slug}`}
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
          <p className="text-xs text-slate-400 mb-3">{formatDate(post.publishedAt, lang)}</p>
          <h2 className="text-lg font-bold mb-3 group-hover:text-violet-600 transition-colors leading-snug">
            {post.title}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {excerpt}{excerpt.length >= 150 ? "…" : ""}
          </p>
          <span className="inline-block mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-500 transition-colors">
            {lang === "de" ? "Weiterlesen →" : "Read more →"}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 bg-[#f3f2f1] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-[#1b1916] transition-colors">For business</Link>
            <Link href="/business/blog" className="text-[#1b1916] font-medium">AI visibility</Link>
            <Link href="/blog" className="hover:text-[#1b1916] transition-colors">Blog</Link>
          </div>
          <Link href="/" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            Check your site
          </Link>
        </div>
      </nav>

      <section className="px-4 sm:px-6 py-16 sm:py-20 text-center relative overflow-hidden bg-[#ebe9e5]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Getting your business{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              named by AI
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg mb-8">
            How answer engines find, read and cite a company — and how to tell whether yours is visible at all.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-7 py-3.5 text-sm font-semibold shadow-lg shadow-violet-600/30 transition-colors"
          >
            Check your site →
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24 pt-14">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <p className="text-slate-600 text-lg text-center py-16">The first articles are on their way.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {english.map((post) => card(post, "en"))}
              </div>
              {german.length > 0 && (
                <div id="de" lang="de" className="mt-16 scroll-mt-24">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Auf Deutsch: Leitfäden zur KI-Sichtbarkeit</h2>
                  <p className="text-slate-600 mt-2 mb-6">Wie ChatGPT, Claude, Gemini und Perplexity Unternehmen finden und nennen.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {german.map((post) => card(post, "de"))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5]">
        <div className="max-w-6xl mx-auto">
          © 2026 ItGrows.ai ·{" "}
          <Link href="/" className="hover:text-[#1b1916] transition-colors">ItGrows for Business</Link>{" · "}
          <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
