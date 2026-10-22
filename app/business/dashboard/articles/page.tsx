"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { card } from "../visibility/parts"

// "Your articles": what we have planned for a client's site and what is already out, from
// /api/geo/articles. Only real rows: a date, a title, where it stands, and the link once we have one.

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
  note: "duplicate" | null
  /** Sent to a WordPress site as a draft and not live yet. */
  awaitingApproval: boolean
  site: Site | null
}

const QUEUED = new Set(["scheduled", "generating", "prepared"])
const label = "text-[11px] font-bold uppercase tracking-wide text-slate-500"

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
      : a.status === "skipped"
        ? ["Skipped", "bg-slate-100 text-slate-500"]
        : a.status === "failed"
          ? ["Failed", "bg-red-50 text-red-700"]
          : ["Queued", "bg-slate-100 text-slate-600"]
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
}

function Rows({ items }: { items: Article[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <span className="text-xs sm:text-sm text-slate-500 tabular-nums sm:w-28 shrink-0">
            {a.status === "published" && a.publishedAt ? fmtWhen(a.publishedAt) : fmtDay(a.scheduledDate)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1b1916] leading-snug break-words">
              {a.title}
              {a.language && a.language.toLowerCase() !== "en" && (
                <span className="ml-2 align-middle text-[10px] font-bold uppercase text-slate-400">{a.language}</span>
              )}
            </p>
            {a.status === "skipped" && a.note === "duplicate" && (
              <p className="text-xs text-slate-500 mt-0.5">Same topic as an article already published, so we dropped it.</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Status a={a} />
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

function SiteArticles({ items, today }: { items: Article[]; today: string }) {
  // The API sends newest first. What comes next reads soonest first; what is out, newest first.
  const isNext = (a: Article) => QUEUED.has(a.status) || (a.status !== "published" && a.scheduledDate > today)
  const next = items.filter(isNext).reverse()
  // Newest out first, by the day it went out, which is the date the row shows.
  const outOn = (a: Article) => a.publishedAt ?? a.scheduledDate
  const published = items
    .filter((a) => a.status === "published")
    .sort((x, y) => (outOn(x) < outOn(y) ? 1 : outOn(x) > outOn(y) ? -1 : 0))
  const notPublished = items.filter((a) => !isNext(a) && a.status !== "published")

  return (
    <>
      <section className={card}>
        <h2 className="font-bold text-lg text-[#1b1916]">Coming next</h2>
        {next.length > 0 ? (
          <div className="mt-2">
            <Rows items={next} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-2">Nothing is planned for the coming days yet.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-bold text-lg text-[#1b1916]">Published</h2>
        {published.length > 0 ? (
          <div className="mt-2">
            <Rows items={published} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-2">Nothing has been published yet.</p>
        )}
        {notPublished.length > 0 && (
          <div className="mt-5">
            <p className={label}>Not published</p>
            <div className="mt-1">
              <Rows items={notPublished} />
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [client, setClient] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/geo/articles", { cache: "no-store" })
      if (!r.ok) throw new Error(String(r.status))
      const j = (await r.json()) as { articles?: Article[]; client?: boolean }
      setArticles(Array.isArray(j.articles) ? j.articles : [])
      setClient(j.client !== false)
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
      setArticles((a) => a ?? [])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916]">Your articles</h1>
        <p className="text-sm text-slate-600 mt-1">
          {single ? `What we have planned for ${bare(single.url)} and what is already out.` : "What we have planned for your site and what is already out."}
        </p>
      </header>

      {loadFailed && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-red-700">We couldn&apos;t load your articles. Try again in a minute.</p>
          <button
            type="button"
            onClick={() => load()}
            className="sm:ml-auto inline-flex justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {!loadFailed && articles.length === 0 && (
        <section className={card}>
          {client ? (
            <p className="text-sm text-slate-600">Your first articles will appear here once we have planned them.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">We write and publish articles on your site as part of the paid plan.</p>
              <Link
                href="/business/dashboard/plan"
                className="mt-3 inline-flex justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-semibold"
              >
                See the plan
              </Link>
            </>
          )}
        </section>
      )}

      {groups.length === 1 && <SiteArticles items={groups[0].items} today={today} />}

      {groups.length > 1 &&
        groups.map((g) => (
          <div key={g.site?.key ?? "none"} className="space-y-5">
            <h2 className="text-lg font-extrabold tracking-tight text-[#1b1916] px-1 pt-2">
              {g.site ? g.site.name : "Your site"}
              {g.site && bare(g.site.url) !== g.site.name && (
                <span className="ml-2 text-sm font-medium text-slate-500">{bare(g.site.url)}</span>
              )}
            </h2>
            <SiteArticles items={g.items} today={today} />
          </div>
        ))}
    </div>
  )
}
