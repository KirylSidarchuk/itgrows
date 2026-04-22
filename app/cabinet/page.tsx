"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { Loader2, RefreshCw, Send, Calendar, Check, Settings, LogOut, Zap, Lock, MessageCircle } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

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

const STATUS_DOT: Record<string, string> = {
  draft: "bg-slate-400",
  scheduled: "bg-blue-500",
  published: "bg-green-500",
  failed: "bg-red-500",
}

function calcDnaScore(brief: LinkedInBrief, profileUrl: string): number {
  let score = 0
  if (profileUrl.trim()) score += 15
  if (brief.companyName.trim()) score += 20
  if (brief.niche.trim()) score += 25
  if (brief.targetAudience.trim()) score += 20
  if (brief.goals.trim()) score += 20
  return score
}

function DnaScoreBar({ score }: { score: number }) {
  const color =
    score >= 90
      ? { bar: "from-green-400 to-emerald-500", text: "text-green-600", bg: "text-green-700 bg-green-50" }
      : score >= 61
      ? { bar: "from-violet-500 to-purple-600", text: "text-violet-600", bg: "text-violet-700 bg-violet-50" }
      : score >= 31
      ? { bar: "from-amber-400 to-orange-400", text: "text-amber-600", bg: "text-amber-700 bg-amber-50" }
      : { bar: "from-red-400 to-rose-500", text: "text-red-500", bg: "text-red-700 bg-red-50" }

  const label =
    score >= 90 ? "Excellent — ready to generate!" :
    score >= 61 ? "Good — almost there" :
    score >= 31 ? "Needs more details" :
    "Just getting started"

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Professional DNA Score</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.bg}`}>{label}</span>
        </div>
        <span className={`text-xl font-bold ${color.text}`}>{score}%</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${color.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">ItGrows understands {score}% of your professional DNA</p>
    </div>
  )
}

function FieldCheckmark({ value }: { value: string }) {
  if (!value.trim()) return null
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600 ml-1 shrink-0">
      <Check className="w-2.5 h-2.5" />
    </span>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function PostCard({
  post,
  onUpdate,
  onPublish,
  onDelete,
  hasSubscription,
}: {
  post: LinkedInPost
  onUpdate: (postId: string, content: string, scheduledFor: string) => Promise<void>
  onPublish: (postId: string) => Promise<void>
  onDelete: (postId: string) => Promise<void>
  hasSubscription: boolean
}) {
  const [content, setContent] = useState(post.content)
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ""
  )
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)

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

  const previewText = content.length > 140 ? content.slice(0, 140) + "…" : content

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      {post.imageUrl && (
        <div className="h-36 overflow-hidden bg-slate-100">
          <img src={post.imageUrl} alt="Post cover" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[post.status] ?? STATUS_DOT.draft}`} />
            <Badge variant="outline" className={`text-xs px-2 py-0.5 capitalize ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}>
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
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-slate-300 hover:text-red-400 transition-colors"
          >
            {deleting ? "..." : "✕"}
          </button>
        </div>

        {post.publishError && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{post.publishError}</p>
        )}

        {/* Content preview / edit */}
        {post.status === "published" ? (
          <p className="text-sm text-slate-600 leading-relaxed">{previewText}</p>
        ) : (
          <>
            {!expanded ? (
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">{previewText}</p>
                <div className="flex items-center justify-between mt-1">
                  {content.length > 140 ? (
                    <button onClick={() => setExpanded(true)} className="text-xs text-violet-500 hover:underline">
                      Show more
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              />
            )}
            {expanded && (
              <button onClick={() => setExpanded(false)} className="text-xs text-slate-400 hover:text-violet-500 hover:underline">
                Collapse
              </button>
            )}
          </>
        )}

        {/* Actions */}
        {post.status !== "published" && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
            <div className="flex-1">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            {isDirty && (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={handleSave}
                className="text-xs border-violet-200 text-violet-600 hover:bg-violet-50 shrink-0"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? "Saved!" : "Save"}
              </Button>
            )}
            {hasSubscription ? (
              <Button
                size="sm"
                disabled={publishing}
                onClick={handlePublish}
                className="text-xs bg-[#0077B5] hover:bg-[#005f8e] text-white shrink-0"
              >
                {publishing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Publish
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled
                title="Upgrade to publish"
                className="text-xs bg-slate-100 text-slate-400 shrink-0 cursor-not-allowed"
              >
                <Lock className="w-3 h-3 mr-1" />
                Publish
              </Button>
            )}
          </div>
        )}
        {post.status === "published" && post.linkedinPostId && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Published · ID: {post.linkedinPostId}
          </p>
        )}
      </div>
    </div>
  )
}

type ActiveTab = "posts" | "dna" | "account" | "support"

function LinkedInPageContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [startingTrial, setStartingTrial] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts")
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
  const [generateTimer, setGenerateTimer] = useState(90)
  const [publishedCollapsed, setPublishedCollapsed] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("itgrows_onboarding_done") !== "true" : false
  )
  const [supportMessage, setSupportMessage] = useState("")
  const [supportTopic, setSupportTopic] = useState("")
  const [supportSending, setSupportSending] = useState(false)
  const [supportSent, setSupportSent] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)
  const [cancelConfirming, setCancelConfirming] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  async function handleUpgrade(planType: "monthly" | "annual" = "monthly") {
    setCheckingOut(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setStatusMessage(data.error ?? "Something went wrong. Please try again.")
        setCheckingOut(false)
      }
    } catch {
      setStatusMessage("Something went wrong. Please try again.")
      setCheckingOut(false)
    }
  }

  async function handleStartTrial() {
    setStartingTrial(true)
    try {
      const res = await fetch("/api/trial/start", { method: "POST" })
      const data = await res.json() as { trialEndsAt?: string; error?: string }
      if (res.ok && data.trialEndsAt) {
        setTrialEndsAt(data.trialEndsAt)
        setStatusMessage("Your 7-day free trial has started! Generate your first posts now.")
      } else if (data.error === "trial_already_used") {
        setStatusMessage("You have already used your free trial. Please subscribe to continue.")
      } else if (data.error === "already_subscribed") {
        setStatusMessage("You already have an active subscription.")
      } else {
        setStatusMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setStatusMessage("Something went wrong. Please try again.")
    } finally {
      setStartingTrial(false)
      setCheckingOut(false)
    }
  }

  async function handleCancelSubscription() {
    if (!cancelConfirming) {
      setCancelConfirming(true)
      return
    }
    setCancelingSubscription(true)
    setCancelConfirming(false)
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" })
      const data = await res.json() as { success?: boolean; cancelAt?: number | null; error?: string }
      if (res.ok && data.success) {
        const dateStr = data.cancelAt
          ? new Date(data.cancelAt * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "the end of your billing period"
        setCancelMessage(`Your subscription will be cancelled on ${dateStr}. You keep full access until then.`)
      } else {
        setCancelMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setCancelMessage("Something went wrong. Please try again.")
    } finally {
      setCancelingSubscription(false)
    }
  }

  const connected = searchParams.get("connected")
  const error = searchParams.get("error")

  const userName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "there"

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
        setAccountsLoading(false)
      })
      .catch(() => { setLoading(false); setAccountsLoading(false) })
  }, [])

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((data) => {
        setSubscriptionStatus(data.status ?? null)
        setSubscriptionEndDate(data.endDate ?? null)
        setTrialEndsAt(data.trialEndsAt ?? null)
        if (data.status === "active" || data.status === "trialing") {
          setSubscriptionPlan(data.plan ?? null)
        }
      })
      .catch(() => {/* non-critical */})
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchBrief()
      fetchPosts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length])

  useEffect(() => {
    const personalAccount = accounts.find((a) => a.pageType === "personal" && a.pageHandle)
    if (personalAccount?.pageHandle && !profileUrl) {
      setProfileUrl(`https://linkedin.com/in/${personalAccount.pageHandle}`)
    }
  }, [accounts, profileUrl])

  useEffect(() => {
    if (!generating) {
      setGenerateTimer(90)
      return
    }
    const interval = setInterval(() => {
      setGenerateTimer((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [generating])

  // Auto-dismiss onboarding when all 3 steps complete
  useEffect(() => {
    if (!showOnboarding) return
    const step1 = accounts.length > 0
    const step2 = !!(brief.niche?.trim() || brief.goals?.trim() || brief.targetAudience?.trim())
    const step3 = posts.length > 0
    if (step1 && step2 && step3) {
      const timer = setTimeout(() => {
        localStorage.setItem("itgrows_onboarding_done", "true")
        setShowOnboarding(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [accounts.length, brief.niche, brief.goals, brief.targetAudience, posts.length, showOnboarding])

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
          } else {
            // Auto-fill from connected LinkedIn account if brief has no URL
            const personalAccount = accounts.find((a) => a.pageType === "personal" && a.pageHandle)
            if (personalAccount?.pageHandle) {
              setProfileUrl(`https://linkedin.com/in/${personalAccount.pageHandle}`)
            }
          }
        } else {
          // No brief yet — still auto-fill profile URL from connected account
          const personalAccount = accounts.find((a) => a.pageType === "personal" && a.pageHandle)
          if (personalAccount?.pageHandle) {
            setProfileUrl(`https://linkedin.com/in/${personalAccount.pageHandle}`)
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

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will permanently delete your account, all posts, and cancel your subscription. This cannot be undone.")) return
    setDeletingAccount(true)
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) {
        await signOut({ callbackUrl: "/" })
      } else {
        alert("Failed to delete account. Please contact support.")
        setDeletingAccount(false)
      }
    } catch {
      alert("Something went wrong. Please try again.")
      setDeletingAccount(false)
    }
  }

  async function handleSendSupport() {
    if (!supportMessage.trim() || supportMessage.trim().length < 20) return
    setSupportSending(true)
    setSupportError(null)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: supportMessage, topic: supportTopic }),
      })
      if (res.ok) {
        setSupportSent(true)
        setSupportMessage("")
        setSupportTopic("")
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setSupportError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setSupportError("Network error. Please try again.")
    } finally {
      setSupportSending(false)
    }
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
      if (res.status === 429) {
        const data = await res.json() as { message?: string }
        setGenerateError(data.message ?? "Too many requests. Please wait before generating again.")
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string }
        if (data.error === "ai_busy") {
          setGenerateError("Our AI is busy right now. Please try again in a few minutes.")
        } else {
          setGenerateError(data.message ?? data.error ?? "Generation failed. Please try again.")
        }
        return
      }
      const data = await res.json() as { posts?: LinkedInPost[] }
      fetchPosts()
      void data
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Network error — request may have timed out")
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpdatePost(postId: string, content: string, scheduledFor: string) {
    const res = await fetch("/api/linkedin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, scheduledFor: scheduledFor || undefined }),
    })
    if (!res.ok) {
      console.error("Failed to update post")
      const data = await res.json().catch(() => ({})) as { error?: string; message?: string }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, publishError: data.message ?? data.error ?? "Failed to save changes. Please try again." } : p
        )
      )
      return
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, content, scheduledFor: scheduledFor || p.scheduledFor, publishError: null } : p
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
      setPublishedCollapsed(false)
    } else if (res.status === 403 && data.error === "subscription_required") {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: "failed", publishError: "Upgrade to Personal to publish posts. See /#pricing" }
            : p
        )
      )
    } else if (res.status === 401 && data.error === "linkedin_token_expired") {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: "failed", publishError: "Your LinkedIn connection has expired. Please reconnect in the Account tab." }
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
    const res = await fetch(`/api/linkedin/posts?id=${postId}`, { method: "DELETE" })
    if (!res.ok) {
      console.error("Failed to delete post")
      setStatusMessage("Failed to delete post. Please try again.")
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const isConnected = accounts.length > 0

  // Paid Stripe subscription takes priority over trial
  const hasActiveSubscription = subscriptionStatus === "active" &&
    (subscriptionPlan === "personal" || subscriptionPlan === "personal_annual")

  // No-card free trial — only active if user hasn't paid yet
  const trialActive = !!(trialEndsAt && new Date(trialEndsAt) > new Date() && !hasActiveSubscription)
  const trialExpired = !!(trialEndsAt && new Date(trialEndsAt) <= new Date() && !hasActiveSubscription)

  const hasPersonalPlan = hasActiveSubscription || trialActive

  const trialDaysLeft = (() => {
    if (!trialEndsAt) return null
    // Stripe trialing (legacy)
    if (subscriptionStatus === "trialing" && subscriptionEndDate) {
      const diff = new Date(subscriptionEndDate).getTime() - Date.now()
      return Math.ceil(diff / 86400000)
    }
    // No-card trial
    if (trialActive) {
      const diff = new Date(trialEndsAt).getTime() - Date.now()
      return Math.ceil(diff / 86400000)
    }
    return null
  })()
  const dnaScore = calcDnaScore(brief, profileUrl)
  const briefFilled = !!(brief.niche?.trim() || brief.goals?.trim() || brief.targetAudience?.trim())
  const activePosts = posts.filter((p) => p.status !== "published").sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime())
  const publishedPosts = posts.filter((p) => p.status === "published").sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime())

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3f2f1 100%)" }}>
      {/* Left sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-slate-100 shadow-sm z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <a href="/">
            <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </a>
        </div>

        {/* Social Media section */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Social Media</p>
          {/* LinkedIn — active */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-600 text-white mb-1 cursor-default">
            <LinkedInIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">LinkedIn</span>
          </div>
          {/* Instagram — coming soon */}
          <button
            disabled
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-slate-400 cursor-not-allowed mb-1"
          >
            <div className="flex items-center gap-3">
              <InstagramIcon className="w-4 h-4 shrink-0 opacity-50" />
              <span className="text-sm">Instagram</span>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">Soon</span>
          </button>
          {/* Twitter/X — coming soon */}
          <button
            disabled
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-slate-400 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <XIcon className="w-4 h-4 shrink-0 opacity-50" />
              <span className="text-sm">X (Twitter)</span>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">Soon</span>
          </button>
        </div>

        {/* Account section */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Account</p>
          <button
            onClick={() => setActiveTab("account")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-violet-700 transition-colors mb-1"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-violet-700 transition-colors mb-1"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">Support</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-violet-700 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-sm">Logout</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 truncate">{userName}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                hasPersonalPlan
                  ? "bg-violet-100 text-violet-600"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {subscriptionPlan === "personal_annual" ? "Personal Annual" : hasPersonalPlan ? "Personal" : "Free"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1b1916] mb-1">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-slate-500 text-sm">
              {isConnected ? "Your LinkedIn is on autopilot" : "Connect LinkedIn to get started"}
            </p>
          </div>

          {/* Upgrade banner — no plan, no trial used yet */}
          {!hasPersonalPlan && !trialExpired && !loading && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Try Free for 7 Days — No Credit Card</p>
                  <p className="text-xs text-white/75 mt-0.5">7 AI posts/week, custom images, auto-scheduling</p>
                </div>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={startingTrial}
                className="shrink-0 bg-white text-violet-700 font-semibold text-xs rounded-xl px-4 py-2 hover:bg-violet-50 transition-colors disabled:opacity-70"
              >
                {startingTrial ? "Starting..." : "Start Free Trial →"}
              </button>
            </div>
          )}

          {/* Trial expired banner — show subscribe CTA */}
          {trialExpired && !hasActiveSubscription && !loading && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 border border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Your trial has ended</p>
                  <p className="text-xs text-red-600 mt-0.5">Subscribe to keep generating and publishing posts</p>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade("monthly")}
                disabled={checkingOut}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl px-4 py-2 transition-colors disabled:opacity-70"
              >
                {checkingOut ? "Loading..." : "Subscribe Now →"}
              </button>
            </div>
          )}

          {/* Trial countdown banner */}
          {(trialActive || subscriptionStatus === "trialing") && trialDaysLeft !== null && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5 border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {trialDaysLeft <= 0
                      ? "Your trial ends today!"
                      : trialDaysLeft === 1
                      ? "1 day left in your free trial"
                      : `${trialDaysLeft} days left in your free trial`}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">Subscribe to keep access after your trial ends</p>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade("monthly")}
                disabled={checkingOut}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl px-4 py-2 transition-colors disabled:opacity-70"
              >
                {checkingOut ? "Loading..." : "Subscribe →"}
              </button>
            </div>
          )}

          {/* Status messages */}
          {statusMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              connected === "1"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {statusMessage}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 w-fit">
            {(["posts", "dna", "account", "support"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab === "posts" ? "Posts" : tab === "dna" ? "Professional DNA" : tab === "account" ? "Account" : "Support"}
              </button>
            ))}
          </div>

          {/* ===================== POSTS TAB ===================== */}
          {activeTab === "posts" && (
            <div className="space-y-5">
              {accountsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              ) : isConnected ? (
                <>
                  {/* Onboarding checklist */}
                  {showOnboarding && (() => {
                    const s1 = accounts.length > 0
                    const s2 = briefFilled
                    const s3 = posts.length > 0 || publishedPosts.length > 0
                    const allDone = s1 && s2 && s3
                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <p className="text-sm font-semibold text-slate-700 mb-3">
                          {allDone ? "✓ You're all set!" : "Getting started"}
                        </p>
                        <div className="space-y-2.5">
                          {/* Step 1 — Connect LinkedIn */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {s1 ? (
                                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-green-600" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                              <span className={`text-sm ${s1 ? "line-through text-slate-400" : "font-semibold text-slate-700"}`}>
                                Connect LinkedIn
                              </span>
                            </div>
                            {!s1 && (
                              <a
                                href="/api/linkedin/connect"
                                className="text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors whitespace-nowrap"
                              >
                                Connect →
                              </a>
                            )}
                          </div>
                          {/* Step 2 — Fill Professional DNA */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {s2 ? (
                                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-green-600" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                              <span className={`text-sm ${s2 ? "line-through text-slate-400" : "font-semibold text-slate-700"}`}>
                                Fill Professional DNA
                              </span>
                            </div>
                            {!s2 && (
                              <button
                                onClick={() => setActiveTab("dna")}
                                className="text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors whitespace-nowrap"
                              >
                                Fill DNA →
                              </button>
                            )}
                          </div>
                          {/* Step 3 — Generate first posts */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {s3 ? (
                                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-green-600" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                              <span className={`text-sm ${s3 ? "line-through text-slate-400" : "font-semibold text-slate-700"}`}>
                                Generate your first posts
                              </span>
                            </div>
                            {!s3 && (
                              <button
                                onClick={briefFilled ? handleGenerate : () => setActiveTab("dna")}
                                disabled={generating}
                                className="text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors whitespace-nowrap disabled:opacity-50"
                              >
                                Generate →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Action bar */}
                  <div className="flex items-center gap-3">
                    {hasPersonalPlan ? (
                      <div className="relative group">
                        <Button
                          disabled={generating || !briefFilled}
                          onClick={handleGenerate}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!briefFilled ? "Fill your Professional DNA first" : undefined}
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              {generateTimer > 0 ? `Generating... (${generateTimer}s left)` : "Almost done..."}
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Generate 7 Posts
                            </>
                          )}
                        </Button>
                        {!briefFilled && !generating && (
                          <div className="absolute left-0 top-full mt-2 z-10 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                            Fill your Professional DNA first
                            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-800 rotate-45" />
                          </div>
                        )}
                      </div>
                    ) : trialExpired ? (
                      <Button
                        onClick={() => handleUpgrade("monthly")}
                        disabled={checkingOut}
                        className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm"
                      >
                        {checkingOut ? "Loading..." : "Subscribe to Continue"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStartTrial}
                        disabled={startingTrial}
                        className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm"
                      >
                        {startingTrial ? "Starting..." : "Start Free Trial — No Card"}
                      </Button>
                    )}
                  </div>

                  {generateError && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                      {generateError}
                    </div>
                  )}

                  {/* Posts grid */}
                  {postsLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                    </div>
                  ) : activePosts.length === 0 && publishedPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 flex flex-col items-center gap-6 text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                        <LinkedInIcon className="w-8 h-8 text-violet-400" />
                      </div>

                      {hasPersonalPlan && !briefFilled ? (
                        /* ── 2-step onboarding guide ── */
                        <div className="w-full max-w-sm">
                          <p className="text-base font-semibold text-slate-700 mb-1">Almost ready to generate!</p>
                          <p className="text-sm text-slate-400 mb-6">Two quick steps and your AI content engine is live.</p>

                          <div className="space-y-3 text-left">
                            {/* Step 1 — active */}
                            <div className="flex items-center gap-4 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3.5">
                              <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                                1
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">Fill your Professional DNA</p>
                                <p className="text-xs text-slate-500 mt-0.5">Tell the AI about your niche, audience &amp; goals</p>
                              </div>
                              <button
                                onClick={() => setActiveTab("dna")}
                                className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors whitespace-nowrap flex items-center gap-1"
                              >
                                Go to Professional DNA
                                <span className="text-violet-400">→</span>
                              </button>
                            </div>

                            {/* Step 2 — locked */}
                            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 opacity-50 select-none">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 text-sm font-bold flex items-center justify-center shrink-0">
                                2
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-400">Generate 7 posts</p>
                                <p className="text-xs text-slate-400 mt-0.5">AI-written, scheduled for the next 7 days</p>
                              </div>
                              <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                            </div>
                          </div>
                        </div>
                      ) : hasPersonalPlan ? (
                        /* ── Brief is filled — show generate button ── */
                        <>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No posts yet</p>
                            <p className="text-sm text-slate-400 max-w-xs">Generate 7 AI-written LinkedIn posts, scheduled for the next 7 days.</p>
                          </div>
                          <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="mt-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70 flex items-center gap-2"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {generateTimer > 0 ? `Generating... (${generateTimer}s left)` : "Almost done..."}
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                Generate 7 Posts
                              </>
                            )}
                          </button>
                        </>
                      ) : trialExpired ? (
                        <>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No posts yet</p>
                            <p className="text-sm text-slate-400 max-w-xs">Your trial has ended. Subscribe to generate more posts.</p>
                          </div>
                          <button
                            onClick={() => handleUpgrade("monthly")}
                            disabled={checkingOut}
                            className="mt-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70"
                          >
                            {checkingOut ? "Loading…" : "Subscribe Now →"}
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No posts yet</p>
                            <p className="text-sm text-slate-400 max-w-xs">Start your free 7-day trial — no credit card required.</p>
                          </div>
                          <button
                            onClick={handleStartTrial}
                            disabled={startingTrial}
                            className="mt-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70"
                          >
                            {startingTrial ? "Starting..." : "Start Free Trial — No Card →"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {activePosts.length > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-700">
                              Upcoming · {activePosts.length} post{activePosts.length !== 1 ? "s" : ""}
                            </h2>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activePosts.map((post) => (
                              <PostCard
                                key={post.id}
                                post={post}
                                onUpdate={handleUpdatePost}
                                onPublish={handlePublishPost}
                                onDelete={handleDeletePost}
                                hasSubscription={hasPersonalPlan}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Published posts — collapsible */}
                      {publishedPosts.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setPublishedCollapsed((c) => !c)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors mb-3"
                          >
                            <span>{publishedCollapsed ? "▶" : "▼"}</span>
                            Published · {publishedPosts.length} post{publishedPosts.length !== 1 ? "s" : ""}
                          </button>
                          {!publishedCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {publishedPosts.map((post) => (
                                <PostCard
                                  key={post.id}
                                  post={post}
                                  onUpdate={handleUpdatePost}
                                  onPublish={handlePublishPost}
                                  onDelete={handleDeletePost}
                                  hasSubscription={hasPersonalPlan}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center gap-5 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0077B5] flex items-center justify-center shadow-lg">
                    <LinkedInIcon className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-700 mb-1">Connect LinkedIn first</p>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Go to the Account tab to connect your LinkedIn profile and start generating posts.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("account")}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-500 transition-colors"
                  >
                    Go to Account →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================== DNA TAB ===================== */}

          {activeTab === "dna" && (
            <div className="space-y-5">
              {/* DNA score card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <DnaScoreBar score={dnaScore} />
                {briefIsAutoFilled && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
                    <span className="text-violet-500 text-sm">✨</span>
                    <p className="text-xs text-violet-700 font-medium">Sourced from your LinkedIn — review and edit if needed</p>
                  </div>
                )}
              </div>

              {/* Brief form */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-800 mb-1">Your Professional DNA</h2>

                {/* LinkedIn Profile URL */}
                <div>
                  <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    LinkedIn Profile URL <FieldCheckmark value={profileUrl} />
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/your-name"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      className={`flex-1 px-3 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                        profileUrl.trim() ? "border-green-300 bg-green-50/30" : "border-slate-200"
                      }`}
                    />
                    <Button
                      size="sm"
                      type="button"
                      disabled={refreshingBrief || !profileUrl.trim()}
                      onClick={() => handleRefreshFromLinkedIn(profileUrl.trim())}
                      className="shrink-0 bg-[#0077B5] hover:bg-[#005f8e] text-white text-xs px-3 rounded-xl"
                    >
                      {refreshingBrief ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      {refreshingBrief ? "Fetching..." : "Fetch from profile"}
                    </Button>
                  </div>
                  {refreshMessage && (
                    <p className={`mt-2 text-xs px-3 py-2 rounded-xl border ${
                      refreshSuccess
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                      {refreshSuccess ? "✅" : "ℹ️"} {refreshMessage}
                    </p>
                  )}
                </div>

                {/* Company + Niche */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Company Name <FieldCheckmark value={brief.companyName} />
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ItGrows, Stripe"
                      value={brief.companyName}
                      onChange={(e) => setBrief((b) => ({ ...b, companyName: e.target.value }))}
                      className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                        brief.companyName.trim() ? "border-green-300 bg-green-50/30" : "border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Niche / Industry <FieldCheckmark value={brief.niche} />
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI SaaS, fintech"
                      value={brief.niche}
                      onChange={(e) => setBrief((b) => ({ ...b, niche: e.target.value }))}
                      className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                        brief.niche.trim() ? "border-green-300 bg-green-50/30" : "border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Target Audience <FieldCheckmark value={brief.targetAudience} />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Series A founders, growth marketers"
                    value={brief.targetAudience}
                    onChange={(e) => setBrief((b) => ({ ...b, targetAudience: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                      brief.targetAudience.trim() ? "border-green-300 bg-green-50/30" : "border-slate-200"
                    }`}
                  />
                </div>

                {/* Goals */}
                <div>
                  <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Goals <FieldCheckmark value={brief.goals} />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. attract inbound leads, build thought leadership"
                    value={brief.goals}
                    onChange={(e) => setBrief((b) => ({ ...b, goals: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                      brief.goals.trim() ? "border-green-300 bg-green-50/30" : "border-slate-200"
                    }`}
                  />
                </div>

                {/* Tone selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Tone of Voice</label>
                  <div className="flex gap-2">
                    {(["professional", "casual", "inspirational"] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setBrief((b) => ({ ...b, tone }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${
                          brief.tone === tone
                            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  disabled={savingBrief}
                  onClick={handleSaveBrief}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6"
                >
                  {savingBrief ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {briefSaved ? "Saved!" : "Save DNA"}
                </Button>
              </div>
            </div>
          )}

          {/* ===================== ACCOUNT TAB ===================== */}
          {activeTab === "account" && (
            <div className="space-y-5">
              {/* Connected accounts */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-800">Connected Accounts</h2>
                  <a href="/api/linkedin/connect">
                    <Button size="sm" className="bg-[#0077B5] hover:bg-[#005f8e] text-white text-xs rounded-xl">
                      + Connect LinkedIn
                    </Button>
                  </a>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#0077B5] flex items-center justify-center shadow-md">
                      <LinkedInIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">No accounts connected</p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Link your LinkedIn personal profile or company page to generate and schedule posts.
                      </p>
                    </div>
                    <a href="/api/linkedin/connect">
                      <Button className="bg-[#0077B5] hover:bg-[#005f8e] text-white rounded-xl px-6">
                        Connect LinkedIn
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0077B5] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <LinkedInIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {account.pageName ?? (account.pageType === "personal" ? "Personal Profile" : "Company Page")}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] border-violet-200 text-violet-600 px-1.5 py-0">
                                {account.pageType === "personal" ? "Personal" : "Organization"}
                              </Badge>
                              {account.pageHandle && (
                                <span className="text-xs text-slate-400">@{account.pageHandle}</span>
                              )}
                              {account.expiresAt && new Date(account.expiresAt) <= new Date() && (
                                <a href="/api/linkedin/connect" className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full transition-colors">
                                  Expired — Reconnect
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-500 hover:bg-red-50 text-xs rounded-lg"
                          disabled={disconnecting === account.id}
                          onClick={() => handleDisconnect(account.id)}
                        >
                          {disconnecting === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscription / Billing */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Subscription</h2>
                {hasActiveSubscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {subscriptionPlan === "personal_annual" ? "Personal Annual" : "Personal"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {subscriptionPlan === "personal_annual" ? "$144/year · billed annually" : "$15/month"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50 px-2 py-0.5">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 px-1">
                      You have full access to generate posts, publish, and auto-scheduling.
                    </p>
                    {cancelMessage ? (
                      <p className="text-xs text-slate-500 px-1 pt-1">{cancelMessage}</p>
                    ) : cancelConfirming ? (
                      <div className="flex items-center gap-3 px-1 pt-1">
                        <p className="text-xs text-slate-500">Are you sure? You&apos;ll keep access until the end of your billing period.</p>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelingSubscription}
                          className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 whitespace-nowrap disabled:opacity-50"
                        >
                          {cancelingSubscription ? "Cancelling…" : "Yes, cancel"}
                        </button>
                        <button
                          onClick={() => setCancelConfirming(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap"
                        >
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCancelSubscription}
                        className="text-xs text-slate-400 hover:text-slate-500 underline underline-offset-2 px-1 pt-1 text-left"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                ) : trialActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Free Trial</p>
                          <p className="text-xs text-slate-500">
                            {trialDaysLeft !== null && trialDaysLeft > 0
                              ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`
                              : "Ends today"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50 px-2 py-0.5">
                        Trial
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpgrade("monthly")}
                        disabled={checkingOut}
                        className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 mb-0.5">Monthly</span>
                        <span className="text-base font-bold text-violet-700">$15</span>
                        <span className="text-xs text-violet-600 font-medium">/ month</span>
                        <span className="text-[10px] text-slate-500 mt-1">Billed monthly</span>
                        <span className="mt-2 w-full text-center text-xs font-semibold text-white bg-violet-600 rounded-lg py-1.5 px-2">
                          {checkingOut ? "Loading…" : "Subscribe"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleUpgrade("annual")}
                        disabled={checkingOut}
                        className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-pink-200 bg-pink-50 hover:border-pink-400 hover:bg-pink-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-pink-500 mb-0.5">Annual</span>
                        <span className="text-base font-bold text-pink-700">$12</span>
                        <span className="text-xs text-pink-600 font-medium">/ month</span>
                        <span className="text-[10px] text-slate-500 mt-1">Billed $144/year · Save 20%</span>
                        <span className="mt-2 w-full text-center text-xs font-semibold text-white bg-pink-600 rounded-lg py-1.5 px-2">
                          {checkingOut ? "Loading…" : "Subscribe"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">Subscribe now to keep access after your trial. Cancel anytime.</p>
                  </div>
                ) : trialExpired ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-sm font-semibold text-red-700 mb-1">Trial Ended</p>
                      <p className="text-xs text-red-600">Your 7-day free trial has ended. Subscribe to continue generating and publishing posts.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpgrade("monthly")}
                        disabled={checkingOut}
                        className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 mb-0.5">Monthly</span>
                        <span className="text-base font-bold text-violet-700">$15</span>
                        <span className="text-xs text-violet-600 font-medium">/ month</span>
                        <span className="text-[10px] text-slate-500 mt-1">Billed monthly</span>
                        <span className="mt-2 w-full text-center text-xs font-semibold text-white bg-violet-600 rounded-lg py-1.5 px-2">
                          {checkingOut ? "Loading…" : "Subscribe Now"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleUpgrade("annual")}
                        disabled={checkingOut}
                        className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-pink-200 bg-pink-50 hover:border-pink-400 hover:bg-pink-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-pink-500 mb-0.5">Annual</span>
                        <span className="text-base font-bold text-pink-700">$12</span>
                        <span className="text-xs text-pink-600 font-medium">/ month</span>
                        <span className="text-[10px] text-slate-500 mt-1">Billed $144/year · Save 20%</span>
                        <span className="mt-2 w-full text-center text-xs font-semibold text-white bg-pink-600 rounded-lg py-1.5 px-2">
                          {checkingOut ? "Loading…" : "Subscribe Now"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">Cancel anytime. Secure payment via Stripe.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 mb-1">Free Plan</p>
                      <p className="text-xs text-slate-500">Start a free 7-day trial — no credit card required. Full access to generate and publish posts.</p>
                    </div>
                    <button
                      onClick={handleStartTrial}
                      disabled={startingTrial}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm font-semibold text-violet-700">
                        {startingTrial ? "Starting trial..." : "Start 7-Day Free Trial — No Credit Card"}
                      </span>
                    </button>
                    <p className="text-xs text-slate-400 text-center">After 7 days, subscribe to continue. $15/month or $144/year.</p>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-5">How it works</h2>
                <ol className="space-y-5">
                  {[
                    { icon: "📝", title: "Fill in your Content Brief", desc: "Tell us about your business, target audience, and goals" },
                    { icon: "✨", title: "We generate posts crafted just for you", desc: "Our AI creates 7 personalized LinkedIn posts with professional visuals, tailored to your niche and tone" },
                    { icon: "🚀", title: "Review, edit, and publish", desc: "Approve posts, schedule them or publish instantly — we handle the rest" },
                    { icon: "🌱", title: "Watch how It Grows...", desc: "Consistent, professional content compounds over time — your audience grows, your authority builds" },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{step.icon}</span>{" "}
                          {i === 3 ? (
                            <>Watch how <span className="text-violet-600">It Grows</span>...</>
                          ) : step.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 rounded-xl border border-red-200 p-5 bg-red-50">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h3>
                <p className="text-xs text-red-500 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="text-sm font-medium text-red-600 border border-red-300 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingAccount ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </div>
          )}

          {/* ===================== SUPPORT TAB ===================== */}
          {activeTab === "support" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-1">Contact Support</h2>
                <p className="text-sm text-slate-500 mb-5">Have a question or found an issue? We'll get back to you as soon as possible.</p>

                {supportSent ? (
                  <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-green-50 border border-green-200">
                    <span className="text-green-600 text-lg">✓</span>
                    <p className="text-sm font-medium text-green-700">Message sent! We'll get back to you soon.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Topic</label>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { label: "🐛 Bug report", value: "Bug report" },
                          { label: "💡 Feature idea", value: "Feature idea" },
                          { label: "❓ Question", value: "Question" },
                          { label: "💳 Billing", value: "Billing" },
                          { label: "Other", value: "Other" },
                        ]).map(({ label, value }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSupportTopic(supportTopic === value ? "" : value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                              supportTopic === value
                                ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-md scale-105"
                                : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                            }`}
                          >
                            {supportTopic === value ? "✓ " : ""}{label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Describe your issue or idea <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={supportMessage}
                        onChange={(e) => { setSupportMessage(e.target.value); setSupportError(null) }}
                        placeholder="Describe your issue or idea..."
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">{supportMessage.trim().length}/20 characters minimum</p>
                    </div>

                    {supportError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{supportError}</p>
                    )}

                    <Button
                      disabled={supportSending || supportMessage.trim().length < 20}
                      onClick={handleSendSupport}
                      className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {supportSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
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
