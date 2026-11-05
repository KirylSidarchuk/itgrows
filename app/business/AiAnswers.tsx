"use client"

// Card A of the free check: what ChatGPT and Perplexity answer when this business's buyers ask.
// While it runs it shows real progress from the VM (stage, the questions as soon as they exist,
// answers in per assistant). The result shows the count, the first business named instead and one
// answer in full; the rest arrive as a number and as questions — there is no answer data in the page to
// un-blur. The offer sits right under who was named instead: an email, and the whole detailed report
// arrives there (a day-0 run takes a few minutes; the copy says "about 10"), with a free account opened
// for that email (app/api/geo/report-request/route.ts); Google and LinkedIn stay a link under the field.
// Under the answer comes that report, free once an account is created
// (lib/geo-pricing.ts), with a real one a click away. AuditForm owns the refs of the offer, the report card and the locked rows:
// it watches them for geo_cta_seen and for the phone bar. Each locked row says which assistants
// answered that question (the API sends their names, never the answers). A launch reward won on the
// website's wheel (signed out) is reminded at the first account offer (the one under who was named
// instead, else the free-report card) and in the failure boxes that offer an account
// (components/geo/GuestRewardNote.tsx "gate").

import { useState } from "react"
import Link from "next/link"
import GuestRewardNote from "@/components/geo/GuestRewardNote"
import { SAMPLE_PATH } from "@/lib/geo-pricing"
import { PROMO_WHEEL } from "@/lib/geo-promo"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config"
import { localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/aiAnswers"
// "Why X and not you?": X reads as a business like theirs (lib/geo-names.ts).
import { findName, headlineName, readsAsBusiness } from "@/lib/geo-names"

type M = (typeof ns)["en"]

export interface TeaserEngine {
  named: boolean
  cited: boolean
  failed: boolean
  /** The first business named, and how many more; the other names stay on the server. */
  namedInstead: string[]
  namedInsteadMore?: number
  /** The site's own pages among the sources, and how many other sites were quoted. */
  sources: string[]
  sourcesMore?: number
  snippet: string
  /** An answer that does not name this business: the assistant's own sentence about whom it names instead. */
  quote?: string
  /** The business that sentence is about, as the name is stored; "" when the route could not find one in it. */
  quoteName?: string
}

export interface TeaserView {
  id?: string
  status: "running" | "done" | "failed"
  domain?: string
  business?: string | null
  language?: string | null
  stage?: "reading" | "questions" | "asking" | "analysing"
  answered?: Record<string, number> | null
  total?: number
  questions?: string[]
  finishedAt?: string
  engines?: string[]
  summary?: {
    named: number
    of: number
    linked: number
    /** The answers that name some business, this one or another; `of` counts every answer. */
    withNames?: number
    engines: Record<string, { named: number; of: number; withNames?: number }>
    namedInstead: { name: string; count: number }[]
    /** How many more businesses were named; their names stay on the server. */
    namedInsteadMore?: number
  }
  open?: { n: number; q: string; engines: Record<string, TeaserEngine> }[]
  /** `answered`: the assistants that answered this question; missing from an older API response. */
  locked?: { n: number; q: string; answered?: string[] }[]
  error?: string
  reason?: string
}

const LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" }

const CTA_BUTTON =
  "mt-4 flex items-center justify-center w-full min-h-12 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"

/** Answers arrive as markdown; quoted on a card they should read as plain sentences. */
function plain(s: string) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\d+\]/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/(^|\s)[*_](\S)/g, "$1$2")
    .replace(/(\S)[*_](?=\s|$|[.,;:!?])/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\s+[-•]\s+/g, " · ")
    .replace(/\s+/g, " ")
    .trim()
}
const STAGES = ["reading", "questions", "asking", "analysing"]

type StepState = "todo" | "active" | "done"

function StepDot({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
        ✓
      </span>
    )
  if (state === "active")
    return <span className="w-5 h-5 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin shrink-0" />
  return <span className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
}

