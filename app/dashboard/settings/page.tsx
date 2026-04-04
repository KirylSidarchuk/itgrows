"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth"
import {
  type ConnectedSite,
  getConnectedSites,
  saveConnectedSites,
  platformLabel,
} from "@/lib/connectedSites"
import type { DetectedPlatform, DetectPlatformResult } from "@/app/api/detect-platform/route"

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = ConnectedSite["platform"]
type FormStep = "url" | "detecting" | "detected" | "credentials"

// Platforms that have full integration support
type SupportedPlatform = "wordpress" | "shopify" | "webflow"

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ["wordpress", "shopify", "webflow"]

const PLATFORM_META: Record<
  SupportedPlatform,
  { label: string; icon: string; description: string }
> = {
  wordpress: {
    label: "WordPress",
    icon: "🌐",
    description: "We can automatically publish articles to your WordPress blog.",
  },
  shopify: {
    label: "Shopify",
    icon: "🛒",
    description: "We can automatically publish articles to your Shopify blog.",
  },
  webflow: {
    label: "Webflow",
    icon: "⚡",
    description: "We can automatically publish articles to your Webflow CMS collection.",
  },
}

function isSupportedPlatform(p: DetectedPlatform): p is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(p as SupportedPlatform)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Integration guides ───────────────────────────────────────────────────────

function WordPressGuide() {
  return (
    <div className="rounded-xl bg-slate-700/30 border border-white/10 p-4 space-y-2 text-sm">
      <p className="text-slate-300 font-medium">How to get Application Password</p>
      <ol className="list-decimal list-inside space-y-1 text-slate-400">
        <li>Go to WordPress Admin → Users → Your Profile</li>
        <li>Scroll down to &quot;Application Passwords&quot;</li>
        <li>Enter name <span className="text-violet-300">itgrows.ai</span> → click Add</li>
        <li>Copy the generated password and paste it below</li>
      </ol>
    </div>
  )
}

function ShopifyGuide() {
  return (
    <div className="rounded-xl bg-slate-700/30 border border-white/10 p-4 space-y-2 text-sm">
      <p className="text-slate-300 font-medium">How to get Access Token &amp; Blog ID</p>
      <ol className="list-decimal list-inside space-y-1 text-slate-400">
        <li>Go to Shopify Admin → Settings → Apps and sales channels → Develop apps</li>
        <li>Create a new app → configure Admin API scopes: <span className="text-violet-300">write_content</span></li>
        <li>Install app → copy the Admin API access token</li>
        <li>Find Blog ID: Admin → Online Store → Blog posts → the URL contains the blog ID</li>
      </ol>
    </div>
  )
}

function WebflowGuide() {
  return (
    <div className="rounded-xl bg-slate-700/30 border border-white/10 p-4 space-y-2 text-sm">
      <p className="text-slate-300 font-medium">How to get API Token &amp; Collection ID</p>
      <ol className="list-decimal list-inside space-y-1 text-slate-400">
        <li>Go to Webflow → Site Settings → Integrations → API Access</li>
        <li>Generate a new API key and copy it</li>
        <li>Find Collection ID: CMS → your blog collection → settings</li>
      </ol>
    </div>
  )
}

// ─── Add-site wizard ──────────────────────────────────────────────────────────

interface AddSiteWizardProps {
  onSaved: (site: ConnectedSite) => void
  onCancel: () => void
}

