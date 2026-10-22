"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ClipboardEvent, type ReactNode, type RefObject } from "react"
import Link from "next/link"
import { card } from "../visibility/parts"

// "Your articles": what we have planned for a client's site and what is already out, from
// /api/geo/articles. Only real rows: a date, a title, where it stands, and the link once we have one.
//
// Each article is written 2 days before its date. From then until the date the client can open it
// here (?article=<id>, the link in the email we send), edit the title, search description and text,
// publish it at once, or stop it (and take the stop back until the date). Untouched, it goes live on
// its date. A WordPress site that takes drafts keeps its own flow: the owner approves in WordPress.

interface Site {
  key: string
  name: string
  url: string
  platform: string
  draft: boolean
}

interface Article {
  id: string
  scheduledDate: string
  title: string
  status: string
  publishedAt: string | null
  publishedUrl: string | null
  language: string
  note: "duplicate" | "stopped" | null
  /** Sent to a WordPress site as a draft and not live yet. */
  awaitingApproval: boolean
  /** Written and waiting for its date: open, edit, publish now or stop. */
  review: boolean
  liveDate: string
  canUndo: boolean
  edited: boolean
  site: Site | null
}

interface ArticleDetail {
  id: string
  title: string
  metaDescription: string
  body: string | null
  coverImageUrl: string | null
  scheduledDate: string
  status: string
  language: string
  publishedAt: string | null
  publishedUrl: string | null
  edited: boolean
  site: { name: string; url: string; draft: boolean } | null
  review: boolean
  stopped: boolean
  canUndo: boolean
  liveDate: string
}

const QUEUED = new Set(["scheduled", "generating", "prepared"])
const label = "text-[11px] font-bold uppercase tracking-wide text-slate-500"
const primaryBtn =
  "inline-flex justify-center items-center rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold"
const secondaryBtn =
  "inline-flex justify-center items-center rounded-xl bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-200 text-[#1b1916] px-4 py-2 text-sm font-semibold"
const quietBtn = "text-sm font-semibold text-violet-700 hover:underline disabled:opacity-60"

// How the article's own HTML is drawn, both when reading and inside the editor.
const prose =
  "text-[15px] leading-relaxed text-[#1b1916] break-words " +
  "[&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:mt-6 [&_h1]:mb-3 " +
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 " +
  "[&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:my-3 " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1 " +
  "[&_a]:text-violet-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-violet-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 " +
  "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm [&_table]:my-4 " +
  "[&_th]:text-left [&_th]:font-semibold [&_th]:bg-slate-50 [&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2 " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top " +
  "[&_code]:font-mono [&_code]:text-[13px] [&_hr]:my-6 [&_hr]:border-slate-200"

function bare(url: string) {
  return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "")
}

/** "2026-10-23" is a calendar day, shown as that day wherever the reader is. */
function fmtDay(day: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day)
  if (!m) return day
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;")

/** The ?article=<id> in the address: the article open on this page, if any. */
function articleInUrl(): string | null {
  if (typeof window === "undefined") return null
  const v = new URLSearchParams(window.location.search).get("article")
  return v && /^[0-9a-f-]{36}$/i.test(v) ? v : null
}

// The address is the source of truth for which article is open, so back/forward work and the
// link in the email opens the article. pushState fires no event of its own, hence NAV_EVENT.
const NAV_EVENT = "itgrows:articles-nav"
function subscribeUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange)
  window.addEventListener(NAV_EVENT, onChange)
  return () => {
    window.removeEventListener("popstate", onChange)
    window.removeEventListener(NAV_EVENT, onChange)
  }
}
function navigate(search: string) {
  window.history.pushState(null, "", window.location.pathname + search)
  window.dispatchEvent(new Event(NAV_EVENT))
}

interface ListData {
  articles: Article[]
  client: boolean
}

async function fetchList(): Promise<ListData | null> {
  try {
    const r = await fetch("/api/geo/articles", { cache: "no-store" })
    if (!r.ok) return null
    const j = (await r.json()) as { articles?: Article[]; client?: boolean }
    return { articles: Array.isArray(j.articles) ? j.articles : [], client: j.client !== false }
  } catch {
    return null
  }
}

