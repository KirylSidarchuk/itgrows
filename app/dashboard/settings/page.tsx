"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  platformLabel,
  generateSiteToken,
  generateSiteSlug,
} from "@/lib/connectedSites"
import type { DetectedPlatform, DetectPlatformResult } from "@/app/api/detect-platform/route"

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep =
  | "url"
  | "detecting"
  | "topics"          // Step 2: Choose article topic
  | "article"         // Step 3: Article preview + Publish Now
  | "blog-cname"      // Step 4: CNAME DNS setup (no-blog path)
  | "blog-done"       // Step 5: confirmation
  | "experience"      // Step 4: technical or not-technical?
  | "blog-advanced"   // Advanced Step: blog check for advanced
  | "blog-simple"     // Advanced Step: blog check for simple
  | "setup-advanced"  // Advanced Step: platform-specific code setup
  | "setup-simple"    // Advanced Step: simple embed guide

type IntegrationMode = "simple" | "advanced" | null

interface ConnectedSite {
  id: string
  name: string
  url: string
  platform: string
  siteToken: string
  siteSlug: string | null
  isDefault: boolean
  webhookUrl?: string | null
  lastCheckOk?: boolean | null
}

// ─── Shopify guide ────────────────────────────────────────────────────────────

function ShopifyGuide() {
  return (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
      <p className="text-slate-700 font-medium">How to get your Shopify API Token</p>
      <p className="text-slate-600 text-xs">
        This is an API token, not your password. It is safe to share with third-party apps.
      </p>
      <ol className="list-decimal list-inside space-y-1 text-slate-600">
        <li>Go to Shopify Admin → Settings → Apps and sales channels → Develop apps</li>
        <li>
          Create a new app → configure Admin API scopes:{" "}
          <span className="text-violet-600">write_content</span>
        </li>
        <li>Install app → copy the Admin API access token</li>
        <li>Find Blog ID: Admin → Online Store → Blog posts → the URL contains the blog ID</li>
      </ol>
    </div>
  )
}

function WebflowGuide() {
  return (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
      <p className="text-slate-700 font-medium">How to get your Webflow API Token</p>
      <p className="text-slate-600 text-xs">
        This is an API token, not your password. It is safe to share with third-party apps.
      </p>
      <ol className="list-decimal list-inside space-y-1 text-slate-600">
        <li>Go to Webflow → Site Settings → Integrations → API Access</li>
        <li>Generate a new API key and copy it</li>
        <li>Find Collection ID: CMS → your blog collection → settings</li>
      </ol>
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="outline"
      className="border-violet-500/40 text-violet-600 hover:bg-violet-500/10 text-xs"
    >
      {copied ? "Copied!" : label}
    </Button>
  )
}

// ─── Big choice card ──────────────────────────────────────────────────────────

function ChoiceCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-5 rounded-2xl bg-[#ebe9e5] border border-black/10 hover:border-violet-500/50 hover:bg-violet-50/30 transition-all text-left w-full group"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[#1b1916] font-semibold text-sm group-hover:text-violet-700 transition-colors">
        {title}
      </span>
      <span className="text-slate-600 text-xs leading-relaxed">{description}</span>
    </button>
  )
}

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
    >
      ← Back
    </Button>
  )
}

// ─── Add-site wizard ──────────────────────────────────────────────────────────

interface Topic {
  title: string
  description: string
}

interface ArticleData {
  title: string
  content: string
  keywords: string[]
  seoScore: number
}

interface AddSiteWizardProps {
  onSaved: (site: ConnectedSite) => void
  onCancel: () => void
  isFirstSite: boolean
}

