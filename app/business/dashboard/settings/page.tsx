"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
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

// ─── Blog under the main domain (yourdomain.com/blog) ─────────────────────────

// How blog-service (/root/blog-service/server.js on the VM) serves a hosted blog under a client's
// own path: it finds the blog by the X-Forwarded-Host header (else Host) matching
// connected_sites.blog_domain, and reads the path from the root, so the proxy strips the prefix:
// /blog/<slug> must arrive as /<slug>. With blog_public_url set, canonical tags, links, the sitemap
// and llms.txt all use that address. The proxy goes to https://blogs.itgrows.ai (valid certificate,
// no DNS change for the client) and names the blog in X-Forwarded-Host; a plain Next.js rewrite can
// forward the client's own domain in that header, which matches no blog, hence a route handler.
const BLOG_ORIGIN = "https://blogs.itgrows.ai"

/** The bare host the API stores as blog_domain (app/api/sites strips scheme and path the same way). */
function bareHost(v: string) {
  return v.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase()
}

/** blog_public_url as blog-service needs it: absolute, no trailing slash. */
function publicBlogUrl(v: string) {
  const t = v.trim().replace(/\/+$/, "")
  if (!t) return ""
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

function blogPath(publicUrl: string) {
  try {
    return new URL(publicUrl).pathname.replace(/\/+$/, "") || "/blog"
  } catch {
    return "/blog"
  }
}

type ProxyKind = "nginx" | "cloudflare" | "nextjs"

const PROXY_LABEL: Record<ProxyKind, string> = { nginx: "nginx", cloudflare: "Cloudflare", nextjs: "Next.js / Vercel" }

function proxySnippet(kind: ProxyKind, publicUrl: string, blogHost: string) {
  const path = blogPath(publicUrl)
  let host = ""
  try {
    host = new URL(publicUrl).host
  } catch {}
  if (kind === "nginx") {
    return `# ${host}${path} -> your itgrows blog. Inside the server { } block for ${host}.
location = ${path} { return 301 ${path}/; }
location ${path}/ {
    proxy_pass ${BLOG_ORIGIN}/;
    proxy_set_header Host blogs.itgrows.ai;
    proxy_set_header X-Forwarded-Host ${blogHost};
    proxy_ssl_server_name on;
}`
  }
  if (kind === "cloudflare") {
    return `// Cloudflare Worker on the route  ${host}${path}*
export default {
  async fetch(request) {
    const url = new URL(request.url)
    const rest = url.pathname.slice("${path}".length)
    if (rest && !rest.startsWith("/")) return fetch(request) // e.g. ${path}ging: not the blog
    return fetch("${BLOG_ORIGIN}" + (rest || "/") + url.search, {
      headers: {
        "X-Forwarded-Host": "${blogHost}",
        "User-Agent": request.headers.get("User-Agent") || "",
      },
    })
  },
}`
  }
  return `// app${path}/[[...path]]/route.ts (App Router)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const rest = url.pathname.slice("${path}".length) || "/"
  const res = await fetch("${BLOG_ORIGIN}" + rest + url.search, {
    headers: {
      "X-Forwarded-Host": "${blogHost}",
      "User-Agent": req.headers.get("user-agent") ?? "",
    },
    cache: "no-store",
  })
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "text/html; charset=utf-8" },
  })
}`
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="rounded-lg bg-[#1b1916] text-white/90 text-xs leading-relaxed p-3 pr-20 overflow-x-auto"><code>{code}</code></pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} label="Copy" />
      </div>
    </div>
  )
}

