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

type FormStep = "url" | "detecting" | "detected"

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

// ─── Add-site wizard ──────────────────────────────────────────────────────────

interface AddSiteWizardProps {
  onSaved: (site: ConnectedSite) => void
  onCancel: () => void
  isFirstSite: boolean
}

function AddSiteWizard({ onSaved, onCancel, isFirstSite }: AddSiteWizardProps) {
  const [step, setStep] = useState<FormStep>("url")
  const [inputUrl, setInputUrl] = useState("")
  const [detected, setDetected] = useState<DetectedPlatform>("custom")
  const [siteName, setSiteName] = useState("")
  const [saving, setSaving] = useState(false)

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
    setStep("detected")
  }

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

  // ── Step 3: save via API ──────────────────────────────────────────────────
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
  }) => {
    setSaving(true)
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
      if (data.site) {
        onSaved(data.site)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = (token: string) => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: detected === "wordpress" ? "wordpress" : detected === "shopify" ? "shopify" : detected === "webflow" ? "webflow" : "custom",
      siteToken: token,
      siteSlug: generateSiteSlug(derivedName, normalUrl),
    })
  }

  const handleConnectShopify = () => {
    saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "shopify",
      siteToken: shopifyAccessToken.trim(),
      siteSlug: generateSiteSlug(derivedName, normalUrl),
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
      siteSlug: generateSiteSlug(derivedName, normalUrl),
      webflowToken: webflowApiToken.trim(),
      webflowCollectionId: webflowCollectionId.trim(),
    })
  }

  // ── Render: Step 1 — URL ──────────────────────────────────────────────────
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

  // ── Render: Step 2 — Detecting ────────────────────────────────────────────
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

  // ── Render: Step 3 — Platform-specific install flow ───────────────────────

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
      {/* Detection badge */}
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
              : "Custom website detected"}
          </p>
          <p className="text-slate-600 text-xs">{inputUrl}</p>
        </div>
      </div>

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
              Site Name <span className="text-slate-500">(optional)</span>
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
            <Button
              onClick={() => setStep("url")}
              variant="outline"
              className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
            >
              ← Change URL
            </Button>
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
              Site Name <span className="text-slate-500">(optional)</span>
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
            <Button
              onClick={() => setStep("url")}
              variant="outline"
              className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
            >
              ← Change URL
            </Button>
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
              Site Name <span className="text-slate-500">(optional)</span>
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
            <Button
              onClick={() => setStep("url")}
              variant="outline"
              className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
            >
              ← Change URL
            </Button>
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
              Site Name <span className="text-slate-500">(optional)</span>
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
            <Button
              onClick={() => setStep("url")}
              variant="outline"
              className="border-black/20 text-slate-700 hover:bg-[#ebe9e5]"
            >
              ← Change URL
            </Button>
          </div>
        </div>
      )}
    </div>
  )
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
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916]">Settings</h1>
          <p className="text-slate-600">Manage your account preferences and integrations.</p>
        </div>

        {/* Connected Sites */}
        <Card className="bg-white border-black/10">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-[#1b1916] text-lg flex items-center gap-2">
                {defaultSite ? (
                  <>
                    <span className="text-green-400">&#10003;</span>
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
                <p className="text-green-400 text-xs mt-1">Default: {defaultSite.name}</p>
              )}
            </div>
            {!showWizard && (
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-violet-600 hover:bg-violet-500 text-[#1b1916] text-sm shrink-0"
              >
                + Add Site
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Existing sites */}
            {loading && (
              <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
            )}
            {!loading && sites.length === 0 && !showWizard && (
              <div className="text-center py-8 text-slate-500 text-sm">
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
                        <span className="px-2 py-0.5 rounded-full bg-green-900/40 border border-green-500/30 text-green-400 text-xs">
                          Default
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs">
                        {platformLabel(site.platform as Parameters<typeof platformLabel>[0])}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 truncate">{site.url}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {!site.isDefault && (
                      <button
                        onClick={() => handleSetDefault(site.id)}
                        className="text-xs text-slate-600 hover:text-violet-300 transition-colors"
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
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-900/10 border border-green-500/20 text-sm">
                    <span className="text-green-400 shrink-0">&#10003; Connected!</span>
                    <span className="text-slate-600 text-xs">Your hosted blog is ready at:</span>
                    <a
                      href={`/blog/${site.siteSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-300 hover:text-violet-200 text-xs font-mono truncate flex-1"
                    >
                      itgrows.ai/blog/{site.siteSlug}
                    </a>
                    <CopyButton
                      text={`https://itgrows.ai/blog/${site.siteSlug}`}
                      label="Copy link"
                    />
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
