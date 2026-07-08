"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { Loader2, RefreshCw, Send, Calendar, Check, Settings, LogOut, Zap, Lock, MessageCircle, BarChart2, ImageIcon, Sparkles } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

interface LinkedInAccount {
  id: string
  pageType: "personal" | "organization"
  pageName: string | null
  pageHandle: string | null
  linkedinPersonUrn: string | null
  linkedinOrgUrn: string | null
  isActive?: boolean
  stripeSubscriptionId?: string | null
  subscriptionStatus?: string | null
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
  postingFrequency: string
  avoidTopics?: string
  imageStyle?: string
}

interface TwitterAccount {
  id: string
  twitterUserId: string
  username: string
  displayName: string | null
  accountType: string
  expiresAt: string | null
  createdAt: string | null
}

interface TwitterCompanyBrief {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
}

interface TwitterPost {
  id: string
  content: string
  isThread: boolean | null
  imageUrl: string | null
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  twitterPostId: string | null
  errorMessage: string | null
  createdAt: string
  accountType: string
}

interface TwitterBrief {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
  avoidTopics?: string
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

const PLAN_DISPLAY: Record<string, { name: string; price: string }> = {
  personal: { name: "Personal", price: "$49/month" },
  personal_annual: { name: "Personal Annual", price: "$411/year · billed annually" },
  personal_annual_discount: { name: "Personal Annual", price: "Annual · billed yearly" },
  duo: { name: "Duo", price: "$99/month" },
  duo_annual: { name: "Duo Annual", price: "$831/year · billed annually" },
  allin: { name: "All-in", price: "$199/month" },
  allin_annual: { name: "All-in Annual", price: "$1,671/year · billed annually" },
  company: { name: "Company plan", price: "from $99/month" },
  company_annual: { name: "Company plan (annual)", price: "billed annually" },
}
function planName(p: string | null | undefined): string { return (p && PLAN_DISPLAY[p]?.name) || "Subscription" }
function planPrice(p: string | null | undefined): string { return (p && PLAN_DISPLAY[p]?.price) || "" }

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
      <p className="text-xs text-slate-600 mt-1.5">ItGrows understands {score}% of your professional DNA</p>
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const IMAGE_STYLE_OPTIONS: Array<[string, string]> = [
  ["ai_art", "AI Art"],
  ["minimalist", "Minimalist"],
  ["photorealistic", "Photo"],
  ["infographic", "Infographic"],
  ["no_image", "No Image"],
]

function PostCard({
  post,
  onUpdate,
  onPublish,
  onDelete,
  hasSubscription,
  trialExpired,
  onUpgrade,
}: {
  post: LinkedInPost
  onUpdate: (postId: string, content: string, scheduledFor: string) => Promise<void>
  onPublish: (postId: string) => Promise<void>
  onDelete: (postId: string) => Promise<void>
  hasSubscription: boolean
  trialExpired?: boolean
  onUpgrade?: () => void
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
  const [imageUrl, setImageUrl] = useState(post.imageUrl)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  async function handleRegenerateImage(style: string) {
    setShowStylePicker(false)
    setRegenerating(true)
    setRegenError(null)
    try {
      const res = await fetch("/api/linkedin/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, imageStyle: style }),
      })
      const data = await res.json() as { imageUrl?: string | null; error?: string }
      if (!res.ok) {
        setRegenError(data.error ?? "Failed to regenerate image")
      } else {
        setImageUrl(data.imageUrl ?? null)
      }
    } catch {
      setRegenError("Failed to regenerate image")
    } finally {
      setRegenerating(false)
    }
  }

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
    ? new Date(post.scheduledFor).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    : null

  const previewText = content.length > 140 ? content.slice(0, 140) + "…" : content

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      {trialExpired && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(2px)" }}>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <button
            onClick={onUpgrade}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Subscribe to publish →
          </button>
        </div>
      )}
      <div className="relative group">
        {imageUrl ? (
          <div className="h-36 overflow-hidden bg-slate-100">
            <img src={imageUrl} alt="Post cover" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-10 bg-slate-50 border-b border-slate-100" />
        )}
        {post.status !== "published" && (
          <div className="absolute top-2 right-2">
            {showStylePicker ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-2 flex flex-col gap-1 min-w-[120px]">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-600">Image style</span>
                  <button
                    onClick={() => setShowStylePicker(false)}
                    className="text-slate-600 hover:text-slate-600 text-xs leading-none"
                  >
                    ✕
                  </button>
                </div>
                {IMAGE_STYLE_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => handleRegenerateImage(value)}
                    className="text-left text-xs px-2 py-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setShowStylePicker(true)}
                disabled={regenerating}
                title="Regenerate image"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 hover:bg-white border border-slate-200 shadow-sm text-xs text-slate-600 hover:text-violet-600 transition-all opacity-0 group-hover:opacity-100"
              >
                {regenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ImageIcon className="w-3 h-3" />
                )}
                {regenerating ? "Generating…" : "Restyle"}
              </button>
            )}
          </div>
        )}
        {regenError && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-1 border-t border-red-100">{regenError}</p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[post.status] ?? STATUS_DOT.draft}`} />
            <Badge variant="outline" className={`text-xs px-2 py-0.5 capitalize ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}>
              {post.status}
            </Badge>
            {scheduledDate && post.status === "scheduled" && (
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {scheduledDate}
              </span>
            )}
            {post.publishedAt && (
              <span className="text-xs text-slate-600">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
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
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-violet-500 transition-colors"
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
              <button onClick={() => setExpanded(false)} className="text-xs text-slate-600 hover:text-violet-500 hover:underline">
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
                className="text-xs bg-slate-100 text-slate-600 shrink-0 cursor-not-allowed"
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
            <a
              href={`https://www.linkedin.com/feed/update/${post.linkedinPostId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-700"
            >
              View on LinkedIn
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

type ActiveTab = "posts" | "dna" | "account" | "support" | "companies"
type ActivePlatform = "linkedin" | "x"
type XActiveTab = "posts" | "dna" | "company-dna"
type LinkedInActiveTab = "personal" | "companies"

function XPostCard({
  post,
  onPublish,
  onImageUpdate,
  onContentUpdate,
  hasSubscription,
  trialExpired,
  onUpgrade,
}: {
  post: TwitterPost
  onPublish: (postId: string) => Promise<void>
  onImageUpdate: (postId: string, imageUrl: string | null) => void
  onContentUpdate: (postId: string, content: string) => void
  hasSubscription: boolean
  trialExpired?: boolean
  onUpgrade?: () => void
}) {
  const [publishing, setPublishing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)

  async function handlePublish() {
    setPublishing(true)
    await onPublish(post.id)
    setPublishing(false)
  }

  async function handleGenerateImage() {
    setGeneratingImage(true)
    setImageError(null)
    try {
      const res = await fetch("/api/x/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json() as { imageUrl?: string; error?: string }
      if (res.ok && data.imageUrl) {
        onImageUpdate(post.id, data.imageUrl)
      } else {
        setImageError(data.error ?? "Failed to generate image")
      }
    } catch {
      setImageError("Network error")
    } finally {
      setGeneratingImage(false)
    }
  }

  async function handleRemoveImage() {
    try {
      await fetch("/api/x/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      })
      onImageUpdate(post.id, null)
    } catch {
      // ignore
    }
  }

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent.length > 280) return
    setSaving(true)
    try {
      const res = await fetch("/api/x/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, content: editContent }),
      })
      if (res.ok) {
        onContentUpdate(post.id, editContent)
        setEditing(false)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const previewText = post.content.length > 140 ? post.content.slice(0, 140) + "…" : post.content

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      {trialExpired && !hasSubscription && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(2px)" }}>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <button
            onClick={onUpgrade}
            className="bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Subscribe to publish
          </button>
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[post.status] ?? STATUS_DOT.draft}`} />
            <Badge variant="outline" className={`text-xs px-2 py-0.5 capitalize ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}>
              {post.status}
            </Badge>
            {post.publishedAt ? (
              <span className="text-xs text-slate-600">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            ) : post.scheduledAt && post.status === "scheduled" ? (
              <span className="text-xs text-slate-600">
                {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {new Date(post.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
          </div>
          <XIcon className="w-3.5 h-3.5 text-slate-600" />
        </div>

        {post.errorMessage && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{post.errorMessage}</p>
        )}

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className={`text-xs ${editContent.length > 280 ? "text-red-500 font-semibold" : "text-slate-600"}`}>
              {editContent.length}/280 chars
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={saving || !editContent.trim() || editContent.length > 280}
                onClick={handleSaveEdit}
                className="text-xs bg-violet-600 hover:bg-violet-500 text-white"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </Button>
              <button
                onClick={() => { setEditing(false); setEditContent(post.content) }}
                className="text-xs text-slate-600 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {!expanded ? (
              <div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{previewText}</p>
                {post.content.length > 140 && (
                  <button onClick={() => setExpanded(true)} className="text-xs text-slate-600 hover:text-slate-700 hover:underline mt-1">
                    Show more
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>
                <button onClick={() => setExpanded(false)} className="text-xs text-slate-600 hover:underline">
                  Collapse
                </button>
              </>
            )}
            <div className="text-xs text-slate-600">
              {post.content.length}/280 chars
            </div>
          </>
        )}

        {/* Image section */}
        {post.imageUrl ? (
          <div className="space-y-2">
            <img
              src={post.imageUrl}
              alt="Tweet image"
              className="w-40 h-40 object-cover rounded-xl border border-slate-100"
            />
            <button
              onClick={handleRemoveImage}
              className="text-xs text-slate-600 hover:text-red-500 transition-colors"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              size="sm"
              variant="outline"
              disabled={generatingImage}
              onClick={handleGenerateImage}
              className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50 h-7 px-2"
            >
              {generatingImage ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
            {imageError && (
              <p className="text-xs text-red-500">{imageError}</p>
            )}
          </div>
        )}

        {post.status !== "published" && !editing && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
            {hasSubscription ? (
              <Button
                size="sm"
                disabled={publishing}
                onClick={handlePublish}
                className="text-xs bg-slate-900 hover:bg-slate-700 text-white shrink-0"
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
                className="text-xs bg-slate-100 text-slate-600 shrink-0 cursor-not-allowed"
              >
                <Lock className="w-3 h-3 mr-1" />
                Publish
              </Button>
            )}
            <button
              onClick={() => { setEditing(true); setEditContent(post.content) }}
              className="text-xs text-slate-600 hover:text-slate-700 transition-colors ml-auto"
            >
              Edit
            </button>
          </div>
        )}
        {post.status === "published" && post.twitterPostId && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <a
              href={`https://twitter.com/i/web/status/${post.twitterPostId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-700"
            >
              View on X
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

function LinkedInPageContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [companyPagePlan, setCompanyPagePlan] = useState<string | null>(null)
  const [buyingCompanyPlan, setBuyingCompanyPlan] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts")
  const [brief, setBrief] = useState<LinkedInBrief>({
    niche: "",
    tone: "professional",
    goals: "",
    companyName: "",
    targetAudience: "",
    postingFrequency: "daily",
    avoidTopics: "",
    imageStyle: "ai_art",
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
  // Carry-forward: posts the user generated on the landing page (localStorage handoff), shown until they publish.
  const [savedGhostPosts, setSavedGhostPosts] = useState<{ posts: string[]; images: (string | null)[] } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateErrorKind, setGenerateErrorKind] = useState<"ai_busy" | "other" | null>(null)
  const [generateRetryCountdown, setGenerateRetryCountdown] = useState<number | null>(null)
  const [generateTimer, setGenerateTimer] = useState(180)
  const [publishedCollapsed, setPublishedCollapsed] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [planModalTab, setPlanModalTab] = useState<"personal" | "company">("personal")
  const [showOnboarding, setShowOnboarding] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("itgrows_onboarding_done") !== "true" : false
  )
  const [showGuide, setShowGuide] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("itgrows_guide_seen") !== "true" : false
  )
  const [guideStep, setGuideStep] = useState(0)
  const [supportMessage, setSupportMessage] = useState("")
  const [supportTopic, setSupportTopic] = useState("")
  const [supportSending, setSupportSending] = useState(false)
  const [supportSent, setSupportSent] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)

  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)
  const [cancelConfirming, setCancelConfirming] = useState(false)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [cancelAt, setCancelAt] = useState<string | null>(null)
  const [renewingSubscription, setRenewingSubscription] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  // LinkedIn account switcher state
  const [linkedInActiveTab, setLinkedInActiveTab] = useState<LinkedInActiveTab>("personal")
  // selectedLinkedInAccountId: null = personal, UUID = specific company account
  const [selectedLinkedInAccountId, setSelectedLinkedInAccountId] = useState<string | null>(null)
  const [orgsActivating, setOrgsActivating] = useState<Record<string, boolean>>({})
  const [orgsDeactivating, setOrgsDeactivating] = useState<Record<string, boolean>>({})
  const [orgsMessage, setOrgsMessage] = useState<string | null>(null)

  const [activePlatform, setActivePlatform] = useState<ActivePlatform>("linkedin")

  // X (Twitter) state
  const [xAccount, setXAccount] = useState<TwitterAccount | null>(null)
  const [xPersonalAccount, setXPersonalAccount] = useState<TwitterAccount | null>(null)
  const [xCompanyAccount, setXCompanyAccount] = useState<TwitterAccount | null>(null)
  const [xAccountLoading, setXAccountLoading] = useState(false)
  const [xPosts, setXPosts] = useState<TwitterPost[]>([])
  const [xPostsLoading, setXPostsLoading] = useState(false)
  const [xGenerating, setXGenerating] = useState(false)
  const [xGenerateError, setXGenerateError] = useState<string | null>(null)
  const [xGenerateErrorKind, setXGenerateErrorKind] = useState<"ai_busy" | "other" | null>(null)
  const [xGenerateRetryCountdown, setXGenerateRetryCountdown] = useState<number | null>(null)
  const [xGenerateTimer, setXGenerateTimer] = useState(120)
  const [xDisconnecting, setXDisconnecting] = useState<string | null>(null)
  const [xPublishedCollapsed, setXPublishedCollapsed] = useState(false)
  const [xActiveTab, setXActiveTab] = useState<XActiveTab>("posts")
  const [xBrief, setXBrief] = useState<TwitterBrief>({ q1: "", q2: "", q3: "", q4: "", q5: "", avoidTopics: "" })
  const [xBriefLoaded, setXBriefLoaded] = useState(false)
  const [xSavingBrief, setXSavingBrief] = useState(false)
  const [xBriefSaved, setXBriefSaved] = useState(false)
  const [xCompanyBrief, setXCompanyBrief] = useState<TwitterCompanyBrief>({ q1: "", q2: "", q3: "", q4: "", q5: "" })
  const [xCompanyBriefLoaded, setXCompanyBriefLoaded] = useState(false)
  const [xSavingCompanyBrief, setXSavingCompanyBrief] = useState(false)
  const [xCompanyBriefSaved, setXCompanyBriefSaved] = useState(false)
  const [showXOnboarding, setShowXOnboarding] = useState(false)
  const [xOnboardingStep, setXOnboardingStep] = useState(0)
  const [xPostsAccountType, setXPostsAccountType] = useState<"personal" | "company">("personal")

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  async function handleChangePlan(plan: string) {
    setCheckingOut(true)
    setCancelMessage(null)
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { success?: boolean; plan?: string; error?: string }
      if (res.ok && data.success) {
        setSubscriptionPlan(data.plan ?? plan)
        setCancelMessage("Plan changed — the price difference is prorated on your next invoice.")
      } else {
        setCancelMessage(data.error ?? "Could not change plan. Please try again.")
      }
    } catch {
      setCancelMessage("Could not change plan. Please try again.")
    } finally {
      setCheckingOut(false)
    }
  }

  function handlePlanSelect(plan: "personal" | "duo" | "allin" | "personal_annual" | "duo_annual" | "allin_annual") {
    setShowPlanModal(false)
    if (hasActiveSubscription) {
      if (confirm(`Switch to ${planName(plan)}? The price difference is prorated on your next invoice.`)) {
        handleChangePlan(plan)
      }
    } else {
      handleUpgrade(plan)
    }
  }

  async function handleUpgrade(plan: "personal" | "duo" | "allin" | "personal_annual" | "duo_annual" | "allin_annual" | "company" | "company_annual" = "personal") {
    setCheckingOut(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
        setCancelAtPeriodEnd(true)
        if (data.cancelAt) {
          setCancelAt(new Date(data.cancelAt * 1000).toISOString())
        }
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

  async function handleRenewSubscription() {
    setRenewingSubscription(true)
    try {
      const res = await fetch("/api/stripe/renew", { method: "POST" })
      const data = await res.json() as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        setCancelAtPeriodEnd(false)
        setCancelAt(null)
        setCancelMessage(null)
      } else {
        setCancelMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setCancelMessage("Something went wrong. Please try again.")
    } finally {
      setRenewingSubscription(false)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setCancelMessage(data.error ?? "Could not open billing. Please try again.")
        setPortalLoading(false)
      }
    } catch {
      setCancelMessage("Could not open billing. Please try again.")
      setPortalLoading(false)
    }
  }

  async function handleBuyCompanyPlan(tier: "single" | "two" | "unlimited") {
    setBuyingCompanyPlan(true)
    setOrgsMessage("Opening secure checkout — one moment…")
    try {
      const res = await fetch("/api/stripe/company-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setOrgsMessage(data.error ?? "Could not start checkout. Please try again.")
        setBuyingCompanyPlan(false)
      }
    } catch {
      setOrgsMessage("Could not start checkout. Please try again.")
      setBuyingCompanyPlan(false)
    }
  }

  const connected = searchParams.get("connected")
  const error = searchParams.get("error")
  const orgActivated = searchParams.get("org_activated")
  const tabParam = searchParams.get("tab")

  const userName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "there"

  const xConnected = searchParams.get("x_connected")

  useEffect(() => {
    if (tabParam === "companies" || orgActivated) {
      setActivePlatform("linkedin")
      setLinkedInActiveTab("companies")
    }
    if (orgActivated) {
      setOrgsMessage("Company page activated successfully!")
      // Update the org in accounts list
      setAccounts((prev) => prev.map((a) => a.id === orgActivated ? { ...a, isActive: true, subscriptionStatus: "active" } : a))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam, orgActivated])

  useEffect(() => {
    if (xConnected === "1") {
      setActivePlatform("x")
    }
  }, [xConnected])

  // Carry-forward: pull the posts + brief the user generated on the landing page (localStorage handoff).
  // Show the posts until they publish, and pre-fill the Professional DNA so they don't re-enter it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("itgrows_ghost_handoff")
      if (!raw) return
      const h = JSON.parse(raw) as {
        posts?: string[]
        images?: (string | null)[]
        brief?: { niche?: string; targetAudience?: string; tone?: string; goals?: string; companyName?: string }
      }
      if (Array.isArray(h.posts) && h.posts.length > 0) {
        setSavedGhostPosts({ posts: h.posts, images: h.images ?? [] })
      }
      // Only pre-fill the brief before any account/brief exists, so we never clobber a real saved DNA.
      if (h.brief?.niche && accounts.length === 0) {
        setBrief((prev) => ({
          ...prev,
          niche: h.brief!.niche ?? prev.niche,
          targetAudience: h.brief!.targetAudience || prev.targetAudience,
          tone: h.brief!.tone || prev.tone,
          goals: h.brief!.goals || prev.goals,
          companyName: h.brief!.companyName || prev.companyName,
        }))
      }
    } catch { /* malformed handoff — ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        setCancelAtPeriodEnd(data.cancelAtPeriodEnd ?? false)
        setCancelAt(data.cancelAt ?? null)
        setCompanyPagePlan(data.companyPagePlan ?? null)
        if (data.status === "active" || data.status === "trialing" || data.status === "past_due") {
          setSubscriptionPlan(data.plan ?? null)
        }
      })
      .catch(() => {/* non-critical */})
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      // Reset state immediately before loading new account data
      setPosts([])
      setBrief({ niche: "", tone: "professional", goals: "", companyName: "", targetAudience: "", avoidTopics: "", postingFrequency: "daily", imageStyle: "ai_art" })
      fetchBrief(selectedLinkedInAccountId)
      fetchPosts(selectedLinkedInAccountId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length, selectedLinkedInAccountId])

  useEffect(() => {
    const personalAccount = accounts.find((a) => a.pageType === "personal" && a.pageHandle)
    if (personalAccount?.pageHandle && !profileUrl) {
      setProfileUrl(`https://linkedin.com/in/${personalAccount.pageHandle}`)
    }
  }, [accounts, profileUrl])

  useEffect(() => {
    if (!generating) {
      setGenerateTimer(180)
      return
    }
    const interval = setInterval(() => {
      setGenerateTimer((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [generating])

  useEffect(() => {
    if (!xGenerating) {
      setXGenerateTimer(120)
      return
    }
    const interval = setInterval(() => {
      setXGenerateTimer((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [xGenerating])

  // Auto-retry countdown for LinkedIn ai_busy error
  useEffect(() => {
    if (generateRetryCountdown === null) return
    if (generateRetryCountdown <= 0) {
      setGenerateRetryCountdown(null)
      void handleGenerate()
      return
    }
    const t = setTimeout(() => setGenerateRetryCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateRetryCountdown])

  // Auto-retry countdown for X ai_busy error
  useEffect(() => {
    if (xGenerateRetryCountdown === null) return
    if (xGenerateRetryCountdown <= 0) {
      setXGenerateRetryCountdown(null)
      void handleXGenerate()
      return
    }
    const t = setTimeout(() => setXGenerateRetryCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xGenerateRetryCountdown])

  useEffect(() => {
    if (activePlatform === "x") {
      fetchXAccount()
      fetchXPosts()
      fetchXBrief()
      fetchXCompanyBrief()
      if (typeof window !== "undefined" && !localStorage.getItem("x_onboarding_seen")) {
        setShowXOnboarding(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlatform])


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


  function fetchBrief(accountId?: string | null) {
    const url = accountId ? `/api/linkedin/brief?linkedinAccountId=${accountId}` : "/api/linkedin/brief"
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.brief) {
          setBrief({
            niche: data.brief.niche ?? "",
            tone: data.brief.tone ?? "professional",
            goals: data.brief.goals ?? "",
            companyName: data.brief.companyName ?? "",
            targetAudience: data.brief.targetAudience ?? "",
            postingFrequency: data.brief.postingFrequency ?? "daily",
            avoidTopics: data.brief.avoidTopics ?? "",
            imageStyle: data.brief.imageStyle ?? "ai_art",
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
          // No brief yet — reset brief to empty state and auto-fill profile URL from connected account
          setBrief({
            niche: "",
            tone: "professional",
            goals: "",
            companyName: "",
            targetAudience: "",
            postingFrequency: "daily",
            avoidTopics: "",
            imageStyle: "ai_art",
          })
          setBriefIsAutoFilled(false)
          const personalAccount = accounts.find((a) => a.pageType === "personal" && a.pageHandle)
          if (personalAccount?.pageHandle) {
            setProfileUrl(`https://linkedin.com/in/${personalAccount.pageHandle}`)
          }
        }
      })
      .catch(() => {})
  }

  const fetchPosts = useCallback((accountId?: string | null) => {
    setPostsLoading(true)
    const url = accountId ? `/api/linkedin/posts?linkedinAccountId=${accountId}` : "/api/linkedin/posts"
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? [])
        setPostsLoading(false)
      })
      .catch(() => setPostsLoading(false))
  }, [])

  const fetchXAccount = useCallback(() => {
    setXAccountLoading(true)
    fetch("/api/x/account")
      .then((r) => r.json())
      .then((data: { account?: TwitterAccount | null; personalAccount?: TwitterAccount | null; companyAccount?: TwitterAccount | null }) => {
        setXAccount(data.account ?? null)
        setXPersonalAccount(data.personalAccount ?? null)
        setXCompanyAccount(data.companyAccount ?? null)
        setXAccountLoading(false)
      })
      .catch(() => setXAccountLoading(false))
  }, [])

  const fetchXPosts = useCallback(() => {
    setXPostsLoading(true)
    fetch("/api/x/posts")
      .then((r) => r.json())
      .then((data: { posts?: TwitterPost[] }) => {
        setXPosts(data.posts ?? [])
        setXPostsLoading(false)
      })
      .catch(() => setXPostsLoading(false))
  }, [])

  const fetchXBrief = useCallback(() => {
    fetch("/api/x/brief")
      .then((r) => r.json())
      .then((data: { brief?: { content?: string; avoidTopics?: string | null } | null }) => {
        if (data.brief?.content) {
          // Parse content back into individual answers
          const lines = data.brief.content.split("\n\n")
          const answers: TwitterBrief = { q1: "", q2: "", q3: "", q4: "", q5: "", avoidTopics: data.brief.avoidTopics ?? "" }
          lines.forEach((block, i) => {
            const parts = block.split("\n")
            if (parts.length >= 2) {
              const key = `q${i + 1}` as "q1" | "q2" | "q3" | "q4" | "q5"
              answers[key] = parts.slice(1).join("\n").replace(/^\(not provided\)$/, "")
            }
          })
          setXBrief(answers)
        }
        setXBriefLoaded(true)
      })
      .catch(() => setXBriefLoaded(true))
  }, [])

  const fetchXCompanyBrief = useCallback(() => {
    fetch("/api/x/company-brief")
      .then((r) => r.json())
      .then((data: { brief?: { content?: string } | null }) => {
        if (data.brief?.content) {
          const lines = data.brief.content.split("\n\n")
          const answers: TwitterCompanyBrief = { q1: "", q2: "", q3: "", q4: "", q5: "" }
          lines.forEach((block, i) => {
            const parts = block.split("\n")
            if (parts.length >= 2) {
              const key = `q${i + 1}` as keyof TwitterCompanyBrief
              answers[key] = parts.slice(1).join("\n").replace(/^\(not provided\)$/, "")
            }
          })
          setXCompanyBrief(answers)
        }
        setXCompanyBriefLoaded(true)
      })
      .catch(() => setXCompanyBriefLoaded(true))
  }, [])

  function handleXImageUpdate(postId: string, imageUrl: string | null) {
    setXPosts((prev) => prev.map((p) => p.id === postId ? { ...p, imageUrl } : p))
  }

  function handleXContentUpdate(postId: string, content: string) {
    setXPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content } : p))
  }

  async function handleXSaveBrief() {
    setXSavingBrief(true)
    try {
      await fetch("/api/x/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: xBrief, avoidTopics: xBrief.avoidTopics ?? "" }),
      })
      setXBriefSaved(true)
      setTimeout(() => setXBriefSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setXSavingBrief(false)
    }
  }

  async function handleDisconnect(id?: string) {
    setDisconnecting(id ?? "all")
    const url = id ? `/api/linkedin/disconnect?id=${id}` : "/api/linkedin/disconnect"
    await fetch(url, { method: "DELETE" })
    setAccounts((prev) => (id ? prev.filter((a) => a.id !== id) : []))
    setDisconnecting(null)
  }

  async function handleActivateOrg(orgId: string) {
    setOrgsActivating((prev) => ({ ...prev, [orgId]: true }))
    setOrgsMessage("Opening secure checkout — one moment…")
    try {
      const res = await fetch("/api/linkedin/organizations/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setOrgsMessage(data.error ?? "Something went wrong. Please try again.")
        setOrgsActivating((prev) => ({ ...prev, [orgId]: false }))
      }
    } catch {
      setOrgsMessage("Something went wrong. Please try again.")
      setOrgsActivating((prev) => ({ ...prev, [orgId]: false }))
    }
  }

  async function handleDeactivateOrg(orgId: string) {
    if (!confirm("Cancel this company page subscription? You'll lose access at the end of the billing period.")) return
    setOrgsDeactivating((prev) => ({ ...prev, [orgId]: true }))
    setOrgsMessage(null)
    try {
      const res = await fetch("/api/linkedin/organizations/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }
      if (res.ok && data.success) {
        setOrgsMessage(data.message ?? "Subscription will be cancelled at end of billing period.")
        setAccounts((prev) => prev.map((a) => a.id === orgId ? { ...a, subscriptionStatus: "canceling" } : a))
      } else {
        setOrgsMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setOrgsMessage("Something went wrong. Please try again.")
    } finally {
      setOrgsDeactivating((prev) => ({ ...prev, [orgId]: false }))
    }
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
      body: JSON.stringify({
        ...brief,
        profileUrl: profileUrl || undefined,
        ...(selectedLinkedInAccountId ? { linkedinAccountId: selectedLinkedInAccountId } : {}),
      }),
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
        setBrief((prev) => ({
          niche: b.niche ?? "",
          tone: b.tone ?? "professional",
          goals: b.goals ?? "",
          companyName: b.companyName ?? "",
          targetAudience: b.targetAudience ?? "",
          postingFrequency: b.postingFrequency ?? "daily",
          avoidTopics: prev.avoidTopics ?? "",
          imageStyle: prev.imageStyle ?? "ai_art",
        }))
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
    setGenerateErrorKind(null)
    setGenerateRetryCountdown(null)
    setPosts([]) // clear immediately so we don't show stale posts from another account
    try {
      const res = await fetch("/api/linkedin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          ...(selectedLinkedInAccountId ? { linkedinAccountId: selectedLinkedInAccountId } : {}),
        }),
      })
      if (res.status === 429) {
        const data = await res.json() as { message?: string }
        setGenerateErrorKind("other")
        setGenerateError(data.message ?? "Too many requests. Please wait before generating again.")
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string; retryAfter?: number }
        if (res.status === 403 && data.error === "subscription_required") {
          // Free first generation already used → prompt to start the trial to keep going.
          setShowPlanModal(true)
          return
        }
        if (data.error === "ai_busy") {
          setGenerateErrorKind("ai_busy")
          setGenerateError(null)
          setGenerateRetryCountdown(data.retryAfter ?? 30)
        } else {
          setGenerateErrorKind("other")
          setGenerateError(data.message ?? data.error ?? "Generation failed. Please try again.")
        }
        return
      }
      const data = await res.json() as { posts?: LinkedInPost[] }
      fetchPosts(selectedLinkedInAccountId)
      void data
    } catch (err) {
      setGenerateErrorKind("other")
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
            ? { ...p, status: "failed", publishError: "Subscribe to publish — open Settings to choose a plan." }
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

  async function handleXDisconnect(type?: "personal" | "company") {
    const key = type ?? "all"
    setXDisconnecting(key)
    const url = type ? `/api/x/disconnect?type=${type}` : "/api/x/disconnect"
    await fetch(url, { method: "POST" })
    if (type === "personal") {
      setXPersonalAccount(null)
      setXAccount(xCompanyAccount)
    } else if (type === "company") {
      setXCompanyAccount(null)
    } else {
      setXAccount(null)
      setXPersonalAccount(null)
      setXCompanyAccount(null)
      setXPosts([])
    }
    setXDisconnecting(null)
  }

  async function handleXSaveCompanyBrief() {
    setXSavingCompanyBrief(true)
    try {
      await fetch("/api/x/company-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: xCompanyBrief }),
      })
      setXCompanyBriefSaved(true)
      setTimeout(() => setXCompanyBriefSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setXSavingCompanyBrief(false)
    }
  }

  async function handleXGenerate() {
    setXGenerating(true)
    setXGenerateError(null)
    setXGenerateErrorKind(null)
    setXGenerateRetryCountdown(null)
    try {
      const res = await fetch("/api/x/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string; retryAfter?: number }
        if (data.error === "ai_busy") {
          setXGenerateErrorKind("ai_busy")
          setXGenerateError(null)
          setXGenerateRetryCountdown(data.retryAfter ?? 30)
        } else {
          setXGenerateErrorKind("other")
          setXGenerateError(data.message ?? data.error ?? "Generation failed. Please try again.")
        }
        return
      }
      fetchXPosts()
    } catch (err) {
      setXGenerateErrorKind("other")
      setXGenerateError(err instanceof Error ? err.message : "Network error")
    } finally {
      setXGenerating(false)
    }
  }

  async function handleXPublishPost(postId: string) {
    const res = await fetch("/api/x/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
    const data = await res.json() as { success?: boolean; error?: string; twitterPostId?: string; imageSkipped?: boolean }
    if (res.ok) {
      setXPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: "published", publishedAt: new Date().toISOString(), twitterPostId: data.twitterPostId ?? null, errorMessage: null }
            : p
        )
      )
      setXPublishedCollapsed(false)
      if (data.imageSkipped) {
        setStatusMessage("Tweet published — the image couldn't be attached yet (X image publishing is coming soon).")
      }
    } else if (res.status === 400 && data.error === "Post already published") {
      // Post was published by cron while page was open — just update local state
      setXPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: "published", errorMessage: null } : p
        )
      )
      setXPublishedCollapsed(false)
    } else {
      setXPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: "failed", errorMessage: data.error ?? "Unknown error" } : p
        )
      )
    }
  }

  const isConnected = accounts.length > 0
  const xIsConnected = xAccount !== null
  const xBothAccountsConnected = !!(xPersonalAccount && xCompanyAccount)
  const xFilteredPosts = xBothAccountsConnected ? xPosts.filter((p) => p.accountType === xPostsAccountType) : xPosts
  const xActivePosts = xFilteredPosts.filter((p) => p.status !== "published").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const xPublishedPosts = xFilteredPosts.filter((p) => p.status === "published")

  // Paid Stripe subscription (any plan) or Stripe trialing
  const hasActiveSubscription = (subscriptionStatus === "active" || subscriptionStatus === "past_due" || subscriptionStatus === "trialing") &&
    !!subscriptionPlan

  // Legacy no-card free trial — only active if user hasn't paid yet
  const trialActive = !!(trialEndsAt && new Date(trialEndsAt) > new Date() && !hasActiveSubscription)
  const trialExpired = !!(trialEndsAt && new Date(trialEndsAt) <= new Date() && !hasActiveSubscription)

  const hasPersonalPlan = hasActiveSubscription || trialActive

  // Account slots by plan
  const accountSlots = (() => {
    if (!hasPersonalPlan) return 0
    // All-in: LinkedIn + X personal + X company
    if (subscriptionPlan === "allin" || subscriptionPlan === "allin_annual") return 3
    // Duo: any 2 accounts
    if (subscriptionPlan === "duo" || subscriptionPlan === "duo_annual") return 2
    // Stripe trialing — give slots based on the plan they signed up for
    if (subscriptionStatus === "trialing") {
      if (subscriptionPlan === "allin" || subscriptionPlan === "allin_annual") return 3
      if (subscriptionPlan === "duo" || subscriptionPlan === "duo_annual") return 2
      return 1
    }
    // Personal / company / annual variants
    return 1
  })()

  // Posts per batch for generate button
  const postsPerWeek = 14

  // Count currently connected accounts (LinkedIn counts as 1 regardless of pageType)
  const connectedAccountCount = (accounts.length > 0 ? 1 : 0) + (xPersonalAccount ? 1 : 0) + (xCompanyAccount ? 1 : 0)
  const canConnectMore = hasPersonalPlan && connectedAccountCount < accountSlots
  const upgradeNeeded = hasPersonalPlan && connectedAccountCount >= accountSlots
  // A company-pages plan ($99/$149/$299) is a standalone bundle that includes the company's X
  // account too, so company X can be connected on a company plan regardless of personal-plan slots.
  const hasCompanyPlan = !!companyPagePlan

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
      {/* Plan selection modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:rounded-3xl shadow-2xl overflow-y-auto" style={{ maxHeight: "95vh", maxWidth: "900px" }}>
            {/* Header */}
            <div className="relative px-6 pt-8 pb-6 text-center border-b border-slate-100">
              <button onClick={() => setShowPlanModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 text-lg font-semibold transition-colors">×</button>
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold rounded-full px-3 py-1 mb-3">
                🎉 14-DAY FREE TRIAL
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Start growing on autopilot</h2>
              <p className="text-slate-600 text-sm">AI writes and schedules your posts every day. Cancel anytime.</p>
              {/* Personal / Company toggle */}
              <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-2xl bg-slate-100">
                <button
                  onClick={() => setPlanModalTab("personal")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${planModalTab === "personal" ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                >Personal plans</button>
                <button
                  onClick={() => setPlanModalTab("company")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${planModalTab === "company" ? "bg-[#0077B5] text-white shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                >Company pages</button>
              </div>
              {/* Billing toggle — personal plans only */}
              {planModalTab === "personal" && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-800"}`}
                  >Monthly</button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${billingCycle === "annual" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-800"}`}
                  >
                    Annual
                    <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${billingCycle === "annual" ? "bg-green-400 text-slate-900" : "bg-green-100 text-green-700"}`}>-30%</span>
                  </button>
                </div>
              )}
            </div>

            {/* Value props */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-5 bg-slate-50 border-b border-slate-100">
              {[
                { icon: "✍️", label: "AI writes posts", desc: "Personalized to your voice" },
                { icon: "📅", label: "Auto-scheduled", desc: "1 post published per day" },
                { icon: "🖼️", label: "Custom images", desc: "AI-generated visuals" },
                { icon: "🔗", label: "LinkedIn + X", desc: "Grow on both platforms" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-slate-100">
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              {planModalTab === "personal" ? (
              <>
              {/* Personal */}
              <button
                onClick={() => handlePlanSelect(billingCycle === "annual" ? "personal_annual" : "personal")}
                disabled={checkingOut}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:shadow-md transition-all text-left disabled:opacity-70"
              >
                <span className="text-xs font-bold text-violet-600 bg-violet-100 rounded-full px-3 py-1 mb-4">Personal</span>
                <div className="mb-1">
                  {billingCycle === "annual" ? (
                    <>
                      <span className="text-4xl font-black text-slate-900">$34</span>
                      <span className="text-slate-600 text-sm font-normal">/mo</span>
                      <span className="ml-2 text-xs text-green-600 font-semibold">$411/yr</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-slate-900">$49</span>
                      <span className="text-slate-600 text-sm font-normal">/month</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-4">{billingCycle === "annual" ? "billed annually" : "billed monthly"}</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">1 platform of your choice</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> LinkedIn or X</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Daily posts · 1 per day, ongoing</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Auto-scheduling</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> AI-generated images</li>
                </ul>
                <div className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {checkingOut ? "Loading..." : "Subscribe →"}
                </div>
              </button>

              {/* Duo */}
              <button
                onClick={() => handlePlanSelect(billingCycle === "annual" ? "duo_annual" : "duo")}
                disabled={checkingOut}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-violet-500 shadow-lg shadow-violet-100 hover:shadow-violet-200 transition-all text-left disabled:opacity-70 relative"
                style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" }}
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-[11px] font-black rounded-full px-4 py-1 whitespace-nowrap">MOST POPULAR</div>
                <span className="text-xs font-bold text-violet-700 bg-violet-200 rounded-full px-3 py-1 mb-4">Duo</span>
                <div className="mb-1">
                  {billingCycle === "annual" ? (
                    <>
                      <span className="text-4xl font-black text-slate-900">$69</span>
                      <span className="text-slate-600 text-sm font-normal">/mo</span>
                      <span className="ml-2 text-xs text-green-600 font-semibold">$831/yr</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-slate-900">$99</span>
                      <span className="text-slate-600 text-sm font-normal">/month</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-4">{billingCycle === "annual" ? "billed annually" : "billed monthly"}</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">LinkedIn + X together</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> LinkedIn <span className="font-bold text-violet-600">+</span> X — both</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Daily posts on both — 1 per day each</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Auto-scheduling</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> AI-generated images</li>
                </ul>
                <div className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {checkingOut ? "Loading..." : "Subscribe →"}
                </div>
              </button>

              {/* All-in */}
              <button
                onClick={() => handlePlanSelect(billingCycle === "annual" ? "allin_annual" : "allin")}
                disabled={checkingOut}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:shadow-md transition-all text-left disabled:opacity-70 bg-white"
              >
                <span className="text-xs font-bold text-violet-700 bg-violet-100 rounded-full px-3 py-1 mb-4">All-in</span>
                <div className="mb-1">
                  {billingCycle === "annual" ? (
                    <>
                      <span className="text-4xl font-black text-slate-900">$139</span>
                      <span className="text-slate-600 text-sm font-normal">/mo</span>
                      <span className="ml-2 text-xs text-green-600 font-semibold">$1,671/yr</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-slate-900">$199</span>
                      <span className="text-slate-600 text-sm font-normal">/month</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-4">{billingCycle === "annual" ? "billed annually" : "billed monthly"}</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">Personal + Company growth</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> LinkedIn + Company Page + X + Company X</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Daily posts on every account — 1 per day each</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Auto-scheduling</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> AI-generated images</li>
                </ul>
                <div className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {checkingOut ? "Loading..." : "Subscribe →"}
                </div>
              </button>

              </>
              ) : (
              <>
              {/* Company pages — Single */}
              <button
                onClick={() => { setShowPlanModal(false); handleBuyCompanyPlan("single") }}
                disabled={buyingCompanyPlan}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-slate-200 hover:border-[#0077B5] hover:shadow-md transition-all text-left disabled:opacity-70 bg-white"
              >
                <span className="text-xs font-bold text-[#0077B5] bg-blue-50 rounded-full px-3 py-1 mb-4">Single</span>
                <div className="mb-1"><span className="text-4xl font-black text-slate-900">$99</span><span className="text-slate-600 text-sm font-normal">/month</span></div>
                <p className="text-xs text-slate-600 mb-4">billed monthly</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">1 company · LinkedIn Page + X</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> LinkedIn Company Page + X account, automated</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Approved by LinkedIn API</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Company voice &amp; tone</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Autopublish</li>
                </ul>
                <div className="w-full bg-[#0077B5] hover:bg-[#005f8e] text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {buyingCompanyPlan ? "Loading..." : "Subscribe →"}
                </div>
              </button>
              {/* Company pages — Two */}
              <button
                onClick={() => { setShowPlanModal(false); handleBuyCompanyPlan("two") }}
                disabled={buyingCompanyPlan}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-[#0077B5] shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all text-left disabled:opacity-70 relative bg-white"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0077B5] text-white text-[11px] font-black rounded-full px-4 py-1 whitespace-nowrap">BEST VALUE</div>
                <span className="text-xs font-bold text-[#0077B5] bg-blue-50 rounded-full px-3 py-1 mb-4">Two pages</span>
                <div className="mb-1"><span className="text-4xl font-black text-slate-900">$149</span><span className="text-slate-600 text-sm font-normal">/month</span></div>
                <p className="text-xs text-slate-600 mb-4">billed monthly</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">2 companies · LinkedIn Page + X each</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> 2 × (LinkedIn Page + X) — saves vs 2× Single</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Approved by LinkedIn API</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Company voice &amp; tone</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Autopublish</li>
                </ul>
                <div className="w-full bg-[#0077B5] hover:bg-[#005f8e] text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {buyingCompanyPlan ? "Loading..." : "Subscribe →"}
                </div>
              </button>
              {/* Company pages — Unlimited */}
              <button
                onClick={() => { setShowPlanModal(false); handleBuyCompanyPlan("unlimited") }}
                disabled={buyingCompanyPlan}
                className="flex flex-col items-start p-6 rounded-2xl border-2 border-slate-200 hover:border-[#0077B5] hover:shadow-md transition-all text-left disabled:opacity-70 bg-white"
              >
                <span className="text-xs font-bold text-[#0077B5] bg-blue-50 rounded-full px-3 py-1 mb-4">Unlimited</span>
                <div className="mb-1"><span className="text-4xl font-black text-slate-900">$299</span><span className="text-slate-600 text-sm font-normal">/month</span></div>
                <p className="text-xs text-slate-600 mb-4">billed monthly</p>
                <p className="text-sm font-semibold text-slate-700 mb-3">Unlimited companies · LinkedIn Page + X</p>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Any number of companies (LinkedIn Page + X each)</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Approved by LinkedIn API</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Company voice &amp; tone</li>
                  <li className="flex items-center gap-2"><span className="text-[#0077B5] font-bold">✓</span> Autopublish</li>
                </ul>
                <div className="w-full bg-[#0077B5] hover:bg-[#005f8e] text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                  {buyingCompanyPlan ? "Loading..." : "Subscribe →"}
                </div>
              </button>
              </>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-600 pb-6">Subscribe to continue after your free trial · Cancel anytime · Secure checkout via Stripe</p>
          </div>
        </div>
      )}

      {/* Onboarding guide modal */}
      {showGuide && (() => {
        const steps = [
          {
            icon: "👋",
            title: "Welcome to ItGrows.ai",
            subtitle: "Your LinkedIn & X — personal and company, on autopilot",
            body: "ItGrows writes, schedules, and publishes posts for you every day — in your voice, on your topics. Run your personal profiles and your company pages from one place. Set it up once, and it runs.",
            visual: (
              <div className="flex justify-center gap-3 mt-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.977 1.977 0 0 1-1.972-1.98 1.977 1.977 0 0 1 1.972-1.979 1.977 1.977 0 0 1 1.972 1.979 1.977 1.977 0 0 1-1.972 1.98zm1.99 13.019H3.347V9h3.98v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <span className="text-xs text-slate-600">LinkedIn</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-xs text-slate-600">X (Twitter)</span>
                </div>
              </div>
            ),
          },
          {
            icon: "🗂️",
            title: "One workspace, every channel",
            subtitle: "Personal + company, LinkedIn + X",
            body: "Manage all your channels side by side — each with its own voice. Your personal brand and your company's presence stay fully separated, never mixed. Company pages are managed under \"Company Pages\"; your X personal and company accounts each have their own setup.",
            visual: (
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                {[
                  { tag: "LinkedIn", sub: "Personal profile", color: "bg-blue-600" },
                  { tag: "LinkedIn", sub: "Company Pages", color: "bg-[#0077B5]" },
                  { tag: "X (Twitter)", sub: "Personal account", color: "bg-slate-900" },
                  { tag: "X (Twitter)", sub: "Company account", color: "bg-slate-500" },
                ].map((c) => (
                  <div key={c.tag + c.sub} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{c.tag}</p>
                      <p className="text-xs text-slate-600 leading-tight truncate">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            icon: "🧬",
            title: "Step 1: Fill your DNA",
            subtitle: "Tell us who you are",
            body: "Your Professional DNA is the foundation. Describe your niche, tone, goals, and audience. Each channel gets its own DNA — a personal voice for you, a brand voice for every company page and account — so nothing sounds generic or mixed up.",
            visual: (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 text-left space-y-2">
                {[
                  { label: "Niche", value: "SaaS founder, B2B sales" },
                  { label: "Tone", value: "Direct, no fluff" },
                  { label: "Goals", value: "Build personal brand, attract investors" },
                ].map((row) => (
                  <div key={row.label} className="flex gap-2 text-sm">
                    <span className="text-slate-600 w-16 shrink-0">{row.label}</span>
                    <span className="text-slate-700 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            icon: "⚡",
            title: "Step 2: Generate posts",
            subtitle: "Two weeks of posts in one click",
            body: "Hit Generate and AI writes your first two weeks of posts — one per day, each unique, on-brand, and ready to publish. You can edit any post before it goes live. After that, new posts keep coming daily on autopilot.",
            visual: (
              <div className="mt-4 flex flex-col gap-2">
                {["Day 1 · Thought leadership post", "Day 2 · Personal story", "Day 3 · Industry insight"].map((label, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-semibold rounded-full px-2 py-0.5">Ready</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            icon: "📅",
            title: "Step 3: Publish on autopilot",
            subtitle: "1 post per day, automatically",
            body: "Your posts are scheduled and published automatically — 1 per day per channel, every day. No manual work. Your profiles and company pages stay active while you focus on what matters.",
            visual: (
              <div className="mt-4 bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-[10px] text-slate-600 font-semibold mb-1">{d}</div>
                  ))}
                  {[true, true, true, false, true, false, false, true, true, false, true, true, false, false].map((posted, i) => (
                    <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${posted ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
                      {posted ? "✓" : "·"}
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            icon: "🚀",
            title: "You're ready to grow",
            subtitle: "Start your 14-day free trial",
            body: "Connect your account, fill your DNA, and generate your first posts. Your audience is waiting.",
            visual: (
              <div className="mt-4 flex flex-col gap-3">
                {[
                  { num: "1", text: "Connect a personal profile or company page", done: false },
                  { num: "2", text: "Fill the DNA for each channel", done: false },
                  { num: "3", text: "Generate posts & let it publish", done: false },
                ].map((item) => (
                  <div key={item.num} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <span className="w-7 h-7 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{item.num}</span>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            ),
          },
        ]
        const step = steps[guideStep]
        const isLast = guideStep === steps.length - 1
        const dismissGuide = () => {
          localStorage.setItem("itgrows_guide_seen", "true")
          setShowGuide(false)
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-slate-100">
                <div
                  className="h-1 bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${((guideStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="p-8">
                {/* Step counter */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs text-slate-600 font-semibold">{guideStep + 1} / {steps.length}</span>
                  <button onClick={dismissGuide} className="text-xs text-slate-600 hover:text-slate-600 transition-colors">Skip tour</button>
                </div>

                {/* Icon + title */}
                <div className="text-center">
                  <div className="text-5xl mb-3">{step.icon}</div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{step.title}</h2>
                  <p className="text-sm font-semibold text-violet-600 mb-4">{step.subtitle}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                </div>

                {/* Visual */}
                {step.visual}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setGuideStep((s) => Math.max(0, s - 1))}
                    className={`text-sm text-slate-600 hover:text-slate-600 transition-colors ${guideStep === 0 ? "invisible" : ""}`}
                  >← Back</button>
                  <div className="flex gap-1">
                    {steps.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === guideStep ? "bg-violet-600" : "bg-slate-200"}`} />
                    ))}
                  </div>
                  {isLast ? (
                    <button
                      onClick={dismissGuide}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
                    >Let&apos;s go →</button>
                  ) : (
                    <button
                      onClick={() => setGuideStep((s) => s + 1)}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
                    >Next →</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      {/* Left sidebar — hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-100 shadow-sm z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </a>
        </div>

        {/* Social Media section */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Social Media</p>
          {/* LinkedIn — Personal */}
          <button
            onClick={() => {
              setActivePlatform("linkedin")
              setLinkedInActiveTab("personal")
              setSelectedLinkedInAccountId(null)
              setActiveTab("posts")
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
              activePlatform === "linkedin" && linkedInActiveTab === "personal" && !selectedLinkedInAccountId && activeTab !== "account" && activeTab !== "support"
                ? "bg-violet-600 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-violet-700"
            }`}
          >
            <LinkedInIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">LinkedIn — Personal</span>
          </button>

          {/* LinkedIn — Company Pages (clearly separated from personal) */}
          <div className="mt-3 mb-1">
            <div className="flex items-center justify-between pl-3 pr-2 mb-1">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Company Pages</p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/linkedin/sync-pages", { method: "POST" })
                    const data = await res.json() as { added?: number; updated?: number; error?: string }
                    if (data.error) { alert("Sync failed: " + data.error); return }
                    alert(`Sync complete: ${data.added ?? 0} new page(s) added, ${data.updated ?? 0} updated.`)
                    window.location.reload()
                  } catch { alert("Sync failed") }
                }}
                title="Sync new pages from LinkedIn"
                aria-label="Sync new pages from LinkedIn"
                className="text-slate-600 hover:text-[#0077B5] p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
              </button>
            </div>
            {accounts.filter((a) => a.pageType === "organization" && a.isActive).map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActivePlatform("linkedin")
                  setLinkedInActiveTab("personal")
                  setSelectedLinkedInAccountId(org.id)
                  setActiveTab("posts")
                }}
                className={`w-full flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-xl mb-0.5 transition-colors ${
                  activePlatform === "linkedin" && linkedInActiveTab === "personal" && selectedLinkedInAccountId === org.id && activeTab !== "account" && activeTab !== "support"
                    ? "bg-blue-50 text-[#0077B5] font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0077B5]"
                }`}
              >
                <LinkedInIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs truncate">{org.pageName ?? org.pageHandle ?? "Company"}</span>
              </button>
            ))}
            <button
              onClick={() => { setActivePlatform("linkedin"); setLinkedInActiveTab("companies"); setActiveTab("posts") }}
              className={`w-full flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-xl mb-1 transition-colors ${
                activePlatform === "linkedin" && linkedInActiveTab === "companies" && activeTab !== "account" && activeTab !== "support"
                  ? "bg-blue-50 text-[#0077B5] font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0077B5]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h8v-2H3v2zm16-7.74L23.59 13 19 17.74V14h-2v-2h2V8.26z"/></svg>
              <span className="text-xs">Manage pages</span>
            </button>
          </div>

          {/* Twitter/X */}
          <button
            onClick={() => { setActivePlatform("x"); setActiveTab("posts") }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
              activePlatform === "x" && activeTab !== "account" && activeTab !== "support"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <XIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">X (Twitter)</span>
          </button>
        </div>

        {/* Account section */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Account</p>
          <button
            onClick={() => { setGuideStep(0); setShowGuide(true) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors mb-1"
          >
            <span className="text-base leading-none">✨</span>
            <span className="text-sm">How it works</span>
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-1 ${activeTab === "account" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-violet-700"}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-1 ${activeTab === "support" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-violet-700"}`}
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
              <p className="text-[11px] text-slate-600 truncate mb-1">{session?.user?.email}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                hasPersonalPlan
                  ? "bg-violet-100 text-violet-600"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {subscriptionPlan === "allin" ? "All-in" : subscriptionPlan === "duo" ? "Duo" : subscriptionPlan === "personal_annual" ? "Personal Annual" : hasPersonalPlan ? "Personal" : "Free"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header — visible only on mobile (< lg) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-100 shadow-sm" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <div className="px-4 py-2 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
            <span className="text-base font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </a>
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]">{session?.user?.email}</p>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              hasPersonalPlan ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-600"
            }`}>
              {subscriptionPlan === "allin" ? "All-in" : subscriptionPlan === "duo" ? "Duo" : subscriptionPlan === "personal_annual" ? "Annual" : hasPersonalPlan ? "Personal" : "Free"}
            </span>
          </div>
        </div>
        {/* Mobile platform switcher */}
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setActivePlatform("linkedin"); setLinkedInActiveTab("personal"); setSelectedLinkedInAccountId(null); setActiveTab("posts") }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activePlatform === "linkedin" && linkedInActiveTab === "personal" && !selectedLinkedInAccountId && activeTab !== "account" && activeTab !== "support" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            <LinkedInIcon className="w-3.5 h-3.5" /> LinkedIn
          </button>
          <button
            onClick={() => { setActivePlatform("linkedin"); setLinkedInActiveTab("companies"); setActiveTab("posts") }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activePlatform === "linkedin" && linkedInActiveTab === "companies" && activeTab !== "account" && activeTab !== "support" ? "bg-[#0077B5] text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Company Pages
          </button>
          <button
            onClick={() => { setActivePlatform("x"); setActiveTab("posts") }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activePlatform === "x" && activeTab !== "account" && activeTab !== "support" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            <XIcon className="w-3.5 h-3.5" /> X
          </button>
        </div>
      </div>

      {/* Mobile bottom nav — visible only on mobile (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100 shadow-lg flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {(["posts", "dna", "account", "support"] as ActiveTab[]).map((tab) => {
          const icons: Record<ActiveTab, React.ReactNode> = {
            posts: <Send className="w-5 h-5" />,
            dna: <Zap className="w-5 h-5" />,
            account: <Settings className="w-5 h-5" />,
            support: <MessageCircle className="w-5 h-5" />,
            companies: <LinkedInIcon className="w-5 h-5" />,
          }
          const labels: Record<ActiveTab, string> = {
            posts: "Posts",
            dna: "DNA",
            account: "Account",
            support: "Support",
            companies: "Companies",
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                activeTab === tab ? "text-violet-600" : "text-slate-600"
              }`}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          )
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-slate-600"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-8 pb-28 lg:pb-8" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" } as React.CSSProperties}>

          {/* Greeting */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1b1916] mb-1">
              {greeting}, {userName} 👋
            </h1>
            {activePlatform === "x" ? (
              xIsConnected ? (
                <p className="text-sm font-semibold text-slate-700">
                  {xPersonalAccount ? `✦ @${xPersonalAccount.username}` : ""}{xPersonalAccount && xCompanyAccount ? " · " : ""}{xCompanyAccount ? `@${xCompanyAccount.username} (co.)` : ""}
                </p>
              ) : (
                <p className="text-slate-600 text-sm">Connect X (Twitter) to get started</p>
              )
            ) : isConnected ? (
              <p className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                ✦ Your LinkedIn is on autopilot
              </p>
            ) : (
              <p className="text-slate-600 text-sm">Connect LinkedIn to get started</p>
            )}
          </div>

          {/* Carry-forward: posts generated on the landing page, waiting to be published */}
          {savedGhostPosts && posts.length === 0 && (
            <div className="mb-4 sm:mb-6 rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-violet-50 to-pink-50 border-b border-violet-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b1916]">Your posts are ready 🎉</p>
                    <p className="text-xs text-slate-600 mt-0.5">We saved the {savedGhostPosts.posts.length} posts you generated. {isConnected ? "Generate your full schedule free — publish when you're ready." : "Connect LinkedIn to generate your full schedule free — you only add a card to publish on autopilot."}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSavedGhostPosts(null); try { localStorage.removeItem("itgrows_ghost_handoff") } catch {} }}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                {savedGhostPosts.posts.slice(0, 3).map((post, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden">
                    {savedGhostPosts.images[i] && (
                      <img src={savedGhostPosts.images[i]!} alt="Post cover" className="w-full h-36 object-cover" />
                    )}
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed p-4 line-clamp-4">{post}</p>
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (!isConnected) { window.location.href = "/api/linkedin/connect?type=personal"; return }
                    void handleGenerate()
                  }}
                  disabled={checkingOut || generating}
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70"
                >
                  {generating ? "Generating…" : isConnected ? "Generate my full schedule — free →" : "Connect LinkedIn to publish these →"}
                </button>
              </div>
            </div>
          )}

          {/* Upgrade banner — no plan, no trial */}
          {!hasPersonalPlan && !trialExpired && !loading && (
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl px-4 sm:px-5 py-4 text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Try Free for 14 Days</p>
                  <p className="text-xs text-white/75 mt-0.5">AI posts, custom images, auto-scheduling · connect LinkedIn or X to start</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                disabled={checkingOut}
                className="shrink-0 bg-white text-violet-700 font-semibold text-xs rounded-xl px-4 py-2 hover:bg-violet-50 transition-colors disabled:opacity-70 self-start sm:self-auto"
              >
                {checkingOut ? "Loading..." : "Start Free Trial →"}
              </button>
            </div>
          )}

          {/* Trial expired banner — show subscribe CTA */}
          {trialExpired && !hasActiveSubscription && !loading && (
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl px-4 sm:px-5 py-4 border border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Your trial has ended. Subscribe to keep publishing your LinkedIn posts.</p>
                  <p className="text-xs text-red-600 mt-0.5">Your posts are preserved — subscribe to generate and publish again</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl px-4 py-2 transition-colors self-start sm:self-auto"
              >
                Subscribe Now →
              </button>
            </div>
          )}

          {/* Trial countdown banner */}
          {(trialActive || subscriptionStatus === "trialing") && trialDaysLeft !== null && (
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl px-4 sm:px-5 py-3.5 border border-amber-200 bg-amber-50">
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
                onClick={() => setShowPlanModal(true)}
                disabled={checkingOut}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl px-4 py-2 transition-colors disabled:opacity-70 self-start sm:self-auto"
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

          {/* ===================== COMPANY PAGES PANEL ===================== */}
          {activePlatform === "linkedin" && linkedInActiveTab === "companies" && activeTab !== "account" && activeTab !== "support" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0077B5] flex items-center justify-center shrink-0">
                    <LinkedInIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-800">Company Pages</p>
                    <p className="text-xs text-slate-600">Manage LinkedIn company pages</p>
                  </div>
                </div>

                {orgsMessage && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {orgsMessage}
                  </div>
                )}

                {/* Company-page plan & quota */}
                {(() => {
                  const planQuota = companyPagePlan === "unlimited" ? Infinity : companyPagePlan === "two" ? 2 : companyPagePlan === "single" ? 1 : 0
                  const allInBonus = (subscriptionStatus === "active" || subscriptionStatus === "trialing") && (subscriptionPlan === "allin" || subscriptionPlan === "allin_annual") ? 1 : 0
                  const totalQuota = planQuota + allInBonus
                  const usedPages = accounts.filter((a) => a.pageType === "organization" && a.isActive).length
                  const planLabel = companyPagePlan === "unlimited" ? "Unlimited" : companyPagePlan === "two" ? "Two pages" : companyPagePlan === "single" ? "Single" : null
                  const overage = totalQuota !== Infinity && usedPages > totalQuota ? usedPages - totalQuota : 0
                  return (
                    <div className="mb-5 p-5 rounded-2xl bg-white border-2 border-violet-200">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-base font-bold text-slate-900">Company-page plan</p>
                        <span className="text-xs font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
                          {planLabel ?? (allInBonus ? "All-in · 1 included" : "No plan")}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {totalQuota === Infinity
                          ? `${usedPages} ${usedPages === 1 ? "page" : "pages"} active · unlimited included`
                          : overage > 0
                            ? `${usedPages} active · ${totalQuota} included with your plan, ${overage} billed at $99/mo`
                            : `${usedPages} of ${totalQuota} included ${totalQuota === 1 ? "page" : "pages"} active`}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 mb-4">Pick a plan below, then activate the pages you want in the list — activation is free within your plan.</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {([["single", "Single", "$99", "1 page"], ["two", "Two", "$149", "2 pages"], ["unlimited", "Unlimited", "$299", "Unlimited"]] as const).map(([tier, name, price, sub]) => (
                          <button
                            key={tier}
                            onClick={() => handleBuyCompanyPlan(tier)}
                            disabled={buyingCompanyPlan || companyPagePlan === tier}
                            className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border-2 text-center transition-colors disabled:cursor-default ${companyPagePlan === tier ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50"}`}
                          >
                            <span className="text-sm font-bold text-slate-900">{name}</span>
                            <span className="text-lg text-violet-700 font-extrabold leading-tight">{price}<span className="text-xs font-semibold text-slate-600">/mo</span></span>
                            <span className="text-xs font-semibold text-slate-600">{buyingCompanyPlan ? "Opening…" : companyPagePlan === tier ? "✓ Current" : sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {accountsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0077B5]" />
                  </div>
                ) : accounts.filter((a) => a.pageType === "organization").length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-600 mb-2">No company pages found.</p>
                    <p className="text-xs text-slate-600 mb-4">Connect your LinkedIn account — company pages are loaded automatically.</p>
                    {accounts.length === 0 && (
                      <a
                        href={`/api/linkedin/connect?userId=${session?.user?.id}&type=personal`}
                        className="inline-flex items-center gap-2 bg-[#0077B5] hover:bg-[#005f8e] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <LinkedInIcon className="w-4 h-4" />
                        Connect LinkedIn
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.filter((a) => a.pageType === "organization").map((org) => (
                      <div key={org.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#0077B5]/10 flex items-center justify-center shrink-0">
                            <LinkedInIcon className="w-4 h-4 text-[#0077B5]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{org.pageName ?? org.pageHandle ?? org.linkedinOrgUrn ?? "Company"}</p>
                            {org.pageHandle && (
                              <p className="text-xs text-slate-600">linkedin.com/company/{org.pageHandle}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {org.isActive ? (
                            <>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {org.subscriptionStatus === "canceling" ? "Canceling" : "Active"}
                              </span>
                              {org.subscriptionStatus !== "canceling" && (
                                <button
                                  onClick={() => handleDeactivateOrg(org.id)}
                                  disabled={orgsDeactivating[org.id]}
                                  className="text-xs text-slate-600 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                                >
                                  {orgsDeactivating[org.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel"}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivateOrg(org.id)}
                              disabled={orgsActivating[org.id]}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0077B5] hover:bg-[#005f8e] text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-70"
                            >
                              {orgsActivating[org.id] ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Opening…</>
                              ) : (
                                <>Activate page</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 p-6 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-lg font-bold text-blue-800 mb-3">How it works</p>
                      <ul className="text-sm text-blue-800 space-y-2.5">
                        <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">•</span><span>Included with your plan — or <strong>$99/month</strong> per extra page</span></li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">•</span><span>Activate a page to start AI content generation for it</span></li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">•</span><span>AI generates and schedules posts in your company&apos;s voice</span></li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">•</span><span>Cancel anytime — access continues until end of billing period</span></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== X (TWITTER) PANEL ===================== */}
          {activePlatform === "x" && activeTab !== "account" && activeTab !== "support" && (
            <div className="space-y-5">
              {xAccountLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                </div>
              ) : (
                <>
                  {/* Account connection cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Personal Account Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Personal Account</p>
                        {xPersonalAccount && (
                          <button
                            onClick={() => handleXDisconnect("personal")}
                            disabled={xDisconnecting === "personal"}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            {xDisconnecting === "personal" ? "..." : "Disconnect"}
                          </button>
                        )}
                      </div>
                      {xPersonalAccount ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                            <XIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">@{xPersonalAccount.username}</p>
                            {xPersonalAccount.displayName && (
                              <p className="text-xs text-slate-600">{xPersonalAccount.displayName}</p>
                            )}
                          </div>
                        </div>
                      ) : upgradeNeeded ? (
                        <div className="flex flex-col items-start gap-2">
                          <p className="text-xs text-slate-600">Personal X account not connected</p>
                          <p className="text-xs text-amber-600 font-medium">Upgrade to Duo/All-in to connect more accounts</p>
                          <Button onClick={() => setShowPlanModal(true)} size="sm" variant="outline" className="rounded-xl text-xs px-4 border-amber-400 text-amber-700">
                            Upgrade Plan →
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-2">
                          <p className="text-xs text-slate-600">Personal X account not connected</p>
                          <a href="/api/x/connect?type=personal">
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs px-4">
                              Connect Personal
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Company Account Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Company Account</p>
                        {xCompanyAccount && (
                          <button
                            onClick={() => handleXDisconnect("company")}
                            disabled={xDisconnecting === "company"}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            {xDisconnecting === "company" ? "..." : "Disconnect"}
                          </button>
                        )}
                      </div>
                      {xCompanyAccount ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-700 flex items-center justify-center shrink-0">
                            <XIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">@{xCompanyAccount.username}</p>
                            {xCompanyAccount.displayName && (
                              <p className="text-xs text-slate-600">{xCompanyAccount.displayName}</p>
                            )}
                          </div>
                        </div>
                      ) : (upgradeNeeded && !hasCompanyPlan) ? (
                        <div className="flex flex-col items-start gap-2">
                          <p className="text-xs text-slate-600">Company X account not connected</p>
                          <p className="text-xs text-amber-600 font-medium">Upgrade to Duo/All-in to connect more accounts</p>
                          <Button onClick={() => setShowPlanModal(true)} size="sm" variant="outline" className="rounded-xl text-xs px-4 border-amber-400 text-amber-700">
                            Upgrade Plan →
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-2">
                          <p className="text-xs text-slate-600">Company X account not connected</p>
                          <a href="/api/x/connect?type=company">
                            <Button size="sm" className="bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-xs px-4">
                              Connect Company
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {!xIsConnected ? (
                    /* Neither connected — show prompt */
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-10 flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <XIcon className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm text-slate-600 max-w-xs">Connect at least one X account above to generate and publish tweets.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                  {/* Tabs: Posts | Personal DNA.X | Company DNA.X */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                      {(["posts", "dna", "company-dna"] as XActiveTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setXActiveTab(tab)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            xActiveTab === tab
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {tab === "posts" ? "Posts" : tab === "dna" ? "Personal DNA.X" : "Company DNA.X"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ===== POSTS TAB ===== */}
                  {xActiveTab === "posts" && (
                    <>
                      {/* Generate button */}
                      <div className="flex items-center gap-3">
                        {hasPersonalPlan ? (
                          <Button
                            disabled={xGenerating}
                            onClick={handleXGenerate}
                            className="bg-slate-900 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {xGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {xGenerateTimer > 0 ? `Generating... (${xGenerateTimer}s left)` : "Almost done..."}
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate 14 Tweets
                              </>
                            )}
                          </Button>
                        ) : trialExpired ? (
                          <button
                            onClick={() => setShowPlanModal(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm text-sm transition-opacity"
                          >
                            <Lock className="w-4 h-4" />
                            Subscribe to Generate
                          </button>
                        ) : (
                          <Button
                            onClick={() => setShowPlanModal(true)}
                            disabled={checkingOut}
                            className="bg-slate-900 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm"
                          >
                            {checkingOut ? "Loading..." : "Start Free Trial"}
                          </Button>
                        )}
                      </div>

                      {xBothAccountsConnected && (
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                          {(["personal", "company"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setXPostsAccountType(type)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                                xPostsAccountType === type
                                  ? "bg-slate-900 text-white"
                                  : "bg-transparent text-slate-600"
                              }`}
                            >
                              {type === "personal" ? "Personal" : "Company"}
                            </button>
                          ))}
                        </div>
                      )}

                      {xGenerateErrorKind === "ai_busy" && xGenerateRetryCountdown !== null && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
                          <div className="text-2xl">⏳</div>
                          <div className="flex-1">
                            <p className="font-semibold text-amber-800">AI is in high demand right now</p>
                            <p className="text-sm text-amber-700 mt-1">Our AI servers are handling a lot of requests. Retrying automatically...</p>
                            <p className="text-sm text-amber-600 mt-1">Retrying in {xGenerateRetryCountdown} seconds...</p>
                            <button
                              onClick={() => { setXGenerateRetryCountdown(null); void handleXGenerate() }}
                              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                            >
                              Try again now
                            </button>
                          </div>
                        </div>
                      )}
                      {xGenerateErrorKind === "other" && xGenerateError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 p-5 flex items-start gap-4">
                          <div className="text-2xl">😔</div>
                          <div>
                            <p className="font-semibold text-red-800">Something went wrong</p>
                            <p className="text-sm text-red-700 mt-1">Please try again or contact support if the issue persists.</p>
                          </div>
                        </div>
                      )}

                      {/* Posts */}
                      {xPostsLoading ? (
                        <div className="flex justify-center py-16">
                          <Loader2 className="w-7 h-7 animate-spin text-slate-600" />
                        </div>
                      ) : xActivePosts.length === 0 && xPublishedPosts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 flex flex-col items-center gap-5 text-center px-6">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center">
                            <XIcon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No tweets yet</p>
                            <p className="text-sm text-slate-600 max-w-xs">Generate 14 tweets in your voice, ready to publish.</p>
                          </div>
                          {hasPersonalPlan && (
                            <button
                              onClick={handleXGenerate}
                              disabled={xGenerating}
                              className="bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70 flex items-center gap-2"
                            >
                              {xGenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4" />
                                  Generate 14 Tweets
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {xActivePosts.length > 0 && (
                            <>
                              <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-700">
                                  Draft · {xActivePosts.length} tweet{xActivePosts.length !== 1 ? "s" : ""}
                                </h2>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {xActivePosts.map((post) => (
                                  <XPostCard
                                    key={post.id}
                                    post={post}
                                    onPublish={handleXPublishPost}
                                    onImageUpdate={handleXImageUpdate}
                                    onContentUpdate={handleXContentUpdate}
                                    hasSubscription={hasPersonalPlan}
                                    trialExpired={trialExpired} onUpgrade={() => setShowPlanModal(true)}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          {xPublishedPosts.length > 0 && (
                            <div className="mt-4">
                              <button
                                onClick={() => setXPublishedCollapsed((c) => !c)}
                                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-700 transition-colors mb-3"
                              >
                                <span>{xPublishedCollapsed ? "▶" : "▼"}</span>
                                Published · {xPublishedPosts.length} tweet{xPublishedPosts.length !== 1 ? "s" : ""}
                              </button>
                              {!xPublishedCollapsed && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {xPublishedPosts.map((post) => (
                                    <XPostCard
                                      key={post.id}
                                      post={post}
                                      onPublish={handleXPublishPost}
                                      onImageUpdate={handleXImageUpdate}
                                      onContentUpdate={handleXContentUpdate}
                                      hasSubscription={hasPersonalPlan}
                                      trialExpired={trialExpired} onUpgrade={() => setShowPlanModal(true)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* ===== DNA.X TAB ===== */}
                  {xActiveTab === "dna" && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                      <h2 className="text-base font-semibold text-slate-800">DNA.X</h2>
                      <p className="text-xs text-slate-600">Tell the AI about your X presence so it can generate tweets in your voice.</p>

                      {/* Q1 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What topics do you post about on X? (your niche)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SaaS growth, AI tools, founder mindset"
                          value={xBrief.q1}
                          onChange={(e) => setXBrief((b) => ({ ...b, q1: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Q2 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          How would you describe your Twitter voice?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. direct, witty, thought-provoking, controversial"
                          value={xBrief.q2}
                          onChange={(e) => setXBrief((b) => ({ ...b, q2: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Q3 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Who is your target audience on X?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. early-stage founders, growth marketers, devs"
                          value={xBrief.q3}
                          onChange={(e) => setXBrief((b) => ({ ...b, q3: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Q4 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What&apos;s your goal on X?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. build following, drive traffic, establish thought leadership"
                          value={xBrief.q4}
                          onChange={(e) => setXBrief((b) => ({ ...b, q4: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Q5 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What type of content performs best for you?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. hot takes, threads, insights, questions, stories"
                          value={xBrief.q5}
                          onChange={(e) => setXBrief((b) => ({ ...b, q5: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Avoid topics / Additional instructions */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Avoid topics / Additional instructions <span className="font-normal text-slate-600">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Don't mention competitors, avoid multi-sig as standalone solution"
                          value={xBrief.avoidTopics ?? ""}
                          onChange={(e) => setXBrief((b) => ({ ...b, avoidTopics: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        />
                      </div>

                      <Button
                        disabled={xSavingBrief}
                        onClick={handleXSaveBrief}
                        className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
                      >
                        {xSavingBrief ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {xBriefSaved ? (
                          <span className="flex items-center gap-1.5 text-emerald-100">
                            <Check className="w-4 h-4 text-emerald-300" />
                            Saved!
                          </span>
                        ) : "Save DNA.X"}
                      </Button>
                    </div>
                  )}

                  {/* ===== COMPANY DNA TAB ===== */}
                  {xActiveTab === "company-dna" && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                      <h2 className="text-base font-semibold text-slate-800">Company DNA</h2>
                      <p className="text-xs text-slate-600">Tell the AI about your company so it can generate tweets in your brand voice.</p>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What does your company do?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. We build AI tools for B2B sales teams"
                          value={xCompanyBrief.q1}
                          onChange={(e) => setXCompanyBrief((b) => ({ ...b, q1: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What&apos;s your brand voice/tone?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. professional, bold, data-driven, friendly"
                          value={xCompanyBrief.q2}
                          onChange={(e) => setXCompanyBrief((b) => ({ ...b, q2: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Who is your target audience?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. VP of Sales at Series A-C SaaS companies"
                          value={xCompanyBrief.q3}
                          onChange={(e) => setXCompanyBrief((b) => ({ ...b, q3: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What are your company&apos;s main topics/themes?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AI in sales, pipeline generation, outbound strategies"
                          value={xCompanyBrief.q4}
                          onChange={(e) => setXCompanyBrief((b) => ({ ...b, q4: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          What&apos;s your company&apos;s goal on X?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. brand awareness, drive signups, establish thought leadership"
                          value={xCompanyBrief.q5}
                          onChange={(e) => setXCompanyBrief((b) => ({ ...b, q5: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <Button
                        disabled={xSavingCompanyBrief}
                        onClick={handleXSaveCompanyBrief}
                        className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
                      >
                        {xSavingCompanyBrief ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {xCompanyBriefSaved ? (
                          <span className="flex items-center gap-1.5 text-emerald-100">
                            <Check className="w-4 h-4 text-emerald-300" />
                            Saved!
                          </span>
                        ) : "Save Company DNA"}
                      </Button>
                    </div>
                  )}
                </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===================== LINKEDIN CONTENT ===================== */}
          {activePlatform === "linkedin" && linkedInActiveTab === "personal" && (<>
          {/* Account context banner when a company account is selected */}
          {selectedLinkedInAccountId && (() => {
            const selectedOrg = accounts.find((a) => a.id === selectedLinkedInAccountId)
            return selectedOrg ? (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-[#0077B5]/5 border border-[#0077B5]/20">
                <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center shrink-0">
                  <LinkedInIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedOrg.pageName ?? selectedOrg.pageHandle ?? "Company"}</p>
                  <p className="text-xs text-slate-600">Company Page</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLinkedInAccountId(null)
                    fetchBrief(null)
                    fetchPosts(null)
                  }}
                  className="text-xs text-slate-600 hover:text-slate-600 transition-colors shrink-0"
                >
                  ← Personal
                </button>
              </div>
            ) : null
          })()}
          {/* Tabs — hidden on mobile (bottom nav used instead), visible on lg+ */}
          <div className="hidden lg:flex items-center gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 w-fit">
            {(["posts", "dna", "account", "support"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab === "posts" ? "Posts" : tab === "dna" ? "Professional DNA" : tab === "account" ? "Settings" : "Support"}
              </button>
            ))}
          </div>
          {/* Mobile tab title */}
          <div className="lg:hidden mb-4">
            <h2 className="text-base font-bold text-slate-700 capitalize">
              {activeTab === "dna" ? "Professional DNA" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
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
                              <span className={`text-sm ${s1 ? "line-through text-slate-600" : "font-semibold text-slate-700"}`}>
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
                              <span className={`text-sm ${s2 ? "line-through text-slate-600" : "font-semibold text-slate-700"}`}>
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
                              <span className={`text-sm ${s3 ? "line-through text-slate-600" : "font-semibold text-slate-700"}`}>
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
                              Generate {postsPerWeek} Posts
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
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm text-sm transition-opacity"
                      >
                        <Lock className="w-4 h-4" />
                        Subscribe to Generate →
                      </button>
                    ) : isConnected && posts.length === 0 ? (
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
                              Generate my posts — free
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
                    ) : (
                      <Button
                        onClick={() => setShowPlanModal(true)}
                        disabled={checkingOut}
                        className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm"
                      >
                        {checkingOut ? "Loading..." : "Start Free Trial"}
                      </Button>
                    )}
                  </div>

                  {generating && (
                    <div className="px-4 py-3 rounded-xl bg-violet-50 text-violet-700 text-sm border border-violet-100">
                      Generating your posts and cover images with AI. This typically takes 1–2 minutes — please keep this tab open.
                    </div>
                  )}

                  {generateErrorKind === "ai_busy" && generateRetryCountdown !== null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
                      <div className="text-2xl">⏳</div>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-800">AI is in high demand right now</p>
                        <p className="text-sm text-amber-700 mt-1">Our AI servers are handling a lot of requests. Retrying automatically...</p>
                        <p className="text-sm text-amber-600 mt-1">Retrying in {generateRetryCountdown} seconds...</p>
                        <button
                          onClick={() => { setGenerateRetryCountdown(null); void handleGenerate() }}
                          className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                        >
                          Try again now
                        </button>
                      </div>
                    </div>
                  )}
                  {generateErrorKind === "other" && generateError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-5 flex items-start gap-4">
                      <div className="text-2xl">😔</div>
                      <div>
                        <p className="font-semibold text-red-800">Something went wrong</p>
                        <p className="text-sm text-red-700 mt-1">Please try again or contact support if the issue persists.</p>
                      </div>
                    </div>
                  )}

                  {/* Image style selector */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide shrink-0">Image style:</span>
                      {([
                        ["ai_art", "AI Art"],
                        ["minimalist", "Minimalist"],
                        ["photorealistic", "Photo"],
                        ["infographic", "Infographic"],
                        ["no_image", "No Images"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={async () => {
                            setBrief((b) => ({ ...b, imageStyle: value }))
                            await fetch("/api/linkedin/brief", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ...brief,
                                imageStyle: value,
                                profileUrl: profileUrl || undefined,
                                ...(selectedLinkedInAccountId ? { linkedinAccountId: selectedLinkedInAccountId } : {}),
                              }),
                            })
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            (brief.imageStyle ?? "ai_art") === value
                              ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

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
                          <p className="text-sm text-slate-600 mb-6">Two quick steps and your AI content engine is live.</p>

                          <div className="space-y-3 text-left">
                            {/* Step 1 — active */}
                            <div className="flex items-center gap-4 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3.5">
                              <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                                1
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">Fill your Professional DNA</p>
                                <p className="text-xs text-slate-600 mt-0.5">Tell the AI about your niche, audience &amp; goals</p>
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
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0">
                                2
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-600">Generate your posts</p>
                                <p className="text-xs text-slate-600 mt-0.5">AI-written, scheduled for the next two weeks</p>
                              </div>
                              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                            </div>
                          </div>
                        </div>
                      ) : hasPersonalPlan ? (
                        /* ── Brief is filled — show generate button ── */
                        <>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No posts yet</p>
                            <p className="text-sm text-slate-600 max-w-xs">Generate AI-written LinkedIn posts, scheduled for the next days.</p>
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
                                Generate {postsPerWeek} Posts
                              </>
                            )}
                          </button>
                        </>
                      ) : trialExpired ? (
                        <>
                          <div>
                            <p className="text-base font-semibold text-slate-700 mb-1">No posts yet</p>
                            <p className="text-sm text-slate-600 max-w-xs">Your trial has ended. Subscribe to generate more posts.</p>
                          </div>
                          <button
                            onClick={() => setShowPlanModal(true)}
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
                            <p className="text-sm text-slate-600 max-w-xs">Start your 14-day free trial to generate posts. Cancel anytime.</p>
                          </div>
                          <button
                            onClick={() => setShowPlanModal(true)}
                            disabled={checkingOut}
                            className="mt-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity disabled:opacity-70"
                          >
                            {checkingOut ? "Loading..." : "Start Free Trial →"}
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
                                trialExpired={trialExpired} onUpgrade={() => setShowPlanModal(true)}
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
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-700 transition-colors mb-3"
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
                                  trialExpired={trialExpired} onUpgrade={() => setShowPlanModal(true)}
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
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 flex flex-col items-center gap-5 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#0077B5] flex items-center justify-center shadow-lg">
                    <LinkedInIcon className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 mb-1">
                      {savedGhostPosts && savedGhostPosts.posts.length > 0
                        ? `Your ${savedGhostPosts.posts.length} posts are saved — connect LinkedIn to publish them`
                        : "Connect LinkedIn to get your posts — free"}
                    </p>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                      We&apos;ll write a full schedule in your voice, with cover images — free, before you enter any card. You approve every post; nothing publishes without you.
                    </p>
                  </div>
                  {/* Bounded 3-step path so connecting feels like step 1 of 3, not an open-ended commitment. */}
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-violet-600">1. Connect</span>
                    <span className="text-slate-300">→</span>
                    <span>2. Personalize</span>
                    <span className="text-slate-300">→</span>
                    <span>3. Generate — free</span>
                  </div>
                  <a href="/api/linkedin/connect?type=personal">
                    <Button className="bg-[#0077B5] hover:bg-[#00669c] text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm">
                      <LinkedInIcon className="w-4 h-4 mr-2" /> Connect LinkedIn — takes 20 seconds
                    </Button>
                  </a>
                  <p className="text-xs text-slate-400 max-w-xs">🔒 You log in on LinkedIn&apos;s site — we never see your password, and you can revoke access anytime.</p>
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
                  <div className="flex flex-col sm:flex-row gap-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Posting frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Posting Frequency</label>
                  <div className="flex gap-2">
                    {([["daily", "Daily"], ["every_other_day", "Every other day"]] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBrief((b) => ({ ...b, postingFrequency: value }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          brief.postingFrequency === value
                            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avoid topics / Additional instructions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Avoid topics / Additional instructions <span className="normal-case font-normal text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Don't mention competitors, avoid multi-sig as standalone solution"
                    value={brief.avoidTopics ?? ""}
                    onChange={(e) => setBrief((b) => ({ ...b, avoidTopics: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none transition-colors"
                  />
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
          </>)}

          {/* Mobile title for Account/Support when not on LinkedIn platform */}
          {(activeTab === "account" || activeTab === "support") && activePlatform !== "linkedin" && (
            <div className="lg:hidden mb-4">
              <h2 className="text-base font-bold text-slate-700 capitalize">
                {activeTab === "account" ? "Settings" : "Support"}
              </h2>
            </div>
          )}

          {/* ===================== ACCOUNT TAB ===================== */}
          {activeTab === "account" && (
            <div className="space-y-5">
              {/* Connected accounts */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-800">Connected Accounts</h2>
                  {accounts.length === 0 ? (
                    <a href="/api/linkedin/connect">
                      <Button size="sm" className="bg-[#0077B5] hover:bg-[#005f8e] text-white text-xs rounded-xl">
                        + Connect LinkedIn
                      </Button>
                    </a>
                  ) : accounts.some((a) => a.pageType === "personal") && !accounts.some((a) => a.pageType === "organization") ? (
                    <a href="/api/linkedin/connect?type=company">
                      <Button size="sm" variant="outline" className="border-[#0077B5] text-[#0077B5] hover:bg-blue-50 text-xs rounded-xl">
                        + Connect Company Page
                      </Button>
                    </a>
                  ) : null}
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
                      <p className="text-xs text-slate-600 max-w-xs">
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
                                <span className="text-xs text-slate-600">@{account.pageHandle}</span>
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
                {hasActiveSubscription && cancelAtPeriodEnd ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {planName(subscriptionPlan)}
                          </p>
                          <p className="text-xs text-slate-600">
                            {cancelAt
                              ? `Ends ${new Date(cancelAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                              : "Cancels at period end"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50 px-2 py-0.5">
                        Cancelled
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 px-1">
                      {cancelAt
                        ? `Your subscription will end on ${new Date(cancelAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. You'll keep full access until then.`
                        : "Your subscription will cancel at the end of the billing period. You'll keep full access until then."}
                    </p>
                    {cancelMessage && (
                      <p className="text-xs text-slate-600 px-1 pt-1">{cancelMessage}</p>
                    )}
                    <button
                      onClick={handleRenewSubscription}
                      disabled={renewingSubscription}
                      className="text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2 px-1 pt-1 text-left disabled:opacity-50"
                    >
                      {renewingSubscription ? "Renewing…" : "Renew subscription"}
                    </button>
                    <button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-sm font-semibold text-violet-700 transition-colors disabled:opacity-60"
                    >
                      {portalLoading ? "Opening…" : "Payment method · invoices"}
                    </button>
                  </div>
                ) : hasActiveSubscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {planName(subscriptionPlan)}
                          </p>
                          <p className="text-xs text-slate-600">
                            {planPrice(subscriptionPlan)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50 px-2 py-0.5">
                        {subscriptionStatus === "trialing" ? "Trial" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 px-1">
                      You have full access to generate posts, publish, and auto-scheduling.
                    </p>
                    <button
                      onClick={() => setShowPlanModal(true)}
                      disabled={checkingOut}
                      className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    >
                      {checkingOut ? "Updating…" : "Change plan"}
                    </button>
                    <button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-sm font-semibold text-violet-700 transition-colors disabled:opacity-60"
                    >
                      {portalLoading ? "Opening…" : "Payment method · invoices · cancel"}
                    </button>
                    {cancelMessage ? (
                      <p className="text-xs text-slate-600 px-1 pt-1">{cancelMessage}</p>
                    ) : cancelConfirming ? (
                      <div className="flex items-center gap-3 px-1 pt-1">
                        <p className="text-xs text-slate-600">Are you sure? You&apos;ll keep access until the end of your billing period.</p>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelingSubscription}
                          className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 whitespace-nowrap disabled:opacity-50"
                        >
                          {cancelingSubscription ? "Cancelling…" : "Yes, cancel"}
                        </button>
                        <button
                          onClick={() => setCancelConfirming(false)}
                          className="text-xs text-slate-600 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap"
                        >
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCancelSubscription}
                        className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 px-1 pt-1 text-left"
                      >
                        {subscriptionStatus === "trialing" ? "Cancel trial" : "Cancel subscription"}
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
                          <p className="text-xs text-slate-600">
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
                    <div className="flex flex-col gap-2">
                      {(["personal", "duo", "allin"] as const).map((p) => {
                        const labels: Record<string, { name: string; price: string; desc: string; color: string; bg: string; border: string }> = {
                          personal: { name: "Personal", price: "$49/mo", desc: "1 account · 1 post/day", color: "text-violet-700", bg: "bg-violet-50 hover:bg-violet-100", border: "border-violet-200 hover:border-violet-400" },
                          duo: { name: "Duo", price: "$99/mo", desc: "2 accounts · 1 post/day each", color: "text-blue-700", bg: "bg-blue-50 hover:bg-blue-100", border: "border-blue-200 hover:border-blue-400" },
                          allin: { name: "All-in", price: "$199/mo", desc: "3 accounts · 1 post/day each", color: "text-pink-700", bg: "bg-pink-50 hover:bg-pink-100", border: "border-pink-200 hover:border-pink-400" },
                        }
                        const l = labels[p]
                        return (
                          <button key={p} onClick={() => handleUpgrade(p)} disabled={checkingOut}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 ${l.border} ${l.bg} transition-colors cursor-pointer disabled:opacity-70`}>
                            <div className="text-left">
                              <span className={`text-sm font-bold ${l.color}`}>{l.name}</span>
                              <p className="text-xs text-slate-600">{l.desc}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${l.color}`}>{l.price}</span>
                              <p className="text-xs text-slate-600 mt-0.5">{checkingOut ? "Loading…" : "Subscribe"}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-600 text-center">Subscribe now to keep access after your trial. Cancel anytime.</p>
                  </div>
                ) : trialExpired ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-sm font-semibold text-red-700 mb-1">Trial Ended</p>
                      <p className="text-xs text-red-600">Your trial has ended. Subscribe to continue generating and publishing posts.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(["personal", "duo", "allin"] as const).map((p) => {
                        const labels: Record<string, { name: string; price: string; desc: string; color: string; bg: string; border: string }> = {
                          personal: { name: "Personal", price: "$49/mo", desc: "1 account · 1 post/day", color: "text-violet-700", bg: "bg-violet-50 hover:bg-violet-100", border: "border-violet-200 hover:border-violet-400" },
                          duo: { name: "Duo", price: "$99/mo", desc: "2 accounts · 1 post/day each", color: "text-blue-700", bg: "bg-blue-50 hover:bg-blue-100", border: "border-blue-200 hover:border-blue-400" },
                          allin: { name: "All-in", price: "$199/mo", desc: "3 accounts · 1 post/day each", color: "text-pink-700", bg: "bg-pink-50 hover:bg-pink-100", border: "border-pink-200 hover:border-pink-400" },
                        }
                        const l = labels[p]
                        return (
                          <button key={p} onClick={() => handleUpgrade(p)} disabled={checkingOut}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 ${l.border} ${l.bg} transition-colors cursor-pointer disabled:opacity-70`}>
                            <div className="text-left">
                              <span className={`text-sm font-bold ${l.color}`}>{l.name}</span>
                              <p className="text-xs text-slate-600">{l.desc}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${l.color}`}>{l.price}</span>
                              <p className="text-xs text-slate-600 mt-0.5">{checkingOut ? "Loading…" : "Subscribe Now"}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-600 text-center">Cancel anytime. Secure payment via Stripe.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 mb-1">No Active Plan</p>
                      <p className="text-xs text-slate-600">14-day free trial · Cancel anytime — no charge until it ends.</p>
                    </div>
                    <button
                      onClick={() => setShowPlanModal(true)}
                      disabled={checkingOut}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm font-semibold text-violet-700">
                        {checkingOut ? "Loading..." : "Start Free Trial — 14 Days →"}
                      </span>
                    </button>
                    <p className="text-xs text-slate-600 text-center">Personal $49/mo · Duo $99/mo · All-in $199/mo · after trial</p>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-5">How it works</h2>
                <ol className="space-y-5">
                  {[
                    { icon: "📝", title: "Fill in your Professional DNA", desc: "Tell us about your business, target audience, and goals" },
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
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
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
                <p className="text-sm text-slate-600 mb-5">Have a question or found an issue? We'll get back to you as soon as possible.</p>

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
                      <p className="text-xs text-slate-600 mt-1">{supportMessage.trim().length}/20 characters minimum</p>
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

      {/* X Onboarding Modal */}
      {showXOnboarding && (() => {
        const xOnboardingScreens = [
          {
            badge: true,
            icon: <div className="text-6xl text-center mb-6 font-bold text-slate-900">𝕏</div>,
            stepLabel: null,
            title: "Let AI run your X — in your voice",
            text: "We publish 1 tweet every day for you. The AI learns how you think, what you stand for, and posts content that sounds exactly like you.",
          },
          {
            badge: false,
            icon: <div className="text-6xl text-center mb-6">🔗</div>,
            stepLabel: "Step 1 of 4",
            title: "Connect your X account",
            text: "One click to link your account. We only post with your explicit approval — nothing goes out without you saying so.",
          },
          {
            badge: false,
            icon: <div className="text-6xl text-center mb-6">🧬</div>,
            stepLabel: "Step 2 of 4",
            title: "Fill in DNA.X",
            text: "Tell the AI your topics, tone, and goals. The more detail you give — the better each tweet sounds like you. This is your voice fingerprint.",
          },
          {
            badge: false,
            icon: <div className="text-6xl text-center mb-6">⚡</div>,
            stepLabel: "Step 3 of 4",
            title: "Generate & publish",
            text: "Get 5 ready-to-post tweets in seconds. Edit the text, add an image, or publish instantly. Posts go out automatically — 1 tweet per day.",
          },
          {
            badge: false,
            icon: <div className="text-6xl text-center mb-6">📈</div>,
            stepLabel: "Step 4 of 4",
            title: "Watch your X grow",
            text: "Consistent daily content = more followers, more DMs, more opportunities. You focus on the work — we handle the publishing.",
          },
        ]
        const screen = xOnboardingScreens[xOnboardingStep]
        const isLast = xOnboardingStep === xOnboardingScreens.length - 1
        const handleClose = () => {
          if (typeof window !== "undefined") {
            localStorage.setItem("x_onboarding_seen", "1")
          }
          setShowXOnboarding(false)
          setXOnboardingStep(0)
        }
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-slate-600 hover:text-slate-600 transition-colors text-xl leading-none"
                onClick={handleClose}
                aria-label="Close"
              >
                ×
              </button>

              {/* Badge (intro screen only) */}
              {screen.badge && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    🤖 X Autopilot
                  </span>
                </div>
              )}

              {/* Step label */}
              {screen.stepLabel && (
                <p className="text-xs font-medium text-violet-500 uppercase tracking-wider mb-2">{screen.stepLabel}</p>
              )}

              {/* Icon */}
              {screen.icon}

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{screen.title}</h2>

              {/* Text */}
              <p className="text-slate-600 text-sm leading-relaxed mb-8">{screen.text}</p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {xOnboardingScreens.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === xOnboardingStep ? "bg-violet-600" : "bg-slate-200"}`}
                  />
                ))}
              </div>

              {/* Next / CTA button */}
              <Button
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold transition-colors mt-4"
                onClick={() => {
                  if (isLast) {
                    handleClose()
                  } else {
                    setXOnboardingStep(xOnboardingStep + 1)
                  }
                }}
              >
                {isLast ? "Let's Go →" : "Next →"}
              </Button>
            </div>
          </div>
        )
      })()}
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
