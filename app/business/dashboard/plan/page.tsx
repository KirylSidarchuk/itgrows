"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { card, fmtDate, fullReport, onPlan, planSteps, type SiteReport } from "../visibility/parts"
import { SAMPLE_PATH, YEAR_DISCOUNT, firstPaymentCents, setupFree, usd, type GeoPrices } from "@/lib/geo-pricing"

// The plan, for one site, and its billing. It is a service, not a guide: the page says who does
// what before it asks for money — we write, publish, fix indexing, prepare the places the
// assistants quote and measure; from the client only what needs their own login or approval. What
// we would do first is read from the site's own report: the first articles are the first Article
// steps of "Your plan" (visibility/parts.tsx planSteps, in its order), questions where others are
// named and it is not, never a list question (lib/geo-list-question.ts); the directories,
// marketplaces, media and discussions the assistants cite become the places we prepare.
//
// Three ways to pay, at the account's own prices (/api/geo/report price, lib/geo-price-test.ts: the
// price test's variant, or the one price): by the month plus the one-time setup, 3 months upfront, or
// a year (both with the setup free). This is the only place, with the end of the report, that names a
// plan price; showing it is counted per variant (/api/geo/plan-view: geo_plan_view). Without the
// prices (they could not be read) the page names none and offers no checkout. The setup is once per
// site: a site that has had a paid plan before, by anyone, reads "<month> a month" with no setup and a
// first payment of one month, exactly what /api/geo/checkout charges (the report's setupPaid, and where that says no,
// /api/geo/launch/setup, which decides as checkout does). A choice made
// on the pricing block arrives as ?interval= (through sign-up, and kept for a day in case the site
// has to be added first): the page opens on it and marks it. An account without a site enters it
// here: /api/geo/follow reads it with plan intent (no free-report limit applies, as nothing free is
// given: the site is not followed and no report queued), checkout opens for it unfollowed ("add"),
// and the Stripe webhook follows it and queues its report once the plan is paid (lib/geo-business.ts
// followPaidSite). Back from paying for such a site before the webhook has followed it, the page says
// "Payment received" and asks for the list again until the site is in it.
//
// A site on the plan, or of a client we set up by hand (site.client), shows "Plan & billing": the
// plan, the places with "We're on it", Cancel plan (/api/geo/cancel: stops at the end of the paid
// period, with undo) and Card and invoices (/api/geo/portal, which cannot cancel or switch plans).

type Interval = "month" | "quarter" | "year"

const WE_DO = [
  "Write articles that answer the questions your buyers ask, with sources, in your language, and publish them on your domain",
  "Fix crawler access and indexing: robots.txt, sitemaps, Bing and Google, IndexNow",
  "Prepare your profiles and listings on the sites the assistants quote, and the letters to their editors",
  "Put all 20 questions to ChatGPT, Claude, Gemini and Perplexity, 3 asks each, every two weeks",
  "A monthly report, read by a person before it reaches you",
]

const ARTICLES_YOU = "You see every article 2 days before it goes live, and can edit or stop it."

const YOU_DO = [
  ARTICLES_YOU,
  "Once, at the start: one DNS record for the blog (or one rule your developer adds), and a link to the blog in your site's menu. We give you the exact lines.",
  "What needs your own login or approval on the sites the assistants quote: claiming a profile, approving a letter.",
]

/** The billing line of a plan the site has, at the prices it was bought at (/api/geo/report paidPrice). */
function billed(p: GeoPrices, interval: string): string | null {
  if (interval === "month") return `${p.month.label} a month`
  if (interval === "quarter") return `${p.quarter.label} every 3 months`
  if (interval === "year") return `${p.year.label} a year`
  return null
}

const YEAR_OFF = `${Math.round(YEAR_DISCOUNT * 100)}% off`

const INTERVALS: Interval[] = ["month", "quarter", "year"]
const CHOICE_KEY = "itg_geo_interval"
const CHOICE_TTL_MS = 86_400_000

