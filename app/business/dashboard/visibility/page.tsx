"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AddSite,
  Banner,
  Crawlers,
  FirstLook,
  History,
  NamedInstead,
  OpeningSite,
  Pending,
  ReportSections,
  RunView,
  WhereNamed,
  YourPlan,
  card,
  fmtDate,
  onPlan,
  planSteps,
  REPORT_USED,
  type Audit,
  type Report,
  type SiteReport,
} from "./parts"
import type { GeoPrices } from "@/lib/geo-pricing"

// The AI-visibility report: where a new account lands after the quick check on the site, and where
// a client sees the weekly count. Arriving with ?site= (or the check's handoff) follows that site,
// which queues the day-0 report on the VM; the page then follows it to completion.
//
// The detailed report is free and shown whole (since 27 Oct 2026). One per account and one per
// connection: past that /api/geo/follow answers "report_limit" (402) or "report_ip_used" (429) and the
// page says "contact us and we'll run it for you" (parts.tsx AddSite), never a price. Whether a new site
// would be refused comes with the list (/api/geo/report reportLimit, lib/geo-free-report.ts): the hint
// under "Add a site" shows only then, and an account without a site that was refused sees the
// contact-us state again after a reload, not the empty form. The report ends with "Your plan": what we
// do, never how to do it yourself; "Start the plan" and "Talk to us".
//
// A new account lands here straight from the sign-up: while the site it came with is being followed, the
// first screen says "Opening your answers for …" (not an empty address form). If that follow fails, the
// site stays in the address and the check's handoff stays in localStorage, and the page offers to try
// again (the next visit retries too); only an answer a retry cannot change (report_limit,
// report_ip_used, limit_user, invalid_url) lets them go, and the form shows it.
//
// Under the report, the history lists every finished report of the site; a row (or a bar of the
// trend, or "View day-0 report") opens that report in place of this week's, until "Back".

// Same conversion the email report fires: a visitor of the quick check left a way to reach them.
// Fired once per site per browser, when the follow succeeds.
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

// Errors of /api/geo/follow that trying again cannot change.
const FINAL_ERRORS = new Set([...REPORT_USED, "limit_user", "invalid_url"])

