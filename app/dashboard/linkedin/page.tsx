"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { ChevronDown, ChevronUp, Loader2, RefreshCw, Send, Calendar } from "lucide-react"

interface LinkedInAccount {
  id: string
  pageType: "personal" | "organization"
  pageName: string | null
  pageHandle: string | null
  linkedinPersonUrn: string | null
  linkedinOrgUrn: string | null
  expiresAt: string | null
  createdAt: string | null
}

interface LinkedInPost {
  id: string
  content: string
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  linkedinPostId: string | null
  publishError: string | null
  imageUrl: string | null
  createdAt: string
}

interface LinkedInBrief {
  niche: string
  tone: string
  goals: string
  companyName: string
  targetAudience: string
  profileUrl?: string
  isAutoFilled?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  scheduled: "bg-blue-50 text-blue-600 border-blue-200",
  published: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-600 border-red-200",
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function PostCard({
  post,
  onUpdate,
  onPublish,
  onDelete,
}: {
  post: LinkedInPost
  onUpdate: (postId: string, content: string, scheduledFor: string) => Promise<void>
  onPublish: (postId: string) => Promise<void>
  onDelete: (postId: string) => Promise<void>
}) {
  const [content, setContent] = useState(post.content)
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ""
  )
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDirty = content !== post.content || scheduledFor !== (post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : "")

