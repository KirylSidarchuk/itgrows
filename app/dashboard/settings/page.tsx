"use client"

import { useEffect, useState } from "react"
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
  | "blog-cname"      // Step 2: CNAME DNS setup (main flow)
  | "blog-done"       // Step 3: confirmation
  | "experience"      // Advanced Step 2: technical or not?
  | "blog-advanced"   // Advanced Step 3A: blog check for advanced
  | "blog-simple"     // Advanced Step 3B: blog check for simple
  | "setup-advanced"  // Advanced Step 4A: platform-specific code setup
  | "setup-simple"    // Advanced Step 4B: simple embed guide

type IntegrationMode = "simple" | "advanced" | null

interface ConnectedSite {
  id: string
  name: string
  url: string
  platform: string
  siteToken: string
  siteSlug: string | null
  isDefault: boolean
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
          <span className="text-violet-300">write_content</span>
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
      className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 text-xs"
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

  const widgetEmbedCode = `<script src="https://itgrows.ai/widget.js?token=${generatedToken}" defer></script>`

  // ── Step 1: detect ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!inputUrl.trim()) return
    setStep("detecting")
    try {
      const res = await fetch("/api/detect-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl.trim() }),
      })
      const data: DetectPlatformResult = await res.json()
      setDetected(data.platform)
    } catch {
      setDetected("custom")
    }
    setStep("blog-cname")
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

  const handleConnectSimple = () => {
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
      siteToken: generatedToken,
      siteSlug,
      integrationMode: "simple",
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
            className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
  // STEP 2 — CNAME blog setup (main flow)
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
          <BackButton onClick={() => setStep("url")} />
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
  // STEP 2 — Experience check (Advanced flow)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "experience") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">
            Do you have experience working with code?
          </h3>
          <p className="text-slate-600 text-xs">
            We&apos;ll tailor the setup process to your experience level.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            icon="🛠️"
            title="Yes, I'm technical"
            description="I can edit code, use APIs, and install plugins. Show me the advanced setup."
            onClick={() => {
              setIntegrationMode("advanced")
              setStep("blog-advanced")
            }}
          />
          <ChoiceCard
            icon="👋"
            title="No, guide me step by step"
            description="I'm not a developer. Walk me through a simple copy-paste setup."
            onClick={() => {
              setIntegrationMode("simple")
              setStep("blog-simple")
            }}
          />
        </div>
        <BackButton onClick={() => setStep("blog-cname")} />
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
              className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
              className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
            <span className="text-violet-300 shrink-0">&#10003; Auto blog</span>
            <span className="text-slate-600 text-xs">We'll create a /blog section on your site and publish articles there automatically</span>
          </div>
        )}
        {hasBlog === true && existingBlogUrl && (
          <div className="rounded-xl bg-violet-900/10 border border-violet-500/20 p-3 flex items-center gap-3 text-sm">
            <span className="text-violet-300 shrink-0">&#10003; Your blog</span>
            <span className="text-slate-600 text-xs">Articles will be published to:</span>
            <span className="text-violet-300 font-mono text-xs truncate">{existingBlogUrl}</span>
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
                    className="text-violet-400 hover:text-violet-300 underline"
                  >
                    Download ItGrows.ai WordPress Plugin
                  </a>
                </li>
                <li>Go to WP Admin → Plugins → Add New → Upload Plugin → Install → Activate</li>
                <li>
                  Go to <span className="text-violet-300">Settings → ItGrows.ai</span> → Copy the
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
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
                  <code className="text-xs text-violet-300 bg-[#ebe9e5] rounded px-2 py-1 font-mono">
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
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
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
  // STEP 4B — Simple widget guide
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "setup-simple") {
    // October CMS / PHP requires a server-side webhook — redirect to advanced flow
    if (detected === "octobercms" || detected === "php") {
      return (
        <div className="space-y-5 pt-4 border-t border-black/10">
          <DetectionBadge />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
            <p className="text-amber-800 font-semibold text-sm">Your platform requires a server-side setup</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              {detected === "octobercms" ? "October CMS" : "PHP-based sites"} cannot use the simple JS widget for publishing — articles need to be saved directly to your CMS database. Please use our step-by-step guide below.
            </p>
          </div>
          <Button
            onClick={() => {
              setIntegrationMode("advanced")
              setStep("setup-advanced")
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white w-full"
          >
            Open Step-by-Step Guide →
          </Button>
          <BackButton onClick={() => setStep("blog-simple")} />
        </div>
      )
    }

    const platformInstructions: Record<string, { step2: string; step3: string }> = {
      wordpress: {
        step2: "Log in to your WordPress Admin (yoursite.com/wp-admin)",
        step3: "Go to Appearance → Theme Editor → find footer.php and paste the code before </body>",
      },
      webflow: {
        step2: "Log in to Webflow and open your project",
        step3: "Go to Project Settings → Custom Code → Footer Code section",
      },
      shopify: {
        step2: "Log in to your Shopify Admin",
        step3: "Go to Online Store → Themes → Edit Code → open theme.liquid and paste before </body>",
      },
    }

    const platformKey =
      detected === "wordpress"
        ? "wordpress"
        : detected === "webflow"
        ? "webflow"
        : detected === "shopify"
        ? "shopify"
        : null

    const instructions = platformKey ? platformInstructions[platformKey] : null

    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />

        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">
            Add the widget to your site
          </h3>
          <p className="text-slate-600 text-xs">
            Follow these steps to connect your site. No coding knowledge required.
          </p>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-slate-700 font-medium text-sm">Here&apos;s your unique embed code:</p>
            </div>
            <div className="flex items-start gap-2 mt-2">
              <code className="text-xs text-violet-300 bg-white/60 rounded-lg px-3 py-2 font-mono flex-1 break-all border border-black/10">
                {widgetEmbedCode}
              </code>
              <CopyButton text={widgetEmbedCode} label="Copy" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="text-slate-700 text-sm">
              {instructions ? instructions.step2 : "Log in to your website's admin panel"}
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="text-slate-700 text-sm">
              {instructions
                ? instructions.step3
                : "Find where to add custom code/scripts (usually in Settings → Custom Code)"}
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <p className="text-slate-700 text-sm">Paste the code and save your changes</p>
          </div>
        </div>

        {/* Blog destination */}
        {hasBlog === false && (
          <div className="rounded-xl bg-violet-900/10 border border-violet-500/20 p-3 text-sm">
            <p className="text-slate-600 text-xs">After adding the widget, a blog will be created on your site automatically. Your articles will appear at: <span className="text-violet-300 font-mono">yoursite.com/blog</span></p>
          </div>
        )}
        {hasBlog === true && (
          <div className="rounded-xl bg-violet-900/10 border border-violet-500/20 p-3 text-sm">
            <p className="text-slate-600 text-xs">
              Your articles will be published directly to:
            </p>
            {existingBlogUrl && (
              <p className="text-violet-300 font-mono text-xs mt-1">{existingBlogUrl}</p>
            )}
          </div>
        )}

        {/* Help link */}
        <p className="text-slate-600 text-xs">
          Need help?{" "}
          <a href="#" className="text-violet-400 hover:text-violet-300 underline">
            Watch our setup guide
          </a>
        </p>

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

        {saveError && (
          <p className="text-red-500 text-sm">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConnectSimple}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-[#1b1916]"
          >
            {saving ? "Connecting..." : "I've added it — Connect"}
          </Button>
          <BackButton onClick={() => setStep("blog-simple")} />
        </div>
      </div>
    )
  }

  return null
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: { sites?: ConnectedSite[] }) => {
        setSites(data.sites ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

            {sites.map((site) => (
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
                {site.siteSlug && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm">
                    <span className="text-green-600 shrink-0 font-semibold">&#10003; Connected!</span>
                    <span className="text-slate-700 text-xs">Articles will be published to your site automatically.</span>
                  </div>
                )}
              </div>
            ))}

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