const ERRORS: Record<string, string> = {
  title_required: "Add a title.",
  text_too_short: "The text is too short to publish.",
  text_invalid: "The text could not be saved. Try again.",
  not_editable: "This article can't be changed any more: it is being published or was stopped.",
  not_ready: "This article can't be published from here any more.",
  not_stoppable: "This article can't be stopped any more: it is being published or is already out.",
  not_stopped: "This article is not stopped.",
  too_late: "Its date has passed, so it can't be brought back.",
  busy: "It is being published right now. Check again in a minute.",
  draft_site: "Articles for your site go to your WordPress as drafts; you approve them there.",
  no_site: "There is no site connected to publish to.",
  not_found: "This article isn't in your account.",
}

async function call(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const r = await fetch(url, { cache: "no-store", ...init })
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>
    return { ok: r.ok, status: r.status, data }
  } catch {
    return { ok: false, status: 0, data: {} }
  }
}

const errorText = (data: Record<string, unknown>) =>
  ERRORS[String(data.error ?? "")] ?? "Something went wrong. Try again in a minute."

// ── List ────────────────────────────────────────────────────────────────────────────────────

function Status({ a }: { a: Article }) {
  if (a.awaitingApproval) {
    return (
      <span className="text-xs font-medium text-amber-800 leading-snug sm:max-w-[15rem]">
        Sent to your WordPress as a draft, waiting for your approval
      </span>
    )
  }
  const [text, cls] =
    a.status === "published"
      ? ["Published", "bg-emerald-50 text-emerald-700"]
      : a.note === "stopped"
        ? ["Stopped", "bg-slate-100 text-slate-600"]
        : a.status === "skipped"
          ? ["Skipped", "bg-slate-100 text-slate-500"]
          : a.status === "failed"
            ? ["Failed", "bg-red-50 text-red-700"]
            : ["Queued", "bg-slate-100 text-slate-600"]
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
}