// The site the visitor came with is in: tidy the address bar and drop the quick check's handoff.
function forgetArrival() {
  const params = new URLSearchParams(window.location.search)
  if (params.has("site") || params.has("unlocked")) window.history.replaceState(null, "", window.location.pathname)
  try {
    localStorage.removeItem("itg_geo_handoff")
    // Signed in now: the pricing block on "/" stops offering this site's sign-up.
    localStorage.removeItem("itg_geo_checked")
  } catch {}
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
  // What /api/geo/follow would answer now for a new site ("report_limit" / "report_ip_used"), or null.
  const [reportLimit, setReportLimit] = useState<string | null>(null)
  // The account's plan prices, for the end of the report (lib/geo-price-test.ts); null: no price named.
  const [price, setPrice] = useState<GeoPrices | null>(null)
  // The site the visitor came with (?site= or the quick check's handoff), until it is followed.
  const [opening, setOpening] = useState<string | null>(null)
  const [audits, setAudits] = useState<Record<string, Audit | "failed">>({})
  // A report opened from the history, and the ones fetched so far, by run.
  const [openRun, setOpenRun] = useState<{ domain: string; id: string } | null>(null)
  const [runs, setRuns] = useState<Record<string, Report | "failed">>({})
  const fetching = useRef(new Set<string>())
  const started = useRef(false)
  // Whether the last list load worked, and a site followed while it did not: "Opening…" stays on screen
  // until a load brings the list (it is asked again while loading fails), not the empty address form.
  const listOk = useRef(true)
  const [awaitingList, setAwaitingList] = useState(false)
  const awaiting = useRef(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/geo/report", { cache: "no-store" })
      if (!r.ok) throw new Error(String(r.status))
      const j = (await r.json()) as { sites: SiteReport[]; reportLimit?: string | null; price?: GeoPrices | null }
      setSites(j.sites)
      setReportLimit(j.reportLimit ?? null)
      setPrice(j.price ?? null)
      setLoadFailed(false)
      listOk.current = true
      if (awaiting.current) {
        awaiting.current = false
        setAwaitingList(false)
        setOpening(null)
      }
      return j.sites
    } catch {
      listOk.current = false
      setLoadFailed(true)
      setSites((s) => s ?? [])
      return null
    }
  }, [])

  // Resolves to the error code, or null once the site is followed.
  const follow = useCallback(
    async (site: string): Promise<string | null> => {
      setAdding(true)
      setFollowErr(null)
      try {
        const r = await fetch("/api/geo/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site }),
        })
        if (r.status === 401) {
          // Signed out meanwhile: a retry here cannot work. Sign in again and come back to the same address
          // (it still names the site, and the hand-over is kept).
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
          return "unauthorized"
        }
        const j = (await r.json().catch(() => ({}))) as { domain?: string; status?: string; error?: string }
        if (!r.ok || !j.domain || j.error) {
          // Past the free report the server names the domain as it spells it: the contact-us note names it.
          const domain = (j.error && REPORT_USED.has(j.error) && j.domain) || bare(site)
          const error = j.error ?? "unavailable"
          setFollowErr({ domain, error })
          track("geo_follow_failed", { domain, error: j.error })
          return error
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
        return null
      } catch {
        // A dropped request: the server may not have it, so it is tried again like any other failure.
        setFollowErr({ domain: bare(site), error: "unavailable" })
        track("geo_follow_failed", { domain: bare(site), error: "network" })
        return "unavailable"
      } finally {
        setAdding(false)
      }
    },
    [load]
  )

  // Follow the site the visitor came with; it is let go once followed, or when retrying cannot help.
  const open = useCallback(
    async (site: string) => {
      setOpening(site)
      const error = await follow(site)
      if (error && !FINAL_ERRORS.has(error)) return
      forgetArrival()
      if (!error && !listOk.current) {
        // Followed, but the list did not load: keep saying "Opening…" until it does.
        awaiting.current = true
        setAwaitingList(true)
        return
      }
      setOpening(null)
    },
    [follow]
  )

  // "Check a different site" (and "+ Add a site" while the card is up): the address form instead.
  const checkOther = () => {
    awaiting.current = false
    setAwaitingList(false)
    setOpening(null)
    setFollowErr(null)
    setShowAdd(true)
    forgetArrival()
  }

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
      // Said at once, so the first screen is never the empty address form.
      if (site) setOpening(site)
      const list = await load()
      if (site && !list?.some((s) => s.domain === site)) {
        // A new site, or the list did not load (a site already followed answers at once).
        await open(site)
        return
      } else if (site) setActive(site)
      setOpening(null)
      forgetArrival()
    })()
  }, [load, open])

  const site = sites?.find((s) => s.domain === active) ?? sites?.[sites.length - 1]
  const anyPending = Boolean(sites?.some((s) => s.pending))

  useEffect(() => {
    if (!anyPending) return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [anyPending, load])

  // The list failed to load: ask again, as the notice says ("It retries on its own").
  useEffect(() => {
    if (!loadFailed || anyPending) return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [loadFailed, anyPending, load])

  // The latest report and the day-0 one are in the payload; any other is fetched once when opened.
  const opened = site && openRun?.domain === site.domain ? openRun.id : null
  const runKey = site && opened && opened !== site.baseline?.id ? opened : null
  useEffect(() => {
    if (!runKey || runs[runKey] || fetching.current.has(runKey)) return
    fetching.current.add(runKey)
    fetch(`/api/geo/report/run?id=${encodeURIComponent(runKey)}`, { cache: "no-store" })
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
  // On the plan, or a client we set up by hand: no offer; the plan is the day-0 report's, each step
  // with where it stands.
  const client = site ? onPlan(site) : false
  // The server's answer for a new site, before anyone types (/api/geo/report reportLimit): with a site
  // on screen a hint under "Add a site"; without one, the contact-us state in place of the empty form.
  const limited = reportLimit !== null && REPORT_USED.has(reportLimit) ? { domain: "", error: reportLimit } : null
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
              <button
                type="button"
                onClick={() => (opening && !adding ? checkOther() : setShowAdd((v) => !v))}
                className="text-sm text-violet-700 font-semibold hover:underline px-1"
              >
                + Add a site
              </button>
            )}
          </div>
        )}
      </header>

      {loadFailed && (
        <div className={`${card} text-sm text-slate-700`}>We couldn&apos;t load your report just now. It retries on its own; you can also refresh.</div>
      )}

      {opening ? (
        <OpeningSite
          domain={opening}
          busy={adding || awaitingList}
          error={followErr?.error ?? null}
          onRetry={() => {
            track("geo_open_retry", { domain: opening })
            open(opening)
          }}
          onOther={checkOther}
        />
      ) : (
        (!site || showAdd || followErr) && (
          <AddSite
            onAdd={follow}
            busy={adding}
            error={followErr ?? (site ? null : limited)}
            first={!site}
            reportUsed={Boolean(site) && limited !== null}
          />
        )
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
              <YourPlan site={site} steps={planSteps(site, audit, client)} ready mode={client ? "client" : "offer"} prices={price} />
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Crawlers audit={audit} />
                <YourPlan site={site} steps={[]} ready={false} mode={client ? "client" : "offer"} prices={price} />
              </div>
              <Pending title="Sites the assistants rely on" />
            </>
          )}
        </>
      )}
    </div>
  )
}
