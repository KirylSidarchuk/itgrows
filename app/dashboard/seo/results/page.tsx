"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { platformLabel } from "@/lib/connectedSites"
import type { BlogPost } from "@/app/api/blog/posts/route"

interface ArticleResult {
  article: {
    keyword: string
    title: string
    content: string
    metaDescription: string
    keywords: string[]
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
        router.push("/dashboard/seo")
      }
    } catch {
      router.push("/dashboard/seo")
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
        }),
      })
      const data = (await res.json()) as { success: boolean; post?: BlogPost; storage?: string; error?: string }

      if (data.post) {
        setBlogSlug(siteSlug ? `${siteSlug}/${data.post.slug}` : data.post.slug)
        setBlogPublished(true)
        setPublishedSiteName(siteName ?? "ItGrows.ai Blog")
      } else {
        const rawSlug = slugify(article.title)
        setBlogSlug(siteSlug ? `${siteSlug}/${rawSlug}` : rawSlug)
        setBlogPublished(true)
        setPublishedSiteName(siteName ?? "ItGrows.ai Blog")
      }
    } catch {
      const rawSlug = slugify(article.title)
      setBlogSlug(siteSlug ? `${siteSlug}/${rawSlug}` : rawSlug)
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

    if (defaultSite.platform === "itgrows_blog") {
      await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
      setBlogPublishing(false)
      return
    }

    // WordPress or custom sites via /api/publish with siteToken
    // Also mirror to hosted itgrows blog
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
        if (pubData.success) {
          await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
        } else {
          await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
        }
      } else {
        await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
      }
    } catch {
      await publishToItgrowsBlog(article, defaultSite.name, defaultSite.id, defaultSite.siteSlug ?? undefined)
    } finally {
      setBlogPublishing(false)
    }
  }

  const handlePublishItgrowsFallback = async () => {
    if (!result || blogPublishing || blogPublished) return
    setNoSiteModal(false)
    setBlogPublishing(true)
    const { article } = result
    await publishToItgrowsBlog(article)
    setBlogPublishing(false)
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
            <Link href="/dashboard/seo">
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
                Published to {publishedSiteName ?? "ItGrows.ai Blog"}!
              </p>
              {blogSlug && (
                <Link
                  href={`/blog/${blogSlug}`}
                  className="text-slate-600 hover:text-[#1b1916] text-sm truncate block underline"
                >
                  itgrows.ai/blog/{blogSlug}
                </Link>
              )}
            </div>
            {blogSlug && (
              <Link href={`/blog/${blogSlug}`} className="shrink-0">
                <Button
                  variant="outline"
                  className="border-violet-300 text-violet-700 hover:bg-violet-50 text-sm"
                >
                  View →
                </Button>
              </Link>
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
                <Link href="/dashboard/settings">
                  <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                    Go to Settings
                  </Button>
                </Link>
                <Button
                  onClick={handlePublishItgrowsFallback}
                  className="w-full bg-[#ebe9e5] hover:bg-[#dedad4] text-[#1b1916] border border-black/10"
                >
                  Publish to ItGrows.ai Blog
                </Button>
                <Button
                  onClick={() => setNoSiteModal(false)}
                  variant="ghost"
                  className="w-full text-slate-500 hover:text-[#1b1916]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-white border-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-600 text-sm font-medium uppercase tracking-wider">
                Meta Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#1b1916] text-sm leading-relaxed">
                {article.metaDescription || "—"}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                {article.metaDescription?.length ?? 0} characters
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-600 text-sm font-medium uppercase tracking-wider">
                Keywords Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {article.keywords?.length ? (
                  article.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 rounded-md bg-violet-100 border border-violet-200 text-violet-700 text-xs"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">No keywords extracted</span>
                )}
              </div>
            </CardContent>
          </Card>
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
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setPreviewMode("raw")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  previewMode === "raw"
                    ? "bg-violet-100 border-violet-400 text-violet-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
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
          <Link href="/dashboard/seo">
            <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white">
              Generate Another Article
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
