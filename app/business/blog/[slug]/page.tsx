import { notFound } from "next/navigation"
import { noteCrawler } from "@/lib/crawler-log"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, ne } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"
import type { Metadata } from "next"

const SITE_SLUG = "itgrows-business"
const BASE = "https://www.itgrows.ai"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// Must run per request: a prerendered response is served from the CDN and never reaches the
// server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.siteSlug, SITE_SLUG)))
  if (!post) return {}

  const imageUrl = `${BASE}/api/blog/image/${post.id}`
  return {
    title: post.title,
    description: post.metaDescription || post.title,
    keywords: Array.isArray(post.keywords) ? (post.keywords as string[]).join(", ") : undefined,
    alternates: { canonical: `${BASE}/business/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.title,
      url: `${BASE}/business/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      images: post.coverImageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription || post.title,
      images: post.coverImageUrl ? [imageUrl] : [],
    },
  }
}

export default async function BusinessBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  void noteCrawler("/business/blog/[slug]")
  const { slug } = await params

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.siteSlug, SITE_SLUG)))

  if (!post) notFound()

  // Siblings for the footer. The generator links inline where it fits; this guarantees every
  // article has outbound paths into the cluster even when it did not.
  const related = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title, id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.siteSlug, SITE_SLUG), ne(blogPosts.slug, slug)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(4)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.title,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.publishedAt.toISOString(),
    publisher: { "@type": "Organization", name: "ItGrows.ai", url: BASE },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/business/blog/${slug}` },
    ...(post.coverImageUrl ? { image: `${BASE}/api/blog/image/${post.id}` } : {}),
  }

  // FAQ extraction, same two shapes the generator produces (bold-paragraph questions, legacy h3).
  const faqItems: Array<{ question: string; answer: string }> = []
  const faqSectionMatch = post.content.match(/<h2[^>]*>[^<]*(?:frequently asked questions|faq)[^<]*<\/h2>([\s\S]*)/i)
  if (faqSectionMatch) {
    const faqPatterns = [
      /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
      /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
    ]
    for (const faqRegex of faqPatterns) {
      let faqMatch
      while ((faqMatch = faqRegex.exec(faqSectionMatch[1])) !== null && faqItems.length < 5) {
        const question = faqMatch[1].replace(/<[^>]+>/g, "").trim()
        const answer = faqMatch[2].replace(/<[^>]+>/g, "").trim()
        if (question.endsWith("?") && answer) faqItems.push({ question, answer })
      }
      if (faqItems.length > 0) break
    }
  }

  const faqSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null

  const wordCount = post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
  const readingTimeMin = Math.max(1, Math.round(wordCount / 200))

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <header className="border-b border-black/10 px-4 sm:px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/business" className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <Link href="/business/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors shrink-0">
            ← All articles
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {post.coverImageUrl && (
            <div className="w-full h-56 sm:h-80 md:h-96 overflow-hidden rounded-2xl mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/blog/image/${post.id}`} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">{post.title}</h1>

          <p className="text-[#1b1916]/60 text-sm mb-10">
            {formatDate(post.publishedAt)}
            <span className="mx-2 opacity-40">·</span>
            {readingTimeMin} min read
          </p>

          <div
            className="article-content"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(post.content, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                  "img", "h1", "h2", "h3", "table", "thead", "tbody", "tr", "th", "td",
                ]),
                allowedAttributes: {
                  ...sanitizeHtml.defaults.allowedAttributes,
                  img: ["src", "alt", "class"],
                  "*": ["class"],
                },
              }),
            }}
          />

          {/* The reason this blog exists. */}
          <div className="mt-12 rounded-2xl bg-white border-2 border-violet-200 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2 tracking-tight">
              Can the answer engines even reach your site?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed">
              Enter your domain and see which crawlers are allowed in, how many pages they can find, and what is
              missing. Free, no signup.
            </p>
            <Link
              href="/business"
              className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 text-sm font-semibold shadow-lg shadow-violet-600/30 transition-colors"
            >
              Check my site →
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-black/10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">Keep reading</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/business/blog/${r.slug}`}
                    className="block bg-white border border-black/10 rounded-2xl p-5 hover:border-violet-300 transition-colors"
                  >
                    <span className="font-semibold text-sm leading-snug">{r.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5]">
        <div className="max-w-6xl mx-auto">
          © 2026 ItGrows.ai ·{" "}
          <Link href="/business" className="hover:text-[#1b1916] transition-colors">ItGrows for Business</Link>{" · "}
          <Link href="/business/blog" className="hover:text-[#1b1916] transition-colors">All articles</Link>
        </div>
      </footer>
    </div>
  )
}
