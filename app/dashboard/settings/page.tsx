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

type Platform = ConnectedSite["platform"]

const PLATFORMS: Array<{ value: Platform; label: string; icon: string }> = [
  { value: "wordpress", label: "WordPress", icon: "🌐" },
  { value: "shopify", label: "Shopify", icon: "🛒" },
  { value: "webflow", label: "Webflow", icon: "⚡" },
  { value: "itgrows_blog", label: "itgrows.ai Blog", icon: "✨" },
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function SettingsPage() {
  const router = useRouter()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [siteName, setSiteName] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [platform, setPlatform] = useState<Platform>("wordpress")
  const [wpUsername, setWpUsername] = useState("")
  const [wpAppPassword, setWpAppPassword] = useState("")
  const [shopifyAccessToken, setShopifyAccessToken] = useState("")
  const [shopifyBlogId, setShopifyBlogId] = useState("")
  const [webflowApiToken, setWebflowApiToken] = useState("")
  const [webflowCollectionId, setWebflowCollectionId] = useState("")

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setSites(getConnectedSites())
  }, [router])

  const resetForm = () => {
    setSiteName("")
    setSiteUrl("")
    setPlatform("wordpress")
    setWpUsername("")
    setWpAppPassword("")
    setShopifyAccessToken("")
    setShopifyBlogId("")
    setWebflowApiToken("")
    setWebflowCollectionId("")
  }

  const handleAddSite = () => {
    if (!siteName.trim() || (!siteUrl.trim() && platform !== "itgrows_blog")) return

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

    const newSite: ConnectedSite = {
      id: generateId(),
      name: siteName.trim(),
      url: platform === "itgrows_blog" ? "https://itgrows.ai/blog" : siteUrl.trim(),
      platform,
      credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      isDefault: sites.length === 0, // first site becomes default
    }

    const updated = [...sites, newSite]
    setSites(updated)
    saveConnectedSites(updated)
    resetForm()
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = sites.filter((s) => s.id !== id)
    // If we deleted the default, make first remaining the default
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
                <p className="text-green-400 text-xs mt-1">
                  Default: {defaultSite.name}
                </p>
              )}
            </div>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm shrink-0"
              >
                + Add Site
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing sites list */}
            {sites.length === 0 && !showForm && (
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

            {/* Add site form */}
            {showForm && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-white font-medium text-sm">Add New Site</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Site Name</Label>
                    <Input
                      placeholder='e.g. "My Blog"'
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                    />
                  </div>
                  {platform !== "itgrows_blog" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Site URL</Label>
                      <Input
                        placeholder="https://myblog.com"
                        value={siteUrl}
                        onChange={(e) => setSiteUrl(e.target.value)}
                        className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Platform selector */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Platform</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          platform === p.value
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 bg-slate-700/40 hover:border-white/20"
                        }`}
                      >
                        <div className="text-xl mb-1">{p.icon}</div>
                        <div className="text-white text-xs font-medium">{p.label}</div>
                        {p.value === "itgrows_blog" && (
                          <div className="text-slate-400 text-xs mt-0.5">No credentials needed</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform-specific credentials */}
                {platform === "wordpress" && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">WordPress Username</Label>
                        <Input
                          placeholder="admin"
                          value={wpUsername}
                          onChange={(e) => setWpUsername(e.target.value)}
                          className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1">
                          Application Password
                          <a
                            href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 text-xs ml-1"
                          >
                            How to get
                          </a>
                        </Label>
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

                {platform === "shopify" && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Access Token</Label>
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

                {platform === "webflow" && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">API Token</Label>
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

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddSite}
                    disabled={!siteName.trim() || (platform !== "itgrows_blog" && !siteUrl.trim())}
                    className="bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    Add Site
                  </Button>
                  <Button
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                    variant="outline"
                    className="border-white/20 text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