  async function handleSave() {
    setSaving(true)
    await onUpdate(post.id, content, scheduledFor)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePublish() {
    setPublishing(true)
    await onPublish(post.id)
    setPublishing(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return
    setDeleting(true)
    await onDelete(post.id)
  }

  const scheduledDate = post.scheduledFor
    ? new Date(post.scheduledFor).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="rounded-xl border border-white/60 bg-white/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0.5 ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}
          >
            {post.status}
          </Badge>
          {scheduledDate && post.status === "scheduled" && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {scheduledDate}
            </span>
          )}
          {post.publishedAt && (
            <span className="text-xs text-slate-400">
              Published {new Date(post.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>

      {post.publishError && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{post.publishError}</p>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={post.status === "published"}
        rows={6}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
      />

      {post.imageUrl && (
        <div className="rounded-lg overflow-hidden border border-slate-200">
          <img
            src={post.imageUrl}
            alt="Post cover"
            className="w-full object-cover max-h-48"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {post.status !== "published" && (
          <>
            <div className="flex-1">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            {isDirty && (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={handleSave}
                className="text-xs border-violet-300 text-violet-600 hover:bg-violet-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? "Saved!" : "Save"}
              </Button>
            )}
            <Button
              size="sm"
              disabled={publishing}
              onClick={handlePublish}
              className="text-xs bg-[#0077B5] hover:bg-[#005f8e] text-white"
            >
              {publishing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Publish now
                </>
              )}
            </Button>
          </>
        )}
        {post.status === "published" && post.linkedinPostId && (
          <span className="text-xs text-green-600">LinkedIn ID: {post.linkedinPostId}</span>
        )}
      </div>
    </div>
  )
}

function LinkedInPageContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [briefOpen, setBriefOpen] = useState(false)
  const [brief, setBrief] = useState<LinkedInBrief>({
    niche: "",
    tone: "professional",
    goals: "",
    companyName: "",
    targetAudience: "",
  })
  const [briefIsAutoFilled, setBriefIsAutoFilled] = useState(false)
  const [profileUrl, setProfileUrl] = useState("")
  const [savingBrief, setSavingBrief] = useState(false)
  const [briefSaved, setBriefSaved] = useState(false)
  const [refreshingBrief, setRefreshingBrief] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const [refreshSuccess, setRefreshSuccess] = useState(false)
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateTimer, setGenerateTimer] = useState(0)

  const connected = searchParams.get("connected")
  const error = searchParams.get("error")

  useEffect(() => {
    if (connected === "1") {
      setStatusMessage("LinkedIn connected successfully!")
    } else if (error && !loading && accounts.length === 0) {
      const messages: Record<string, string> = {
        oauth_denied: "LinkedIn authorization was denied.",
        token_failed: "Failed to obtain access token from LinkedIn.",
        server_error: "A server error occurred during connection.",
      }
      setStatusMessage(messages[error] ?? "Connection failed. Please try again.")
    }
  }, [connected, error, loading, accounts.length])

  useEffect(() => {
    fetch("/api/linkedin/pages")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchBrief()
      fetchPosts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length])

  useEffect(() => {
    if (!generating) {
      setGenerateTimer(0)
      return
    }
    const interval = setInterval(() => {
      setGenerateTimer((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [generating])

  function fetchBrief() {
    fetch("/api/linkedin/brief")
      .then((r) => r.json())
      .then((data) => {
        if (data.brief) {
          setBrief({
            niche: data.brief.niche ?? "",
            tone: data.brief.tone ?? "professional",
            goals: data.brief.goals ?? "",
            companyName: data.brief.companyName ?? "",
            targetAudience: data.brief.targetAudience ?? "",
          })
          setBriefIsAutoFilled(data.brief.isAutoFilled === true)
          if (data.brief.profileUrl) {
            setProfileUrl(data.brief.profileUrl)
          }
        }
      })
      .catch(() => {})
  }

  const fetchPosts = useCallback(() => {
    setPostsLoading(true)
    fetch("/api/linkedin/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? [])
        setPostsLoading(false)
      })
      .catch(() => setPostsLoading(false))
  }, [])

  async function handleDisconnect(id?: string) {
    setDisconnecting(id ?? "all")
    const url = id ? `/api/linkedin/disconnect?id=${id}` : "/api/linkedin/disconnect"
    await fetch(url, { method: "DELETE" })
    setAccounts((prev) => (id ? prev.filter((a) => a.id !== id) : []))
    setDisconnecting(null)
  }

  async function handleSaveBrief() {
    setSavingBrief(true)
    await fetch("/api/linkedin/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brief, profileUrl: profileUrl || undefined }),
    })
    setSavingBrief(false)
    setBriefSaved(true)
    setBriefIsAutoFilled(false)
    setTimeout(() => setBriefSaved(false), 2500)
  }

  async function handleRefreshFromLinkedIn(urlOverride?: string) {
    setRefreshingBrief(true)
    setRefreshMessage(null)
    setRefreshSuccess(false)
    try {
      const body: Record<string, string> = {}
      if (urlOverride) body.profileUrl = urlOverride
      const res = await fetch("/api/linkedin/refresh-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as {
        success?: boolean
        brief?: LinkedInBrief
        reason?: string
        message?: string
        error?: string
      }
      if (data.success && data.brief) {
        const b = data.brief
        setBrief({
          niche: b.niche ?? "",
          tone: b.tone ?? "professional",
          goals: b.goals ?? "",
          companyName: b.companyName ?? "",
          targetAudience: b.targetAudience ?? "",
        })
        if (b.profileUrl) setProfileUrl(b.profileUrl)
        setBriefIsAutoFilled(true)
        setBriefOpen(true)
        setRefreshSuccess(true)
        setRefreshMessage("Updated from LinkedIn")
      } else {
        setRefreshSuccess(false)
        setRefreshMessage(data.message ?? data.error ?? "Could not refresh from LinkedIn. Please fill in manually.")
      }
    } catch {
      setRefreshSuccess(false)
      setRefreshMessage("Could not connect to LinkedIn. Please try again or fill in manually.")
    } finally {
      setRefreshingBrief(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch("/api/linkedin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json() as { posts?: LinkedInPost[]; error?: string }
      if (!res.ok || data.error) {
        setGenerateError(data.error ?? "Failed to generate posts")
      } else {
        fetchPosts()
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Network error — request may have timed out")
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpdatePost(postId: string, content: string, scheduledFor: string) {
    await fetch("/api/linkedin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, scheduledFor: scheduledFor || undefined }),
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, content, scheduledFor: scheduledFor || p.scheduledFor } : p
      )
    )
  }

  async function handlePublishPost(postId: string) {
    const res = await fetch("/api/linkedin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
    const data = await res.json() as { success?: boolean; error?: string; linkedinPostId?: string }
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: "published", publishedAt: new Date().toISOString(), linkedinPostId: data.linkedinPostId ?? null, publishError: null }
            : p
        )
      )
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: "failed", publishError: data.error ?? "Unknown error" } : p
        )
      )
    }
  }

  async function handleDeletePost(postId: string) {
    await fetch(`/api/linkedin/posts?id=${postId}`, { method: "DELETE" })
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const isConnected = accounts.length > 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1b1916] mb-1">LinkedIn</h1>
        <p className="text-sm text-slate-500">Connect your LinkedIn account to generate and publish posts.</p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            connected === "1"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {!isConnected && !loading && (
        <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 bg-[#0077B5] rounded-2xl flex items-center justify-center">
              <LinkedInIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#1b1916] mb-1">Connect LinkedIn</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                Link your LinkedIn personal profile or company page to generate and schedule posts.
              </p>
            </div>
            <a href="/api/linkedin/connect">
              <Button className="bg-[#0077B5] hover:bg-[#005f8e] text-white px-6">
                Connect LinkedIn
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <>
          {/* Connected accounts */}
          <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm mb-4">
            <CardContent className="py-3 px-4 space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0077B5] rounded-lg flex items-center justify-center shrink-0">
                      <LinkedInIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1b1916]">
                        {account.pageName ?? (account.pageType === "personal" ? "Personal Profile" : "Company Page")}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-violet-200 text-violet-600 px-1.5 py-0"
                        >
                          {account.pageType === "personal" ? "Personal" : "Organization"}
                        </Badge>
                        {account.pageHandle && (
                          <span className="text-xs text-slate-400">@{account.pageHandle}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                    disabled={disconnecting === account.id}
                    onClick={() => handleDisconnect(account.id)}
                  >
                    {disconnecting === account.id ? "..." : "Disconnect"}
                  </Button>
                </div>
              ))}
              <div className="pt-1">
                <a href="/api/linkedin/connect">
                  <Button size="sm" variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50 text-xs">
                    + Connect another account
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* How it works guide */}
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-violet-50 to-slate-50 border border-violet-100 p-5">
            <h3 className="text-sm font-semibold text-violet-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">?</span>
              How it works
            </h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-semibold text-[#1b1916] flex items-center gap-1.5">
                    <span>📝</span> Fill in your Content Brief
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tell us about your business, target audience, and goals
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-semibold text-[#1b1916] flex items-center gap-1.5">
                    <span>✨</span> We generate posts crafted just for you
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Our AI creates 7 personalized LinkedIn posts with professional visuals, tailored to your niche and tone of voice
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-semibold text-[#1b1916] flex items-center gap-1.5">
                    <span>🚀</span> Review, edit, and publish
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Approve posts, schedule them or publish instantly — we handle the rest
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Brief section */}
          <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm mb-4">
            <CardHeader
              className="py-3 px-4 cursor-pointer"
              onClick={() => setBriefOpen((o) => !o)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-sm font-semibold text-[#1b1916]">Your professional DNA</CardTitle>
                  {briefIsAutoFilled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200">
                      ✨ Sourced from your LinkedIn profile — your DNA is unique, edit if needed
                    </span>
                  )}
                </div>
                {briefOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Your unique background that powers every post we create
              </p>
            </CardHeader>
            {briefOpen && (
              <CardContent className="space-y-3 pt-0">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn Profile URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <Button
                      size="sm"
                      type="button"
                      disabled={refreshingBrief || !profileUrl.trim()}
                      onClick={() => handleRefreshFromLinkedIn(profileUrl.trim())}
                      className="shrink-0 bg-[#0077B5] hover:bg-[#005f8e] text-white text-xs px-3"
                    >
                      {refreshingBrief ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      {refreshingBrief ? "Fetching..." : "Fetch from profile →"}
                    </Button>
                  </div>
                  {refreshMessage && (
                    <p
                      className={`mt-1.5 text-xs px-2 py-1 rounded-lg border ${
                        refreshSuccess
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}
                    >
                      {refreshSuccess ? "✅" : "ℹ️"} {refreshMessage}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={brief.companyName}
                      onChange={(e) => setBrief((b) => ({ ...b, companyName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Niche / Industry</label>
                    <input
                      type="text"
                      placeholder="e.g. SaaS, B2B marketing, fintech"
                      value={brief.niche}
                      onChange={(e) => setBrief((b) => ({ ...b, niche: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tone</label>
                    <select
                      value={brief.tone}
                      onChange={(e) => setBrief((b) => ({ ...b, tone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="inspirational">Inspirational</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Target Audience</label>
                    <input
                      type="text"
                      placeholder="e.g. startup founders, CTOs"
                      value={brief.targetAudience}
                      onChange={(e) => setBrief((b) => ({ ...b, targetAudience: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Goals</label>
                  <input
                    type="text"
                    placeholder="e.g. drive traffic, build authority, get leads"
                    value={brief.goals}
                    onChange={(e) => setBrief((b) => ({ ...b, goals: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingBrief}
                  onClick={handleSaveBrief}
                  className="border-violet-300 text-violet-600 hover:bg-violet-50"
                >
                  {savingBrief ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {briefSaved ? "Saved!" : "Save DNA"}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Generate button */}
          <div className="mb-4">
            <Button
              disabled={generating}
              onClick={handleGenerate}
              className="bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90 w-full py-5 text-base font-semibold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating 7 posts... ({generateTimer}s)
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate 7 LinkedIn Posts
                </>
              )}
            </Button>
            {generateError && (
              <p className="text-xs text-red-500 mt-2 text-center">{generateError}</p>
            )}
          </div>

          {/* Posts list */}
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm">
              <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="text-3xl">📝</div>
                <p className="text-sm font-medium text-[#1b1916]">No posts yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Fill in your content brief and click &quot;Generate 7 LinkedIn Posts&quot; to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#1b1916]">
                    Posts ({posts.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchPosts}
                    className="border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUpdate={handleUpdatePost}
                    onPublish={handlePublishPost}
                    onDelete={handleDeletePost}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default function LinkedInPage() {
  return (
    <Suspense>
      <LinkedInPageContent />
    </Suspense>
  )
}
