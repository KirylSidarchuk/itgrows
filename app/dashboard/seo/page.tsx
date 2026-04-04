"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth"
import { getConnectedSites, type ConnectedSite } from "@/lib/connectedSites"

type Platform = "wordpress" | "shopify" | "webflow" | "none"
type Language = "en" | "ru" | "uk"
type Tone = "Professional" | "Casual" | "Expert"
type Step = "idle" | "keywords" | "generating" | "publishing" | "done" | "error"

interface WordPressCredentials {
  siteUrl: string
  username: string
  appPassword: string
}

interface ShopifyCredentials {
  storeUrl: string
  accessToken: string
  blogId: string
}

interface WebflowCredentials {
  apiToken: string
  collectionId: string
}

type Credentials = WordPressCredentials | ShopifyCredentials | WebflowCredentials

interface GeneratedArticle {
  keyword: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
}

const STORAGE_KEY_CREDS = "ge_seo_credentials"

export default function SeoAutopilotPage() {
  const router = useRouter()

  // Auth guard
  useEffect(() => {
    const u = getUser()
    if (!u) router.push("/login")
    setConnectedSites(getConnectedSites())
  }, [router])

  const [connectedSites, setConnectedSites] = useState<ConnectedSite[]>([])
  const [topic, setTopic] = useState("")
  const [language, setLanguage] = useState<Language>("en")
  const [tone, setTone] = useState<Tone>("Professional")
  const [platform, setPlatform] = useState<Platform>("none")

  const [wpCreds, setWpCreds] = useState<WordPressCredentials>({
    siteUrl: "",
    username: "",
    appPassword: "",
  })
  const [shopifyCreds, setShopifyCreds] = useState<ShopifyCredentials>({
    storeUrl: "",
    accessToken: "",
    blogId: "",
  })
  const [webflowCreds, setWebflowCreds] = useState<WebflowCredentials>({
    apiToken: "",
    collectionId: "",
  })

  const [step, setStep] = useState<Step>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [suggestedKeyword, setSuggestedKeyword] = useState("")
  const [article, setArticle] = useState<GeneratedArticle | null>(null)
  const [publishUrl, setPublishUrl] = useState("")

  // Load saved credentials from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREDS)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          wp?: WordPressCredentials
          shopify?: ShopifyCredentials
          webflow?: WebflowCredentials
        }
        if (parsed.wp) setWpCreds(parsed.wp)
        if (parsed.shopify) setShopifyCreds(parsed.shopify)
        if (parsed.webflow) setWebflowCreds(parsed.webflow)
      }
    } catch {
      // ignore
    }
  }, [])

  const saveCredentials = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CREDS,
        JSON.stringify({ wp: wpCreds, shopify: shopifyCreds, webflow: webflowCreds })
      )
    } catch {
      // ignore
    }
  }

  const getCredentials = (): Credentials | null => {
    if (platform === "wordpress") return wpCreds
    if (platform === "shopify") return shopifyCreds
    if (platform === "webflow") return webflowCreds
    return null
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setErrorMessage("")
    setArticle(null)
    setPublishUrl("")

    // Save creds
    saveCredentials()

    try {
      // Step 1: Keywords
      setStep("keywords")
      const kwRes = await fetch("/api/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), language }),
      })
      if (!kwRes.ok) {
        const err = await kwRes.json() as { error?: string }
        throw new Error(err.error ?? "Failed to fetch keywords")
      }
      const kwData = await kwRes.json() as { keywords: string[] }
      // Pick the best keyword (use original topic or first suggestion)
      const bestKeyword = kwData.keywords[0] ?? topic.trim()
      setSuggestedKeyword(bestKeyword)

      // Step 2: Generate article
      setStep("generating")
      const genRes = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: bestKeyword, language, tone }),
      })
      if (!genRes.ok) {
        const err = await genRes.json() as { error?: string }
        throw new Error(err.error ?? "Failed to generate article")
      }
      const genData = await genRes.json() as GeneratedArticle
      setArticle(genData)

      // Step 3: Publish (if platform selected)
      if (platform !== "none") {
        setStep("publishing")
        const creds = getCredentials()
        const pubRes = await fetch("/api/seo/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, credentials: creds, article: genData }),
        })
        if (!pubRes.ok) {
          const err = await pubRes.json() as { error?: string }
          throw new Error(err.error ?? "Failed to publish")
        }
        const pubData = await pubRes.json() as { url: string }
        setPublishUrl(pubData.url ?? "")
      }

      setStep("done")

      // Store result for results page
      localStorage.setItem(
        "ge_seo_last_result",
        JSON.stringify({
          article: genData,
          publishUrl: platform !== "none" ? publishUrl : "",
          platform,
          keyword: bestKeyword,
        })
      )

      // Save as task in tasks list
      const articleData = {
        keyword: bestKeyword,
        title: genData.title,
        content: genData.content,
        metaDescription: genData.metaDescription,
        keywords: genData.keywords,
      }
      const newTask = {
        id: Date.now().toString(),
        title: `SEO Article: ${genData.title || bestKeyword}`,
        description: `SEO article targeting "${bestKeyword}" keyword`,
        type: "seo_article" as const,
        status: "done" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        articleData,
      }
      try {
        const existingTasks = JSON.parse(localStorage.getItem("itgrows_tasks_v2") || "[]")
        existingTasks.unshift(newTask)
        localStorage.setItem("itgrows_tasks_v2", JSON.stringify(existingTasks))
      } catch {
        // ignore
      }

      // Navigate to results
      setTimeout(() => {
        router.push("/dashboard/seo/results")
      }, 800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error"
      setErrorMessage(msg)
      setStep("error")
    }
  }

  const stepInfo: Record<Step, { label: string; pct: number }> = {
    idle: { label: "", pct: 0 },
    keywords: { label: "Step 1 — Finding keywords...", pct: 15 },
    generating: { label: "Step 2 — Generating article...", pct: 55 },
    publishing: { label: "Step 3 — Publishing...", pct: 88 },
    done: { label: "Done!", pct: 100 },
    error: { label: "Error", pct: 0 },
  }

  const isRunning = ["keywords", "generating", "publishing"].includes(step)

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            SEO Autopilot
          </h1>
          <p className="text-slate-400">
            Generate and publish SEO-optimized articles automatically
          </p>
        </div>

        {/* Progress bar */}
        {step !== "idle" && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span
                className={
                  step === "error" ? "text-red-400" : step === "done" ? "text-green-400" : "text-violet-400"
                }
              >
                {stepInfo[step].label}
              </span>
              {step !== "error" && (
                <span className="text-slate-400">{stepInfo[step].pct}%</span>
              )}
            </div>
            {step !== "error" && (
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    step === "done"
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : "bg-gradient-to-r from-violet-500 to-pink-500"
                  }`}
                  style={{ width: `${stepInfo[step].pct}%` }}
                />
              </div>
            )}
            {step === "error" && (
              <div className="mt-2 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic */}
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base">Content Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Topic / Keyword</Label>
                <Input
                  placeholder="e.g. best AI tools for marketing 2026"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  disabled={isRunning}
                  className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Language</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["en", "ru", "uk"] as Language[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        disabled={isRunning}
                        onClick={() => setLanguage(l)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          language === l
                            ? "bg-violet-600/30 border-violet-500 text-violet-300"
                            : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {l === "en" ? "English" : l === "ru" ? "Russian" : "Ukrainian"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Tone</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["Professional", "Casual", "Expert"] as Tone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={isRunning}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          tone === t
                            ? "bg-pink-600/30 border-pink-500 text-pink-300"
                            : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform */}
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base">Publish To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connected sites */}
              {connectedSites.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Connected Sites</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {connectedSites.map((site) => (
                      <button
                        key={site.id}
                        type="button"
                        disabled={isRunning}
                        onClick={() => setPlatform("none")}
                        className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30 bg-green-900/10 hover:bg-green-900/20 text-left transition-all"
                      >
                        <span className="text-lg">
                          {site.platform === "wordpress" ? "🌐" :
                           site.platform === "shopify" ? "🛒" :
                           site.platform === "webflow" ? "⚡" : "✨"}
                        </span>
                        <div className="min-w-0">
                          <div className="text-white text-xs font-medium truncate">{site.name}</div>
                          <div className="text-slate-400 text-xs truncate">{site.url}</div>
                        </div>
                        {site.isDefault && (
                          <span className="ml-auto shrink-0 text-green-400 text-xs">Default</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Article will be published to the default site after generation.
                    <Link href="/dashboard/settings" className="text-violet-400 hover:text-violet-300 ml-1">
                      Manage sites
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/40 border border-white/10">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">Connect your site</p>
                    <p className="text-slate-500 text-xs">For one-click publishing after generation</p>
                  </div>
                  <Link href="/dashboard/settings">
                    <Button
                      type="button"
                      className="bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 text-violet-300 text-xs"
                    >
                      Settings
                    </Button>
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    { value: "wordpress", label: "WordPress", icon: "🌐" },
                    { value: "shopify", label: "Shopify", icon: "🛒" },
                    { value: "webflow", label: "Webflow", icon: "⚡" },
                    { value: "none", label: "Just Generate", icon: "📝" },
                  ] as Array<{ value: Platform; label: string; icon: string }>
                ).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setPlatform(p.value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      platform === p.value
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/10 bg-slate-700/40 hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="text-white text-xs font-medium">{p.label}</div>
                  </button>
                ))}
              </div>

              {/* Credentials — WordPress */}
              {platform === "wordpress" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-xs">
                    WordPress credentials are saved locally in your browser.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Site URL</Label>
                    <Input
                      placeholder="https://yoursite.com"
                      value={wpCreds.siteUrl}
                      onChange={(e) => setWpCreds({ ...wpCreds, siteUrl: e.target.value })}
                      disabled={isRunning}
                      className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Username</Label>
                      <Input
                        placeholder="admin"
                        value={wpCreds.username}
                        onChange={(e) => setWpCreds({ ...wpCreds, username: e.target.value })}
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Application Password</Label>
                      <Input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={wpCreds.appPassword}
                        onChange={(e) => setWpCreds({ ...wpCreds, appPassword: e.target.value })}
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials — Shopify */}
              {platform === "shopify" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-xs">
                    Shopify credentials are saved locally in your browser.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Store URL</Label>
                    <Input
                      placeholder="https://yourstore.myshopify.com"
                      value={shopifyCreds.storeUrl}
                      onChange={(e) =>
                        setShopifyCreds({ ...shopifyCreds, storeUrl: e.target.value })
                      }
                      disabled={isRunning}
                      className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Access Token</Label>
                      <Input
                        type="password"
                        placeholder="shpat_..."
                        value={shopifyCreds.accessToken}
                        onChange={(e) =>
                          setShopifyCreds({ ...shopifyCreds, accessToken: e.target.value })
                        }
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Blog ID</Label>
                      <Input
                        placeholder="123456789"
                        value={shopifyCreds.blogId}
                        onChange={(e) =>
                          setShopifyCreds({ ...shopifyCreds, blogId: e.target.value })
                        }
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials — Webflow */}
              {platform === "webflow" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-xs">
                    Webflow credentials are saved locally in your browser.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">API Token</Label>
                      <Input
                        type="password"
                        placeholder="your-webflow-token"
                        value={webflowCreds.apiToken}
                        onChange={(e) =>
                          setWebflowCreds({ ...webflowCreds, apiToken: e.target.value })
                        }
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Collection ID</Label>
                      <Input
                        placeholder="collection-id"
                        value={webflowCreds.collectionId}
                        onChange={(e) =>
                          setWebflowCreds({ ...webflowCreds, collectionId: e.target.value })
                        }
                        disabled={isRunning}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isRunning || !topic.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white disabled:opacity-50"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {stepInfo[step].label}
              </span>
            ) : (
              "Generate & Publish"
            )}
          </Button>
        </form>

        {/* Suggested keyword display */}
        {suggestedKeyword && step !== "idle" && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-slate-800/40 border border-white/10 text-sm">
            <span className="text-slate-400">Using keyword: </span>
            <span className="text-violet-300 font-medium">{suggestedKeyword}</span>
          </div>
        )}
      </div>
    </div>
  )
}