function AddSiteWizard({ onSaved, onCancel }: AddSiteWizardProps) {
  const [step, setStep] = useState<FormStep>("url")
  const [inputUrl, setInputUrl] = useState("")

  // Detection result
  const [detected, setDetected] = useState<DetectedPlatform>("unknown")
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform>("wordpress")

  // Credentials
  const [siteName, setSiteName] = useState("")
  const [wpUsername, setWpUsername] = useState("")
  const [wpAppPassword, setWpAppPassword] = useState("")
  const [shopifyAccessToken, setShopifyAccessToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")
  const [webflowApiToken, setWebflowApiToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")

  const [notifyRequested, setNotifyRequested] = useState(false)

  const activePlatform: SupportedPlatform =
    isSupportedPlatform(detected) ? detected : selectedPlatform

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
      if (isSupportedPlatform(data.platform)) {
        setSelectedPlatform(data.platform)
      }
    } catch {
      setDetected("unknown")
    }

    setStep("detected")
  }

  // ── Step 3: save ──────────────────────────────────────────────────────────
  const handleAddSite = () => {
    const platform = activePlatform
    const credentials: ConnectedSite["credentials"] = {}

    if (platform === "wordpress") {
      credentials.username = wpUsername
      credentials.appPassword = wpAppPassword
    } else if (platform === "shopify") {
      credentials.accessToken = shopifyAccessToken
      credentials.blogId = shopifyBlogId
    } else if (platform === "webflow") {
      credentials.apiToken = webflowApiToken
      credentials.collectionId = webflowCollectionId
    }

    const normalUrl = inputUrl.trim().startsWith("http")
      ? inputUrl.trim()
      : "https://" + inputUrl.trim()

    const derivedName =
      siteName.trim() ||
      (() => {
        try {
          return new URL(normalUrl).hostname
        } catch {
          return normalUrl
        }
      })()

    const newSite: ConnectedSite = {
      id: generateId(),
      name: derivedName,
      url: normalUrl,
      platform: platform as Platform,
      credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      isDefault: false,
    }

    onSaved(newSite)
  }

  const canSave = (): boolean => {
    if (activePlatform === "wordpress") return !!(wpUsername.trim() && wpAppPassword.trim())
    if (activePlatform === "shopify") return !!(shopifyAccessToken.trim() && shopifyBlogId.trim())
    if (activePlatform === "webflow") return !!(webflowApiToken.trim() && webflowCollectionId.trim())
    return false
  }

  // ── Render: Step 1 — URL ──────────────────────────────────────────────────
  if (step === "url") {
    return (
      <div className="space-y-5 pt-4 border-t border-white/10">
        <h3 className="text-white font-semibold text-base">Connect Your Website</h3>

        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">Website URL</Label>
          <Input
            placeholder="https://yoursite.com"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
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
            className="border-white/20 text-slate-300 hover:bg-white/5"
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
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 py-6">
          <svg
            className="animate-spin h-5 w-5 text-violet-400 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-slate-300 text-sm">Detecting your platform...</span>
        </div>
      </div>
    )
  }

  // ── Render: Step 3 — Detected + credentials ───────────────────────────────
  const isUnsupported =
    detected === "wix" || detected === "squarespace"
  const isUnknown = detected === "unknown"

  return (
    <div className="space-y-5 pt-4 border-t border-white/10">
      {/* Detection result card */}
      <div className="rounded-xl bg-slate-700/40 border border-white/10 p-4 space-y-1">
        {isSupportedPlatform(detected) ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{PLATFORM_META[detected].icon}</span>
              <span className="text-white font-semibold">
                {PLATFORM_META[detected].label} detected
              </span>
            </div>
            <p className="text-slate-400 text-xs">{inputUrl}</p>
            <p className="text-green-400 text-sm flex items-center gap-1 mt-1">
              <span>&#10003;</span> {PLATFORM_META[detected].description}
            </p>
          </>
        ) : isUnsupported ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{detected === "wix" ? "🔲" : "⬛"}</span>
              <span className="text-white font-semibold capitalize">{detected} detected</span>
            </div>
            <p className="text-slate-400 text-xs">{inputUrl}</p>
          </>
        ) : (
          <>
            <p className="text-slate-300 font-medium">Platform not detected</p>
            <p className="text-slate-400 text-xs">{inputUrl}</p>
          </>
        )}
      </div>

      {/* Unsupported platforms */}
      {isUnsupported && (
        <div className="rounded-xl bg-amber-900/20 border border-amber-500/20 p-4 text-sm text-amber-300 space-y-3">
          <p>
            Direct API integration with{" "}
            <span className="capitalize font-medium">{detected}</span> is not supported yet.
            We&apos;ll notify you when it&apos;s available.
          </p>
          {!notifyRequested ? (
            <Button
              onClick={() => setNotifyRequested(true)}
              size="sm"
              className="bg-amber-600/30 border border-amber-500/40 text-amber-200 hover:bg-amber-600/50"
            >
              Notify Me
            </Button>
          ) : (
            <p className="text-green-400 text-xs">&#10003; You&apos;re on the list!</p>
          )}
        </div>
      )}

      {/* Unknown → manual platform selection */}
      {isUnknown && (
        <div className="space-y-2">
          <p className="text-slate-400 text-sm">Select manually:</p>
          <div className="flex gap-2 flex-wrap">
            {SUPPORTED_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlatform(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                  selectedPlatform === p
                    ? "border-violet-500 bg-violet-500/10 text-white"
                    : "border-white/10 bg-slate-700/40 text-slate-300 hover:border-white/20"
                }`}
              >
                <span>{PLATFORM_META[p].icon}</span>
                {PLATFORM_META[p].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credentials section — only for supported platforms */}
      {(isSupportedPlatform(detected) || isUnknown) && (
        <>
          {/* WordPress */}
          {activePlatform === "wordpress" && (
            <div className="space-y-4">
              <WordPressGuide />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Username</Label>
                  <Input
                    placeholder="admin"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-300 text-sm">Application Password</Label>
                    <a
                      href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-xs"
                    >
                      How to get Application Password →
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shopify */}
          {activePlatform === "shopify" && (
            <div className="space-y-4">
              <ShopifyGuide />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-300 text-sm">Access Token</Label>
                    <a
                      href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-xs"
                    >
                      How to get →
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="shpat_..."
                    value={shopifyAccessToken}
                    onChange={(e) => setShopifyAccessToken(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Blog ID</Label>
                  <Input
                    placeholder="123456789"
                    value={shopifyBlogId}
                    onChange={(e) => setShopifyBlogId(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Webflow */}
          {activePlatform === "webflow" && (
            <div className="space-y-4">
              <WebflowGuide />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-300 text-sm">API Token</Label>
                    <a
                      href="https://developers.webflow.com/docs/access-token"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-xs"
                    >
                      How to get →
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="your-webflow-token"
                    value={webflowApiToken}
                    onChange={(e) => setWebflowApiToken(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Collection ID</Label>
                  <Input
                    placeholder="collection-id"
                    value={webflowCollectionId}
                    onChange={(e) => setWebflowCollectionId(e.target.value)}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional site name */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">
              Site Name <span className="text-slate-500">(optional)</span>
            </Label>
            <Input
              placeholder="My Blog"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleAddSite}
              disabled={!canSave()}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Add Site
            </Button>
            <Button
              onClick={() => setStep("url")}
              variant="outline"
              className="border-white/20 text-slate-300 hover:bg-white/5"
            >
              ← Change URL
            </Button>
          </div>
        </>
      )}

      {/* Unsupported: only show Change URL */}
      {isUnsupported && (
        <Button
          onClick={() => setStep("url")}
          variant="outline"
          className="border-white/20 text-slate-300 hover:bg-white/5"
        >
          ← Change URL
        </Button>
      )}
    </div>
  )
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setSites(getConnectedSites())
  }, [router])

  const handleSaved = (newSite: ConnectedSite) => {
    const withDefault: ConnectedSite = {
      ...newSite,
      isDefault: sites.length === 0,
    }
    const updated = [...sites, withDefault]
    setSites(updated)
    saveConnectedSites(updated)
    setShowWizard(false)
  }

  const handleDelete = (id: string) => {
    const updated = sites.filter((s) => s.id !== id)
    if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
      updated[0].isDefault = true
    }
    setSites(updated)
    saveConnectedSites(updated)
  }

  const handleSetDefault = (id: string) => {
    const updated = sites.map((s) => ({ ...s, isDefault: s.id === id }))
    setSites(updated)
    saveConnectedSites(updated)
  }

  const defaultSite = sites.find((s) => s.isDefault) ?? sites[0] ?? null

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-white">Settings</h1>
          <p className="text-slate-400">Manage your account preferences and integrations.</p>
        </div>

        {/* Connected Sites */}
        <Card className="bg-slate-800/60 border-white/10">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                {defaultSite ? (
                  <>
                    <span className="text-green-400">&#10003;</span>
                    Your Connected Sites
                  </>
                ) : (
                  "Your Connected Sites"
                )}
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Add your website to automatically publish articles from itgrows.ai
              </p>
              {defaultSite && (
                <p className="text-green-400 text-xs mt-1">Default: {defaultSite.name}</p>
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
            {sites.length === 0 && !showWizard && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No sites connected yet. Click &quot;+ Add Site&quot; to get started.
              </div>
            )}

            {sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-700/40 border border-white/10"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{site.name}</span>
                    {site.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-green-900/40 border border-green-500/30 text-green-400 text-xs">
                        Default
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs">
                      {platformLabel(site.platform)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{site.url}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {!site.isDefault && (
                    <button
                      onClick={() => handleSetDefault(site.id)}
                      className="text-xs text-slate-400 hover:text-violet-300 transition-colors"
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
            ))}

            {/* Wizard */}
            {showWizard && (
              <AddSiteWizard
                onSaved={handleSaved}
                onCancel={() => setShowWizard(false)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
