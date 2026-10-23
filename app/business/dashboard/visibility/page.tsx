"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { REPORT_SITES } from "@/lib/geo-pricing"
import {
  AddSite,
  Banner,
  CreditNote,
  Crawlers,
  FirstLook,
  History,
  NamedInstead,
  Pending,
  ReportSections,
  RunView,
  WhereNamed,
  YourPlan,
  card,
  fmtDate,
  isPreview,
  onPlan,
  planSteps,
  type Audit,
  type Report,
  type SiteReport,
} from "./parts"

// The AI-visibility report: where a new account lands after the quick check on the site, and where
// a client sees the weekly count. Arriving with ?site= (or the check's handoff) follows that site,
// which queues the day-0 report on the VM; the page then follows it to completion.
//
// The detailed report is a preview until it is bought or the site is on the plan (see parts.tsx).
// Stripe brings the buyer back with ?site=…&unlocked=1; the webhook may land a few seconds later, so
// the page asks again until the site reads as unlocked. A site past the account's report is refused
// by /api/geo/follow with "report_limit" (402); its report can be bought instead, and the purchase
// follows it. The report ends with "Your plan": what we do, never how to do it yourself.
//
// Under the report, the history lists every finished report of the site; a row (or a bar of the
// trend, or "View day-0 report") opens that report in place of this week's, until "Back".