function Waiting({ view, elapsed }: { view: TeaserView | null; elapsed: number }) {
  const m = useT(ns)
  const at = Math.max(0, STAGES.indexOf(view?.stage ?? "reading"))
  const qs = view?.questions ?? []
  const total = view?.total ?? 5
  const ans = view?.answered ?? {}
  const inLanguage = (view?.language && (m.inLanguage as Readonly<Record<string, string | undefined>>)[view.language]) || ""
  const asking = (e: string): StepState => (at >= 3 || (ans[e] ?? 0) >= total ? "done" : at === 2 ? "active" : "todo")
  const steps: { label: string; state: StepState }[] = [
    { label: m.stepReading, state: at > 0 || qs.length ? "done" : "active" },
    { label: qs.length ? m.stepWrote(inLanguage) : m.stepWriting, state: qs.length ? "done" : at >= 1 ? "active" : "todo" },
    {
      label: at >= 2 ? m.stepAskingCount(LABEL.chatgpt, Math.min(ans.chatgpt ?? 0, total), total) : m.stepAsking(LABEL.chatgpt),
      state: asking("chatgpt"),
    },
    {
      label: at >= 2 ? m.stepAskingCount(LABEL.perplexity, Math.min(ans.perplexity ?? 0, total), total) : m.stepAsking(LABEL.perplexity),
      state: asking("perplexity"),
    },
    { label: m.stepChecking, state: at >= 3 ? "active" : "todo" },
  ]
  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-extrabold text-lg sm:text-xl leading-snug">{m.waitingTitle}</h3>
      <p className="text-sm text-slate-500 mt-1">{m.waitingSub}</p>
      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <StepDot state={s.state} />
            <span className={`text-sm ${s.state === "todo" ? "text-slate-400" : "text-[#1b1916]"} ${s.state === "active" ? "font-semibold" : ""}`}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      {elapsed >= 40 && (
        <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {m.slow}
        </p>
      )}
      {qs.length > 0 && (
        <div className="mt-6 animate-in fade-in duration-500">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">{m.yourQuestions}</p>
          <ol className="space-y-2">
            {qs.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-snug">
                <span className="text-slate-400 tabular-nums shrink-0">{i + 1}.</span>
                <span className="line-clamp-2">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function Chip({ a }: { a: TeaserEngine }) {
  const m = useT(ns)
  if (a.failed) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-slate-600 bg-slate-100 border-slate-200">{m.chipTimedOut}</span>
  if (a.named && a.cited) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">{m.chipNamedLinked}</span>
  if (a.named) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-amber-700 bg-amber-50 border-amber-200">{m.chipNamedNoLink}</span>
  return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-red-700 bg-red-50 border-red-200">{m.chipNotNamed}</span>
}

function EnginePanel({ engine, a, domain, quoted }: { engine: string; a: TeaserEngine; domain: string; quoted?: boolean }) {
  const m = useT(ns)
  // Its words already lead the card (`quoted`): here only who it named and what it cited.
  const said = quoted ? "" : a.snippet || (a.named ? "" : (a.quote ?? ""))
  const names = a.namedInstead
  const src = a.sources
  const moreNames = (a.namedInsteadMore ?? 0) + Math.max(0, names.length - 4)
  const moreSrc = (a.sourcesMore ?? 0) + Math.max(0, src.length - 4)
  const own = (d: string) => d === domain || d.endsWith("." + domain)
  return (
    <div className="bg-[#f8f7f6] rounded-xl p-3.5 mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">{LABEL[engine] ?? engine}</span>
        <Chip a={a} />
      </div>
      {!a.failed && (
        <>
          {said && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{m.quote(plain(said))}</p>}
          <p className="text-[13px] text-slate-700 mt-2 leading-relaxed">
            {names.length ? (
              <>
                <span className="text-slate-500">{a.named ? m.alsoNamed : m.namedInsteadLabel}</span>
                {names.slice(0, 4).join(", ")}
                {moreNames > 0 && <span className="text-slate-500">{m.more(moreNames)}</span>}
              </>
            ) : (
              <span className="text-slate-500">{m.noBusinessNamed}</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 break-words">
            {src.length || moreSrc ? (
              <>
                {m.sources}{" "}
                {src.slice(0, 4).map((d, i) => (
                  <span key={d}>
                    {i > 0 && " · "}
                    <span className={own(d) ? "text-violet-700 font-bold" : ""}>{d}</span>
                  </span>
                ))}
                {moreSrc > 0 && `${src.length ? " " : ""}+${moreSrc}`}
              </>
            ) : (
              m.noSources
            )}
          </p>
        </>
      )}
    </div>
  )
}

function OpenRow({ row, domain, engines, quoted }: { row: NonNullable<TeaserView["open"]>[number]; domain: string; engines: string[]; quoted?: string }) {
  return (
    <div data-attention="result-answer">
      <p className="text-base font-semibold leading-snug">
        <span className="text-slate-400 mr-1.5 tabular-nums">{row.n}.</span>
        {row.q}
      </p>
      {engines.filter((e) => row.engines[e]).map((e) => (
        <EnginePanel key={e} engine={e} a={row.engines[e]} domain={domain} quoted={quoted === e} />
      ))}
    </div>
  )
}

type OpenRows = NonNullable<TeaserView["open"]>

/** The assistant's own words that lead the result (5 Nov 2026: on 12 of 12 results with no mention there were none
 *  above the form, and a count alone cannot be checked): an answer that names someone else, else one naming you. */
function leadQuote(open: OpenRows, engines: string[]) {
  for (const row of open)
    for (const e of engines) {
      const a = row.engines[e]
      // The one the sentence is about (the route finds it), else the first name, unbolded if the quote spells it
      // otherwise; not a register or a product model: the card bolds it as the business named instead.
      const name = a?.quoteName || a?.namedInstead[0] || ""
      if (a && !a.failed && !a.named && a.quote && name && readsAsBusiness(name)) return { n: row.n, engine: e, q: row.q, text: a.quote, name }
    }
  for (const row of open)
    for (const e of engines) {
      const a = row.engines[e]
      const text = a && !a.failed && a.named ? leadSnippet(plain(a.snippet)) : ""
      if (text) return { n: row.n, engine: e, q: row.q, text, name: "" }
    }
  return null
}

/** A snippet fit to lead the card, or "": one that starts at a sentence, not mid-word (28 Oct 2026: "…sting also
 *  notes…"), with a link cut short at its end cut off (ChatGPT's "([site](https://…"), and no other pieces of links,
 *  tables or source marks left in it (4 Nov: "…oo.com/kb/SLN37235.html?utm_source=openai))"). */
function leadSnippet(text: string) {
  if (/^(…|\.\.\.)/.test(text)) return ""
  const cut = text.search(/\s*(\(\[|\u3010|\[[^\]]*$)/)
  const t = cut >= 0 ? text.slice(0, cut).replace(/[\s,;:\u2013\u2014-]+$/, "") + "…" : text
  return t.length < 45 || /https?:|www\.|\]\(|\butm_|\)\)|\.[a-z]{2,6}\/\S|\|/i.test(t) ? "" : t
}

/** `text` with the first `name` in it in bold, in the text's own spelling. */
function Marked({ text, name }: { text: string; name: string }) {
  const hit = name ? findName(text, name) : null
  if (!hit) return <>{text}</>
  const [a, b] = hit
  return (
    <>
      {text.slice(0, a)}
      <b className="font-bold text-[#1b1916]">{text.slice(a, b)}</b>
      {text.slice(b)}
    </>
  )
}

function askedAt(m: M, locale: Locale, iso?: string) {
  if (!iso) return m.askedTodayNoTime
  const d = new Date(iso)
  const now = new Date()
  // English keeps the visitor's own clock format; the other languages use their own.
  const time = d.toLocaleTimeString(locale === "en" ? [] : INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" })
  const sameDay = d.toDateString() === now.toDateString()
  return m.askedAt(sameDay, time)
}

/** The id of the offer the other buttons on the card bring the visitor to, and of its email field. */
export const REPORT_FORM_ID = "geo-report-form"
export const REPORT_EMAIL_ID = "geo-report-email"

/** Brings the visitor to the email field (or, once sent, to the card that says so). */
export function goToReportForm() {
  const field = document.getElementById(REPORT_EMAIL_ID)
  ;(field ?? document.getElementById(REPORT_FORM_ID))?.scrollIntoView({ behavior: "smooth", block: "center" })
  field?.focus({ preventScroll: true })
}

/** The email that gets the report: the account is opened on the server, so nothing else is asked. */
function ReportEmailForm({
  domain,
  signupHref,
  loginHref,
  onCta,
  onEmailResult,
  onSent,
}: {
  domain: string
  signupHref: string
  loginHref: string
  onCta: (where: string) => void
  onEmailResult?: (status: string) => void
  onSent: (email: string) => void
}) {
  const m = useT(ns)
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [trap, setTrap] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<"" | "email" | "exists" | "ip" | "send">("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const address = email.trim()
    if (!/^[!-?A-~]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(address)) return setError("email")
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/geo/report-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, site: domain, hp: trap }),
      })
      const j = (await res.json().catch(() => ({}))) as { status?: string; id?: string; error?: string }
      onEmailResult?.(j.status ?? j.error ?? "failed")
      if (j.status === "queued") {
        try {
          // The same two sign-up conversions /signup sends (app/signup/page.tsx), once per account.
          const w = window as unknown as { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void }
          w.gtag?.("event", "conversion", { send_to: "AW-18160234884/SQ7pCN7Sk8gcEITjvNND", transaction_id: "signup_" + j.id })
          w.fbq?.("track", "CompleteRegistration", {}, { eventID: "signup_" + j.id })
        } catch {
          // Analytics never gets in the way.
        }
        return onSent(address)
      }
      setError(j.error === "exists" ? "exists" : j.error === "report_ip_used" ? "ip" : j.error === "invalid_email" ? "email" : "send")
    } catch {
      setError("send")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4">
      <label htmlFor={REPORT_EMAIL_ID} className="block text-sm font-semibold mb-1.5">
        {m.emailLabel}
      </label>
      <input
        id={REPORT_EMAIL_ID}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (error) setError("")
        }}
        placeholder={m.emailPlaceholder}
        className="w-full min-h-12 rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
      {/* For bots only: people never see or reach this field. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-2 leading-relaxed">
          {error === "email" && m.errEmail}
          {error === "send" && m.errSend}
          {error === "exists" && (
            <>
              {m.errExists}{" "}
              <a href={loginHref} className="font-semibold underline">
                {m.sentLogin}
              </a>
            </>
          )}
          {error === "ip" && (
            <>
              {m.errIpUsed}{" "}
              <a href={localePath(locale, "/#apply")} className="font-semibold underline">
                {m.errIpLink}
              </a>
            </>
          )}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${CTA_BUTTON} disabled:opacity-60`}>
        {busy ? m.sending : m.sendReport}
      </button>
      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
        {m.reportPerk}
        {PROMO_WHEEL.enabled && ` ${m.reportWheel}`}
      </p>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        {rich(m.reportAgree, {
          link: (c) => (
            <Link href="/terms" className="underline">
              {c}
            </Link>
          ),
          link2: (c) => (
            <Link href="/privacy" className="underline">
              {c}
            </Link>
          ),
        })}
      </p>
      <p className="text-xs text-slate-500 mt-1.5">
        <a href={signupHref} onClick={() => onCta("inline")} className="underline">
          {m.reportOauth}
        </a>
      </p>
    </form>
  )
}

function Result({
  view,
  signupHref,
  onCta,
  onTrack,
  onEmailResult,
  onLeadSent,
  ctaRef,
  reportRef,
  lockedRef,
}: {
  view: TeaserView
  signupHref: string
  /** A real way to /signup: counts the click and leaves the site for the cabinet to follow. */
  onCta: (where: string) => void
  /** A click that only brings the visitor to the form: counted, nothing handed over. */
  onTrack?: (where: string) => void
  onEmailResult?: (status: string) => void
  onLeadSent?: () => void
  ctaRef?: React.Ref<HTMLDivElement>
  reportRef?: React.Ref<HTMLDivElement>
  lockedRef?: React.Ref<HTMLDivElement>
}) {
  const m = useT(ns)
  const locale = useLocale()
  const [sent, setSent] = useState<string | null>(null)
  const s = view.summary!
  const domain = view.domain ?? ""
  const engines = (view.engines ?? ["chatgpt", "perplexity"]).filter((e) => s.engines[e])
  const answered = engines.filter((e) => s.engines[e].of > 0)
  const silent = engines.filter((e) => s.engines[e].of === 0)
  const zero = s.named === 0
  // The count is over the answers that name some business (app/api/geo/teaser/route.ts); when none does, over all.
  const withNames = s.withNames ?? s.of
  const noNames = withNames === 0
  const all = withNames > 0 && s.named === withNames
  const tileOf = (e: string) => (noNames ? s.engines[e].of : (s.engines[e].withNames ?? s.engines[e].of))
  const who = m.joinAnd(answered.map((e) => LABEL[e]))
  const several = answered.length > 1
  // "Both named you in every answer": only the assistants that named some business; "named someone else": only
  // those with an answer that names a business and not this one.
  const namers = answered.filter((e) => (s.engines[e].withNames ?? s.engines[e].of) > 0)
  const others = answered.filter((e) => (s.engines[e].withNames ?? s.engines[e].of) > s.engines[e].named)
  const names = (list: string[]) => m.joinAnd(list.map((e) => LABEL[e]))
  const sub = noNames
    ? m.subNoNames(several, who)
    : zero
      ? m.subZero(several, who, domain, withNames, s.of)
      : all
        ? m.subAll(namers.length > 1, names(namers), domain)
        : m.subSome(others.length > 1, s.named, withNames - s.named, names(others))
  const open = view.open ?? []
  const lead = leadQuote(open, engines)
  const locked = view.locked ?? []
  // Who answered a closed question, in the card's order; without the per-question list, every
  // assistant that answered at all.
  const answeredBy = (r: (typeof locked)[number]) => (r.answered ? engines.filter((e) => r.answered!.includes(e)) : answered)
  // A closed question no assistant answered is shown but not counted as a ready answer.
  const ready = locked.filter((r) => answeredBy(r).length > 0).length
  const total = open.length + ready
  const top = headlineName(s.namedInstead)
  const moreNamed = s.namedInsteadMore ?? 0
  const loginHref = localePath(locale, `/login?callbackUrl=${encodeURIComponent(`/business/dashboard/visibility?site=${domain}`)}`)
  const offerTitle = zero ? (top ? m.ctaZeroTitle(top) : m.ctaZeroTitleNoName) : all ? m.ctaTitle(ready) : m.ctaSomeTitle(withNames - s.named)
  const toForm = (where: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    onTrack?.(where)
    goToReportForm()
  }
  // With no answers ready there is no form on the card: these links go to sign-up, as the report card does.
  const toOffer = (where: string) => (ready > 0 ? { href: sent ? loginHref : `#${REPORT_FORM_ID}`, onClick: sent ? undefined : toForm(where) } : { href: signupHref, onClick: () => onCta(where) })

  return (
    <div>
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <h3 data-attention="result-count" className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[40px] leading-none font-extrabold tracking-tight tabular-nums">{s.named}</span>
          <span className="text-xl font-bold text-slate-500">{noNames ? m.ofAnswersNamed(s.named, s.of) : m.ofNamingAnswers(s.named, withNames)}</span>
        </h3>
        {silent.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {m.silentNote(silent.length > 1, silent.map((e) => LABEL[e]).join(", "))}
          </p>
        )}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{sub}</p>

        {lead && (
          <figure data-attention="result-quote" className="mt-4 rounded-xl bg-[#f8f7f6] border-l-4 border-l-violet-600 px-4 py-3">
            <figcaption className="text-xs text-slate-500 leading-relaxed">{m.quoteAsked(LABEL[lead.engine] ?? lead.engine, lead.q)}</figcaption>
            <blockquote lang={view.language ?? undefined} className="text-[15px] text-slate-800 leading-relaxed mt-1.5 break-words">
              <Marked text={m.quote(lead.text)} name={lead.name} />
            </blockquote>
          </figure>
        )}

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {engines.map((e) => (
            <div key={e} className="bg-[#f8f7f6] rounded-xl px-3.5 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{LABEL[e]}</div>
              <div className="text-lg font-extrabold tabular-nums mt-0.5">
                {s.engines[e].of > 0 && tileOf(e) === 0 ? (
                  <span className="text-slate-400 text-sm font-bold">{m.engineNoNames}</span>
                ) : s.engines[e].of > 0 ? (
                  <>
                    {s.engines[e].named} <span className="text-slate-400 text-sm font-bold">{m.engineOf(tileOf(e))}</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-bold">{m.noAnswer}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {s.linked > 0 && <p className="text-xs text-slate-600 mt-2.5">{m.linkedAsSource(s.linked, s.of)}</p>}

        {s.namedInstead.length > 0 && (
          <div data-attention="result-names" className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
              {zero ? m.namedInsteadTitle : m.othersNamed}
            </p>
            <ul className="space-y-1">
              {s.namedInstead.map((r) => (
                <li key={r.name} className="text-sm">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-slate-500">{m.inAnswers(r.count)}</span>
                </li>
              ))}
              {moreNamed > 0 && (
                <>
                  {[32, 24].slice(0, moreNamed).map((w) => (
                    <li key={w} aria-hidden className="flex items-center gap-2 pt-1 blur-[3px] select-none">
                      <span className={`h-3 rounded bg-slate-300 ${w === 32 ? "w-32" : "w-24"}`} />
                      <span className="h-2.5 w-20 rounded bg-slate-200" />
                    </li>
                  ))}
                  <li className="pt-1 text-sm font-semibold text-violet-700">
                    <a {...toOffer("more-named")} className="hover:underline">
                      {m.moreNamed(moreNamed, all)}
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {ready > 0 && (
          <div ref={ctaRef} id={REPORT_FORM_ID} data-attention="result-form" className="mt-5 scroll-mt-24 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:p-5">
            {sent ? (
              <div role="status">
                <p className="font-extrabold text-lg leading-snug break-words">{m.sentTitle(sent)}</p>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{m.sentBody}</p>
                <a href={loginHref} className="mt-2.5 inline-block text-sm font-semibold text-violet-700 hover:underline">
                  {m.sentLogin}
                </a>
              </div>
            ) : (
              <>
                <p className="font-extrabold text-lg leading-snug break-words">{offerTitle}</p>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{all ? m.ctaBody(all, ready) : m.reportOffer}</p>
                <ReportEmailForm
                  domain={domain}
                  signupHref={signupHref}
                  loginHref={loginHref}
                  onCta={onCta}
                  onEmailResult={onEmailResult}
                  onSent={(email) => {
                    setSent(email)
                    onLeadSent?.()
                  }}
                />
                <GuestRewardNote where="gate" onTint className="mt-3" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 border-t border-black/[0.07] pt-5">
        {open[0] && <OpenRow row={open[0]} domain={domain} engines={engines} quoted={lead?.n === open[0].n ? lead.engine : undefined} />}
        {open[1] && (
          <div className="relative mt-6 max-h-[300px] overflow-hidden">
            <OpenRow row={open[1]} domain={domain} engines={engines} quoted={lead?.n === open[1].n ? lead.engine : undefined} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-white/0 to-white backdrop-blur-[2px]" />
          </div>
        )}

        <div ref={reportRef} data-attention="result-report-card" className={`relative z-10 ${open[1] ? "-mt-8" : "mt-6"} rounded-2xl bg-white border border-black/10 shadow-lg shadow-violet-600/10 p-5`}>
          <p className="font-extrabold text-lg leading-snug break-words">{m.reportTitle(domain)}</p>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {rich(m.reportBody, { b: (c) => <b className="text-[#1b1916]">{c}</b> })}
          </p>
          {sent ? (
            <a href={loginHref} className={CTA_BUTTON}>
              {m.sentLogin}
            </a>
          ) : ready ? (
            <a href={`#${REPORT_FORM_ID}`} onClick={toForm("overlay")} className={CTA_BUTTON}>
              {m.sendReport}
            </a>
          ) : (
            <a href={signupHref} onClick={() => onCta("overlay")} className={CTA_BUTTON}>
              {m.createAccount}
            </a>
          )}
          <a
            href={localePath(locale, SAMPLE_PATH)}
            target="_blank"
            rel="noopener"
            onClick={() => onCta("sample")}
            className="mt-2.5 block text-center text-sm font-semibold text-violet-700 hover:underline"
          >
            {m.seeReport}
          </a>
          {!ready && <GuestRewardNote where="gate" className="mt-3" />}
        </div>

        <div ref={lockedRef} data-attention="result-locked" className="mt-5 space-y-4 pb-5">
          {locked.map((r) => {
            const by = answeredBy(r)
            return (
              <a
                key={r.n}
                {...toOffer("locked-row")}
                className="block group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4"
              >
                <p className="text-base font-semibold leading-snug group-hover:text-violet-700">
                  <span className="text-slate-400 mr-1.5 tabular-nums">{r.n}.</span>
                  {r.q}
                </p>
                {by.length > 0 && (
                  <div aria-hidden className="mt-2 rounded-xl bg-[#f8f7f6] p-3.5 blur-[3px] select-none">
                    <div className="h-3 w-2/5 rounded bg-slate-300" />
                    <div className="h-2.5 w-11/12 rounded bg-slate-200 mt-2.5" />
                    <div className="h-2.5 w-3/4 rounded bg-slate-200 mt-1.5" />
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1.5">
                  {by.length ? m.lockedNote(by.length > 1, by.map((e) => LABEL[e] ?? e).join(" · ")) : m.chipTimedOut}
                </p>
              </a>
            )
          })}
        </div>
      </div>

      <p className="px-5 sm:px-6 pb-5 text-xs text-slate-500 leading-relaxed">
        {m.footnote(askedAt(m, locale, view.finishedAt))}
      </p>
    </div>
  )
}

// The VM's reason text (English, technical) -> the sentence shown, in the page's language.
const REASON: [RegExp, keyof M["reasons"]][] = [
  [/certificate/, "certificate"],
  [/resolve/, "resolve"],
  [/answered (401|403|429)/, "refused"],
  [/answered 5\d\d/, "serverError"],
  [/answered 404/, "notFound"],
  [/timeout|did not answer/, "timeout"],
]

function Failed({
  view,
  domain,
  signupHref,
  onCta,
  onRetry,
  onOtherUrl,
}: {
  view: TeaserView
  domain: string
  signupHref: string
  onCta: (where: string) => void
  onRetry: () => void
  onOtherUrl: () => void
}) {
  const m = useT(ns)
  const e = view.error ?? "check_failed"
  const amber = "bg-amber-50 border-amber-200"
  // `reward`: a box that offers an account also reminds a launch reward won on the website.
  const box = (tone: string, title: string, body: string, actions: React.ReactNode, note?: string, reward = false) => (
    <div className={`m-4 rounded-xl border ${tone} p-4 sm:p-5`}>
      <p className="font-extrabold text-base leading-snug">{title}</p>
      <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{body}</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:items-center">{actions}</div>
      {note && <p className="text-xs text-slate-500 mt-2.5">{note}</p>}
      {reward && <GuestRewardNote where="gate" onTint className="mt-3" />}
    </div>
  )
  const primary = (label: string, onClick?: () => void, href?: string) =>
    href ? (
      <a href={href} onClick={onClick} className="inline-flex justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold">
        {label}
      </a>
    ) : (
      <button type="button" onClick={onClick} className="inline-flex justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold">
        {label}
      </button>
    )
  // Next to "Try again": the account runs the detailed check on its own, so a failed quick check
  // need not be the end of the visit.
  const account = (where: string) => (
    <a
      href={signupHref}
      onClick={() => onCta(where)}
      className="inline-flex justify-center rounded-xl border border-black/15 bg-white hover:bg-[#f8f7f6] text-[#1b1916] px-5 py-3 text-sm font-semibold"
    >
      {m.createAccount}
    </a>
  )

  if (e === "limit_ip")
    return box(
      amber,
      m.limitTitle,
      m.limitBody,
      <>
        {primary(m.createAccount, () => onCta("limit"), signupHref)}
        <span className="text-sm text-slate-500">{m.tomorrow}</span>
      </>,
      undefined,
      true
    )
  if (e === "busy")
    return box(
      amber,
      m.busyTitle,
      m.busyBody,
      primary(m.createAccount, () => onCta("busy"), signupHref),
      m.busyNote,
      true
    )
  if (e === "unreachable") {
    const reason = REASON.find(([re]) => re.test(view.reason ?? ""))?.[1]
    const why = reason ? m.reasons[reason] : m.reasonDefault
    return box(
      "bg-red-50 border-red-200",
      m.unreachableTitle(domain),
      m.unreachableBody(why),
      primary(m.otherUrl, onOtherUrl),
      m.notCounted
    )
  }
  if (e === "questions_failed")
    return box(
      amber,
      m.questionsTitle,
      m.questionsBody,
      <>
        {primary(m.tryAgain, onRetry)}
        {account("questions-failed")}
      </>,
      m.notCounted,
      true
    )
  if (e === "invalid_url")
    return box(amber, m.invalidTitle, m.invalidBody, primary(m.otherUrl, onOtherUrl))
  return box(
    amber,
    m.failedTitle,
    m.failedBody,
    <>
      {primary(m.tryAgain, onRetry)}
      {account("failed")}
    </>,
    m.notCounted,
    true
  )
}

export default function AiAnswers({
  view,
  domain,
  elapsed,
  signupHref,
  onCta,
  onTrack,
  onEmailResult,
  onLeadSent,
  onRetry,
  onOtherUrl,
  ctaRef,
  reportRef,
  lockedRef,
}: {
  view: TeaserView | null
  domain: string
  elapsed: number
  signupHref: string
  onCta: (where: string) => void
  onTrack?: (where: string) => void
  onEmailResult?: (status: string) => void
  onLeadSent?: () => void
  onRetry: () => void
  onOtherUrl: () => void
  /** The account offer under the named-instead list, the free-report card and the locked rows:
   *  AuditForm watches all three. */
  ctaRef?: React.Ref<HTMLDivElement>
  reportRef?: React.Ref<HTMLDivElement>
  lockedRef?: React.Ref<HTMLDivElement>
}) {
  const m = useT(ns)
  const shown = view?.domain || domain
  const waiting = !view || view.status === "running"
  return (
    <div className={`bg-white border border-black/10 rounded-2xl overflow-hidden ${waiting ? "min-h-[560px]" : ""}`}>
      <div className="px-5 sm:px-6 pt-4 pb-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{m.eyebrow(shown)}</p>
      </div>
      {waiting && <Waiting view={view} elapsed={elapsed} />}
      {view?.status === "done" && view.summary && (
        <Result view={view} signupHref={signupHref} onCta={onCta} onTrack={onTrack} onEmailResult={onEmailResult} onLeadSent={onLeadSent} ctaRef={ctaRef} reportRef={reportRef} lockedRef={lockedRef} />
      )}
      {view?.status === "failed" && (
        <Failed view={view} domain={shown} signupHref={signupHref} onCta={onCta} onRetry={onRetry} onOtherUrl={onOtherUrl} />
      )}
    </div>
  )
}
