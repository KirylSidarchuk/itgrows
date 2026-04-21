"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { platformLabel } from "@/lib/connectedSites"
import type { BlogPost } from "@/app/api/blog/posts/route"

interface SeoBreakdown {
  wordCount: number
  headings: number
  keywords: number
  meta: number
  faq: number
  keyTakeaways: number
}

interface ArticleResult {
  article: {
    keyword: string
    title: string
    content: string
    metaDescription: string
    keywords: string[]
    seoScore?: number
    seoBreakdown?: SeoBreakdown
    coverImageUrl?: string | null
  }
  publishUrl: string
  platform: string
  keyword: string
}

interface ConnectedSite {
  id: string
  name: string
  url: string
  platform: string
  siteToken: string
  siteSlug: string | null
  blogDomain: string | null
  isDefault: boolean
}

export default function SeoResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<ArticleResult | null>(null)
  const [previewMode, setPreviewMode] = useState<"html" | "raw">("html")
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [blogPublishing, setBlogPublishing] = useState(false)
  const [blogPublished, setBlogPublished] = useState(false)
  const [blogSlug, setBlogSlug] = useState<string | null>(null)
  const [publishedSiteName, setPublishedSiteName] = useState<string | null>(null)
  const [noSiteModal, setNoSiteModal] = useState(false)
  const [defaultSite, setDefaultSite] = useState<ConnectedSite | null>(null)

  function slugify(text: string): string {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() +
      "-" +
      Date.now().toString(36)
    )
  }

  useEffect(() => {
    // Load article from sessionStorage
    try {
      const sessionData = sessionStorage.getItem("seo_result")
      if (sessionData) {
        const articleData = JSON.parse(sessionData) as ArticleResult["article"]
        sessionStorage.removeItem("seo_result")
        const tid = sessionStorage.getItem("seo_result_task_id") ?? null
        sessionStorage.removeItem("seo_result_task_id")
        setTaskId(tid)
        setResult({
          article: articleData,
          publishUrl: "",
          platform: "none",
          keyword: articleData.keyword,
        })
      } else {
        router.push("/business/dashboard/seo")
      }
    } catch {
      router.push("/business/dashboard/seo")
    }

    // Load default site from API
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: { sites?: ConnectedSite[] }) => {
        const sites = data.sites ?? []
        const site = sites.find((s) => s.isDefault) ?? sites[0] ?? null
        setDefaultSite(site)
      })
      .catch(() => {})
  }, [router])

  const handleEditStart = () => {
    if (!result) return
    setEditContent(result.article.content)
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditContent("")
  }

  const handleEditSave = async () => {
    if (!result) return
    const updatedArticle = { ...result.article, content: editContent }
    const updatedResult = { ...result, article: updatedArticle }
    setResult(updatedResult)

    // Update task in DB if we have a task ID
    if (taskId) {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleData: updatedArticle,
          }),
        })
      } catch {
        // ignore
      }
    }

    setIsEditing(false)
    setEditContent("")
  }

  const publishToItgrowsBlog = async (
    article: ArticleResult["article"],
    siteName?: string,
    siteId?: string,
    siteSlug?: string,
  ) => {
    try {
      const res = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          metaDescription: article.metaDescription,
          keywords: article.keywords,
          keyword: article.keyword,
          ...(siteId ? { siteId } : {}),
          ...(siteSlug ? { siteSlug } : {}),
          ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
        }),
      })
      const data = (await res.json()) as { success: boolean; post?: BlogPost; storage?: string; error?: string }

      const toPath = (slug: string) =>
        siteSlug && siteSlug !== "itgrows" ? `sites/${siteSlug}/${slug}` : slug
      if (data.post) {
        setBlogSlug(toPath(data.post.slug))
        setBlogPublished(true)
        setPublishedSiteName(siteName ?? "ItGrows.ai Blog")
      } else {
        setBlogSlug(toPath(slugify(article.title)))
        setBlogPublished(true)
        setPublishedSiteName(siteName ?? "ItGrows.ai Blog")
      }
    } catch {
      const toPath = (slug: string) =>
        siteSlug && siteSlug !== "itgrows" ? `sites/${siteSlug}/${slug}` : slug
      setBlogSlug(toPath(slugify(article.title)))
      setBlogPublished(true)
      setPublishedSiteName(siteName ?? "ItGrows.ai Blog")
    }
  }

  const handlePublishToBlog = async () => {
    if (!result || blogPublishing || blogPublished) return

    // No connected sites → show modal
    if (!defaultSite) {
      setNoSiteModal(true)
      return
    }

    setBlogPublishing(true)
    const { article } = result

    // Owner's ItGrows.ai blog
    if (defaultSite.platform === "itgrows_blog") {
      await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
      setBlogPublishing(false)
      return
    }

    // Custom platform with blogDomain/siteSlug — publish to external site AND mirror to blog_posts for CNAME display
    if (defaultSite.platform === "custom" && (defaultSite.siteSlug || defaultSite.blogDomain)) {
      await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
      setBlogPublishing(false)
      return
    }

    // External site (WordPress, Shopify, Webflow, etc.) — publish only there
    try {
      const pubRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: defaultSite.url,
          siteToken: defaultSite.siteToken,
          platform: defaultSite.platform,
          title: article.title,
          content: article.content,
          metaDescription: article.metaDescription,
        }),
      })
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as { success?: boolean; url?: string }
        setBlogPublished(true)
        setPublishedSiteName(defaultSite.name)
        if (pubData.url) setBlogSlug(pubData.url)
      } else {
        setBlogPublished(true)
        setPublishedSiteName(defaultSite.name)
      }
    } catch {
      setBlogPublished(true)
      setPublishedSiteName(defaultSite.name)
    } finally {
      setBlogPublishing(false)
    }
  }

  if (!result) return null

  const { article, publishUrl, platform } = result

  const platformLabelMap: Record<string, string> = {
    wordpress: "WordPress",
    shopify: "Shopify",
    webflow: "Webflow",
    none: "",
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Article Generated
            </h1>
            <p className="text-slate-600">
              {publishUrl
                ? `Published to ${platformLabelMap[platform] ?? platform}`
                : "Ready to publish or copy"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/business/dashboard/seo">
              <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white">
                New Article
              </Button>
            </Link>
          </div>
        </div>

        {/* Published URL banner */}
        {publishUrl && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-300">
            <span className="text-2xl">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-green-700 font-medium text-sm">Successfully published!</p>
              <a
                href={publishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-[#1b1916] text-sm truncate block underline"
              >
                {publishUrl}
              </a>
            </div>
            <a
              href={publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50 text-sm"
              >
                Open Post
              </Button>
            </a>
          </div>
        )}

        {/* Blog published banner */}
        {blogPublished && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-violet-50 border border-violet-200">
            <span className="text-2xl">🚀</span>
            <div className="flex-1 min-w-0">
              <p className="text-violet-700 font-medium text-sm">
                Published to {publishedSiteName ?? "your site"}!
              </p>
              {blogSlug && blogSlug.startsWith("http") && (
                <a
                  href={blogSlug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-[#1b1916] text-sm truncate block underline"
                >
                  {blogSlug}
                </a>
              )}
              {blogSlug && !blogSlug.startsWith("http") && (
                <Link
                  href={`/blog/${blogSlug}`}
                  className="text-slate-600 hover:text-[#1b1916] text-sm truncate block underline"
                >
                  itgrows.ai/blog/{blogSlug}
                </Link>
              )}
            </div>
            {blogSlug && (
              <a
                href={blogSlug.startsWith("http") ? blogSlug : `/blog/${blogSlug}`}
                target={blogSlug.startsWith("http") ? "_blank" : undefined}
                rel={blogSlug.startsWith("http") ? "noopener noreferrer" : undefined}
                className="shrink-0"
              >
                <Button variant="outline" className="border-violet-300 text-violet-700 hover:bg-violet-50 text-sm">
                  View →
                </Button>
              </a>
            )}
          </div>
        )}

        {/* No site connected modal */}
        {noSiteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border border-black/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-[#1b1916] font-semibold text-lg mb-2">No Site Connected</h3>
              <p className="text-slate-600 text-sm mb-5">
                Add your website in Settings to publish articles automatically.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/business/dashboard/settings">
                  <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                    Connect a Site
                  </Button>
                </Link>
                <Button
                  onClick={() => setNoSiteModal(false)}
                  variant="ghost"
                  className="w-full text-[#1b1916] hover:text-[#1b1916]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cover Image Preview */}
        {article.coverImageUrl && (
          <div className="mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Cover Image</p>
            <div className="w-full h-48 md:h-64 overflow-hidden rounded-2xl border border-black/10">
              <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Meta + SEO Score layout */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Left: meta description + keywords */}
          <div className="flex-1 flex flex-col gap-4">
            <Card className="bg-white border-black/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#1b1916] text-sm font-medium uppercase tracking-wider">
                  Meta Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1b1916] text-sm leading-relaxed">
                  {article.metaDescription || "—"}
                </p>
                <p className="text-[#1b1916] text-xs mt-2">
                  {article.metaDescription?.length ?? 0} characters
                </p>
              </CardContent>
            </Card>

            {/* Target Keywords pills */}
            <Card className="bg-white border-black/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#1b1916] text-sm font-medium uppercase tracking-wider">
                  Target Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {article.keywords?.length ? (
                    article.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-pink-100 border border-violet-200 text-violet-700"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#1b1916] text-sm">No keywords extracted</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: SEO Score widget */}
          {article.seoScore !== undefined && article.seoBreakdown && (
            <div className="lg:w-72 shrink-0">
              <Card className="bg-white border-black/10 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1b1916] text-sm font-medium uppercase tracking-wider">
                    SEO Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Circular score */}
                  <div className="flex justify-center mb-5">
                    <div className="relative flex items-center justify-center w-24 h-24">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                        <circle
                          cx="48" cy="48" r="40"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="48" cy="48" r="40"
                          fill="none"
                          stroke={
                            article.seoScore >= 80
                              ? "#22c55e"
                              : article.seoScore >= 60
                              ? "#eab308"
                              : "#ef4444"
                          }
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - article.seoScore / 100)}`}
                        />
                      </svg>
                      <div className="text-center">
                        <span
                          className={`text-2xl font-bold ${
                            article.seoScore >= 80
                              ? "text-green-600"
                              : article.seoScore >= 60
                              ? "text-yellow-600"
                              : "text-red-500"
                          }`}
                        >
                          {article.seoScore}
                        </span>
                        <span className="text-[#1b1916] text-xs block">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown bars */}
                  <div className="space-y-2.5">
                    {[
                      { label: "Word Count", score: article.seoBreakdown.wordCount, max: 25 },
                      { label: "Headings", score: article.seoBreakdown.headings, max: 20 },
                      { label: "Keywords", score: article.seoBreakdown.keywords, max: 20 },
                      { label: "Meta Desc", score: article.seoBreakdown.meta, max: 15 },
                      { label: "FAQ Section", score: article.seoBreakdown.faq, max: 10 },
                      { label: "Key Takeaways", score: article.seoBreakdown.keyTakeaways, max: 10 },
                    ].map(({ label, score, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#1b1916]">{label}</span>
                          <span className="text-[#1b1916] font-medium">{score}/{max}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score / max >= 0.8
                                ? "bg-green-500"
                                : score / max >= 0.5
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${(score / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Article preview */}
        <Card className="bg-white border-black/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[#1b1916] text-lg">{article.title || "Article"}</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode("html")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  previewMode === "html"
                    ? "bg-violet-100 border-violet-400 text-violet-700"
                    : "border-slate-200 text-[#1b1916] hover:border-slate-300"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setPreviewMode("raw")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  previewMode === "raw"
                    ? "bg-violet-100 border-violet-400 text-violet-700"
                    : "border-slate-200 text-[#1b1916] hover:border-slate-300"
                }`}
              >
                HTML
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[500px] bg-[#ebe9e5] text-[#1b1916] text-xs font-mono p-4 rounded-lg border border-violet-300 focus:outline-none focus:border-violet-500 resize-y"
              />
            ) : previewMode === "html" ? (
              <div
                className="prose prose-slate max-w-none text-slate-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1b1916] [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-violet-700 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-pink-700 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-[#1b1916]"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <pre className="text-xs text-slate-700 overflow-auto max-h-96 whitespace-pre-wrap font-mono bg-[#ebe9e5] p-4 rounded-lg">
                {article.content}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!isEditing && (
            <Button
              onClick={() => {
                navigator.clipboard.writeText(article.content).catch(() => {})
              }}
              variant="outline"
              className="border-black/20 text-[#1b1916] bg-white hover:bg-[#ebe9e5]"
            >
              Copy HTML
            </Button>
          )}
          {!isEditing ? (
            <Button
              onClick={handleEditStart}
              variant="outline"
              className="border-black/20 text-[#1b1916] bg-white hover:bg-[#ebe9e5]"
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                onClick={handleEditSave}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
              >
                Save
              </Button>
              <Button
                onClick={handleEditCancel}
                variant="outline"
                className="border-black/20 text-[#1b1916] bg-white hover:bg-[#ebe9e5]"
              >
                Cancel
              </Button>
            </>
          )}
          {!isEditing && !blogPublished && (
            <Button
              onClick={handlePublishToBlog}
              disabled={blogPublishing}
              className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white"
            >
              {blogPublishing
                ? "Publishing..."
                : defaultSite
                ? `Publish to ${defaultSite.name}`
                : "Publish to Blog"}
            </Button>
          )}
          {!isEditing && blogPublished && (
            <span className="flex items-center gap-2 text-green-600 font-medium text-sm px-1">
              <span className="text-green-600">✓</span>
              Published on {publishedSiteName ?? "ItGrows.ai Blog"}
            </span>
          )}
          <Link href="/business/dashboard/seo">
            <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white">
              Generate Another Article
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
