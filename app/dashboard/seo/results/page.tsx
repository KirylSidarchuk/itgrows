"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/auth"

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

export default function SeoResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<ArticleResult | null>(null)
  const [previewMode, setPreviewMode] = useState<"html" | "raw">("html")
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    try {
      // First check sessionStorage (when navigating from tasks list)
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
        return
      }
      // Fall back to last generated result from localStorage
      const saved = localStorage.getItem("ge_seo_last_result")
      if (saved) {
        setResult(JSON.parse(saved) as ArticleResult)
      } else {
        router.push("/dashboard/seo")
      }
    } catch {
      router.push("/dashboard/seo")
    }
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

  const handleEditSave = () => {
    if (!result) return
    const updatedArticle = { ...result.article, content: editContent }
    const updatedResult = { ...result, article: updatedArticle }
    setResult(updatedResult)

    // Update in localStorage itgrows_tasks_v2 if we have a task ID
    if (taskId) {
      try {
        const tasks = JSON.parse(localStorage.getItem("itgrows_tasks_v2") || "[]") as Array<{
          id: string
          updatedAt: string
          articleData?: { keyword: string; title: string; content: string; metaDescription: string; keywords: string[] }
        }>
        const idx = tasks.findIndex((t) => t.id === taskId)
        if (idx !== -1 && tasks[idx].articleData) {
          tasks[idx].articleData!.content = editContent
          tasks[idx].updatedAt = new Date().toISOString()
          localStorage.setItem("itgrows_tasks_v2", JSON.stringify(tasks))
        }
      } catch {
        // ignore
      }
    }

    // Also update ge_seo_last_result if that was the source
    try {
      const saved = localStorage.getItem("ge_seo_last_result")
      if (saved) {
        const parsed = JSON.parse(saved) as ArticleResult
        parsed.article.content = editContent
        localStorage.setItem("ge_seo_last_result", JSON.stringify(parsed))
      }
    } catch {
      // ignore
    }

    setIsEditing(false)
    setEditContent("")
  }

  if (!result) return null

  const { article, publishUrl, platform } = result

  const platformLabel: Record<string, string> = {
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
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Article Generated
            </h1>
            <p className="text-slate-400">
              {publishUrl
                ? `Published to ${platformLabel[platform] ?? platform}`
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
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-900/20 border border-green-500/30">
            <span className="text-2xl">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 font-medium text-sm">Successfully published!</p>
              <a
                href={publishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white text-sm truncate block underline"
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
                className="border-green-500/30 text-green-400 hover:bg-green-900/20 text-sm"
              >
                Open Post
              </Button>
            </a>
          </div>
        )}

        {/* Meta info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium uppercase tracking-wider">
                Meta Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white text-sm leading-relaxed">
                {article.metaDescription || "—"}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                {article.metaDescription?.length ?? 0} characters
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium uppercase tracking-wider">
                Keywords Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {article.keywords?.length ? (
                  article.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 rounded-md bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs"
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
        <Card className="bg-slate-800/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-lg">{article.title || "Article"}</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode("html")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  previewMode === "html"
                    ? "bg-violet-600/30 border-violet-500 text-violet-300"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setPreviewMode("raw")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  previewMode === "raw"
                    ? "bg-violet-600/30 border-violet-500 text-violet-300"
                    : "border-white/10 text-slate-400 hover:border-white/20"
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
                className="w-full min-h-[500px] bg-slate-900/60 text-slate-200 text-xs font-mono p-4 rounded-lg border border-violet-500/40 focus:outline-none focus:border-violet-500 resize-y"
              />
            ) : previewMode === "html" ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-slate-200 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-violet-300 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-pink-300 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <pre className="text-xs text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap font-mono bg-slate-900/60 p-4 rounded-lg">
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
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              Copy HTML
            </Button>
          )}
          {!isEditing ? (
            <Button
              onClick={handleEditStart}
              variant="outline"
              className="border-white/10 text-slate-300 hover:bg-white/5"
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
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancel
              </Button>
            </>
          )}
          {!publishUrl && (
            <Link href="/dashboard/seo">
              <Button
                variant="outline"
                className="border-violet-500/30 text-violet-300 hover:bg-violet-900/20"
              >
                Publish to Platform
              </Button>
            </Link>
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