function AddSiteWizard({ onSaved, onCancel, isFirstSite }: AddSiteWizardProps) {
  const [step, setStep] = useState<WizardStep>("url")
  const [inputUrl, setInputUrl] = useState("")
  const [detected, setDetected] = useState<DetectedPlatform>("custom")
  const [siteName, setSiteName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Onboarding flow state
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [topicImages, setTopicImages] = useState<Record<number, string>>({})
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topicsError, setTopicsError] = useState("")
  const [articleError, setArticleError] = useState("")
  const [genTimer, setGenTimer] = useState(0)
  const [showFullArticle, setShowFullArticle] = useState(false)

  // New flow state
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>(null)
  const [hasBlog, setHasBlog] = useState<boolean | null>(null)
  const [existingBlogUrl, setExistingBlogUrl] = useState("")

  // Blog domain (CNAME flow)
  const [blogDomain, setBlogDomain] = useState("")

  // WordPress plugin flow
  const [wpToken, setWpToken] = useState("")

  // Custom / Next.js snippet flow — pre-generate a token
  const [generatedToken] = useState(() => generateSiteToken())

  // Shopify fields
  const [shopifyAccessToken, setShopifyAccessToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")

  // Webflow fields
  const [webflowApiToken, setWebflowApiToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")

  // October CMS / PHP webhook fields
  const [webhookUrl, setWebhookUrl] = useState("")

  // ── Derived values ────────────────────────────────────────────────────────

  const normalUrl = inputUrl.trim().startsWith("http")
    ? inputUrl.trim()
    : "https://" + inputUrl.trim()

  const derivedName = (() => {
    if (siteName.trim()) return siteName.trim()
    try {
      return new URL(normalUrl).hostname
    } catch {
      return normalUrl
    }
  })()

  const siteSlug = generateSiteSlug(derivedName, normalUrl)

  // ── Step 1: detect platform + fetch topics ───────────────────────────────
  const handleAnalyze = async () => {
    if (!inputUrl.trim()) return
    setStep("detecting")
    setTopicsError("")
    try {
      // Run platform detection and topic fetching in parallel
      const [platformRes, topicsRes] = await Promise.allSettled([
        fetch("/api/detect-platform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputUrl.trim() }),
        }),
        fetch("/api/onboarding/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteUrl: inputUrl.trim() }),
        }),
      ])

      if (platformRes.status === "fulfilled") {
        const data: DetectPlatformResult = await platformRes.value.json()
        setDetected(data.platform)
      } else {
        setDetected("custom")
      }

      if (topicsRes.status === "fulfilled") {
        const data = await topicsRes.value.json() as { topics?: Topic[]; error?: string }
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics)
          // Generate images non-blocking
          data.topics.forEach((topic: Topic, idx: number) => {
            fetch("/api/images/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: topic.title, keywords: [] }),
            })
              .then(r => r.json())
              .then((d: { url?: string }) => {
                if (d.url) setTopicImages(prev => ({ ...prev, [idx]: d.url! }))
              })
              .catch(() => {})
          })
          setStep("topics")
        } else {
          // If topics fail, skip to integration step
          setStep("experience")
        }
      } else {
        setStep("experience")
      }
    } catch {
      setDetected("custom")
      setStep("experience")
    }
  }

  // ── Step 2: generate article from selected topic ───────────────────────
  const handleGenerateArticle = async () => {
    if (!selectedTopic) return
    setArticleLoading(true)
    setArticleError("")
    setGenTimer(30)
    const timerRef = { id: null as ReturnType<typeof setInterval> | null }
    timerRef.id = setInterval(() => {
      setGenTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.id ?? undefined); return 0 }
        return t - 1
      })
    }, 1000)
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: selectedTopic.title, siteUrl: inputUrl.trim(), tone: "Professional" }),
      })
      const data = await res.json() as { title?: string; content?: string; keywords?: string[]; seoScore?: number; error?: string }
      if (!res.ok || !data.content) throw new Error(data.error ?? "Failed to generate article")
      const wordCount = (data.content ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
      const fallbackScore = Math.min(100, Math.max(50, Math.round(40 + wordCount / 40)))
      clearInterval(timerRef.id)
      setArticle({
        title: data.title ?? selectedTopic.title,
        content: data.content,
        keywords: data.keywords ?? [],
        seoScore: data.seoScore ?? fallbackScore,
      })
      setStep("article")
    } catch (e) {
      clearInterval(timerRef.id)
      setArticleError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setArticleLoading(false)
    }
  }

  // Extract first 3 paragraphs from HTML
  function getArticlePreview(html: string): string {
    const matches = html.match(/<p>.*?<\/p>/g) ?? []
    return matches.slice(0, 3).join("\n")
  }

  // ── Save via API ──────────────────────────────────────────────────────────
  const saveSite = async (siteData: {
    name: string
    url: string
    platform: string
    siteToken: string
    siteSlug: string
    shopifyToken?: string
    shopifyBlogId?: string
    webflowToken?: string
    webflowCollectionId?: string
    integrationMode?: IntegrationMode
    hasBlog?: boolean | null
    existingBlogUrl?: string
    blogDomain?: string
    webhookUrl?: string
  }) => {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...siteData,
          isDefault: isFirstSite,
        }),
      })
      const data = await res.json() as { site?: ConnectedSite; error?: string }
      if (res.status === 409) {
        setSaveError("This site is already registered with another account.")
        return false
      }
      if (data.site) {
        onSaved(data.site)
        return true
      }
      return false
    } catch {
      // ignore
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = (token: string) => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform:
        detected === "wordpress"
          ? "wordpress"
          : detected === "shopify"
          ? "shopify"
          : detected === "webflow"
          ? "webflow"
          : detected === "octobercms"
          ? "octobercms"
          : detected === "php"
          ? "php"
          : "custom",
      siteToken: token,
      siteSlug,
      integrationMode,
      hasBlog,
      existingBlogUrl: hasBlog ? existingBlogUrl : "",
    })
  }

  const handleConnectPhp = () => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: detected === "octobercms" ? "octobercms" : "php",
      siteToken: generatedToken,
      siteSlug,
      integrationMode,
      hasBlog,
      existingBlogUrl: hasBlog ? existingBlogUrl : "",
      webhookUrl: webhookUrl.trim(),
    })
  }

  const handleConnectShopify = () => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "shopify",
      siteToken: shopifyAccessToken.trim(),
      siteSlug,
      shopifyToken: shopifyAccessToken.trim(),
      shopifyBlogId: shopifyBlogId.trim(),
      integrationMode,
      hasBlog,
      existingBlogUrl: hasBlog ? existingBlogUrl : "",
    })
  }

  const handleConnectWebflow = () => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "webflow",
      siteToken: webflowApiToken.trim(),
      siteSlug,
      webflowToken: webflowApiToken.trim(),
      webflowCollectionId: webflowCollectionId.trim(),
      integrationMode,
      hasBlog,
      existingBlogUrl: hasBlog ? existingBlogUrl : "",
    })
  }

  const handleConnectCname = async () => {
    return saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "custom",
      siteToken: generatedToken,
      siteSlug,
      blogDomain: blogDomain.trim(),
    })
  }

  // ── Detection badge (shared) ──────────────────────────────────────────────
  const DetectionBadge = () => (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 flex items-center gap-3">
      <span className="text-green-400 text-lg">&#10003;</span>
      <div>
        <p className="text-[#1b1916] font-semibold text-sm">
          {detected === "wordpress"
            ? "WordPress detected"
            : detected === "shopify"
            ? "Shopify detected"
            : detected === "webflow"
            ? "Webflow detected"
            : detected === "nextjs"
            ? "Next.js / React detected"
            : detected === "octobercms"
            ? "October CMS detected"
            : detected === "php"
            ? "PHP / Custom CMS detected"
            : "Custom website detected"}
        </p>
        <p className="text-slate-600 text-xs">{inputUrl}</p>
      </div>
    </div>
  )

  // ── Blog URL input (shared between 3A and 3B) ─────────────────────────────
  const BlogUrlInput = () => (
    <div className="space-y-2 pt-1">
      <Label className="text-slate-700 text-sm">Blog URL</Label>
      <Input
        placeholder="https://yoursite.com/blog"
        value={existingBlogUrl}
        onChange={(e) => setExistingBlogUrl(e.target.value)}
        className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
      />
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — URL entry
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "url") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <h3 className="text-[#1b1916] font-semibold text-base">Connect Your Website</h3>
        <div className="space-y-2">
          <Label className="text-slate-700 text-sm">Website URL</Label>
          <Input
            placeholder="https://yoursite.com"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={!inputUrl.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            Analyze &amp; Connect
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETECTING
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "detecting") {
    return (
      <div className="space-y-4 pt-4 border-t border-black/10">
        <div className="flex items-center gap-3 py-6">
          <svg
            className="animate-spin h-5 w-5 text-violet-400 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-slate-700 text-sm">Detecting your platform...</span>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Choose article topic
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "topics") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <div className="text-center">
          <div className="text-3xl mb-2">💡</div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Here are 3 article ideas for your site</h3>
          <p className="text-slate-600 text-xs">Click one to select it</p>
        </div>

        <div className="space-y-3">
          {topics.map((topic, i) => (
            <button
              key={i}
              onClick={() => setSelectedTopic(topic)}
              className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${
                selectedTopic?.title === topic.title
                  ? "border-violet-500 bg-violet-50"
                  : "border-black/10 hover:border-violet-300 bg-[#ebe9e5]"
              }`}
            >
              {topicImages[i] ? (
                <img src={topicImages[i]} className="w-full h-28 object-cover rounded-t-xl mb-3" alt={topic.title} />
              ) : (
                <div className="w-full h-28 rounded-t-xl mb-3 bg-gradient-to-br from-violet-50 to-slate-100 flex flex-col items-center justify-center gap-1 border-b border-black/5">
                  <span className="text-violet-400 text-xl animate-spin">⟳</span>
                  <span className="text-violet-500 text-xs font-semibold tracking-wide">Generating image…</span>
                </div>
              )}
              <div className="px-4 pb-4">
                <p className="font-semibold text-[#1b1916] mb-1">{topic.title}</p>
                <p className="text-slate-600 text-xs">{topic.description}</p>
              </div>
            </button>
          ))}
        </div>

        {topicsError && <p className="text-red-500 text-sm">{topicsError}</p>}
        {articleError && <p className="text-red-500 text-sm">{articleError}</p>}

        <div className="flex gap-3">
          <Button
            onClick={handleGenerateArticle}
            disabled={articleLoading || !selectedTopic}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex-1"
          >
            {articleLoading ? (
              <span>{genTimer === 0 ? "Almost ready…" : `Generating… ~${genTimer}s`}</span>
            ) : (
              "Generate article →"
            )}
          </Button>
          <Button
            onClick={() => setStep("experience")}
            variant="outline"
            className="border-black/20 text-slate-700 hover:bg-[#ebe9e5] text-xs"
          >
            Skip
          </Button>
        </div>
        <BackButton onClick={() => setStep("url")} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Article preview + Publish Now
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "article" && article) {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <div className="text-center">
          <div className="text-3xl mb-2">📄</div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Your article is ready!</h3>
          <p className="text-slate-600 text-xs">Here&apos;s a preview of what we generated</p>
        </div>

        {/* Keywords */}
        {article.keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Keywords</p>
            <div className="flex flex-wrap gap-2">
              {article.keywords.slice(0, 8).map((kw, i) => (
                <span key={i} className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO Score */}
        <div className="bg-[#ebe9e5] rounded-xl p-4 border border-black/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">SEO Score ✨</p>
            <span className={`text-sm font-bold ${article.seoScore >= 80 ? "text-green-600" : article.seoScore >= 60 ? "text-yellow-600" : "text-red-500"}`}>
              {article.seoScore} / 100
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${article.seoScore >= 80 ? "bg-green-500" : article.seoScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${article.seoScore}%` }}
            />
          </div>
        </div>

        {/* Article preview */}
        <div className="bg-[#ebe9e5] rounded-xl p-4 border border-black/10">
          <h4 className="text-sm font-bold text-[#1b1916] mb-2">{article.title}</h4>
          <div
            className="text-slate-700 text-xs leading-relaxed prose prose-sm max-w-none [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: getArticlePreview(article.content) }}
          />
          <p className="text-violet-500 text-xs mt-2 italic">… article continues</p>
        </div>

        {/* Toggle full article */}
        <button
          onClick={() => setShowFullArticle((v) => !v)}
          className="w-full py-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors flex items-center justify-center gap-1"
        >
          {showFullArticle ? "Collapse ↑" : "Read full article ↓"}
        </button>

        {showFullArticle && (
          <div className="bg-white rounded-xl p-5 border border-black/10 shadow-sm text-sm">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        )}

        <Button
          onClick={() => setStep("experience")}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white"
        >
          Publish Now →
        </Button>

        <BackButton onClick={() => setStep("topics")} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — CNAME blog setup (no-blog path)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "blog-cname") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Set up your blog</h3>
          <p className="text-slate-600 text-xs">
            Add a DNS record to your domain to host your blog on our platform. No technical setup needed.
          </p>
        </div>

        {/* DNS instruction box */}
        <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-5 space-y-3">
          <p className="text-[#1b1916] font-semibold text-sm">Add this DNS record to your domain registrar:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left pb-2 pr-6 font-semibold">Type</th>
                  <th className="text-left pb-2 pr-6 font-semibold">Name</th>
                  <th className="text-left pb-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pr-6 py-1 font-mono text-violet-700 font-bold">CNAME</td>
                  <td className="pr-6 py-1 font-mono text-[#1b1916]">blog</td>
                  <td className="py-1 font-mono text-[#1b1916] text-xs">blogs.itgrows.ai</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs">You can use any subdomain name (e.g. <code className="bg-white/60 px-1 rounded text-violet-700">blog</code>, <code className="bg-white/60 px-1 rounded text-violet-700">news</code>, <code className="bg-white/60 px-1 rounded text-violet-700">articles</code>)</p>
        </div>

        {/* Blog URL input */}
        <div className="space-y-2">
          <Label className="text-slate-700 text-sm font-medium">Your blog URL (after adding DNS):</Label>
          <Input
            placeholder="e.g. blog.yoursite.com"
            value={blogDomain}
            onChange={(e) => setBlogDomain(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
          />
          <p className="text-slate-500 text-xs">Enter the subdomain you used (e.g. blog.yoursite.com)</p>
        </div>

        {saveError && (
          <p className="text-red-500 text-sm">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={async () => { const ok = await handleConnectCname(); if (ok) setStep("blog-done") }}
            disabled={!blogDomain.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Saving..." : "I've added the DNS record →"}
          </Button>
          <BackButton onClick={() => setStep("experience")} />
        </div>

        {/* Advanced setup link */}
        <div className="pt-2 border-t border-black/10">
          <button
            onClick={() => setStep("experience")}
            className="text-xs text-slate-500 hover:text-violet-600 transition-colors underline"
          >
            Advanced Setup (WordPress, Shopify, Webflow, custom code)
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Done (CNAME flow)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "blog-done") {
    const displayDomain = blogDomain.trim()
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <div className="text-center py-4">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-[#1b1916] font-bold text-xl mb-2">You&apos;re all set!</h3>
          <p className="text-slate-600 text-sm mb-4">
            Your blog will be live at:
          </p>
          <div className="inline-block bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 font-mono text-violet-700 text-sm font-semibold">
            {displayDomain || "your blog domain"}
          </div>
          <p className="text-slate-500 text-xs mt-3">DNS changes can take up to 24 hours to propagate.</p>
        </div>
        <Button
          onClick={onCancel}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white"
        >
          Done
        </Button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — Experience check: technical or not-technical?
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "experience") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">
            How would you like to publish?
          </h3>
          <p className="text-slate-600 text-xs">
            Choose the setup that fits you best.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            icon="🛠️"
            title="I'm technical"
            description="I can edit code, use APIs, and install plugins. Show me the advanced setup."
            onClick={() => {
              setIntegrationMode("advanced")
              setStep("blog-advanced")
            }}
          />
          <ChoiceCard
            icon="👋"
            title="Guide me step by step"
            description="I'm not a developer. Walk me through a simple copy-paste setup."
            onClick={() => {
              setIntegrationMode("simple")
              setStep("blog-simple")
            }}
          />
        </div>
        <BackButton onClick={() => setStep(article ? "article" : topics.length > 0 ? "topics" : "url")} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3A — Blog check for Advanced flow
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "blog-advanced") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">
            Does your site have a blog section?
          </h3>
          <p className="text-slate-600 text-xs">
            This determines where your AI-generated articles will be published.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            icon="📝"
            title="Yes, I have a blog"
            description="I already have a blog on my site. Publish articles there."
            onClick={() => setHasBlog(true)}
          />
          <ChoiceCard
            icon="☁️"
            title="No, create one for me"
            description="No problem — we'll create a blog section on your site automatically"
            onClick={() => {
              setHasBlog(false)
              setExistingBlogUrl("")
              setStep("setup-advanced")
            }}
          />
        </div>

        {hasBlog === true && (
          <div className="space-y-4">
            <BlogUrlInput />
            <Button
              onClick={() => setStep("setup-advanced")}
              disabled={!existingBlogUrl.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Continue →
            </Button>
          </div>
        )}

        <BackButton onClick={() => setStep("experience")} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3B — Blog check for Simple flow
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "blog-simple") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">
            Does your website have a blog?
          </h3>
          <p className="text-slate-600 text-xs">
            We need to know where to publish your articles.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            icon="📝"
            title="Yes, I have a blog"
            description="I already have a blog page on my website."
            onClick={() => setHasBlog(true)}
          />
          <ChoiceCard
            icon="✨"
            title="No, create one for me"
            description="No problem — we'll create a blog section on your site automatically"
            onClick={() => {
              setHasBlog(false)
              setExistingBlogUrl("")
              setStep("setup-simple")
            }}
          />
        </div>

        {hasBlog === true && (
          <div className="space-y-4">
            <BlogUrlInput />
            <Button
              onClick={() => setStep("setup-simple")}
              disabled={!existingBlogUrl.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Continue →
            </Button>
          </div>
        )}

        <BackButton onClick={() => setStep("experience")} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4A — Advanced integration setup (platform-specific)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "setup-advanced") {
    const snippetCode = `// Add to your API routes or server
// itgrows.ai publishing endpoint
export async function POST(req) {
  const { token, title, content, metaDescription } = await req.json()
  if (token !== process.env.ITGROWS_SITE_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Save article to your database/CMS here
  console.log('New article from itgrows.ai:', title)
  return Response.json({ success: true })
}`

    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />

        {/* Blog destination info */}
        {hasBlog === false && (
          <div className="rounded-xl bg-violet-900/10 border border-violet-500/20 p-3 flex items-center gap-3 text-sm">
            <span className="text-violet-600 shrink-0">&#10003; Auto blog</span>
            <span className="text-slate-600 text-xs">We'll create a /blog section on your site and publish articles there automatically</span>
          </div>
        )}
        {hasBlog === true && existingBlogUrl && (
          <div className="rounded-xl bg-violet-900/10 border border-violet-500/20 p-3 flex items-center gap-3 text-sm">
            <span className="text-violet-600 shrink-0">&#10003; Your blog</span>
            <span className="text-slate-600 text-xs">Articles will be published to:</span>
            <span className="text-violet-600 font-mono text-xs truncate">{existingBlogUrl}</span>
          </div>
        )}

        {saveError && (
          <p className="text-red-500 text-sm">{saveError}</p>
        )}

        {/* ── WordPress ── */}
        {detected === "wordpress" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-3 text-sm">
              <p className="text-slate-700 font-medium">Install our free plugin:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>
                  <a
                    href="/api/wp-plugin/download"
                    className="text-violet-600 hover:text-violet-800 underline"
                  >
                    Download ItGrows.ai WordPress Plugin
                  </a>
                </li>
                <li>Go to WP Admin → Plugins → Add New → Upload Plugin → Install → Activate</li>
                <li>
                  Go to <span className="text-violet-600">Settings → ItGrows.ai</span> → Copy the
                  Site Token shown there
                </li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">Site Token (from WP Admin)</Label>
              <Input
                placeholder="igt_..."
                value={wpToken}
                onChange={(e) => setWpToken(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">
                Site Name <span className="text-[#1b1916]">(optional)</span>
              </Label>
              <Input
                placeholder="My Blog"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => handleConnect(wpToken.trim())}
                disabled={!wpToken.trim() || saving}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? "Connecting..." : "Connect"}
              </Button>
              <BackButton onClick={() => setStep("blog-advanced")} />
            </div>
          </div>
        )}

        {/* ── Custom / Next.js ── */}
        {(detected === "custom" || detected === "nextjs") && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-3 text-sm">
              <p className="text-slate-700 font-medium">
                Add this snippet to your site to enable publishing:
              </p>
              <div className="relative">
                <pre className="text-xs text-slate-700 bg-[#ebe9e5] rounded-lg p-3 overflow-auto font-mono whitespace-pre-wrap">
                  {snippetCode}
                </pre>
                <div className="mt-2">
                  <CopyButton text={snippetCode} label="Copy Snippet" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-slate-600 text-xs mb-2">Set environment variable:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-violet-600 bg-[#ebe9e5] rounded px-2 py-1 font-mono">
                    ITGROWS_SITE_TOKEN={generatedToken}
                  </code>
                  <CopyButton text={`ITGROWS_SITE_TOKEN=${generatedToken}`} label="Copy" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">
                Site Name <span className="text-[#1b1916]">(optional)</span>
              </Label>
              <Input
                placeholder="My Blog"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => handleConnect(generatedToken)}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? "Connecting..." : "I've installed it — Connect"}
              </Button>
              <BackButton onClick={() => setStep("blog-advanced")} />
            </div>
          </div>
        )}

        {/* ── Shopify ── */}
        {detected === "shopify" && (
          <div className="space-y-4">
            <ShopifyGuide />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Access Token</Label>
                <Input
                  type="password"
                  placeholder="shpat_..."
                  value={shopifyAccessToken}
                  onChange={(e) => setShopifyAccessToken(e.target.value)}
                  className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Blog ID</Label>
                <Input
                  placeholder="123456789"
                  value={shopifyBlogId}
                  onChange={(e) => setShopifyBlogId(e.target.value)}
                  className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">
                Site Name <span className="text-[#1b1916]">(optional)</span>
              </Label>
              <Input
                placeholder="My Store"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleConnectShopify}
                disabled={!shopifyAccessToken.trim() || !shopifyBlogId.trim() || saving}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? "Connecting..." : "Connect"}
              </Button>
              <BackButton onClick={() => setStep("blog-advanced")} />
            </div>
          </div>
        )}

        {/* ── Webflow ── */}
        {detected === "webflow" && (
          <div className="space-y-4">
            <WebflowGuide />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">API Token</Label>
                <Input
                  type="password"
                  placeholder="your-webflow-token"
                  value={webflowApiToken}
                  onChange={(e) => setWebflowApiToken(e.target.value)}
                  className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Collection ID</Label>
                <Input
                  placeholder="collection-id"
                  value={webflowCollectionId}
                  onChange={(e) => setWebflowCollectionId(e.target.value)}
                  className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">
                Site Name <span className="text-[#1b1916]">(optional)</span>
              </Label>
              <Input
                placeholder="My Site"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleConnectWebflow}
                disabled={!webflowApiToken.trim() || !webflowCollectionId.trim() || saving}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? "Connecting..." : "Connect"}
              </Button>
              <BackButton onClick={() => setStep("blog-advanced")} />
            </div>
          </div>
        )}

        {/* ── October CMS / PHP ── */}
        {(detected === "octobercms" || detected === "php") && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-3 text-sm">
              <p className="text-slate-700 font-medium">Step 1: Create a webhook file on your server</p>
              <p className="text-slate-600 text-xs">Create a file at <code className="bg-white/60 px-1 rounded text-violet-700">/itgrows-webhook.php</code> in your site root with the following content:</p>
              <div className="relative">
                <pre className="text-xs text-slate-700 bg-white/60 rounded-lg p-3 overflow-auto font-mono whitespace-pre-wrap border border-black/10">{`<?php
$secret = '${generatedToken}'; // Your site token
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || $input['token'] !== $secret) { http_response_code(401); exit; }

// Save article to your CMS database
// Example for October CMS (RainLab Blog):
// $post = new \\RainLab\\Blog\\Models\\Post;
// $post->title = $input['title'];
// $post->content = $input['content'];
// $post->meta_description = $input['metaDescription'];
// $post->published = true;
// $post->save();

http_response_code(200);
echo json_encode(['success' => true]);
?>`}</pre>
                <div className="mt-2">
                  <CopyButton
                    text={`<?php\n$secret = '${generatedToken}';\n$input = json_decode(file_get_contents('php://input'), true);\nif (!$input || $input['token'] !== $secret) { http_response_code(401); exit; }\n\n// Save article to your CMS\n// $post->title = $input['title'];\n// $post->content = $input['content'];\n// $post->meta_description = $input['metaDescription'];\n\nhttp_response_code(200);\necho json_encode(['success' => true]);\n?>`}
                    label="Copy PHP Code"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">Step 2: Enter your webhook URL</Label>
              <Input
                placeholder={`https://yoursite.com/itgrows-webhook.php`}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs">Enter the URL where you uploaded the webhook file</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">
                Site Name <span className="text-[#1b1916]">(optional)</span>
              </Label>
              <Input
                placeholder="My Site"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleConnectPhp}
                disabled={!webhookUrl.trim() || saving}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? "Connecting..." : "I've created the file — Connect"}
              </Button>
              <BackButton onClick={() => setStep("blog-advanced")} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4B — CNAME setup (simple / non-technical path)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "setup-simple") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Set up your blog</h3>
          <p className="text-slate-600 text-xs">
            Add a DNS record to your domain to host your blog on our platform. No technical setup needed.
          </p>
        </div>

        {/* DNS instruction box */}
        <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-5 space-y-3">
          <p className="text-[#1b1916] font-semibold text-sm">Add this DNS record to your domain registrar:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left pb-2 pr-6 font-semibold">Type</th>
                  <th className="text-left pb-2 pr-6 font-semibold">Name</th>
                  <th className="text-left pb-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pr-6 py-1 font-mono text-violet-700 font-bold">CNAME</td>
                  <td className="pr-6 py-1 font-mono text-[#1b1916]">blog</td>
                  <td className="py-1 font-mono text-[#1b1916] text-xs">blogs.itgrows.ai</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs">You can use any subdomain name (e.g. <code className="bg-white/60 px-1 rounded text-violet-700">blog</code>, <code className="bg-white/60 px-1 rounded text-violet-700">news</code>, <code className="bg-white/60 px-1 rounded text-violet-700">articles</code>)</p>
        </div>

        {/* Blog URL input */}
        <div className="space-y-2">
          <Label className="text-slate-700 text-sm font-medium">Your blog URL (after adding DNS):</Label>
          <Input
            placeholder="e.g. blog.yoursite.com"
            value={blogDomain}
            onChange={(e) => setBlogDomain(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
          />
          <p className="text-slate-500 text-xs">Enter the subdomain you used (e.g. blog.yoursite.com)</p>
        </div>

        {saveError && (
          <p className="text-red-500 text-sm">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={async () => { const ok = await handleConnectCname(); if (ok) setStep("blog-done") }}
            disabled={!blogDomain.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Saving..." : "I've added the DNS record →"}
          </Button>
          <BackButton onClick={() => setStep("blog-simple")} />
        </div>

        {/* Advanced setup link */}
        <div className="pt-2 border-t border-black/10">
          <button
            onClick={() => setStep("experience")}
            className="text-xs text-slate-500 hover:text-violet-600 transition-colors underline"
          >
            Advanced Setup (WordPress, Shopify, Webflow, custom code)
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ─── Settings page ────────────────────────────────────────────────────────────

type TestStatus = { loading: boolean; success?: boolean; message?: string }

function SettingsContent() {
  const searchParams = useSearchParams()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({})

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: { sites?: ConnectedSite[] }) => {
        const loaded = data.sites ?? []
        setSites(loaded)
        // Auto-open wizard if no sites connected OR ?connect=1 param is present
        if (loaded.length === 0 || searchParams.get("connect") === "1") {
          setShowWizard(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleSaved = (newSite: ConnectedSite) => {
    setSites((prev) => [...prev, newSite])
    setShowWizard(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/sites/${id}`, { method: "DELETE" }).catch(() => {})
    setSites((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      // If we deleted the default and there are remaining sites, promote the first
      if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
        const firstId = updated[0].id
        fetch(`/api/sites/${firstId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        }).catch(() => {})
        updated[0] = { ...updated[0], isDefault: true }
      }
      return updated
    })
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/sites/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    }).catch(() => {})
    setSites((prev) => prev.map((s) => ({ ...s, isDefault: s.id === id })))
  }

  const handleTestConnection = async (id: string) => {
    setTestStatuses((prev) => ({ ...prev, [id]: { loading: true } }))
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id }),
      })
      const data = await res.json() as { success: boolean; message: string }
      setTestStatuses((prev) => ({
        ...prev,
        [id]: { loading: false, success: data.success, message: data.message },
      }))
    } catch {
      setTestStatuses((prev) => ({
        ...prev,
        [id]: { loading: false, success: false, message: "Request failed" },
      }))
    }
  }

  const defaultSite = sites.find((s) => s.isDefault) ?? sites[0] ?? null

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916] dashboard-heading">Settings</h1>
          <p className="text-slate-600">Manage your account preferences and integrations.</p>
        </div>

        {/* Connected Sites */}
        <Card className="dashboard-glass-card border-0">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-[#1b1916] text-lg flex items-center gap-2">
                {defaultSite ? (
                  <>
                    <span className="text-green-600">&#10003;</span>
                    Your Connected Sites
                  </>
                ) : (
                  "Your Connected Sites"
                )}
              </CardTitle>
              <p className="text-slate-600 text-sm mt-1">
                Add your website to automatically publish articles from ItGrows.ai
              </p>
              {defaultSite && (
                <p className="text-green-600 text-xs mt-1">Default: {defaultSite.name}</p>
              )}
            </div>
            {!showWizard && (
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm shrink-0"
              >
                + Add Site
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Existing sites */}
            {loading && (
              <div className="text-center py-8 text-[#1b1916] text-sm">Loading...</div>
            )}
            {!loading && sites.length === 0 && !showWizard && (
              <div className="text-center py-8 text-[#1b1916] text-sm">
                No sites connected yet. Click &quot;+ Add Site&quot; to get started.
              </div>
            )}

            {sites.map((site) => {
              const testStatus = testStatuses[site.id]
              return (
                <div key={site.id} className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#ebe9e5] border border-black/10">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1b1916] font-medium text-sm">{site.name}</span>
                        {site.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-700 text-xs font-medium">
                            Default
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 border border-violet-300 text-violet-700 text-xs font-medium">
                          {platformLabel(site.platform as Parameters<typeof platformLabel>[0])}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5 truncate">{site.url}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button
                        onClick={() => handleTestConnection(site.id)}
                        disabled={testStatus?.loading}
                        className="text-xs text-violet-500 hover:text-violet-700 transition-colors disabled:opacity-50"
                        title="Test connection"
                      >
                        {testStatus?.loading ? "Testing…" : "⚡ Test"}
                      </button>
                      {!site.isDefault && (
                        <button
                          onClick={() => handleSetDefault(site.id)}
                          className="text-xs text-slate-500 hover:text-violet-600 transition-colors"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {testStatus && !testStatus.loading && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs ${
                        testStatus.success
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      <span>{testStatus.success ? "✅" : "❌"}</span>
                      <span>{testStatus.success ? "Connection working" : `Connection failed: ${testStatus.message}`}</span>
                    </div>
                  )}
                  {site.siteSlug && !testStatus && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm">
                      <span className="text-green-600 shrink-0 font-semibold">&#10003; Connected!</span>
                      <span className="text-slate-700 text-xs">Articles will be published to your site automatically.</span>
                    </div>
                  )}
                  {!testStatus && site.platform === "custom" && !site.lastCheckOk && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <span>⚠️</span>
                      <span>Integration not verified. Add the <code className="font-mono bg-amber-100 px-1 rounded">/api/itgrows-publish</code> endpoint to your site and click Test.</span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Wizard */}
            {showWizard && (
              <AddSiteWizard
                onSaved={handleSaved}
                onCancel={() => setShowWizard(false)}
                isFirstSite={sites.length === 0}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