/** What the client's developer adds so the hosted blog shows at yourdomain.com/blog. */
function ProxySteps({ publicUrl, blogHost }: { publicUrl: string; blogHost: string }) {
  const [kind, setKind] = useState<ProxyKind>("nginx")
  const sitemap = `Sitemap: ${publicUrl}/sitemap.xml`
  return (
    <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-4 space-y-3 text-sm">
      <p className="text-[#1b1916] font-semibold">For your developer, once</p>
      <ol className="list-decimal pl-5 space-y-3 text-slate-700">
        <li>
          One proxy rule: <code className="bg-white/60 px-1 rounded text-violet-700">{blogPath(publicUrl)}/…</code> is served from our
          server, with the prefix removed and the blog named in <code className="bg-white/60 px-1 rounded">X-Forwarded-Host</code>.
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(PROXY_LABEL) as ProxyKind[]).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === k ? "bg-violet-600 text-white" : "bg-white text-slate-700 border border-black/10"}`}>
                {PROXY_LABEL[k]}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <CodeBlock code={proxySnippet(kind, publicUrl, blogHost)} />
          </div>
        </li>
        <li>
          One line in your site&apos;s robots.txt, so Bing and Google find the blog&apos;s sitemap:
          <div className="mt-2">
            <CodeBlock code={sitemap} />
          </div>
        </li>
        <li>A link to the blog in your site&apos;s menu.</li>
      </ol>
      <p className="text-xs text-slate-600">
        Then <a href={`${publicUrl}/`} target="_blank" rel="noopener noreferrer" className="text-violet-700 underline break-all">{publicUrl}/</a> shows
        your blog, and every article&apos;s canonical tag and sitemap entry use this address. Stuck?{" "}
        <Link href="/business/dashboard/support" className="font-semibold text-violet-700 underline">Write to us</Link> and we sort it out with your developer.
      </p>
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

  // Hosted blog: at blog.<domain> (one DNS record) or under the main domain at <domain>/blog
  // (a proxy rule on the client's side). Both are the same blog on blog-service.
  const [blogMode, setBlogMode] = useState<"subdomain" | "subdirectory">("subdomain")
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

  // www.example.com should suggest blog.example.com, not blog.www.example.com.
  const rootDomain = derivedDomain.replace(/^www\./i, "")

  // Pre-fill blog domain when we reach cname step
  useEffect(() => {
    if (step === "cname" && !blogDomain && rootDomain) {
      setBlogDomain(`blog.${rootDomain}`)
    }
  }, [step, blogDomain, rootDomain])

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

  // blog_public_url only for the main-domain blog; blog.<domain> serves at its own root.
  const publicUrl = blogMode === "subdirectory" ? publicBlogUrl(blogPublicUrl) : ""

  const handleConnectCname = async () => {
    return saveSite({
      name: derivedName,
      url: normalUrl,
      platform: "custom",
      siteToken: generatedToken,
      siteSlug,
      blogDomain: blogDomain.trim(),
      blogPublicUrl: publicUrl || undefined,
    })
  }

  const chooseBlogMode = (m: "subdomain" | "subdirectory") => {
    setBlogMode(m)
    if (m === "subdirectory" && !blogPublicUrl.trim()) setBlogPublicUrl(`https://${derivedDomain}/blog`)
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

        <p className="text-slate-600 text-xs">
          For assistants to find the articles on your WordPress: your sitemap listed in robots.txt, an IndexNow plugin switched on, and the blog linked from your menu.
        </p>

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
  // HOSTED BLOG (custom / Next.js / PHP / OctoberCMS / Shopify / Webflow / unknown)
  // ─────────────────────────────────────────────────────────────────────────
  // What makes a blog findable is the same either way: one address per article, linked from the
  // main site, in a sitemap Bing and Google read. Our hosted blog does that itself; the choice is
  // only where it shows. blog.<domain> is the default (FreightSizer runs on blog.freightsizer.ai).
  if (step === "cname") {
    const sub = blogMode === "subdomain"
    const host = bareHost(blogDomain) || `blog.${rootDomain}`
    const cnameName = host.endsWith(`.${rootDomain}`) ? host.slice(0, -(rootDomain.length + 1)) : host
    const options = [
      {
        mode: "subdomain" as const,
        title: `blog.${rootDomain} — we host it`,
        badge: "Recommended to start",
        text: "One DNS record on your side. We handle HTTPS, the sitemap, IndexNow pings to Bing on every new article, and the article markup. FreightSizer's blog runs this way, at blog.freightsizer.ai.",
      },
      {
        mode: "subdirectory" as const,
        title: `${derivedDomain}/blog — the same blog under your main domain`,
        badge: "",
        text: "No DNS change. Your developer adds one proxy rule to your site; links, canonical tags and the sitemap then use your main domain.",
      },
    ]
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <DetectionBadge />
        <div>
          <h3 className="text-[#1b1916] font-semibold text-base mb-1">Where your blog lives</h3>
          <p className="text-slate-600 text-xs">
            We write and publish the articles on the plan; this only decides their address. Assistants find articles that have one
            address, are linked from your main site and sit in a sitemap Bing and Google read — both options give you that.
          </p>
        </div>

        <div className="grid gap-3" role="radiogroup" aria-label="Where your blog lives">
          {options.map((o) => (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={blogMode === o.mode}
              onClick={() => chooseBlogMode(o.mode)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                blogMode === o.mode ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : "border-black/10 bg-white hover:bg-[#f4f3f1]"
              }`}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${blogMode === o.mode ? "border-violet-600 bg-violet-600 ring-2 ring-inset ring-white" : "border-slate-400"}`} />
                <span className="font-semibold text-sm text-[#1b1916] break-all">{o.title}</span>
                {o.badge && <span className="rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-[11px] font-semibold text-violet-700">{o.badge}</span>}
              </span>
              <span className="block mt-1.5 pl-6 text-xs text-slate-600">{o.text}</span>
            </button>
          ))}
        </div>

        {sub ? (
          <>
            <div className="rounded-xl bg-[#ebe9e5] border border-black/10 p-5 space-y-3">
              <p className="text-[#1b1916] font-semibold text-sm">Add this DNS record where you manage your domain:</p>
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
                      <td className="pr-6 py-1 font-mono text-[#1b1916]">{cnameName}</td>
                      <td className="py-1 font-mono text-[#1b1916] text-xs">blogs.itgrows.ai</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-500 text-xs">
                Your blog will be at <code className="bg-white/60 px-1 rounded text-violet-700">{host}</code>. Then add a link to it in
                your site&apos;s menu — that is how assistants and search engines get from your site to the articles.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm font-medium">Blog address</Label>
              <Input
                placeholder={`blog.${rootDomain}`}
                value={blogDomain}
                onChange={(e) => setBlogDomain(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs">Pre-filled with the suggested subdomain — change it if you want another.</p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm font-medium">Blog address on your site</Label>
              <Input
                placeholder={`https://${derivedDomain}/blog`}
                value={blogPublicUrl}
                onChange={(e) => setBlogPublicUrl(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs">Canonical tags, links and the sitemap use this address.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm font-medium">Blog name on our side</Label>
              <Input
                placeholder={`blog.${rootDomain}`}
                value={blogDomain}
                onChange={(e) => setBlogDomain(e.target.value)}
                className="bg-[#ebe9e5] border-black/10 text-[#1b1916] placeholder:text-slate-500 focus:border-violet-500 text-sm font-mono"
              />
              <p className="text-slate-500 text-xs">Your proxy sends this name so our server knows which blog to show. It needs no DNS record.</p>
            </div>

            {publicUrl && <ProxySteps publicUrl={publicUrl} blogHost={host} />}
          </>
        )}

        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={async () => { const ok = await handleConnectCname(); if (ok) setStep("done") }}
            disabled={!blogDomain.trim() || (!sub && !publicUrl) || saving}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? "Saving..." : sub ? "I've added the DNS record" : "Save — my developer adds the rule"}
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
    const sub = blogMode === "subdomain"
    const displayDomain = sub ? blogDomain.trim() : publicUrl
    return (
      <div className="space-y-5 pt-4 border-t border-black/10">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">&#10003;</div>
          <h3 className="text-[#1b1916] font-bold text-xl mb-2">Saved</h3>
          <p className="text-slate-600 text-sm mb-4">
            Your blog will be at:
          </p>
          <div className="inline-block bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 font-mono text-violet-700 text-sm font-semibold break-all">
            {displayDomain}
          </div>
          <p className="text-slate-500 text-xs mt-3">
            {sub
              ? "DNS changes can take up to 24 hours to propagate. Remember the link to the blog in your site's menu."
              : "It shows there once your developer adds the proxy rule. The rule stays on your website's card on this page."}
          </p>
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
// plugin or webhook site whose stored check is not OK. The route tests what publishing uses for
// each method (the blog address, the WordPress login, the plugin, the webhook's server) without
// sending an article, so every site is offered the check.
async function checkConnection(id: string): Promise<{ ran: boolean; success: boolean; message: string }> {
  try {
    const res = await fetch("/api/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: id }),
    })
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
    return {
      ran: res.ok,
      success: res.ok && data.success === true,
      message: data.message || "The check did not run. Reload the page and try again.",
    }
  } catch {
    return { ran: false, success: false, message: "The check did not run. Try again in a minute." }
  }
}

function siteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function fmtWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ─── Launch report ────────────────────────────────────────────────────────────

// What the launch checked, fixed and set up for a site: GET /api/geo/launch, from
// /root/geo_check/launch.py on the VM. The automatic items run again every day (cron 05:40 UTC)
// and on "Check again"; the others we set as the work gets done. "na" items never reach here.
// Each item says who does it. First what we need from the client ("you": what to do and where to
// click, and Done, POST /api/geo/launch/done, after which it reads "We are checking" until a check or
// we confirm it), then what we are doing (our manual items, with their date), then the rest of the
// report: the automatic checks.
type LaunchStatus = "ok" | "fixed" | "handed" | "you" | "todo" | "issue" | "tip" | "check"

interface LaunchItem {
  key: string
  title: string
  how: "auto" | "manual"
  who?: "you" | "us"
  status: LaunchStatus
  note: string | null
  updated_at: string | null
  steps?: string[]
}

const LAUNCH_PILL: Record<LaunchStatus, [string, string]> = {
  ok: ["In order", "text-green-700 bg-green-50 border-green-200"],
  fixed: ["Fixed by us", "text-emerald-800 bg-emerald-100 border-emerald-300"],
  handed: ["With your developer", "text-sky-800 bg-sky-50 border-sky-200"],
  you: ["Needs you", "text-amber-900 bg-amber-50 border-amber-300"],
  todo: ["We're on it", "text-violet-700 bg-violet-50 border-violet-200"],
  issue: ["Needs fixing", "text-red-700 bg-red-50 border-red-200"],
  tip: ["Worth adding", "text-slate-600 bg-slate-100 border-slate-200"],
  check: ["We are checking", "text-sky-800 bg-sky-50 border-sky-200"],
}

const DONE_PILL: [string, string] = ["Done", "text-green-700 bg-green-50 border-green-200"]

const known = (items: LaunchItem[] | undefined) => (items ?? []).filter((i) => Object.hasOwn(LAUNCH_PILL, i.status))

/** The bare domain the launch API keys on, normalised as app/api/geo/launch does. */
function domainOf(url: string) {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]
}

function fmtDay(iso: string | null) {
  const d = new Date(iso ?? "")
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const isYou = (i: LaunchItem) => i.who === "you"
const OPEN_YOU = new Set<LaunchStatus>(["you", "issue", "handed", "todo"])

function YouItem({ item, onDone }: { item: LaunchItem; onDone: (key: string) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const open = OPEN_YOU.has(item.status)
  const [pillText, pillCls] = item.status === "check" ? LAUNCH_PILL.check : open ? LAUNCH_PILL.you : DONE_PILL
  const done = async () => {
    setBusy(true)
    setFailed(false)
    const ok = await onDone(item.key)
    if (!ok) setFailed(true)
    setBusy(false)
  }
  return (
    <li className="rounded-xl bg-[#f8f7f6] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-sm font-semibold text-[#1b1916]">{item.title}</span>
        <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${pillCls}`}>{pillText}</span>
      </div>
      {open && (
        <>
          {(item.steps ?? []).map((s) => (
            <p key={s} className="mt-1.5 text-sm text-slate-700 break-words">
              {s}
            </p>
          ))}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={done}
              disabled={busy}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? "Saving…" : "Done"}
            </button>
            {failed && <span className="text-xs text-red-700">That didn&apos;t go through. Try again in a minute.</span>}
          </div>
        </>
      )}
    </li>
  )
}

function LaunchReport({ domain }: { domain: string }) {
  // null while loading
  const [items, setItems] = useState<LaunchItem[] | "failed" | null>(null)
  const [hidden, setHidden] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState<{ text: string; bad?: boolean } | null>(null)

  useEffect(() => {
    let live = true
    fetch(`/api/geo/launch?site=${encodeURIComponent(domain)}`, { cache: "no-store" })
      .then(async (r) => {
        // Not one of this account's sites as the API sees it: nothing to show.
        if (r.status === 404) {
          if (live) setHidden(true)
          return
        }
        if (!r.ok) throw new Error(String(r.status))
        const data = (await r.json()) as { items?: LaunchItem[] }
        if (live) setItems(known(data.items))
      })
      .catch(() => {
        if (live) setItems("failed")
      })
    return () => {
      live = false
    }
  }, [domain])

  // The automatic checks fetch the site as eleven crawlers, so this can take most of a minute.
  // The API answers {recent: true} with the stored items when it ran in the last few minutes.
  const checkAgain = async () => {
    setChecking(true)
    setChecked(null)
    try {
      const r = await fetch("/api/geo/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: domain }),
      })
      const data = (await r.json().catch(() => ({}))) as { items?: LaunchItem[]; recent?: boolean }
      if (!r.ok || !Array.isArray(data.items)) throw new Error(String(r.status))
      setItems(known(data.items))
      setChecked({ text: data.recent ? "Checked a few minutes ago" : "Checked just now" })
    } catch {
      setChecked({ text: "The check did not run. Try again in a few minutes.", bad: true })
    } finally {
      setChecking(false)
    }
  }

  const markDone = async (key: string) => {
    try {
      const r = await fetch("/api/geo/launch/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: domain, key }),
      })
      const data = (await r.json().catch(() => ({}))) as { status?: LaunchStatus }
      if (!r.ok || !data.status) return false
      setItems((cur) => (Array.isArray(cur) ? cur.map((i) => (i.key === key ? { ...i, status: data.status! } : i)) : cur))
      return true
    } catch {
      return false
    }
  }

  if (hidden) return null

  const list = Array.isArray(items) ? items : []
  // What we need from the client: theirs to do, being checked, or done by them ("ok" from the start
  // was never needed). What we are doing: our manual items. The rest: the automatic checks.
  const youList = list.filter((i) => isYou(i) && i.status !== "ok")
  const usList = list.filter((i) => !isYou(i) && i.how === "manual")
  const rest = list.filter((i) => !isYou(i) && i.how !== "manual")
  // "Worth adding" is optional, so it neither counts against the site nor in the total.
  const counted = list.filter((i) => i.status !== "tip")
  const inOrder = counted.filter((i) => i.status === "ok" || i.status === "fixed").length
  const notRun = Array.isArray(items) && (list.length === 0 || list.every((i) => !i.updated_at))
  const ready = Array.isArray(items) && !notRun
  const pct = counted.length ? Math.round((inOrder / counted.length) * 100) : 0
  const open = list.some((i) => i.status === "you" || i.status === "issue" || i.status === "handed")

  return (
    <>
      {ready && youList.length > 0 && (
        <section className={card}>
          <p className={`${label} break-all`}>{domain}</p>
          <h2 className="mt-1 font-extrabold text-lg text-[#1b1916]">What we need from you</h2>
          <ul className="mt-4 space-y-2">
            {youList.map((i) => (
              <YouItem key={i.key} item={i} onDone={markDone} />
            ))}
          </ul>
        </section>
      )}

      {ready && usList.length > 0 && (
        <section className={card}>
          <p className={`${label} break-all`}>{domain}</p>
          <h2 className="mt-1 font-extrabold text-lg text-[#1b1916]">What we&apos;re doing</h2>
          <ul className="mt-4 space-y-2">
            {usList.map((i) => {
              const [text, cls] = LAUNCH_PILL[i.status]
              return (
                <li key={i.key} className="rounded-xl bg-[#f8f7f6] px-3.5 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-sm font-semibold text-[#1b1916]">{i.title}</span>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>{text}</span>
                  </div>
                  {i.updated_at && <p className="mt-1 text-xs text-slate-500">{fmtDay(i.updated_at)}</p>}
                  {i.note && <p className="mt-1 text-xs text-slate-600 break-words">{i.note}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className={card}>
        <p className={`${label} break-all`}>{domain}</p>
        <h2 className="mt-1 font-extrabold text-lg text-[#1b1916]">
          {ready ? `Ready for AI assistants: ${inOrder} of ${counted.length} in order` : "Ready for AI assistants"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          The launch report that comes with your launch: what we checked, fixed and set up so AI assistants and search engines can
          reach and read your site. The automatic checks run again every day.
        </p>

        {ready && (
          <div
            className="mt-4 h-2 rounded-full bg-[#ebe9e5] overflow-hidden"
            role="progressbar"
            aria-label="Items in order"
            aria-valuemin={0}
            aria-valuemax={counted.length}
            aria-valuenow={inOrder}
          >
            <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
          </div>
        )}

        {items === null ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-[#f8f7f6] animate-pulse" />
            ))}
          </div>
        ) : items === "failed" ? (
          <p className="mt-4 text-sm text-slate-600">The launch report did not load just now. Reload the page in a minute.</p>
        ) : notRun ? (
          <p className="mt-4 text-sm text-slate-600">The launch check has not run for this site yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rest.map((i) => {
              const [text, cls] = LAUNCH_PILL[i.status]
              return (
                <li key={i.key} className="rounded-xl bg-[#f8f7f6] px-3.5 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-sm font-semibold text-[#1b1916]">{i.title}</span>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>{text}</span>
                  </div>
                  {i.note && <p className="mt-1 text-xs text-slate-600 break-words">{i.note}</p>}
                </li>
              )
            })}
          </ul>
        )}

        {items !== null && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              onClick={checkAgain}
              disabled={checking}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {checking ? "Checking… up to a minute" : notRun ? "Run the check" : "Check again"}
            </button>
            {checked && <span className={`text-xs ${checked.bad ? "text-red-700" : "text-slate-600"}`}>{checked.text}</span>}
            {open && !checking && (
              <span className="text-xs text-slate-600">
                A question about an item?{" "}
                <Link href="/business/dashboard/support" className="font-semibold text-violet-700 underline">
                  Write to us
                </Link>
                .
              </span>
            )}
          </div>
        )}
      </section>
    </>
  )
}

// ─── Publishing connection ────────────────────────────────────────────────────

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
  // A hosted blog shown under the main domain keeps its proxy rule here, for the client's developer.
  const proxied = (() => {
    if (method !== "hosted" || !site.blogPublicUrl || !site.blogDomain) return null
    const publicUrl = publicBlogUrl(site.blogPublicUrl)
    try {
      return new URL(publicUrl).host.toLowerCase() === site.blogDomain.toLowerCase() ? null : { publicUrl, blogHost: site.blogDomain }
    } catch {
      return null
    }
  })()
  const token = (method === "wp_plugin" || method === "webhook") && site.siteToken ? site.siteToken : null
  const fresh = test && !test.loading && test.message ? test : null
  // A status we set by hand has no time; then the badge alone shows it.
  const when = site.lastCheckedAt ? fmtWhen(site.lastCheckedAt) : ""

  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold text-lg text-[#1b1916]">Publishing</h2>
            {showDefault && site.isDefault && (
              <span className="rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-xs font-semibold text-violet-700">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 break-words">
            How our articles reach {site.name !== site.url ? `${site.name}, ` : ""}
            <a href={siteHref(site.url)} target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:underline break-all">
              {site.url}
            </a>
          </p>
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
            The last check did not pass. Check the connection again, or{" "}
            <Link href="/business/dashboard/support" className="font-semibold underline">
              write to us
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

      {proxied && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-violet-700">The proxy rule for your developer</summary>
          <div className="mt-3">
            <ProxySteps publicUrl={proxied.publicUrl} blogHost={proxied.blogHost} />
          </div>
        </details>
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
        <button
          onClick={onCheck}
          disabled={test?.loading}
          className="rounded-xl border border-violet-500/40 bg-white text-violet-700 hover:bg-violet-50 px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {test?.loading ? "Checking…" : "Check the connection"}
        </button>
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
  const rechecked = useRef(false)
  // Sites on the plan (geo_follows.plan = paid, via /api/geo/report). One without a connected
  // website yet still shows its launch report, and when we connect publishing.
  const [planDomains, setPlanDomains] = useState<string[]>([])

  const runCheck = useCallback(async (id: string) => {
    setTestStatuses((prev) => ({ ...prev, [id]: { loading: true } }))
    const r = await checkConnection(id)
    setTestStatuses((prev) => ({ ...prev, [id]: { loading: false, success: r.success, message: r.message } }))
    // A check that ran is stored by the server, so the card shows it too.
    if (r.ran) {
      const at = new Date().toISOString()
      setSites((prev) => prev.map((s) => (s.id === id ? { ...s, lastCheckOk: r.success, lastCheckedAt: at } : s)))
    }
  }, [])

  useEffect(() => {
    fetch("/api/sites", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data: { sites?: ConnectedSite[] }) => {
        const list = data.sites ?? []
        setSites(list)
        // A stored "Problem" can be stale: the old check failed on bare addresses ("itgrows.ai")
        // and tested things publishing does not use. A failed site is checked again once on open.
        if (rechecked.current) return
        rechecked.current = true
        list.filter((x) => x.lastCheckOk === false).forEach((x) => void runCheck(x.id))
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [runCheck])

  useEffect(() => {
    fetch("/api/geo/report", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { sites: [] }))
      .then((data: { sites?: { domain?: string; plan?: string }[] }) =>
        setPlanDomains((data.sites ?? []).filter((s) => s.plan === "paid" && s.domain).map((s) => s.domain as string))
      )
      .catch(() => {})
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

  const several = sites.length > 1
  // One launch report per domain, above the first of its sites.
  const firstOfDomain = new Set(
    sites.filter((s, i) => sites.findIndex((t) => domainOf(t.url) === domainOf(s.url)) === i).map((s) => s.id)
  )
  const connected = new Set(sites.map((s) => domainOf(s.url)))
  const planOnly = loading || loadError ? [] : planDomains.filter((d) => !connected.has(d))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916]">Your website</h1>
        <p className="text-sm text-slate-600 mt-1">
          {several
            ? "How ready each site is for AI assistants, and where we publish your articles. New articles go to the website marked Default."
            : "How ready your site is for AI assistants, and where we publish your articles."}
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

      {planOnly.map((d) => (
        <div key={d} className="space-y-3">
          <LaunchReport domain={d} />
          <section className={card}>
            <h2 className="font-extrabold text-lg text-[#1b1916]">Publishing</h2>
            <p className="mt-1 text-sm text-slate-600 break-words">
              Your plan is active; we email you within one business day to connect publishing.
            </p>
          </section>
        </div>
      ))}

      {!loading && !loadError && sites.length === 0 && planOnly.length === 0 && !showWizard && (
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
        <div key={site.id} className="space-y-3">
          {firstOfDomain.has(site.id) && domainOf(site.url) && <LaunchReport domain={domainOf(site.url)} />}
          <SiteCard
            site={site}
            showDefault={several}
            test={testStatuses[site.id]}
            onCheck={() => void runCheck(site.id)}
            onSetDefault={() => handleSetDefault(site)}
          />
        </div>
      ))}

      {!loading && !loadError && (sites.length > 0 || planOnly.length > 0) && !showWizard && (
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
