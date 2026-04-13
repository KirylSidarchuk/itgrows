import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.userId, ITGROWS_OWNER_USER_ID)))
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.userId, ITGROWS_OWNER_USER_ID)))

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

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

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

          {/* Date */}
          <p className="text-[#1b1916]/60 text-sm mb-10">{formatDate(post.publishedAt)}</p>

          {/* Content */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]), allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt", "class"], "*": ["class"] } }) }}
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
