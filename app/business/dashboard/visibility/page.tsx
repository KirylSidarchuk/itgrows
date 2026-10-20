"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AddSite,
  Banner,
  Crawlers,
  FirstLook,
  Hero,
  NamedInstead,
  NextSteps,
  Pending,
  PlanCard,
  Sources,
  WeeklyHero,
  WhatChanged,
  WhereNamed,
  card,
  fmtDate,
  nextSteps,
  type Audit,
  type SiteReport,
} from "./parts"

// The AI-visibility report: where a free account lands after the check on /business, and where a
// paying client sees the weekly count. Arriving with ?site= (or the check's handoff) follows that
// site, which queues the day-0 report on the VM; the page then follows it to completion.

// Same conversion the email report on /business fires: a visitor of the free check left a way to
// reach them. Fired once per site per browser, when the follow succeeds.
const REPORT_CONVERSION = "AW-18160234884/GnV1COO4h-AcEITjvNND"
const AUDIT_TTL_MS = 60 * 60 * 1000

function bare(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({ event, path: "/business/dashboard/visibility", props, anon_id: localStorage.getItem("itg_anon") })
    )
  } catch {}
}

export default function VisibilityPage() {
  const [sites, setSites] = useState<SiteReport[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [active, setActive] = useState("")
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [followErr, setFollowErr] = useState<{ domain: string; error: string } | null>(null)
  const [audits, setAudits] = useState<Record<string, Audit | "failed">>({})
  const [showBase, setShowBase] = useState(false)
  const started = useRef(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/geo/report", { cache: "no-store" })
      if (!r.ok) throw new Error(String(r.status))
      const j = (await r.json()) as { sites: SiteReport[] }
      setSites(j.sites)
      setLoadFailed(false)
      return j.sites
    } catch {
      setLoadFailed(true)
      setSites((s) => s ?? [])
      return null
    }
  }, [])

  const follow = useCallback(
    async (site: string) => {
      setAdding(true)
      setFollowErr(null)
      try {
        const r = await fetch("/api/geo/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site }),
        })
        const j = (await r.json().catch(() => ({}))) as { domain?: string; status?: string; error?: string }
        if (!r.ok || !j.domain) {
          setFollowErr({ domain: bare(site), error: j.error ?? "unavailable" })
          track("geo_follow_failed", { domain: bare(site), error: j.error })
          return
        }
        setActive(j.domain)
        setShowAdd(false)
        try {
          const key = `itg_geo_conv_${j.domain}`
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1")
            const w = window as unknown as { gtag?: (...args: unknown[]) => void }
            w.gtag?.("event", "conversion", { send_to: REPORT_CONVERSION })
          }
        } catch {}
        await load()
      } finally {
        setAdding(false)
      }
    },
    [load]
  )

  // First visit: follow the site the visitor came with, then tidy the address bar.
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      const params = new URLSearchParams(window.location.search)
      let site = bare(params.get("site") ?? "")
      if (!site) {
        try {
          const h = JSON.parse(localStorage.getItem("itg_geo_handoff") ?? "null") as { site?: string; at?: number } | null
          if (h?.site && Date.now() - (h.at ?? 0) < 86_400_000) site = bare(h.site)
        } catch {}
      }
      const list = await load()
      if (site && list && !list.some((s) => s.domain === site)) await follow(site)
      else if (site) setActive(site)
      if (params.has("site")) window.history.replaceState(null, "", window.location.pathname)
      try {
        localStorage.removeItem("itg_geo_handoff")
      } catch {}
    })()
  }, [load, follow])

  const site = sites?.find((s) => s.domain === active) ?? sites?.[sites.length - 1]
  const anyPending = Boolean(sites?.some((s) => s.pending))

  useEffect(() => {
    if (!anyPending) return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [anyPending, load])

  // The crawler check for the site on screen, cached for an hour in this tab.
  const domain = site?.domain
  useEffect(() => {
    if (!domain || audits[domain]) return
    const key = `itg_geo_audit_${domain}`
    try {
      const c = JSON.parse(sessionStorage.getItem(key) ?? "null") as { at: number; audit: Audit } | null
      if (c && Date.now() - c.at < AUDIT_TTL_MS) {
        setAudits((a) => ({ ...a, [domain]: c.audit }))
        return
      }
    } catch {}
    fetch("/api/business/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: domain }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((audit: Audit & { error?: string }) => {
        if (audit.error) throw new Error(audit.error)
        setAudits((a) => ({ ...a, [domain]: audit }))
        try {
          sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), audit }))
        } catch {}
      })
      .catch(() => setAudits((a) => ({ ...a, [domain]: "failed" })))
  }, [domain, audits])

  if (sites === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="h-8 w-48 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
      </div>
    )
  }

  const audit = site ? audits[site.domain] : undefined
  const free = site ? site.plan !== "paid" : true

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI visibility</h1>
        {site && (
          <p className="text-sm text-slate-600 mt-1">{[site.business, site.city, site.domain].filter(Boolean).join(" · ")}</p>
        )}
        {site?.latest && <p className="text-xs text-slate-500 mt-1">Checked {fmtDate(site.latest.finishedAt)}</p>}
        {sites.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {sites.length > 1 &&
              sites.map((s) => (
                <button
                  key={s.domain}
                  type="button"
                  onClick={() => setActive(s.domain)}
                  className={`text-sm rounded-full px-3.5 py-1.5 font-medium ${
                    s.domain === site?.domain ? "bg-violet-600 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  {s.domain}
                </button>
              ))}
            {sites.length < 3 && (
              <button type="button" onClick={() => setShowAdd((v) => !v)} className="text-sm text-violet-700 font-semibold hover:underline px-1">
                + Add a site
              </button>
            )}
          </div>
        )}
      </header>

      {loadFailed && (
        <div className={`${card} text-sm text-slate-700`}>We couldn&apos;t load your report just now. It retries on its own; you can also refresh.</div>
      )}

      {(!site || showAdd) && <AddSite onAdd={follow} busy={adding} error={followErr} first={!site} />}

      {site && (
        <>
          {site.pending && <Banner pending={site.pending} />}

          {site.latest ? (
            <>
              {site.latest.kind === "weekly" ? (
                <>
                  <WeeklyHero site={site} onShowBaseline={site.baseline ? () => setShowBase((v) => !v) : undefined} />
                  <WhatChanged changes={site.latest.summary.changes ?? []} />
                  {site.baseline && site.latest.rows.length < site.baseline.rows.length && (
                    <WhereNamed
                      rows={site.latest.rows}
                      engines={site.latest.engines}
                      samples={site.latest.samples}
                      asked={site.latest.finishedAt}
                      title="This week's questions"
                    />
                  )}
                </>
              ) : (
                <Hero report={site.latest} />
              )}
              {(() => {
                // The detailed cards come from the fullest report: this week's for a paid site, the
                // day-0 report for a free one (its weekly check is five questions).
                const full = site.baseline && site.latest.rows.length < site.baseline.rows.length ? site.baseline : site.latest
                const fromDay0 = full !== site.latest
                return (
                  <>
                    {fromDay0 && (
                      <p className="text-xs font-semibold text-slate-600 px-1">
                        From your day-0 report · {fmtDate(full.finishedAt)} · 20 questions × 4 assistants, 3 asks each
                      </p>
                    )}
                    {fromDay0 && showBase && <Hero report={full} />}
                    <div className="grid xl:grid-cols-2 gap-5">
                      <NamedInstead summary={full.summary} you={site.business || site.domain} />
                      <Sources summary={full.summary} />
                    </div>
                    <WhereNamed rows={full.rows} engines={full.engines} samples={full.samples} asked={full.finishedAt} />
                  </>
                )
              })()}
              <div className="grid xl:grid-cols-2 gap-5">
                <Crawlers audit={audit} />
                <NextSteps key={site.domain} domain={site.domain} steps={nextSteps(site, audit)} ready />
              </div>
              {free && <PlanCard domain={site.domain} />}
            </>
          ) : (
            <>
              {site.failed && !site.pending && (
                <section className="rounded-2xl bg-red-50 border border-red-200 p-5">
                  <p className="font-bold text-red-900">We couldn&apos;t finish your report for {site.domain}</p>
                  <p className="text-sm text-red-900/80 mt-1">Something failed on our side or at one of the assistants. Starting it again is free.</p>
                  <button
                    type="button"
                    onClick={() => follow(site.domain)}
                    disabled={adding}
                    className="mt-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold"
                  >
                    {adding ? "Starting…" : "Try again"}
                  </button>
                </section>
              )}
              {site.teaser && <FirstLook site={site} />}
              {site.teaser && <NamedInstead summary={site.teaser.summary} you={site.business || site.domain} firstLook />}
              {site.teaser && (
                <WhereNamed
                  rows={site.teaser.rows}
                  engines={site.teaser.engines}
                  samples={1}
                  asked={site.teaser.finishedAt}
                  title={`First results · ${site.teaser.rows.length} questions, ${site.teaser.engines.length} assistants`}
                />
              )}
              <div className="grid xl:grid-cols-2 gap-5">
                <Crawlers audit={audit} />
                <NextSteps key={site.domain} domain={site.domain} steps={[]} ready={false} />
              </div>
              <Pending title="Sites the assistants rely on" />
            </>
          )}
        </>
      )}
    </div>
  )
}
