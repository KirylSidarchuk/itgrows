import { notFound, permanentRedirect } from "next/navigation"
import { noteCrawler } from "@/lib/crawler-log"
import Link from "next/link"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"
import type { Metadata } from "next"

const SITE_SLUG = "itgrows-business"
const BASE = "https://www.itgrows.ai"

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
}

// The page around the article speaks the article's language. Articles are English or German
// (blog_posts.lang); any other language gets the English page.
const UI = {
  en: {
    dateLocale: "en-US",
    ogLocale: "en_US",
    allArticles: "All articles",
    updated: "Updated",
    minRead: "min read",
    ctaTitle: "Does ChatGPT name your business?",
    ctaText:
      "Enter your site: we ask ChatGPT and Perplexity five questions your buyers ask and show who they name instead of you. No signup, about 30 seconds.",
    ctaCheck: "Check my AI visibility →",
    ctaCrawlers: "Am I blocking AI crawlers?",
    keepReading: "Keep reading",
    home: "ItGrows for Business",
    // Our site in the post's language (the GEO site is translated: /de, 2f44505).
    links: { home: "/", check: "/business/ai-visibility-checker", crawlers: "/business/ai-crawler-checker" },
  },
  de: {
    dateLocale: "de-DE",
    ogLocale: "de_DE",
    allArticles: "Alle Artikel",
    updated: "Aktualisiert am",
    minRead: "Min. Lesezeit",
    ctaTitle: "Nennt ChatGPT Ihr Unternehmen?",
    ctaText:
      "Geben Sie Ihre Website ein: Wir stellen ChatGPT und Perplexity fünf Fragen, wie Ihre Kunden sie stellen, und zeigen, wen sie statt Ihnen nennen. Ohne Anmeldung, etwa 30 Sekunden.",
    ctaCheck: "Meine KI-Sichtbarkeit prüfen →",
    ctaCrawlers: "Sperre ich KI-Crawler aus?",
    keepReading: "Weiterlesen",
    home: "ItGrows für Unternehmen",
    links: { home: "/de", check: "/de/business/ai-visibility-checker", crawlers: "/de/business/ai-crawler-checker" },
  },
}
const uiFor = (lang: string | null) => UI[lang === "de" ? "de" : "en"]

// FAQPage data from the article's FAQ section (German articles head it "Häufig gestellte Fragen").
// The generator writes each question as a bold paragraph; the answer follows in the next paragraph
// or, in some articles, in the question's own paragraph. Older content used <h3> questions.
const FAQ_SECTION = /<h2[^>]*>[^<]*(?:frequently asked questions|\bfaqs?\b|häufig gestellte fragen|häufige fragen)[^<]*<\/h2>([\s\S]*)/i

function extractFaq(content: string): Array<{ question: string; answer: string }> {
  const section = content.match(FAQ_SECTION)?.[1]
  if (!section) return []
  const items: Array<{ question: string; answer: string }> = []
  const patterns = [
    /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*(?:<\/p>\s*<p[^>]*>)?([\s\S]*?)<\/p>/gi,
    /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
  ]
  for (const pattern of patterns) {
    for (const m of section.matchAll(pattern)) {
      if (items.length >= 5) break
      const question = m[1].replace(/<[^>]+>/g, "").trim()
      const answer = m[2].replace(/<[^>]+>/g, "").trim()
      // Only genuine Q/A pairs: a question ends with "?", which skips bold lead-ins like "Note:".
      if (question.endsWith("?") && answer) items.push({ question, answer })
    }
    if (items.length > 0) break
  }
  return items
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
  if (!post || post.redirectTo) return {}

  const imageUrl = `${BASE}/api/blog/image/${post.id}`
  return {
    title: post.title,
    description: post.metaDescription || post.title,
    keywords: Array.isArray(post.keywords) ? (post.keywords as string[]).join(", ") : undefined,
    alternates: {
      canonical: `${BASE}/business/blog/${slug}`,
      types: { "text/markdown": `${BASE}/business/blog/${slug}.md` },
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.title,
      url: `${BASE}/business/blog/${slug}`,
      type: "article",
      locale: uiFor(post.lang).ogLocale,
      publishedTime: post.publishedAt.toISOString(),
      ...(post.updatedAt ? { modifiedTime: post.updatedAt.toISOString() } : {}),
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
  if (post.redirectTo) permanentRedirect(post.redirectTo)

  const lang = post.lang ?? "en"
  const ui = uiFor(post.lang)

  // Siblings for the footer. The generator links inline where it fits; this guarantees every
  // article has outbound paths into the cluster even when it did not. Same language only: a German
  // reader offered English pages (or the reverse) has nowhere to go.
  const related = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title, id: blogPosts.id })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.siteSlug, SITE_SLUG),
        ne(blogPosts.slug, slug),
        isNull(blogPosts.redirectTo),
        sql`coalesce(${blogPosts.lang}, 'en') = ${lang}`,
      ),
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(4)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.title,
    datePublished: post.publishedAt.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt).toISOString(),
    inLanguage: post.lang ?? "en",
    author: { "@type": "Organization", "@id": `${BASE}/#organization`, name: "ItGrows", url: BASE },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "ItGrows",
      url: BASE,
      logo: { "@type": "ImageObject", url: `${BASE}/logo.jpg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/business/blog/${slug}` },
    ...(post.coverImageUrl ? { image: `${BASE}/api/blog/image/${post.id}` } : {}),
  }

  const faqItems = extractFaq(post.content)

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
    <div lang={lang} className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      {/* app/layout.tsx sets <html lang="en"> for every route; this tells search engines (Bing reads it)
          the page's real language. React moves it into <head>. */}
      <meta httpEquiv="content-language" content={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <header className="border-b border-black/10 px-4 sm:px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href={ui.links.home} className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <Link href="/business/blog" className="text-sm text-slate-600 hover:text-[#1b1916] transition-colors shrink-0">
            ← {ui.allArticles}
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
            {formatDate(post.publishedAt, ui.dateLocale)}
            {post.updatedAt && (
              <>
                <span className="mx-2 opacity-40">·</span>
                {ui.updated} {formatDate(post.updatedAt, ui.dateLocale)}
              </>
            )}
            <span className="mx-2 opacity-40">·</span>
            {readingTimeMin} {ui.minRead}
          </p>

          <div
            className="article-content"
            dangerouslySetInnerHTML={{
              // The stored article starts with its own <h1>; the page already renders the title as one.
              __html: sanitizeHtml(post.content.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i, ""), {
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
              {ui.ctaTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed">{ui.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={ui.links.check}
                className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 text-sm font-semibold shadow-lg shadow-violet-600/30 transition-colors"
              >
                {ui.ctaCheck}
              </Link>
              <Link
                href={ui.links.crawlers}
                className="inline-block rounded-xl border border-black/10 bg-white hover:bg-[#f8f7f6] px-8 py-3.5 text-sm font-semibold transition-colors"
              >
                {ui.ctaCrawlers}
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-black/10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">{ui.keepReading}</h2>
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
          <Link href={ui.links.home} className="hover:text-[#1b1916] transition-colors">{ui.home}</Link>{" · "}
          <Link href="/business/blog" className="hover:text-[#1b1916] transition-colors">{ui.allArticles}</Link>
        </div>
      </footer>
    </div>
  )
}
