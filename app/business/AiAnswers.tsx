"use client"

// Card A of the free check: what ChatGPT and Perplexity answer when this business's buyers ask.
// While it runs it shows real progress from the VM (stage, the questions as soon as they exist,
// answers in per assistant). The result shows two answers in full; the other three arrive as their
// question only — there is no answer data in the page to un-blur. The account offer sits right under
// who was named instead, before the two answers: an account opens the other answers and, a few
// minutes later, the whole detailed report (a day-0 run takes about 6 minutes; the copy says
// "about 10"). Under the two answers comes that report, free once an account is created
// (lib/geo-pricing.ts), with a real one a click away. AuditForm owns the refs of the offer, the report card and the locked rows:
// it watches them for geo_cta_seen and for the phone bar. Each locked row says which assistants
// answered that question (the API sends their names, never the answers).

import { SAMPLE_PATH } from "@/lib/geo-pricing"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config"
import { localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/aiAnswers"

type M = (typeof ns)["en"]

export interface TeaserEngine {
  named: boolean
  cited: boolean
  failed: boolean
  namedInstead: string[]
  sources: string[]
  snippet: string
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
    engines: Record<string, { named: number; of: number }>
    namedInstead: { name: string; count: number }[]
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

function EnginePanel({ engine, a, domain }: { engine: string; a: TeaserEngine; domain: string }) {
  const m = useT(ns)
  const names = a.namedInstead
  const src = a.sources
  const own = (d: string) => d === domain || d.endsWith("." + domain)
  return (
    <div className="bg-[#f8f7f6] rounded-xl p-3.5 mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">{LABEL[engine] ?? engine}</span>
        <Chip a={a} />
      </div>
      {!a.failed && (
        <>
          {a.snippet && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{m.quote(plain(a.snippet))}</p>}
          <p className="text-[13px] text-slate-700 mt-2 leading-relaxed">
            {names.length ? (
              <>
                <span className="text-slate-500">{a.named ? m.alsoNamed : m.namedInsteadLabel}</span>
                {names.slice(0, 4).join(", ")}
                {names.length > 4 && <span className="text-slate-500">{m.more(names.length - 4)}</span>}
              </>
            ) : (
              <span className="text-slate-500">{m.noBusinessNamed}</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 break-words">
            {src.length ? (
              <>
                {m.sources}{" "}
                {src.slice(0, 4).map((d, i) => (
                  <span key={d}>
                    {i > 0 && " · "}
                    <span className={own(d) ? "text-violet-700 font-bold" : ""}>{d}</span>
                  </span>
                ))}
                {src.length > 4 && ` +${src.length - 4}`}
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

function OpenRow({ row, domain, engines }: { row: NonNullable<TeaserView["open"]>[number]; domain: string; engines: string[] }) {
  return (
    <div>
      <p className="text-base font-semibold leading-snug">
        <span className="text-slate-400 mr-1.5 tabular-nums">{row.n}.</span>
        {row.q}
      </p>
      {engines.filter((e) => row.engines[e]).map((e) => (
        <EnginePanel key={e} engine={e} a={row.engines[e]} domain={domain} />
      ))}
    </div>
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

function Result({
  view,
  signupHref,
  onCta,
  ctaRef,
  reportRef,
  lockedRef,
}: {
  view: TeaserView
  signupHref: string
  onCta: (where: string) => void
  ctaRef?: React.Ref<HTMLDivElement>
  reportRef?: React.Ref<HTMLDivElement>
  lockedRef?: React.Ref<HTMLDivElement>
}) {
  const m = useT(ns)
  const locale = useLocale()
  const s = view.summary!
  const domain = view.domain ?? ""
  const engines = (view.engines ?? ["chatgpt", "perplexity"]).filter((e) => s.engines[e])
  const answered = engines.filter((e) => s.engines[e].of > 0)
  const silent = engines.filter((e) => s.engines[e].of === 0)
  const zero = s.named === 0
  const all = s.of > 0 && s.named === s.of
  const who = m.joinAnd(answered.map((e) => LABEL[e]))
  const several = answered.length > 1
  const sub = zero
    ? m.subZero(several, who, domain)
    : all
      ? m.subAll(several, who, domain)
      : m.subSome(several, s.named, s.of - s.named, who)
  const open = view.open ?? []
  const locked = view.locked ?? []
  // Who answered a closed question, in the card's order; without the per-question list, every
  // assistant that answered at all.
  const answeredBy = (r: (typeof locked)[number]) => (r.answered ? engines.filter((e) => r.answered!.includes(e)) : answered)
  // A closed question no assistant answered is shown but not counted as a ready answer.
  const ready = locked.filter((r) => answeredBy(r).length > 0).length
  const total = open.length + ready

  return (
    <div>
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <h3 className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[40px] leading-none font-extrabold tracking-tight tabular-nums">{s.named}</span>
          <span className="text-xl font-bold text-slate-500">{m.ofAnswersNamed(s.named, s.of)}</span>
        </h3>
        {silent.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {m.silentNote(silent.length > 1, silent.map((e) => LABEL[e]).join(", "))}
          </p>
        )}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{sub}</p>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {engines.map((e) => (
            <div key={e} className="bg-[#f8f7f6] rounded-xl px-3.5 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{LABEL[e]}</div>
              <div className="text-lg font-extrabold tabular-nums mt-0.5">
                {s.engines[e].of > 0 ? (
                  <>
                    {s.engines[e].named} <span className="text-slate-400 text-sm font-bold">{m.engineOf(s.engines[e].of)}</span>
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
          <div className="mt-4">
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
            </ul>
          </div>
        )}

        {ready > 0 && (
          <div ref={ctaRef} className="mt-5 scroll-mt-24 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:p-5">
            <p className="font-extrabold text-lg leading-snug">{m.ctaTitle(ready)}</p>
            <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{m.ctaBody(all, ready)}</p>
            <a href={signupHref} onClick={() => onCta("inline")} className={CTA_BUTTON}>
              {m.ctaButton(total)}
            </a>
            <p className="text-xs text-slate-500 mt-2.5 text-center leading-relaxed">{m.ctaSignIn}</p>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 border-t border-black/[0.07] pt-5">
        {open[0] && <OpenRow row={open[0]} domain={domain} engines={engines} />}
        {open[1] && (
          <div className="relative mt-6 max-h-[300px] overflow-hidden">
            <OpenRow row={open[1]} domain={domain} engines={engines} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-white/0 to-white backdrop-blur-[2px]" />
          </div>
        )}

        <div ref={reportRef} className="relative z-10 -mt-8 rounded-2xl bg-white border border-black/10 shadow-lg shadow-violet-600/10 p-5">
          <p className="font-extrabold text-lg leading-snug break-words">{m.reportTitle(domain)}</p>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {rich(m.reportBody, { b: (c) => <b className="text-[#1b1916]">{c}</b> })}
          </p>
          <a href={signupHref} onClick={() => onCta("overlay")} className={CTA_BUTTON}>
            {ready ? m.ctaButton(total) : m.createAccount}
          </a>
          <a
            href={localePath(locale, SAMPLE_PATH)}
            target="_blank"
            rel="noopener"
            onClick={() => onCta("sample")}
            className="mt-2.5 block text-center text-sm font-semibold text-violet-700 hover:underline"
          >
            {m.seeReport}
          </a>
        </div>

        <div ref={lockedRef} className="mt-5 space-y-4 pb-5">
          {locked.map((r) => {
            const by = answeredBy(r)
            return (
              <a
                key={r.n}
                href={signupHref}
                onClick={() => onCta("locked-row")}
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
  const box = (tone: string, title: string, body: string, actions: React.ReactNode, note?: string) => (
    <div className={`m-4 rounded-xl border ${tone} p-4 sm:p-5`}>
      <p className="font-extrabold text-base leading-snug">{title}</p>
      <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{body}</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:items-center">{actions}</div>
      {note && <p className="text-xs text-slate-500 mt-2.5">{note}</p>}
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
      </>
    )
  if (e === "busy")
    return box(
      amber,
      m.busyTitle,
      m.busyBody,
      primary(m.createAccount, () => onCta("busy"), signupHref),
      m.busyNote
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
      m.notCounted
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
    m.notCounted
  )
}

export default function AiAnswers({
  view,
  domain,
  elapsed,
  signupHref,
  onCta,
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
        <Result view={view} signupHref={signupHref} onCta={onCta} ctaRef={ctaRef} reportRef={reportRef} lockedRef={lockedRef} />
      )}
      {view?.status === "failed" && (
        <Failed view={view} domain={shown} signupHref={signupHref} onCta={onCta} onRetry={onRetry} onOtherUrl={onOtherUrl} />
      )}
    </div>
  )
}