/** The billing period chosen on the pricing block: from the address, else remembered from it. */
function chosenInterval(params: URLSearchParams): Interval | null {
  let v = params.get("interval")
  try {
    if (v) localStorage.setItem(CHOICE_KEY, JSON.stringify({ v, at: Date.now() }))
    else {
      const c = JSON.parse(localStorage.getItem(CHOICE_KEY) ?? "null") as { v?: string; at?: number } | null
      if (c?.v && Date.now() - (c.at ?? 0) < CHOICE_TTL_MS) v = c.v
    }
  } catch {}
  return INTERVALS.includes(v as Interval) ? (v as Interval) : null
}

// The places the assistants quote instead of the client, by the type lib/geo_check gives a source.
// We prepare everything; from the client only what needs their own login or approval. A competitor
// is never a place: its site is a question our own article answers better (a step in the report).
const PLACE: Record<string, { tag: string; what: string; we: string; you: string }> = {
  directory: {
    tag: "Directory & reviews",
    what: "A directory with reviews: the assistants read the profiles here.",
    we: "We prepare your profile: the text and every field, matching your site.",
    you: "Signing in to claim the profile (it has to be your own login), and approving the text.",
  },
  marketplace: {
    tag: "Marketplace",
    what: "A marketplace: the assistants read the listings here.",
    we: "We prepare your listing: the text and every field, matching your site.",
    you: "Signing in to open the listing (it has to be your own login), and approving the text.",
  },
  roundup: {
    tag: "Media & guides",
    what: "An article or guide that lists providers.",
    we: "We find the article that covers your service and its editor, and write the letter to the editor.",
    you: "Approving the letter: it goes out from your address.",
  },
  news: {
    tag: "News & media",
    what: "A news site the assistants quote.",
    we: "We find the journalist who covers your field and write the pitch: a story, data or a comment they can use.",
    you: "Approving the pitch: it goes out from your address.",
  },
  community: {
    tag: "Community",
    what: "Discussions the assistants read.",
    we: "We prepare the answers for the discussions where your buyers ask these questions.",
    you: "Posting them from your own account (it has to be your login).",
  },
}
const MAX_PLACES = 6

const FOLLOW_ERRORS: Record<string, string> = {
  invalid_url: "That doesn't look like a website address. Enter it like yourcompany.com.",
  unreachable: "We couldn't open that site. Check the address, or write to us.",
  questions_failed: "We couldn't read enough text on that site. Write to us and we set it up with you.",
  limit_user: "An account follows up to 3 sites.",
  limit_reads: "That's a lot of new sites for one day. Try again tomorrow, or write to us.",
}

const CHECKOUT_FAILED = "Checkout did not open. Try again in a minute."

function plan(site: SiteReport) {
  const full = fullReport(site)
  if (!full) return { questions: [] as string[], places: [] as { domain: string; count: number; type: string }[] }
  // The questions of the first Article steps of "Your plan" as the offer shows it: never a list question.
  const questions = planSteps(site, undefined).flatMap((st) => (st.q !== undefined ? [st.q] : [])).slice(0, 5)
  const own = (d: string) => d === site.domain || d.endsWith(`.${site.domain}`)
  const places = (full.summary.sources ?? [])
    .filter((s) => s.type !== "competitor" && PLACE[s.type] && !own(s.domain))
    .slice(0, MAX_PLACES)
  return { questions, places }
}