// Same conversion the email report fires: a visitor of the quick check left a way to reach them.
// Fired once per site per browser, when the follow succeeds.
const REPORT_CONVERSION = "AW-18160234884/GnV1COO4h-AcEITjvNND"
const AUDIT_TTL_MS = 60 * 60 * 1000
const UNLOCK_POLL_MS = 3_000
const UNLOCK_WAIT_MS = 2 * 60 * 1000

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
  // A report opened from the history, and the ones fetched so far, by run and access: buying the
  // report changes how a run is cut, so a run fetched as a preview is not shown once it is unlocked.
  const [openRun, setOpenRun] = useState<{ domain: string; id: string } | null>(null)
  const [runs, setRuns] = useState<Record<string, Report | "failed">>({})
  const fetching = useRef(new Set<string>())
  // Back from Stripe with a bought report: which site, since when, and whether it is taking long.
  const [unlocking, setUnlocking] = useState<{ domain: string; since: number } | null>(null)
  const [unlockSlow, setUnlockSlow] = useState(false)
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
        if (!r.ok || !j.domain || j.error) {
          // report_limit names the domain as the server spells it: the report is bought for that one.
          const domain = (j.error === "report_limit" && j.domain) || bare(site)
          setFollowErr({ domain, error: j.error ?? "unavailable" })
          track("geo_follow_failed", { domain, error: j.error })
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
      const unlocked = params.get("unlocked") === "1"
      if (!site) {
        try {
          const h = JSON.parse(localStorage.getItem("itg_geo_handoff") ?? "null") as { site?: string; at?: number } | null
          if (h?.site && Date.now() - (h.at ?? 0) < 86_400_000) site = bare(h.site)
        } catch {}
      }
      const list = await load()
      if (site && unlocked) {
        // A bought report: the webhook unlocks the site (and follows it, if it is a new one). Not
        // following it from here, which the account's report limit would refuse in the meantime.
        setActive(site)
        setUnlocking({ domain: site, since: Date.now() })
        track("geo_research_return", { domain: site })
      } else if (site && list && !list.some((s) => s.domain === site)) await follow(site)
      else if (site) setActive(site)
      if (params.has("site") || unlocked) window.history.replaceState(null, "", window.location.pathname)
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

  // After the purchase: ask again every few seconds until the site reads as unlocked.
  const bought = unlocking ? sites?.find((s) => s.domain === unlocking.domain) : undefined
  const unlockedNow = Boolean(bought && !isPreview(bought))
  useEffect(() => {
    if (!unlocking || unlockedNow) return
    const t = setInterval(() => {
      if (Date.now() - unlocking.since > UNLOCK_WAIT_MS) {
        clearInterval(t)
        setUnlockSlow(true)
        return
      }
      load()
    }, UNLOCK_POLL_MS)
    return () => clearInterval(t)
  }, [unlocking, unlockedNow, load])

  // The latest report and the day-0 one are in the payload; any other is fetched once when opened.
  const opened = site && openRun?.domain === site.domain ? openRun.id : null
  const runKey = site && opened && opened !== site.baseline?.id ? `${opened}:${site.access ?? "full"}` : null
  useEffect(() => {
    if (!runKey || runs[runKey] || fetching.current.has(runKey)) return
    fetching.current.add(runKey)
    fetch(`/api/geo/report/run?id=${encodeURIComponent(runKey.split(":")[0])}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { report: Report }) => setRuns((c) => ({ ...c, [runKey]: j.report })))
      .catch(() => setRuns((c) => ({ ...c, [runKey]: "failed" })))
      .finally(() => fetching.current.delete(runKey))
  }, [runKey, runs])

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
  // On the plan, or a client we set up by hand: no unlock, no offer; the plan is the day-0 report's,
  // each step with where it stands.
  const client = site ? onPlan(site) : false
  // The server's rule for a new site, as a hint before anyone types: sites neither bought nor on the
  // plan (a client we set up by hand reads as unlocked everywhere, and has no limit).
  const reportUsed = sites.filter(isPreview).length >= REPORT_SITES
  const run = !site || !opened ? null : opened === site.baseline?.id ? site.baseline : (runKey && runs[runKey]) || "loading"
  // The latest report is the page itself: opening it goes back.
  const showRun = (id: string) => {
    if (!site) return
    setOpenRun(id === site.latest?.id ? null : { domain: site.domain, id })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const showDay0 = () => {
    if (site?.baseline?.id) showRun(site.baseline.id)
  }
  const retryRun = () =>
    setRuns((c) => {
      const next = { ...c }
      if (runKey) delete next[runKey]
      return next
    })

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
        {site && (
          <div className="mt-3 empty:hidden">
            <CreditNote site={site} />
          </div>
        )}
      </header>

      {unlocking &&
        (unlockedNow ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 sm:px-5 py-3.5 flex items-start gap-3">
            <p className="flex-1 text-sm text-green-900 leading-relaxed">
              <b>Unlocked.</b>{" "}
              {bought?.latest
                ? `The full report for ${unlocking.domain} is below.`
                : `Your report for ${unlocking.domain} is being built; all of it opens here when it's ready.`}
            </p>
            <button type="button" onClick={() => setUnlocking(null)} aria-label="Dismiss" className="text-xl leading-none text-green-800/60 hover:text-green-900">
              ×
            </button>
          </div>
        ) : unlockSlow ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 sm:px-5 py-3.5 text-sm text-amber-900 leading-relaxed">
            <b>Not unlocked yet.</b> A payment can take a minute to confirm. Refresh this page shortly; if {unlocking.domain} is still
            locked,{" "}
            <a href="/business/dashboard/support" className="font-semibold underline">
              write to us
            </a>
            .
          </div>
        ) : (
          <div className="rounded-2xl bg-violet-50 border border-violet-200 px-4 sm:px-5 py-3.5 flex items-center gap-3 text-sm text-violet-900">
            <span aria-hidden className="w-4 h-4 shrink-0 rounded-full border-2 border-violet-300 border-t-violet-700 animate-spin" />
            <span>
              <b>Thank you.</b> Unlocking the full report for {unlocking.domain}. This takes a few seconds.
            </span>
          </div>
        ))}

      {loadFailed && (
        <div className={`${card} text-sm text-slate-700`}>We couldn&apos;t load your report just now. It retries on its own; you can also refresh.</div>
      )}

      {(!site || showAdd || followErr) && (
        <AddSite onAdd={follow} busy={adding} error={followErr} first={!site} reportUsed={Boolean(site) && reportUsed} />
      )}

      {site && (
        <>
          {site.pending && <Banner pending={site.pending} />}

          {site.latest ? (
            <>
              {/* The detailed cards come from the fullest report: this week's on the plan, else the
                  day-0 report (a short weekly check is five questions). */}
              {run ? (
                <RunView key={opened} site={site} run={run} onBack={() => setOpenRun(null)} onRetry={retryRun} />
              ) : (
                <ReportSections site={site} onToggleBase={showDay0} onOpenRun={showRun} />
              )}
              <History site={site} openId={opened} onOpen={showRun} />
              <Crawlers audit={audit} />
              <YourPlan site={site} steps={planSteps(site, audit, client)} ready mode={client ? "client" : "offer"} />
            </>
          ) : (
            <>
              {site.failed && !site.pending && (
                <section className="rounded-2xl bg-red-50 border border-red-200 p-5">
                  <p className="font-bold text-red-900">We couldn&apos;t finish your report for {site.domain}</p>
                  <p className="text-sm text-red-900/80 mt-1">Something failed on our side or at one of the assistants. You can start it again.</p>
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
                <YourPlan site={site} steps={[]} ready={false} mode={client ? "client" : "offer"} />
              </div>
              <Pending title="Sites the assistants rely on" />
            </>
          )}
        </>
      )}
    </div>
  )
}
