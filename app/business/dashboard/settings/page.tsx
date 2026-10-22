"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  platformLabel,
  generateSiteToken,
  generateSiteSlug,
} from "@/lib/connectedSites"
import type { DetectedPlatform, DetectPlatformResult } from "@/app/api/detect-platform/route"
import { card } from "../visibility/parts"

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep =
  | "url"
  | "detecting"
  | "wordpress"
  | "cname"
  | "done"

// As /api/sites returns it (lib/public-site.ts): passwords and third-party tokens never reach the
// browser, only whether one is stored. siteToken is our own key for the WordPress plugin and the
// webhook, which the owner needs on their side.
interface ConnectedSite {
  id: string
  name: string
  url: string
  platform: string
  siteToken: string | null
  siteSlug: string | null
  isDefault: boolean
  webhookUrl?: string | null
  blogDomain?: string | null
  blogPublicUrl?: string | null
  wpUsername?: string | null
  hasWpAppPassword?: boolean
  lastCheckedAt?: string | null
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

// ─── WordPress plugin steps ───────────────────────────────────────────────────

function WpPluginSteps({ last }: { last: string }) {
  return (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-2 text-sm">
      <ol className="list-decimal list-inside space-y-2 text-slate-600">
        <li>
          <a href="/api/wp-plugin/download" className="text-violet-600 hover:text-violet-800 underline font-medium">
            Download ItGrows WordPress Plugin
          </a>
        </li>
        <li>Go to <strong>WP Admin → Plugins → Add New → Upload Plugin → Install → Activate</strong></li>
        <li>Go to <strong>Settings → ItGrows.ai</strong> and copy your <strong>Site Token</strong></li>
        <li>{last}</li>
      </ol>
    </div>
  )
}

// ─── Add-site wizard ──────────────────────────────────────────────────────────

const SAVE_FAILED = "That did not save. Try again, or write to us and we will connect it."

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
      // WordPress gets the plugin; every other site gets the hosted blog (one DNS record).
      setStep(platform === "wordpress" ? "wordpress" : "cname")
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
      setSaveError(SAVE_FAILED)
      return false
    } catch {
      setSaveError(SAVE_FAILED)
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
        <h3 className="text-[#1b1916] font-semibold text-base">Connect a website</h3>
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

        <WpPluginSteps last="Paste the Site Token in the field below" />

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
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">&#10003;</div>
          <h3 className="text-[#1b1916] font-bold text-xl mb-2">Saved</h3>
          <p className="text-slate-600 text-sm mb-4">
            Your blog will be at:
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

// ─── Your website page ────────────────────────────────────────────────────────

type TestStatus = { loading: boolean; success?: boolean; message?: string }

const label = "text-[11px] font-bold uppercase tracking-wide text-slate-500"

// How articles reach the site, mirroring the branches of app/api/cron/publish-scheduled: WordPress
// with a stored application password publishes through the WordPress API, other WordPress sites
// through our plugin; a custom site with a blog domain is our hosted blog; every other custom or
// PHP site is posted to as a webhook.
type Method = "wp_plugin" | "wp_api" | "webhook" | "hosted" | "other"

function methodOf(site: ConnectedSite): Method {
  if (site.platform === "wordpress") return site.hasWpAppPassword && site.wpUsername?.trim() ? "wp_api" : "wp_plugin"
  if (site.platform === "itgrows_blog") return "hosted"
  if (site.platform === "custom" && site.blogDomain) return "hosted"
  if (["php", "octobercms", "october", "custom", "nextjs", "next.js"].includes(site.platform)) return "webhook"
  return "other"
}

const METHOD_LABEL: Record<Exclude<Method, "other">, string> = {
  wp_plugin: "WordPress plugin",
  wp_api: "WordPress API",
  webhook: "Webhook",
  hosted: "Hosted blog",
}

function methodLabel(site: ConnectedSite) {
  const m = methodOf(site)
  if (m !== "other") return METHOD_LABEL[m]
  return platformLabel(site.platform as Parameters<typeof platformLabel>[0]) ?? site.platform
}

// POST /api/test-connection stores its result, and publish-scheduled refuses every article for a
// plugin or webhook site whose stored check is not OK. Two of its checks test something publishing
// does not use, so a click could stop articles that go through fine:
// - WordPress with an application password: it asks for our plugin's status address, and those
//   sites have no plugin (404 on firma-ausland.de).
// - PHP / October CMS webhooks: it sends GET ?test=1, while articles go out as POST. MagiScan's
//   webhook answers that GET with 404 and takes an article every day.
// Until the route checks what publishing uses, these sites are not offered the check.
const UNCHECKABLE_WEBHOOK = ["php", "october", "octobercms"]

function checkable(site: ConnectedSite) {
  const m = methodOf(site)
  if (m === "wp_api") return false
  if (m === "webhook" && UNCHECKABLE_WEBHOOK.includes(site.platform)) return false
  return true
}

function siteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function fmtWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function StatusPill({ ok }: { ok: boolean | null | undefined }) {
  if (ok === true)
    return <span className="shrink-0 rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-bold text-green-800">OK</span>
  if (ok === false)
    return <span className="shrink-0 rounded-full bg-red-50 border border-red-300 px-2.5 py-0.5 text-xs font-bold text-red-700">Problem</span>
  return <span className="shrink-0 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-slate-600">Not checked yet</span>
}

function SiteCard({
  site,
  showDefault,
  test,
  onCheck,
  onSetDefault,
}: {
  site: ConnectedSite
  showDefault: boolean
  test: TestStatus | undefined
  onCheck: () => void
  onSetDefault: () => void
}) {
  const method = methodOf(site)
  const blogUrl = method === "hosted" ? site.blogPublicUrl || (site.blogDomain ? `https://${site.blogDomain}` : null) : null
  const token = (method === "wp_plugin" || method === "webhook") && site.siteToken ? site.siteToken : null
  const fresh = test && !test.loading && test.message ? test : null
  const canCheck = checkable(site)
  // A status we set by hand has no time; then the badge alone shows it.
  const when = site.lastCheckedAt ? fmtWhen(site.lastCheckedAt) : ""

  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold text-lg text-[#1b1916] break-words">{site.name}</h2>
            {showDefault && site.isDefault && (
              <span className="rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-xs font-semibold text-violet-700">
                Default
              </span>
            )}
          </div>
          <a
            href={siteHref(site.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-700 hover:underline break-all"
          >
            {site.url}
          </a>
        </div>
        <StatusPill ok={site.lastCheckOk} />
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className={label}>Method</dt>
          <dd className="mt-0.5 text-[#1b1916]">{methodLabel(site)}</dd>
        </div>
        {(when || site.lastCheckOk == null) && (
          <div>
            <dt className={label}>Last check</dt>
            <dd className="mt-0.5 text-[#1b1916]">{when || "Not checked yet"}</dd>
          </div>
        )}
        {blogUrl && (
          <div className="sm:col-span-2 min-w-0">
            <dt className={label}>Blog address</dt>
            <dd className="mt-0.5">
              <a href={siteHref(blogUrl)} target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:underline break-all">
                {blogUrl}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {fresh ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            fresh.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p>{fresh.message}</p>
          {!fresh.success && (
            <p className="mt-1 text-xs">
              If this stays,{" "}
              <Link href="/business/dashboard/support" className="font-semibold underline">
                write to us
              </Link>{" "}
              and we will fix it.
            </p>
          )}
        </div>
      ) : (
        site.lastCheckOk === false && (
          <p className="mt-4 rounded-xl border bg-red-50 border-red-200 px-4 py-2.5 text-sm text-red-800">
            The last check did not pass. {canCheck ? "Check again, or " : ""}
            <Link href="/business/dashboard/support" className="font-semibold underline">
              {canCheck ? "write to us" : "Write to us"}
            </Link>{" "}
            and we will fix it.
          </p>
        )
      )}

      {token && (
        <div className="mt-4 rounded-xl bg-[#ebe9e5] border border-black/10 p-4">
          <p className={label}>Site token</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="font-mono text-xs text-[#1b1916] break-all">{token}</code>
            <CopyButton text={token} label="Copy" />
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {method === "wp_plugin"
              ? "It must be the same as the token in WP Admin → Settings → ItGrows.ai."
              : "Your webhook checks this token on every article we send."}
          </p>
        </div>
      )}

      {method === "wp_plugin" && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-violet-700">How to install the plugin</summary>
          <div className="mt-3">
            <WpPluginSteps last="Check that the Site Token there is the same as the one above. If it is different, write to us and we will update it." />
          </div>
        </details>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {canCheck ? (
          <button
            onClick={onCheck}
            disabled={test?.loading}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {test?.loading ? "Checking…" : "Check again"}
          </button>
        ) : (
          <p className="text-xs text-slate-600">
            {method === "wp_api"
              ? "WordPress checks this connection each time we publish an article."
              : "Your site checks this connection each time we send an article."}
          </p>
        )}
        {showDefault && !site.isDefault && (
          <button
            onClick={onSetDefault}
            className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f4f3f1]"
          >
            Set as default
          </button>
        )}
      </div>
    </section>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  // We connect paying clients' websites ourselves, so the wizard opens only when asked for: the
  // "Connect a website" button, or ?connect=1 from other pages and the WordPress plugin.
  const [showWizard, setShowWizard] = useState(() => searchParams.get("connect") === "1")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [notice, setNotice] = useState("")
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({})

  useEffect(() => {
    fetch("/api/sites", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data: { sites?: ConnectedSite[] }) => setSites(data.sites ?? []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (newSite: ConnectedSite) => {
    setSites((prev) => [
      ...prev.map((s) => (newSite.isDefault ? { ...s, isDefault: false } : s)),
      newSite,
    ])
    // The hosted-blog step shows its own "Saved" screen and closes itself.
    if (newSite.platform !== "custom") setShowWizard(false)
  }

  // The default site is where new articles are published, so this asks first.
  const handleSetDefault = async (site: ConnectedSite) => {
    if (!window.confirm(`Publish new articles to ${site.name} from now on?`)) return
    setNotice("")
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    }).catch(() => null)
    if (!res?.ok) {
      setNotice("That did not save. Try again, or write to us.")
      return
    }
    setSites((prev) => prev.map((s) => ({ ...s, isDefault: s.id === site.id })))
  }

  const handleTestConnection = async (id: string) => {
    setTestStatuses((prev) => ({ ...prev, [id]: { loading: true } }))
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id }),
      })
      const data = await res.json() as { success?: boolean; message?: string }
      setTestStatuses((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          success: res.ok && data.success === true,
          message: data.message || "The check did not run. Reload the page and try again.",
        },
      }))
      // A 200 is a check that ran; the server stores its result, so the card shows it too.
      if (res.ok) {
        const at = new Date().toISOString()
        setSites((prev) => prev.map((s) => (s.id === id ? { ...s, lastCheckOk: data.success === true, lastCheckedAt: at } : s)))
      }
    } catch {
      setTestStatuses((prev) => ({
        ...prev,
        [id]: { loading: false, success: false, message: "The check did not run. Try again in a minute." },
      }))
    }
  }

  const several = sites.length > 1

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916]">Your website</h1>
        <p className="text-sm text-slate-600 mt-1">
          {several
            ? "Where we publish your articles. New articles go to the website marked Default."
            : "Where we publish your articles."}
        </p>
      </header>

      {loading && <section className={`${card} text-sm text-slate-600`}>Loading…</section>}

      {!loading && loadError && (
        <section className={`${card} text-sm text-[#1b1916]`}>
          We could not load your website. Reload the page, or{" "}
          <Link href="/business/dashboard/support" className="font-semibold text-violet-700 underline">
            write to us
          </Link>
          .
        </section>
      )}

      {notice && <p className="rounded-xl border bg-red-50 border-red-200 px-4 py-2.5 text-sm text-red-800">{notice}</p>}

      {!loading && !loadError && sites.length === 0 && !showWizard && (
        <section className={card}>
          <p className="text-[#1b1916]">
            We connect your website when your paid plan starts.{" "}
            <Link href="/business/dashboard/support" className="font-semibold text-violet-700 underline">
              Write to us
            </Link>{" "}
            if you want to start now.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-4 rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f4f3f1]"
          >
            Connect a website
          </button>
        </section>
      )}

      {sites.map((site) => (
        <SiteCard
          key={site.id}
          site={site}
          showDefault={several}
          test={testStatuses[site.id]}
          onCheck={() => handleTestConnection(site.id)}
          onSetDefault={() => handleSetDefault(site)}
        />
      ))}

      {!loading && !loadError && sites.length > 0 && !showWizard && (
        <button
          onClick={() => setShowWizard(true)}
          className="rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          Connect a website
        </button>
      )}

      {showWizard && (
        <section className={`${card} [&>div]:border-t-0 [&>div]:pt-0`}>
          <AddSiteWizard
            onSaved={handleSaved}
            onCancel={() => setShowWizard(false)}
            isFirstSite={sites.length === 0}
          />
        </section>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 text-slate-500 text-sm">Loading…</div>}>
      <SettingsContent />
    </Suspense>
  )
}
