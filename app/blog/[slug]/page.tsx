import { notFound } from "next/navigation"
import { noteCrawler } from "@/lib/crawler-log"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, ne, or } from "drizzle-orm"

// itgrows.ai internal blog owner — only their posts are publicly accessible at /blog
const ITGROWS_OWNER_USER_ID = "7cd0011c-fadd-4ff5-bd1e-6445fea70b22"
import sanitizeHtml from "sanitize-html"
import type { Metadata } from "next"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Must run per request: a prerendered response is served from the CDN and never
// reaches the server, so crawler visits would be invisible.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), or(eq(blogPosts.userId, ITGROWS_OWNER_USER_ID), eq(blogPosts.siteSlug, "itgrows"))))
  if (!post) return {}

  const imageUrl = `https://www.itgrows.ai/api/blog/image/${post.id}`

  return {
    title: post.title,
    description: post.metaDescription || post.title,
    keywords: Array.isArray(post.keywords) ? (post.keywords as string[]).join(", ") : undefined,
    alternates: {
      canonical: `https://www.itgrows.ai/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.title,
      url: `https://www.itgrows.ai/blog/${slug}`,
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

type BlogRow = { slug: string; title: string; siteSlug: string | null; keyword: string | null }

// Reading suggestions, and one honest bridge to the product. A GEO reader is already asking the
// question /business answers; a LinkedIn reader is not, and is offered the explainer instead.
function ReadNext({ current, related }: { current: BlogRow; related: BlogRow[] }) {
  const isGeo = current.siteSlug === "itgrows-business"
  const base = isGeo ? "/business/blog" : "/blog"

  return (
    <div className="mt-14 pt-10 border-t border-black/10">
      {related.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#1b1916]/50 mb-4">Read next</h2>
          <ul className="space-y-3 mb-10">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`${base}/${r.slug}`}
                  className="block rounded-xl border border-black/10 px-4 py-3 hover:border-violet-400 transition-colors"
                >
                  <span className="font-medium text-[#1b1916]">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="rounded-2xl bg-[#f5f3f0] border border-black/10 p-6">
        {isGeo ? (
          <>
            <p className="text-[#1b1916] font-semibold mb-2">We do this for companies.</p>
            <p className="text-sm text-[#1b1916]/70 leading-relaxed mb-4">
              Answer-shaped articles published on your own domain, so an assistant has something of
              yours to quote. $499 a month.
            </p>
            <Link href="/business" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors">
              See how it works →
            </Link>
          </>
        ) : (
          <>
            <p className="text-[#1b1916] font-semibold mb-2">A different question worth asking</p>
            <p className="text-sm text-[#1b1916]/70 leading-relaxed mb-4">
              People increasingly ask an assistant instead of a search engine, and it answers by
              quoting somebody. We measured our own logs: AI crawlers read our sites roughly 370
              times more often than Google does.
            </p>
            <Link href="/business" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-500 font-semibold text-sm transition-colors">
              Why assistants name some companies and not others →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  void noteCrawler("/blog/[slug]")
  const { slug } = await params

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), or(eq(blogPosts.userId, ITGROWS_OWNER_USER_ID), eq(blogPosts.siteSlug, "itgrows"))))

  // Two more from the same blog, most recent first, excluding this one. Matching on shared
  // keywords would be better; the table has no index for it, so recency is the cheap honest
  // version rather than a slow clever one.
  const related = post
    ? await db
        .select({
          slug: blogPosts.slug,
          title: blogPosts.title,
          siteSlug: blogPosts.siteSlug,
          keyword: blogPosts.keyword,
        })
        .from(blogPosts)
        .where(and(eq(blogPosts.siteSlug, post.siteSlug ?? "itgrows"), ne(blogPosts.slug, slug)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(2)
    : []

  if (!post) {
    notFound()
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.title,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.publishedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "ItGrows.ai",
      url: "https://www.itgrows.ai",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.itgrows.ai/blog/${slug}`,
    },
    ...(post.coverImageUrl
      ? { image: `https://www.itgrows.ai/api/blog/image/${post.id}` }
      : {}),
  }

  // Extract FAQ items from the article for FAQPage structured data.
  // Our generator renders FAQ questions as bold paragraphs (**Q**  ->  <p><strong>Q</strong></p>)
  // followed by a <p> answer; older content used <h3> questions. Support both formats.
  const faqItems: Array<{ question: string; answer: string }> = []
  const faqSectionMatch = post.content.match(/<h2[^>]*>[^<]*(?:frequently asked questions|faq)[^<]*<\/h2>([\s\S]*)/i)
  if (faqSectionMatch) {
    const faqPatterns = [
      /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi, // bold-paragraph questions
      /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,                        // legacy h3 questions
    ]
    for (const faqRegex of faqPatterns) {
      let faqMatch
      while ((faqMatch = faqRegex.exec(faqSectionMatch[1])) !== null && faqItems.length < 5) {
        const question = faqMatch[1].replace(/<[^>]+>/g, "").trim()
        const answer = faqMatch[2].replace(/<[^>]+>/g, "").trim()
        // Only keep genuine Q/A pairs (a question ends with "?"); skips the CTA strong-line.
        if (question.endsWith("?") && answer) {
          faqItems.push({ question, answer })
        }
      }
      if (faqItems.length > 0) break
    }
  }

  const faqSchema = faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null

  // Reading time estimate
  const wordCount = post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
  const readingTimeMin = Math.max(1, Math.round(wordCount / 200))

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
          {/* Cover Image */}
          {post.coverImageUrl && (
            <div className="w-full h-64 md:h-96 overflow-hidden rounded-2xl mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/blog/image/${post.id}`} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-[#1b1916]">
            {post.title}
          </h1>

          {/* Date + Reading time */}
          <p className="text-[#1b1916]/60 text-sm mb-10">
            {formatDate(post.publishedAt)}
            <span className="mx-2 opacity-40">·</span>
            {readingTimeMin} min read
          </p>

          {/* Content */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content, {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "table", "thead", "tbody", "tr", "th", "td"]),
              allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt", "class"], "*": ["class"] }
            }) }}
          />

          {/* What to read next. The blog is the only surface bringing strangers in, so it has to
              lead somewhere; without this every article is a dead end. */}
          <ReadNext current={post} related={related} />

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