function Places({
  places,
  working,
}: {
  places: { domain: string; count: number; type: string }[]
  /** On the plan: every place reads "We're on it". */
  working: boolean
}) {
  if (!places.length) return null
  const lead = "font-semibold text-[#1b1916]"
  const chip = "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
  return (
    <section className={card}>
      <h2 className="font-bold text-lg">The places the assistants quote instead of you</h2>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
        We prepare everything (profile text, the letter to the editor...); from you only what needs your own login or approval.
      </p>
      <ul className="mt-4 space-y-3">
        {places.map((p) => {
          const t = PLACE[p.type]
          return (
            <li key={p.domain} className="rounded-xl border border-black/[0.07] bg-white p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <a href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-semibold break-all hover:text-violet-700">
                  {p.domain}
                </a>
                <span className={`${chip} text-slate-600 bg-[#f8f7f6]`}>{t.tag}</span>
                {working && <span className={`${chip} text-green-800 bg-green-50 border border-green-200`}>We&apos;re on it</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {`${t.what} Cited in ${p.count} answer${p.count === 1 ? "" : "s"} to your buyers' questions.`}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                <span className={lead}>We do: </span>
                {t.we}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                <span className={lead}>From you: </span>
                {t.you}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Choice({
  title,
  lines,
  cta,
  busyText,
  disabled,
  picked,
  onClick,
}: {
  title: string
  lines: React.ReactNode[]
  cta: string
  /** Set while this option is opening checkout. */
  busyText: string | null
  disabled: boolean
  /** The option chosen on the pricing block. */
  picked: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 flex flex-col border ${
        picked ? "bg-white/[0.1] border-violet-300 ring-2 ring-violet-400/50" : "bg-white/[0.06] border-white/15"
      }`}
    >
      {picked && <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300 mb-1">Your choice</p>}
      <p className="font-extrabold text-lg leading-snug">{title}</p>
      <div className="mt-1.5 space-y-0.5 text-sm text-white/70 flex-1">
        {lines.map((l, i) => <p key={i}>{l}</p>)}
      </div>
      <button type="button" onClick={onClick} disabled={disabled}
        className="mt-4 rounded-xl bg-white text-[#1b1916] hover:bg-violet-50 disabled:opacity-60 px-5 py-3 text-sm font-bold">
        {busyText ?? cta}
      </button>
    </div>
  )
}

const CANCEL_FAILED = "That didn't go through. Try again in a minute, or write to us."

/** Cancel plan, at the end of the paid period, and Keep my plan to undo it: /api/geo/cancel, which
 *  touches only this site's plan subscription. Shows nothing while it loads, or when Stripe has no
 *  live plan subscription for the site. */
function CancelPlan({ domain }: { domain: string }) {
  const [state, setState] = useState<{ cancelAt: string | null; periodEnd: string | null } | "loading" | "none">("loading")
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let current = true
    fetch(`/api/geo/cancel?domain=${encodeURIComponent(domain)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { cancelAt?: string | null; periodEnd?: string | null }
        if (current) setState(r.status === 404 ? "none" : { cancelAt: j.cancelAt ?? null, periodEnd: j.periodEnd ?? null })
      })
      .catch(() => {
        if (current) setState({ cancelAt: null, periodEnd: null })
      })
    return () => {
      current = false
    }
  }, [domain])

  async function send(undo: boolean) {
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/geo/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, undo }),
      })
      const j = (await r.json().catch(() => ({}))) as { cancelAt?: string | null; error?: string }
      if (r.ok) {
        setState((s) => ({ cancelAt: j.cancelAt ?? null, periodEnd: (typeof s === "object" ? s.periodEnd : null) ?? j.cancelAt ?? null }))
        setConfirming(false)
      } else {
        setError(j.error === "no_subscription" ? "We couldn't find the subscription for this site. Write to us and we sort it out." : CANCEL_FAILED)
      }
    } catch {
      setError(CANCEL_FAILED)
    }
    setBusy(false)
  }

  if (typeof state !== "object") return null
  const secondary =
    "rounded-xl bg-white border border-black/15 hover:bg-[#f8f7f6] disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-[#1b1916]"
  return (
    <div>
      {state.cancelAt ? (
        <>
          <p className="text-sm font-semibold text-[#1b1916]">Cancels on {fmtDate(state.cancelAt)}</p>
          <button type="button" onClick={() => send(true)} disabled={busy} className={`mt-3 ${secondary}`}>
            {busy ? "Saving…" : "Keep my plan"}
          </button>
        </>
      ) : confirming ? (
        <div className="rounded-xl border border-black/[0.07] bg-[#f8f7f6] p-4" role="alertdialog" aria-label="Cancel plan">
          <p className="text-sm text-[#1b1916]">
            Your plan stays active until {state.periodEnd ? fmtDate(state.periodEnd) : "the end of the paid period"}, then stops. Cancel?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => send(false)} disabled={busy}
              className="rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-semibold">
              {busy ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={secondary}>
              Keep my plan
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)}
          className="text-sm font-semibold text-slate-600 hover:text-red-700 hover:underline underline-offset-2">
          Cancel plan
        </button>
      )}
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  )
}