function Rows({ items, onOpen, onUndo, undoing }: { items: Article[]; onOpen: (id: string) => void; onUndo: (a: Article) => void; undoing: string | null }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <span className="text-xs sm:text-sm text-slate-500 tabular-nums sm:w-28 shrink-0">
            {a.status === "published" && a.publishedAt ? fmtWhen(a.publishedAt) : fmtDay(a.scheduledDate)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1b1916] leading-snug break-words">
              {a.review || a.note === "stopped" ? (
                <button type="button" onClick={() => onOpen(a.id)} className="text-left hover:text-violet-700 hover:underline">
                  {a.title}
                </button>
              ) : (
                a.title
              )}
              {a.language && a.language.toLowerCase() !== "en" && (
                <span className="ml-2 align-middle text-[10px] font-bold uppercase text-slate-400">{a.language}</span>
              )}
            </p>
            {a.review && (
              <p className="text-xs font-semibold text-amber-800 mt-0.5">
                Ready for you to review — goes live on {fmtDay(a.liveDate)}
                {a.edited && <span className="font-medium text-slate-500"> · edited by you</span>}
              </p>
            )}
            {a.note === "stopped" && (
              <p className="text-xs text-slate-500 mt-0.5">
                Stopped by you, so it will not go live.{a.canUndo ? ` You can undo this until ${fmtDay(a.scheduledDate)}.` : ""}
              </p>
            )}
            {a.status === "skipped" && a.note === "duplicate" && (
              <p className="text-xs text-slate-500 mt-0.5">Same topic as an article already published, so we dropped it.</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {a.review ? (
              <button type="button" onClick={() => onOpen(a.id)} className={primaryBtn}>
                Review
              </button>
            ) : (
              <Status a={a} />
            )}
            {a.canUndo && (
              <button type="button" onClick={() => onUndo(a)} disabled={undoing === a.id} className={quietBtn}>
                {undoing === a.id ? "Undoing…" : "Undo"}
              </button>
            )}
            {a.publishedUrl && (
              <a
                href={a.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-violet-700 hover:underline"
              >
                Open
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function SiteArticles({ items, today, onOpen, onUndo, undoing }: { items: Article[]; today: string; onOpen: (id: string) => void; onUndo: (a: Article) => void; undoing: string | null }) {
  // The API sends newest first. What comes next reads soonest first; what is out, newest first.
  const isNext = (a: Article) => QUEUED.has(a.status) || (a.status !== "published" && a.scheduledDate > today)
  const next = items.filter(isNext).reverse()
  // Newest out first, by the day it went out, which is the date the row shows.
  const outOn = (a: Article) => a.publishedAt ?? a.scheduledDate
  const published = items
    .filter((a) => a.status === "published")
    .sort((x, y) => (outOn(x) < outOn(y) ? 1 : outOn(x) > outOn(y) ? -1 : 0))
  const notPublished = items.filter((a) => !isNext(a) && a.status !== "published")
  const rowProps = { onOpen, onUndo, undoing }

  return (
    <>
      <section className={card}>
        <h2 className="font-bold text-lg text-[#1b1916]">Coming next</h2>
        {next.length > 0 ? (
          <div className="mt-2">
            <Rows items={next} {...rowProps} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-2">Nothing is planned for the coming days yet.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-bold text-lg text-[#1b1916]">Published</h2>
        {published.length > 0 ? (
          <div className="mt-2">
            <Rows items={published} {...rowProps} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-2">Nothing has been published yet.</p>
        )}
        {notPublished.length > 0 && (
          <div className="mt-5">
            <p className={label}>Not published</p>
            <div className="mt-1">
              <Rows items={notPublished} {...rowProps} />
            </div>
          </div>
        )}
      </section>
    </>
  )
}

// ── Editor ──────────────────────────────────────────────────────────────────────────────────

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // Keep the text selection in the editor while the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="min-w-9 h-9 px-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </button>
  )
}

/** A plain rich-text editor for the article's text: headings, paragraphs, bold, italic, lists and
 *  links. What it produces is cleaned again on the server before it is stored. */
function TextEditor({ initial, editorRef }: { initial: string; editorRef: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initial
    try {
      document.execCommand("defaultParagraphSeparator", false, "p")
    } catch {
      /* older browsers: new lines become <div>, which the server turns into paragraphs */
    }
  }, [initial, editorRef])

  const run = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const addLink = () => {
    const sel = window.getSelection()
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    const input = window.prompt("Link address (https://…)", "https://")
    if (!input) return
    const href = input.trim()
    if (!/^(https?:\/\/[^\s]+|mailto:[^\s]+)$/i.test(href)) {
      window.alert("A link has to start with https:// or mailto:")
      return
    }
    editorRef.current?.focus()
    if (range && sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
    if (range && !range.collapsed) document.execCommand("createLink", false, href)
    else document.execCommand("insertHTML", false, `<a href="${escAttr(href)}">${escText(href)}</a>`)
  }

  // Pasted text arrives as plain text, so no styles or scripts come along from other pages.
  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n")
    if (!text) return
    if (!text.includes("\n")) {
      document.execCommand("insertText", false, text)
      return
    }
    const html = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escText(p).replace(/\n/g, "<br>")}</p>`)
      .join("")
    document.execCommand("insertHTML", false, html)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-slate-100 p-1.5">
        <ToolButton title="Paragraph" onClick={() => run("formatBlock", "<p>")}>¶</ToolButton>
        <ToolButton title="Heading" onClick={() => run("formatBlock", "<h2>")}>H2</ToolButton>
        <ToolButton title="Subheading" onClick={() => run("formatBlock", "<h3>")}>H3</ToolButton>
        <ToolButton title="Bold" onClick={() => run("bold")}>
          <span className="font-extrabold">B</span>
        </ToolButton>
        <ToolButton title="Italic" onClick={() => run("italic")}>
          <span className="italic font-serif">I</span>
        </ToolButton>
        <ToolButton title="Bulleted list" onClick={() => run("insertUnorderedList")}>• List</ToolButton>
        <ToolButton title="Numbered list" onClick={() => run("insertOrderedList")}>1. List</ToolButton>
        <ToolButton title="Add a link to the selected text" onClick={addLink}>Link</ToolButton>
        <ToolButton title="Remove link" onClick={() => run("unlink")}>Unlink</ToolButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article text"
        onPaste={onPaste}
        className={`${prose} min-h-[24rem] max-h-[70vh] overflow-y-auto px-4 sm:px-5 py-3 outline-none focus:ring-2 focus:ring-violet-200 rounded-b-xl`}
      />
    </div>
  )
}

// ── One article ─────────────────────────────────────────────────────────────────────────────

function ArticleView({ id, onBack }: { id: string; onBack: () => void }) {
  const [a, setA] = useState<ArticleDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [meta, setMeta] = useState("")
  const [busy, setBusy] = useState<null | "save" | "publish" | "stop" | "undo">(null)
  const [confirming, setConfirming] = useState<null | "publish" | "stop">(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Bumped to read the article again after a change.
  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  useEffect(() => {
    let current = true
    call(`/api/geo/articles/${id}`).then((r) => {
      if (!current) return
      if (r.ok && r.data.article) {
        setA(r.data.article as ArticleDetail)
        setLoadError(null)
      } else {
        setLoadError(r.status === 404 ? ERRORS.not_found : "We couldn't load this article. Try again in a minute.")
      }
    })
    return () => {
      current = false
    }
  }, [id, version])

  const startEdit = () => {
    if (!a) return
    setTitle(a.title)
    setMeta(a.metaDescription)
    setMessage(null)
    setConfirming(null)
    setEditing(true)
  }

  const save = async () => {
    if (!a) return
    setBusy("save")
    setMessage(null)
    const r = await call(`/api/geo/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, metaDescription: meta, content: editorRef.current?.innerHTML ?? "" }),
    })
    setBusy(null)
    if (r.ok && r.data.article) {
      const next = r.data.article as ArticleDetail
      setA(next)
      setEditing(false)
      setMessage({ ok: true, text: `Saved. This is what goes live on ${fmtDay(next.liveDate)}.` })
    } else {
      setMessage({ ok: false, text: errorText(r.data) })
      if (r.status === 409) {
        setEditing(false)
        reload()
      }
    }
  }

  const act = async (kind: "publish" | "stop" | "undo") => {
    if (!a) return
    setBusy(kind)
    setConfirming(null)
    setMessage(null)
    const path = kind === "undo" ? "resume" : kind
    const r = await call(`/api/geo/articles/${a.id}/${path}`, { method: "POST" })
    setBusy(null)
    if (r.ok) {
      setMessage({
        ok: true,
        text:
          kind === "publish"
            ? "Published."
            : kind === "stop"
              ? "Stopped. It will not go live."
              : `It is back in the plan and goes live on ${fmtDay(a.scheduledDate)}.`,
      })
    } else if (kind === "publish" && r.data.error === "publish_failed") {
      setMessage({
        ok: false,
        text: r.data.requeued
          ? `We couldn't publish it just now and have been alerted. It is still set to go live on ${fmtDay(a.scheduledDate)}.`
          : "We couldn't publish it just now and have been alerted. We will try again.",
      })
    } else {
      setMessage({ ok: false, text: errorText(r.data) })
    }
    reload()
  }

  const back = (
    <button type="button" onClick={onBack} className="text-sm font-semibold text-violet-700 hover:underline">
      ← All articles
    </button>
  )

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
        {back}
        <section className={card}>
          <p className="text-sm text-slate-600">{loadError}</p>
        </section>
      </div>
    )
  }

  if (!a) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="h-5 w-28 rounded bg-white/60 animate-pulse" />
        <div className="h-72 rounded-2xl bg-white/60 animate-pulse" />
      </div>
    )
  }

  const siteName = a.site ? bare(a.site.url) : "your site"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      {back}

      {/* Where it stands, and what can be done with it. */}
      {a.review ? (
        <section className="rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 space-y-3">
          <div>
            <p className="font-bold text-amber-900">Ready for you to review — goes live on {fmtDay(a.liveDate)}</p>
            <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">
              If you do nothing, it goes live on {siteName} on that date. You can edit it, publish it now, or stop it.
            </p>
          </div>
          {!editing && confirming === null && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={startEdit} disabled={busy !== null} className={secondaryBtn}>
                Edit
              </button>
              <button type="button" onClick={() => setConfirming("publish")} disabled={busy !== null} className={primaryBtn}>
                {busy === "publish" ? "Publishing…" : "Publish now"}
              </button>
              <button type="button" onClick={() => setConfirming("stop")} disabled={busy !== null} className={secondaryBtn}>
                {busy === "stop" ? "Stopping…" : "Stop"}
              </button>
            </div>
          )}
          {!editing && confirming === "publish" && (
            <div className="rounded-xl bg-white border border-amber-200 p-3 sm:p-4 space-y-3">
              <p className="text-sm text-[#1b1916]">
                Publish this article on {siteName} now? It goes live right away instead of on {fmtDay(a.liveDate)}.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => act("publish")} className={primaryBtn}>
                  Yes, publish now
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={secondaryBtn}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!editing && confirming === "stop" && (
            <div className="rounded-xl bg-white border border-amber-200 p-3 sm:p-4 space-y-3">
              <p className="text-sm text-[#1b1916]">
                Stop this article? It will not go live on {fmtDay(a.liveDate)}.
                {a.scheduledDate > new Date().toISOString().slice(0, 10) ? ` You can undo this until ${fmtDay(a.scheduledDate)}.` : ""}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => act("stop")} className={primaryBtn}>
                  Yes, stop it
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={secondaryBtn}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      ) : a.stopped ? (
        <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-slate-700 flex-1">
            Stopped by you, so it will not go live.
            {a.canUndo ? ` You can undo this until ${fmtDay(a.scheduledDate)}.` : ""}
          </p>
          {a.canUndo && (
            <button type="button" onClick={() => act("undo")} disabled={busy !== null} className={primaryBtn}>
              {busy === "undo" ? "Undoing…" : "Undo"}
            </button>
          )}
        </section>
      ) : a.status === "published" ? (
        <section className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm font-semibold text-emerald-800 flex-1">
            Published{a.publishedAt ? ` on ${fmtWhen(a.publishedAt)}` : ""}
            {a.site?.draft ? " as a draft in your WordPress" : ""}.
          </p>
          {a.publishedUrl && (
            <a href={a.publishedUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
              Open on your site
            </a>
          )}
        </section>
      ) : QUEUED.has(a.status) ? (
        <section className="rounded-2xl bg-white/90 border border-white p-4 sm:p-5">
          <p className="text-sm text-slate-700">
            {a.site?.draft
              ? `Goes to your WordPress as a draft on ${fmtDay(a.liveDate)}; it goes live when you publish it there.`
              : `Planned for ${fmtDay(a.scheduledDate)}. You can read and edit it here 2 days before it goes live.`}
          </p>
        </section>
      ) : (
        <section className="rounded-2xl bg-white/90 border border-white p-4 sm:p-5">
          <p className="text-sm text-slate-700">Not published.</p>
        </section>
      )}

      {message && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-red-50 border border-red-100 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      {editing ? (
        <section className={`${card} space-y-4`}>
          <div>
            <label htmlFor="article-title" className={label}>
              Title
            </label>
            <input
              id="article-title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-[#1b1916] outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div>
            <label htmlFor="article-meta" className={label}>
              Search description
            </label>
            <textarea
              id="article-meta"
              value={meta}
              maxLength={320}
              rows={3}
              onChange={(e) => setMeta(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#1b1916] outline-none focus:ring-2 focus:ring-violet-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              Shown under the title in search results. {meta.length} characters.
            </p>
          </div>
          <div>
            <p className={label}>Text</p>
            <div className="mt-1">
              <TextEditor initial={a.body ?? ""} editorRef={editorRef} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={save} disabled={busy !== null || !title.trim()} className={primaryBtn}>
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setMessage(null)
              }}
              disabled={busy !== null}
              className={secondaryBtn}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : (
        <article className={card}>
          {a.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.coverImageUrl} alt="" className="w-full rounded-xl object-cover aspect-[1200/630] bg-slate-100 mb-5" />
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916] leading-tight break-words">{a.title}</h1>
          {a.edited && <p className="text-xs text-slate-500 mt-1">Edited by you</p>}
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className={label}>Search description</p>
            <p className="text-sm text-slate-700 mt-1">{a.metaDescription || "—"}</p>
          </div>
          {a.body ? (
            <div className={`${prose} mt-4`} dangerouslySetInnerHTML={{ __html: a.body }} />
          ) : (
            <p className="text-sm text-slate-500 mt-4">The text appears here once the article is written, 2 days before its date.</p>
          )}
        </article>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [client, setClient] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [undoing, setUndoing] = useState<string | null>(null)
  const [undoError, setUndoError] = useState<string | null>(null)
  const openId = useSyncExternalStore(subscribeUrl, articleInUrl, () => null)

  const apply = useCallback((d: ListData | null) => {
    if (d) {
      setArticles(d.articles)
      setClient(d.client)
      setLoadFailed(false)
    } else {
      setLoadFailed(true)
      setArticles((a) => a ?? [])
    }
  }, [])
  const load = useCallback(() => fetchList().then(apply), [apply])

  // The list is read on arrival and again on every return from an article, which may have changed it.
  useEffect(() => {
    if (openId) return
    let current = true
    fetchList().then((d) => current && apply(d))
    return () => {
      current = false
    }
  }, [openId, apply])

  const open = useCallback((id: string) => {
    navigate(`?article=${id}`)
    window.scrollTo(0, 0)
  }, [])

  const close = useCallback(() => navigate(""), [])

  const undo = useCallback(
    async (a: Article) => {
      setUndoing(a.id)
      setUndoError(null)
      const r = await call(`/api/geo/articles/${a.id}/resume`, { method: "POST" })
      setUndoing(null)
      if (!r.ok) setUndoError(errorText(r.data))
      load()
    },
    [load],
  )

  if (openId) return <ArticleView key={openId} id={openId} onBack={close} />

  if (articles === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="h-8 w-48 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  // One group per site the articles go to, in the order the newest article for each appears.
  const groups: { site: Site | null; items: Article[] }[] = []
  for (const a of articles) {
    const key = a.site?.key ?? ""
    const g = groups.find((x) => (x.site?.key ?? "") === key)
    if (g) g.items.push(a)
    else groups.push({ site: a.site, items: [a] })
  }
  const single = groups.length === 1 ? groups[0].site : null
  // Every site here takes drafts it approves in WordPress: the review promise does not apply.
  const allDraft = groups.length > 0 && groups.every((g) => g.site?.draft)
  const rowProps = { onOpen: open, onUndo: undo, undoing }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916]">Your articles</h1>
        <p className="text-sm text-slate-600 mt-1">
          {single ? `What we have planned for ${bare(single.url)} and what is already out.` : "What we have planned for your site and what is already out."}
          {client && !allDraft && " You see every article 2 days before it goes live, and can edit or stop it."}
        </p>
      </header>

      {loadFailed && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-red-700">We couldn&apos;t load your articles. Try again in a minute.</p>
          <button type="button" onClick={() => load()} className={`sm:ml-auto ${primaryBtn}`}>
            Try again
          </button>
        </div>
      )}

      {undoError && (
        <div role="status" className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {undoError}
        </div>
      )}

      {!loadFailed && articles.length === 0 && (
        <section className={card}>
          {client ? (
            <p className="text-sm text-slate-600">Your first articles will appear here once we have planned them.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">We write and publish articles on your site as part of the paid plan.</p>
              <Link href="/business/dashboard/plan" className={`mt-3 ${primaryBtn}`}>
                See the plan
              </Link>
            </>
          )}
        </section>
      )}

      {groups.length === 1 && <SiteArticles items={groups[0].items} today={today} {...rowProps} />}

      {groups.length > 1 &&
        groups.map((g) => (
          <div key={g.site?.key ?? "none"} className="space-y-5">
            <h2 className="text-lg font-extrabold tracking-tight text-[#1b1916] px-1 pt-2">
              {g.site ? g.site.name : "Your site"}
              {g.site && bare(g.site.url) !== g.site.name && (
                <span className="ml-2 text-sm font-medium text-slate-500">{bare(g.site.url)}</span>
              )}
            </h2>
            <SiteArticles items={g.items} today={today} {...rowProps} />
          </div>
        ))}
    </div>
  )
}
