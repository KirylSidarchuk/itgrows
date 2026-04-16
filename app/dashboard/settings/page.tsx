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
  | "wordpress"
  | "shopify"
  | "webflow"
  | "cname"
  | "done"

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

  // Blog domain (CNAME flow)
  const [blogDomain, setBlogDomain] = useState("")
  const [blogPublicUrl, setBlogPublicUrl] = useState("")

  // WordPress plugin flow
  const [wpToken, setWpToken] = useState("")

  // Pre-generate a token for CNAME / custom
  const [generatedToken] = useState(() => generateSiteToken())

  // Shopify fields
  const [shopifyAccessToken, setShopifyAccessToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")

  // Webflow fields
  const [webflowApiToken, setWebflowApiToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")

  // ── Derived values ────────────────────────────────────────────────────────

  const normalUrl = inputUrl.trim().startsWith("http")
    ? inputUrl.trim()
    : "https://" + inputUrl.trim()

  const derivedDomain = (() => {
    try {
      return new URL(normalUrl).hostname
    } catch {
      return inputUrl.trim()
    }
  })()

  const derivedName = (() => {
    if (siteName.trim()) return siteName.trim()
    return derivedDomain
  })()

  const siteSlug = generateSiteSlug(derivedName, normalUrl)

  // Pre-fill blog domain when we reach cname step
  useEffect(() => {
    if (step === "cname" && !blogDomain && derivedDomain) {
      setBlogDomain(`blog.${derivedDomain}`)
    }
  }, [step, blogDomain, derivedDomain])

  // ── Step 1: detect platform ───────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!inputUrl.trim()) return
    setStep("detecting")
    setSaveError("")
    try {
      const res = await fetch("/api/detect-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl.trim() }),
      })
      const data: DetectPlatformResult = await res.json()
      const platform = data.platform ?? "custom"
      setDetected(platform)
      if (platform === "wordpress") {
        setStep("wordpress")
      } else if (platform === "shopify") {
        setStep("shopify")
      } else if (platform === "webflow") {
        setStep("webflow")
      } else {
        setStep("cname")
      }
    } catch {
      setDetected("custom")
      setStep("cname")
    }
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
    blogDomain?: string
    blogPublicUrl?: string
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
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleConnectWordPress = () => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "wordpress",
      siteToken: wpToken.trim(),
      siteSlug,
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
      blogPublicUrl: blogPublicUrl.trim() || undefined,
    })
  }

  // ── Detection badge ───────────────────────────────────────────────────────
  const DetectionBadge = () => (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 flex items-center gap-3">
      <span className="text-green-500 text-lg font-bold">&#10003;</span>
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
            Analyze
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
  // WORDPRESS
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "wordpress") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Connect WordPress</h3>
          <p className="text-slate-600 text-xs">Install the ItGrows plugin and paste your Site Token below.</p>
        </div>

        <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>
              <a href="/api/wp-plugin/download" className="text-violet-600 hover:text-violet-800 underline font-medium">
                Download ItGrows WordPress Plugin
              </a>
            </li>
            <li>Go to <strong>WP Admin → Plugins → Add New → Upload Plugin → Install → Activate</strong></li>
            <li>Go to <strong>Settings → ItGrows.ai</strong> and copy your <strong>Site Token</strong></li>
            <li>Paste the Site Token in the field below</li>
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
            Site Name <span className="text-slate-400">(optional)</span>
          </Label>
          <Input
            placeholder="My Blog"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
          />
        </div>

        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConnectWordPress}
            disabled={!wpToken.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Connecting..." : "Connect WordPress"}
          </Button>
          <BackButton onClick={() => setStep("url")} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHOPIFY
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "shopify") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Connect Shopify</h3>
          <p className="text-slate-600 text-xs">Create a private app and enter your API token below.</p>
        </div>

        <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Go to <strong>Shopify Admin → Settings → Apps and sales channels → Develop apps</strong></li>
            <li>Create a new app → configure Admin API scopes: <span className="text-violet-600 font-mono">write_content</span></li>
            <li>Install app → copy the <strong>Admin API access token</strong></li>
            <li>Find Blog ID: <strong>Admin → Online Store → Blog posts</strong> → the URL contains the blog ID</li>
          </ol>
        </div>

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
            Site Name <span className="text-slate-400">(optional)</span>
          </Label>
          <Input
            placeholder="My Store"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
          />
        </div>

        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConnectShopify}
            disabled={!shopifyAccessToken.trim() || !shopifyBlogId.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Connecting..." : "Connect Shopify"}
          </Button>
          <BackButton onClick={() => setStep("url")} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WEBFLOW
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "webflow") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Connect Webflow</h3>
          <p className="text-slate-600 text-xs">Generate an API token in Webflow and enter your Collection ID.</p>
        </div>

        <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Go to <strong>Webflow Dashboard → Project Settings → Integrations → API Access</strong></li>
            <li>Generate a new API token and copy it</li>
            <li>Find Collection ID: <strong>CMS → your blog collection → settings</strong></li>
          </ol>
        </div>

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
            Site Name <span className="text-slate-400">(optional)</span>
          </Label>
          <Input
            placeholder="My Site"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm"
          />
        </div>

        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConnectWebflow}
            disabled={!webflowApiToken.trim() || !webflowCollectionId.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Connecting..." : "Connect Webflow"}
          </Button>
          <BackButton onClick={() => setStep("url")} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CNAME (custom / Next.js / PHP / OctoberCMS / unknown)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "cname") {
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Set up your blog</h3>
          <p className="text-slate-600 text-xs">
            We&apos;ll create a blog at <strong>blog.{derivedDomain}</strong>. Just add one DNS record.
          </p>
        </div>

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
          <p className="text-slate-500 text-xs">
            This will create your blog at <code className="bg-white/60 px-1 rounded text-violet-700">blog.{derivedDomain}</code>. Changes take effect in 5–30 minutes.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 text-sm font-medium">Your blog URL after DNS:</Label>
          <Input
            placeholder={`blog.${derivedDomain}`}
            value={blogDomain}
            onChange={(e) => setBlogDomain(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
          />
          <p className="text-slate-500 text-xs">Pre-filled with the suggested subdomain — change if needed</p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 text-sm font-medium">
            Custom blog URL <span className="text-slate-400 font-normal">(optional — if using subdirectory proxy)</span>
          </Label>
          <Input
            placeholder={`https://${derivedDomain}/blog`}
            value={blogPublicUrl}
            onChange={(e) => setBlogPublicUrl(e.target.value)}
            className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
          />
          <p className="text-slate-500 text-xs">
            e.g. <code className="bg-white/60 px-1 rounded text-violet-700">https://yourdomain.com/blog</code> — leave empty if using <code className="bg-white/60 px-1 rounded text-violet-700">blog.yourdomain.com</code>. Used for correct canonical tags and sitemap URLs.
          </p>
        </div>

        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={async () => { const ok = await handleConnectCname(); if (ok) setStep("done") }}
            disabled={!blogDomain.trim() || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Saving..." : "I've added the DNS record"}
          </Button>
          <BackButton onClick={() => setStep("url")} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "done") {
    const displayDomain = blogDomain.trim()
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <div className="text-center py-4">
          <div className="text-4xl mb-4">&#9989;</div>
          <h3 className="text-[#1b1916] font-bold text-xl mb-2">Connected!</h3>
          <p className="text-slate-600 text-sm mb-4">
            Your blog is at:
          </p>
          <div className="inline-block bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 font-mono text-violet-700 text-sm font-semibold">
            {displayDomain}
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
                      <span>DNS propagation in progress. Your blog will be live at <code className="font-mono bg-amber-100 px-1 rounded">{site.url}</code> within 24 hours.</span>
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