/** Card and invoices: a Stripe Billing Portal session from /api/geo/portal (it cancels nothing). */
function ManageSubscription() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function open() {
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/geo/portal", { method: "POST" })
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
      if (j.url) {
        window.location.assign(j.url)
        return
      }
      setError(
        j.error === "no_billing" || j.error === "no_plan"
          ? "We couldn't find your billing yet. If you've just paid, try again in a few minutes, or write to us."
          : "The billing page did not open. Try again in a minute, or write to us.",
      )
    } catch {
      setError("The billing page did not open. Try again in a minute, or write to us.")
    }
    setBusy(false)
  }
  return (
    <div>
      <button type="button" onClick={open} disabled={busy}
        className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-5 py-3 text-sm font-semibold">
        {busy ? "Opening…" : "Card and invoices"}
      </button>
      <p className="text-xs text-slate-500 mt-2">Change your card, download invoices.</p>
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  )
}

/** What the launch will need from the client, from the site's own check (GET /api/geo/launch/needs):
 *  titles only, before the payment choices. The first time a site is checked this takes most of a
 *  minute; until then, and when nothing is needed, the block is not shown. */
function LaunchNeeds({ domain }: { domain: string }) {
  const [needs, setNeeds] = useState<{ key: string; title: string; optional?: boolean }[] | null>(null)
  useEffect(() => {
    let current = true
    fetch(`/api/geo/launch/needs?site=${encodeURIComponent(domain)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (r.ok ? await r.json().catch(() => ({})) : {}) as { items?: { key: string; title: string; optional?: boolean }[] }
        if (current) setNeeds(j.items ?? [])
      })
      .catch(() => {
        if (current) setNeeds([])
      })
    return () => {
      current = false
    }
  }, [domain])
  if (!needs?.length) return null
  return (
    <div className="mt-6 rounded-xl bg-white/[0.06] border border-white/15 p-4 sm:p-5">
      <h2 className="font-extrabold text-lg">To launch, we&apos;ll need from you (about 15 minutes)</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-white/85">
        {needs.map((n) => (
          <li key={n.key} className="flex gap-2">
            <span className="text-violet-300">→</span>
            {n.optional ? `${n.title} (if you use it)` : n.title}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-white/60">We send the exact steps after you start.</p>
    </div>
  )
}

/** The site's one-time setup is paid already, by our records (/api/geo/report setupPaid). */
const reportSetupPaid = (s: SiteReport) => (s as SiteReport & { setupPaid?: boolean }).setupPaid === true

type Loaded = { sites: SiteReport[]; prices: { now: GeoPrices; paid: GeoPrices } | null }

/** The signed-in account's sites, each cut to what it has paid for (lib/geo-report.ts), and its plan
 *  prices: what a new plan costs it, and what a plan it has was bought at. */
async function loadSites(): Promise<Loaded> {
  const r = await fetch("/api/geo/report", { cache: "no-store" })
  const j = (r.ok ? await r.json() : { sites: [] }) as { sites?: SiteReport[]; price?: GeoPrices | null; paidPrice?: GeoPrices | null }
  return { sites: j.sites ?? [], prices: j.price && j.paidPrice ? { now: j.price, paid: j.paidPrice } : null }
}

export default function PlanPage() {
  const [sites, setSites] = useState<SiteReport[] | null>(null)
  const [prices, setPrices] = useState<Loaded["prices"]>(null)
  const [domain, setDomain] = useState("")
  const [justPaid, setJustPaid] = useState(false)
  const [busy, setBusy] = useState<{ interval: Interval; stage: "follow" | "checkout" } | null>(null)
  const [error, setError] = useState("")
  const [picked, setPicked] = useState<Interval | null>(null)
  // An account without a site enters it here.
  const [newSite, setNewSite] = useState("")
  // Per site: the setup paid before as checkout decides it (Stripe included), where the report said no.
  const [setupAsked, setSetupAsked] = useState<Record<string, boolean>>({})
  // Back from paying for a site the webhook has not followed yet (it was bought unfollowed).
  const [paidFor, setPaidFor] = useState("")

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const chosen = chosenInterval(p)
    loadSites()
      .then(({ sites: list, prices: loaded }) => {
        if (chosen) setPicked(chosen)
        setJustPaid(p.get("paid") === "1")
        setPrices(loaded)
        setSites(list)
        const asked = p.get("site")
        const known = list.some((s) => s.domain === asked)
        setDomain(asked && known ? asked : (list[0]?.domain ?? ""))
        if (asked && !known && p.get("paid") === "1") setPaidFor(asked)
        else if (!list.length && asked) setNewSite(asked)
      })
      .catch(() => setSites([]))
  }, [])

  // The webhook follows a site bought unfollowed within seconds: ask for the list until it is in it.
  useEffect(() => {
    if (!paidFor) return
    let tries = 0
    const t = setInterval(() => {
      if (++tries >= 36) clearInterval(t)
      loadSites()
        .then(({ sites: list }) => {
          if (!list.some((s) => s.domain === paidFor)) return
          clearInterval(t)
          setSites(list)
          setDomain(paidFor)
          setPaidFor("")
        })
        .catch(() => {})
    }, 5_000)
    return () => clearInterval(t)
  }, [paidFor])

  useEffect(() => {
    const s = sites?.find((x) => x.domain === domain)
    if (!s || onPlan(s) || reportSetupPaid(s) || s.domain in setupAsked) return
    let current = true
    fetch(`/api/geo/launch/setup?site=${encodeURIComponent(s.domain)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (r.ok ? await r.json().catch(() => ({})) : {}) as { setupPaid?: boolean }
        if (current && typeof j.setupPaid === "boolean") setSetupAsked((m) => ({ ...m, [s.domain]: j.setupPaid === true }))
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [sites, domain, setupAsked])

  // geo_plan_view: the prices were on screen, once per page load; the server records the variant.
  const viewSent = useRef(false)
  useEffect(() => {
    if (viewSent.current || sites === null || !prices || paidFor) return
    const s = sites.find((x) => x.domain === domain)
    if (s && (onPlan(s) || justPaid)) return
    viewSent.current = true
    fetch("/api/geo/plan-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: s?.domain ?? null }),
      keepalive: true,
    }).catch(() => {})
  }, [sites, prices, domain, justPaid, paidFor])

  async function start(interval: Interval) {
    setError("")
    let target = domain
    // A site the account does not follow yet: read with plan intent (followed only once paid), then
    // bought unfollowed.
    const adding = !sites?.some((s) => s.domain === domain)
    try {
      if (adding) {
        setBusy({ interval, stage: "follow" })
        const r = await fetch("/api/geo/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: newSite.trim(), plan: true }),
        })
        const j = (await r.json().catch(() => ({}))) as { domain?: string; error?: string }
        if (!r.ok || !j.domain) {
          setError(FOLLOW_ERRORS[j.error ?? ""] ?? "That didn't work. Try again in a minute, or write to us.")
          setBusy(null)
          return
        }
        target = j.domain
      }
      setBusy({ interval, stage: "checkout" })
      const r = await fetch("/api/geo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target, interval, ...(adding ? { add: true } : {}) }),
      })
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
      if (j.url) {
        window.location.assign(j.url)
        return
      }
      setError(
        j.error === "already_paid"
          ? "This site is already on the plan."
          : j.error === "limit_user"
            ? FOLLOW_ERRORS.limit_user
            : j.error === "not_followed" && !adding
              ? "Add this site to the AI visibility report first."
              : CHECKOUT_FAILED,
      )
    } catch {
      setError(CHECKOUT_FAILED)
    }
    setBusy(null)
  }

  if (sites === null) return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><div className="h-48 rounded-2xl bg-white/60 animate-pulse" /></div>

  const site = sites.find((s) => s.domain === domain) ?? null
  const working = site ? onPlan(site) : false
  const paid = site?.plan === "paid"
  const { questions, places } = site ? plan(site) : { questions: [], places: [] }
  const named = site?.latest?.summary.named
  const of = site?.latest?.summary.of
  const forSite = site?.domain ?? (newSite.trim() || "your site")
  // The site has had a paid plan before: the month-to-month plan starts without the setup.
  const setupPaid = site ? reportSetupPaid(site) || setupAsked[site.domain] === true : false
  const P = prices?.now
  const firstCents = (p: GeoPrices, i: Interval) => firstPaymentCents(p, i) - (!setupFree(i) && setupPaid ? p.setup.cents : 0)
  const billedLine = site?.planInterval && prices ? billed(prices.paid, site.planInterval) : null

  const busyText = (i: Interval) =>
    busy?.interval === i ? (busy.stage === "follow" ? "Reading your site… up to a minute" : "Opening checkout…") : null
  const firstPayment = (p: GeoPrices, i: Interval) => <>First payment {usd(firstCents(p, i))}</>
  const choice = (i: Interval, title: string, lines: React.ReactNode[], cta: string) => (
    <Choice
      key={i}
      title={title}
      lines={lines.filter(Boolean)}
      cta={cta}
      busyText={busyText(i)}
      disabled={busy !== null || (!site && newSite.trim().length < 3)}
      picked={picked === i}
      onClick={() => start(i)}
    />
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{working || paidFor ? "Plan & billing" : "Articles written for you"}</h1>
        {site && !paidFor && <p className="text-sm text-slate-600 mt-1">{[site.business, site.domain].filter(Boolean).join(" · ")}</p>}
        {!working && !paidFor && (
          <p className="text-sm text-[#1b1916] mt-2 max-w-2xl">
            We do this for you: on the plan we write, publish and measure for {forSite}. {ARTICLES_YOU} The report shows where you are
            missing; the plan is us doing the work.
          </p>
        )}
        {sites.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sites.map((s) => (
              <button key={s.domain} type="button" onClick={() => setDomain(s.domain)}
                className={`text-sm rounded-full px-3.5 py-1.5 font-medium ${s.domain === domain ? "bg-violet-600 text-white" : "bg-white/70 text-slate-700"}`}>
                {s.domain}
              </button>
            ))}
          </div>
        )}
      </header>

      {paidFor ? (
        <section className="rounded-2xl bg-green-50 border border-green-200 p-6" aria-live="polite">
          <h2 className="font-extrabold text-lg text-green-900">Payment received — setting things up</h2>
          <p className="mt-2 text-sm text-green-900 break-words">
            We&apos;re adding {paidFor} to your account and starting its full AI visibility report. This page updates on its own; if it
            hasn&apos;t in a few minutes, reload it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/business/dashboard/support" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Write to us</Link>
          </div>
        </section>
      ) : site && (working || justPaid) ? (
        <>
          <section className="rounded-2xl bg-green-50 border border-green-200 p-6">
            <h2 className="font-extrabold text-lg text-green-900">{justPaid && !working ? "Payment received — setting things up" : "Your plan is active"}</h2>
            {site.client && !paid ? (
              <p className="mt-2 text-sm text-green-900">
                We&apos;re on it for {site.domain}: the articles, the fixes and the places below. {ARTICLES_YOU}
              </p>
            ) : (
              <ol className="mt-3 space-y-2 text-sm text-green-900 list-decimal pl-5">
                <li>Within one business day we email you to connect publishing to {site.domain}: a blog we host at blog.{site.domain} or {site.domain}/blog, or your WordPress.</li>
                <li>{ARTICLES_YOU} Each one is ready 2 days before its date and we email you; untouched, it goes live on the date.</li>
                <li>Every two weeks we run the full check: 20 questions, 4 assistants, 3 asks.</li>
              </ol>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/business/dashboard/articles" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Your articles</Link>
              <Link href="/business/dashboard/settings" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Your website</Link>
              <Link href="/business/dashboard/support" className="rounded-xl bg-white border border-green-200 px-4 py-2.5 text-sm font-semibold">Write to us</Link>
            </div>
          </section>

          <section className={card}>
            <h2 className="font-bold text-lg">Billing</h2>
            {paid ? (
              <>
                <p className="text-sm text-slate-600 mt-1">
                  AI visibility for {site.domain}
                  {billedLine ? <>: <b className="text-[#1b1916]">{billedLine}</b></> : null}.
                </p>
                <div className="mt-4 space-y-5">
                  <ManageSubscription />
                  <CancelPlan key={site.domain} domain={site.domain} />
                </div>
              </>
            ) : site.client ? (
              <p className="text-sm text-slate-600 mt-1">
                Billing for {site.domain} is arranged with us directly.{" "}
                <Link href="/business/dashboard/support" className="font-semibold text-violet-700 hover:underline">Write to us</Link> about it.
              </p>
            ) : (
              <p className="text-sm text-slate-600 mt-1">Your subscription shows here within a few minutes of payment; reload the page then.</p>
            )}
          </section>

          <Places places={places} working />
        </>
      ) : (
        <>
          {site ? (
            <section className={card}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Where you stand</p>
              <p className="mt-2 text-lg font-bold">
                {named !== undefined ? <>Named in {named} of {of} answers{site.latest ? <> · {fmtDate(site.latest.finishedAt)}</> : null}.</> : <>Your report is still being built.</>}
              </p>
              {questions.length > 0 && (
                <>
                  <h2 className="font-bold mt-5">The first articles we would write for you</h2>
                  <p className="text-xs text-slate-500 mt-1">Questions where the assistants named others and not you.</p>
                  <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm">
                    {questions.map((q) => <li key={q}>{q}</li>)}
                  </ol>
                </>
              )}
            </section>
          ) : (
            <section className={card}>
              <h2 className="font-bold text-lg">Your website</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Enter your website, then choose how you pay. Your full AI visibility report comes with the plan: we start building it as soon
                as your payment goes through.
              </p>
              <input
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                disabled={busy !== null}
                placeholder="yourcompany.com"
                aria-label="Your website address"
                className="mt-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </section>
          )}

          {site && <Places places={places} working={false} />}

          <section className="rounded-2xl bg-[#1b1916] text-white p-6 sm:p-7">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h2 className="font-extrabold text-xl">What we do</h2>
                <ul className="mt-3 space-y-2 text-sm text-white/85">
                  {WE_DO.map((i) => <li key={i} className="flex gap-2"><span className="text-violet-300">✓</span>{i}</li>)}
                </ul>
              </div>
              <div>
                <h2 className="font-extrabold text-xl">What you do</h2>
                <ul className="mt-3 space-y-2 text-sm text-white/85">
                  {YOU_DO.map((i) => <li key={i} className="flex gap-2"><span className="text-violet-300">→</span>{i}</li>)}
                </ul>
              </div>
            </div>
            <p className="text-sm text-white/60 mt-5">No one can promise that assistants will name you. We promise the work and an honest count every two weeks.</p>

            {site && <LaunchNeeds key={site.domain} domain={site.domain} />}

            <h2 className="mt-6 font-extrabold text-xl break-all">Start for {forSite}</h2>

            {P ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {choice(
                  "month",
                  setupPaid ? `${P.month.label} a month` : `${P.month.label} a month + ${P.setup.label} setup`,
                  [
                    firstPayment(P, "month"),
                    setupPaid
                      ? "Billed monthly."
                      : `Billed monthly. The ${P.setup.label} setup is one-time: your site and its indexes made ready, with a launch report.`,
                  ],
                  "Start monthly",
                )}
                {choice(
                  "quarter",
                  `${P.quarter.label} for 3 months upfront`,
                  [firstPayment(P, "quarter"), `${P.quarter.perMonth} a month, billed every 3 months.${setupPaid ? "" : " Setup free."}`],
                  "Pay 3 months",
                )}
                {choice(
                  "year",
                  `${P.year.label} for a year`,
                  [firstPayment(P, "year"), `${P.year.perMonth} a month, ${YEAR_OFF}.${setupPaid ? "" : " Setup free."}`],
                  "Pay a year",
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/80">
                Your prices did not load. Reload the page in a minute, or{" "}
                <Link href="/business/dashboard/support" className="font-semibold text-violet-200 hover:text-white hover:underline">write to us</Link>.
              </p>
            )}

            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
            <p className="mt-4 text-sm">
              <Link href={SAMPLE_PATH} className="font-semibold text-violet-200 hover:text-white hover:underline">
                See a real report →
              </Link>
            </p>
            <p className="text-xs text-white/50 mt-3">
              Secure payment by Stripe. Cancel any time on this page once your plan is active: it stops at the end of the paid period.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
