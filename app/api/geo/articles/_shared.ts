import sanitizeHtml from "sanitize-html"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites, scheduledPosts } from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"

// What the "Your articles" endpoints share: who may touch a row (only its owner), which site an
// article goes to (the one the publisher picks), when it can be reviewed, and the strict cleaning
// every edited text goes through before it is stored.
//
// The review window: the writer on the VM (blog_engine/client_writer.py, 03:00 UTC) prepares each
// article 2 days before its date and stores it in article_data with preparedBy "vm-writer"; the
// status stays "scheduled" until the nightly publisher (08:00 UTC on the date) sends it out. In
// between the client can read, edit, publish now or stop it. A WordPress site that takes drafts
// (site_profile.publishStatus "draft") keeps its own flow: the owner approves in WordPress.

export const STOP_NOTE = "stopped by client"

/** Today as the publisher counts days: the UTC calendar date. */
export const utcToday = () => new Date().toISOString().slice(0, 10)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PreparedData {
  preparedBy?: string
  title?: string
  content?: string
  metaDescription?: string
  coverImageUrl?: string
  keywords?: string[]
  reviewNoticeAt?: string
  editedAt?: string
}

export function preparedData(data: unknown): PreparedData | null {
  const d = data as PreparedData | null
  return d && d.preparedBy === "vm-writer" && typeof d.title === "string" && d.title && typeof d.content === "string" && d.content ? d : null
}

export type PublishSite = typeof connectedSites.$inferSelect

/** The site every article of this user is published to, picked as the publisher picks it. */
export async function publishSiteFor(userId: string): Promise<PublishSite | null> {
  const sites = await db
    .select()
    .from(connectedSites)
    .where(eq(connectedSites.userId, userId))
    .orderBy(asc(connectedSites.createdAt))
  return sites.find((s) => s.isDefault) ?? sites[0] ?? null
}

/** A WordPress site whose owner approves each article in WordPress: we send drafts, not posts. */
export function isDraftSite(site: Pick<PublishSite, "platform" | "siteProfile"> | null | undefined): boolean {
  const profile = site?.siteProfile as { publishStatus?: string } | null | undefined
  return site?.platform === "wordpress" && profile?.publishStatus === "draft"
}

type RowForState = Pick<typeof scheduledPosts.$inferSelect, "status" | "scheduledDate" | "publishError">

export interface ReviewState {
  /** Written, waiting for its date, and the client can read, edit, publish now or stop it. */
  review: boolean
  /** Stopped by the client. */
  stopped: boolean
  /** A stop the client can still take back: its date has not come yet. */
  canUndo: boolean
  /** The day it goes live if nothing is done: its date, or today for one already due. */
  liveDate: string
}

/** `prepared`: the row carries a finished article from the writer (preparedData). */
export function reviewState(row: RowForState, prepared: boolean, draftSite: boolean, today = utcToday()): ReviewState {
  const stopped = row.status === "skipped" && (row.publishError ?? "").startsWith(STOP_NOTE)
  return {
    review: !draftSite && prepared && row.status === "scheduled",
    stopped,
    canUndo: !draftSite && stopped && row.scheduledDate > today,
    liveDate: row.scheduledDate > today ? row.scheduledDate : today,
  }
}

/** The signed-in user's own scheduled article, or the HTTP status to answer with. A row of another
 *  account is "not found", the same as one that does not exist. */
export async function ownArticle(id: string): Promise<{ userId: string; row: typeof scheduledPosts.$inferSelect } | { status: 401 | 404 }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { status: 401 }
  if (!UUID.test(id)) return { status: 404 }
  const [row] = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)))
    .limit(1)
  return row ? { userId, row } : { status: 404 }
}

// ── Cleaning ────────────────────────────────────────────────────────────────────────────────

const LEADING_H1 = /^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i

/** The article's text without its leading <h1> (the title is edited on its own). */
export function bodyOf(content: string): { body: string; hasH1: boolean } {
  const m = LEADING_H1.exec(content)
  return m ? { body: content.slice(m[0].length), hasH1: true } : { body: content, hasH1: false }
}

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** The stored article: the leading <h1> carries the (possibly edited) title, as the writer made it. */
export function withTitle(body: string, title: string, hasH1: boolean): string {
  return hasH1 ? `<h1>${escapeText(title)}</h1>\n${body}` : body
}

// What an article may contain: the structure the writer produces (headings, paragraphs, lists,
// links, tables, emphasis) and nothing else. No attributes but a link's address and table spans; no
// scripts, styles, images, frames or event handlers. Unknown tags are dropped, their text kept.
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "u", "s", "sub", "sup",
  "ul", "ol", "li", "a", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
]
const REL_TOKENS = new Set(["noopener", "noreferrer", "nofollow", "sponsored", "ugc"])

export function cleanArticleHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      ol: ["start"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    // Dropped together with everything inside them.
    nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed", "svg", "math", "template", "title", "head", "select"],
    transformTags: {
      b: "strong",
      i: "em",
      strike: "s",
      del: "s",
      div: "p",
      a: (_tag, attribs) => {
        const out: Record<string, string> = {}
        if (attribs.href) out.href = attribs.href.trim()
        if (attribs.title) out.title = attribs.title
        const rel = (attribs.rel ?? "").toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t))
        if (attribs.target === "_blank") {
          out.target = "_blank"
          if (!rel.includes("noopener")) rel.unshift("noopener")
        }
        if (rel.length) out.rel = Array.from(new Set(rel)).join(" ")
        return { tagName: "a", attribs: out }
      },
      th: (_tag, attribs) => ({ tagName: "th", attribs: spans(attribs, true) }),
      td: (_tag, attribs) => ({ tagName: "td", attribs: spans(attribs, false) }),
      ol: (_tag, attribs) => {
        const out: Record<string, string> = {}
        if (/^\d{1,4}$/.test(attribs.start ?? "")) out.start = attribs.start
        return { tagName: "ol", attribs: out }
      },
    },
  })
  // The empty paragraphs an editor leaves behind when lines are deleted.
  return clean.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "").trim()
}

function spans(attribs: Record<string, string>, th: boolean): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of ["colspan", "rowspan"]) if (/^\d{1,2}$/.test(attribs[k] ?? "")) out[k] = attribs[k]
  if (th && /^(row|col|rowgroup|colgroup)$/.test(attribs.scope ?? "")) out.scope = attribs.scope
  return out
}

/** The words of an article, for checking it was not emptied by mistake. */
export const textOf = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;|\s+/g, " ").trim()

/** A title or description: one line of plain text, no markup characters, at most `max` long. */
export function cleanLine(v: unknown, max: number): string {
  if (typeof v !== "string") return ""
  return v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
}
