"use client"

// Card A of the free check: what ChatGPT and Perplexity answer when this business's buyers ask.
// While it runs it shows real progress from the VM (stage, the questions as soon as they exist,
// answers in per assistant). The result shows two answers in full; the other three arrive as their
// question only — there is no answer data in the page to un-blur — behind the account offer. The
// offer says what it costs: the account shows the detailed report's totals and the quick check's
// questions; the whole report is paid (lib/geo-pricing.ts), with a real one a click away. Nothing
// here is called free: the quick check is the one free thing, and it is described, not labelled.

import { CREDIT_DAYS, GEO_PRICES, SAMPLE_PATH } from "@/lib/geo-pricing"

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
  locked?: { n: number; q: string }[]
  error?: string
  reason?: string
}

const LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" }

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
const LANG: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian", nl: "Dutch", pl: "Polish",
  pt: "Portuguese", sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", cs: "Czech", tr: "Turkish",
  ru: "Russian", uk: "Ukrainian", ro: "Romanian", hu: "Hungarian", el: "Greek", ja: "Japanese",
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
  const at = Math.max(0, STAGES.indexOf(view?.stage ?? "reading"))
  const qs = view?.questions ?? []
  const total = view?.total ?? 5
  const ans = view?.answered ?? {}
  const lang = view?.language && LANG[view.language] ? ` in ${LANG[view.language]}` : ""
  const asking = (e: string): StepState => (at >= 3 || (ans[e] ?? 0) >= total ? "done" : at === 2 ? "active" : "todo")
  const steps: { label: string; state: StepState }[] = [
    { label: "Reading your homepage", state: at > 0 || qs.length ? "done" : "active" },
    { label: qs.length ? `Wrote 5 buyer questions${lang}` : "Writing 5 buyer questions", state: qs.length ? "done" : at >= 1 ? "active" : "todo" },
    { label: `Asking ChatGPT${at >= 2 ? ` · ${Math.min(ans.chatgpt ?? 0, total)} of ${total} answered` : ""}`, state: asking("chatgpt") },
    { label: `Asking Perplexity${at >= 2 ? ` · ${Math.min(ans.perplexity ?? 0, total)} of ${total} answered` : ""}`, state: asking("perplexity") },
    { label: "Checking who they name and which sites they cite", state: at >= 3 ? "active" : "todo" },
  ]
  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-extrabold text-lg sm:text-xl leading-snug">Asking ChatGPT and Perplexity what your buyers ask</h3>
      <p className="text-sm text-slate-500 mt-1">Live answers, web search on. Takes 15–35 seconds.</p>
      <ol className="mt-5 space-y-3">
        {steps.map((s) => (
          <li key={s.label.slice(0, 14)} className="flex items-center gap-3">
            <StepDot state={s.state} />
            <span className={`text-sm ${s.state === "todo" ? "text-slate-400" : "text-[#1b1916]"} ${s.state === "active" ? "font-semibold" : ""}`}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      {elapsed >= 40 && (
        <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Slower than usual — one assistant is taking its time. Still working.
        </p>
      )}
      {qs.length > 0 && (
        <div className="mt-6 animate-in fade-in duration-500">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Your 5 questions</p>
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
  if (a.failed) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-slate-600 bg-slate-100 border-slate-200">No answer — timed out</span>
  if (a.named && a.cited) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">Named, linked to you</span>
  if (a.named) return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-amber-700 bg-amber-50 border-amber-200">Named, no link to you</span>
  return <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border text-red-700 bg-red-50 border-red-200">Not named</span>
}

function EnginePanel({ engine, a, domain }: { engine: string; a: TeaserEngine; domain: string }) {
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
          {a.snippet && <p className="text-sm text-slate-700 mt-2 leading-relaxed">“{plain(a.snippet)}”</p>}
          <p className="text-[13px] text-slate-700 mt-2 leading-relaxed">
            {names.length ? (
              <>
                <span className="text-slate-500">{a.named ? "Also named: " : "Named instead: "}</span>
                {names.slice(0, 4).join(", ")}
                {names.length > 4 && <span className="text-slate-500"> +{names.length - 4} more</span>}
              </>
            ) : (
              <span className="text-slate-500">No specific business named.</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 break-words">
            {src.length ? (
              <>
                Sources:{" "}
                {src.slice(0, 4).map((d, i) => (
                  <span key={d}>
                    {i > 0 && " · "}
                    <span className={own(d) ? "text-violet-700 font-bold" : ""}>{d}</span>
                  </span>
                ))}
                {src.length > 4 && ` +${src.length - 4}`}
              </>
            ) : (
              "No sources cited."
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

function askedAt(iso?: string) {
  if (!iso) return "Asked today"
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const sameDay = d.toDateString() === now.toDateString()
  return `Asked ${sameDay ? "today" : "yesterday"} at ${time}`
}

function Result({ view, signupHref, onCta }: { view: TeaserView; signupHref: string; onCta: (where: string) => void }) {
  const s = view.summary!
  const domain = view.domain ?? ""
  const engines = (view.engines ?? ["chatgpt", "perplexity"]).filter((e) => s.engines[e])
  const answered = engines.filter((e) => s.engines[e].of > 0)
  const silent = engines.filter((e) => s.engines[e].of === 0)
  const zero = s.named === 0
  const all = s.of > 0 && s.named === s.of
  const who = answered.map((e) => LABEL[e]).join(" and ")
  const sub = zero
    ? `We asked ${who} 5 questions your buyers ask. ${answered.length > 1 ? "Neither" : "It"} named ${domain}.`
    : all
      ? `${answered.length > 1 ? "Both assistants" : who} named ${domain} in every answer. This check covered 2 of the 4 assistants we track.`
      : `You came up in ${s.named} answer${s.named === 1 ? "" : "s"}. In the other ${s.of - s.named}, ${who} answered without you.`
  const open = view.open ?? []
  const locked = view.locked ?? []

  return (
    <div>
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <h3 className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[40px] leading-none font-extrabold tracking-tight tabular-nums">{s.named}</span>
          <span className="text-xl font-bold text-slate-500">of {s.of} answers named you</span>
        </h3>
        {silent.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {silent.map((e) => LABEL[e]).join(", ")} didn&apos;t respond and {silent.length > 1 ? "are" : "is"} left out of the count.
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
                    {s.engines[e].named} <span className="text-slate-400 text-sm font-bold">of {s.engines[e].of}</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-bold">No answer</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {s.linked > 0 && <p className="text-xs text-slate-600 mt-2.5">Linked as a source: {s.linked} of {s.of}</p>}

        {s.namedInstead.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
              {zero ? "Named instead of you" : "Others named"}
            </p>
            <ul className="space-y-1">
              {s.namedInstead.map((r) => (
                <li key={r.name} className="text-sm">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-slate-500"> — in {r.count} answer{r.count === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
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

        <div className="relative z-10 -mt-8 rounded-2xl bg-white border border-black/10 shadow-lg shadow-violet-600/10 p-5">
          <p className="font-extrabold text-lg leading-snug">{all ? "Do Claude and Gemini agree?" : "Want to see what all of them say?"}</p>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Create an account and we build the detailed report for {domain}: 20 buyer questions to ChatGPT, Claude, Gemini
            and Perplexity, 3 times each — who gets named, which sites they quote, and our plan for your site.
          </p>
          <p className="text-sm text-[#1b1916] mt-2 leading-relaxed">
            You see its totals and these 5 questions. The whole report is <b>{GEO_PRICES.research.label}</b>, one payment. If you
            then want us to do the work, the {GEO_PRICES.research.label} comes off your first plan payment within {CREDIT_DAYS} days.
          </p>
          <a
            href={signupHref}
            onClick={() => onCta("overlay")}
            className="mt-4 flex items-center justify-center w-full min-h-12 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold text-center transition-colors"
          >
            Create account — build my report
          </a>
          <a
            href={SAMPLE_PATH}
            target="_blank"
            rel="noopener"
            onClick={() => onCta("sample")}
            className="mt-2.5 block text-center text-sm font-semibold text-violet-700 hover:underline"
          >
            See a real report →
          </a>
          <p className="text-xs text-slate-500 mt-2.5 text-center leading-relaxed">
            Google or LinkedIn in one click, or a code by email. No card to create the account.
          </p>
        </div>

        <div className="mt-5 space-y-4 pb-5">
          {locked.map((r) => (
            <a key={r.n} href={signupHref} onClick={() => onCta("locked-row")} className="block group">
              <p className="text-base font-semibold leading-snug group-hover:text-violet-700">
                <span className="text-slate-400 mr-1.5 tabular-nums">{r.n}.</span>
                {r.q}
              </p>
              <div aria-hidden className="mt-2 rounded-xl bg-[#f8f7f6] p-3.5 blur-[3px] select-none">
                <div className="h-3 w-2/5 rounded bg-slate-300" />
                <div className="h-2.5 w-11/12 rounded bg-slate-200 mt-2.5" />
                <div className="h-2.5 w-3/4 rounded bg-slate-200 mt-1.5" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">ChatGPT · Perplexity — answered, in your detailed report</p>
            </a>
          ))}
        </div>
      </div>

      <p className="px-5 sm:px-6 pb-5 text-xs text-slate-500 leading-relaxed">
        {askedAt(view.finishedAt)}, web search on. Answers vary between runs — the detailed report asks each question 3 times.
      </p>
    </div>
  )
}

const REASON: [RegExp, string][] = [
  [/certificate/, "Its security certificate isn't valid for this address, so browsers show a warning and crawlers get an error."],
  [/resolve/, "The address doesn't resolve. Check the spelling."],
  [/answered (401|403|429)/, "The site refused our request — usually bot protection or a firewall."],
  [/answered 5\d\d/, "The site answered with a server error."],
  [/answered 404/, "The homepage answered “not found”."],
  [/timeout|did not answer/, "The server didn't respond within 10 seconds."],
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

  if (e === "limit_ip")
    return box(
      amber,
      "You've used today's 3 checks",
      `Each check asks ChatGPT and Perplexity live, so we limit it per visitor. Create an account and we build the detailed report for your site: 20 questions, 4 assistants, with its totals open. The whole report is ${GEO_PRICES.research.label}.`,
      <>
        {primary("Create account", () => onCta("limit"), signupHref)}
        <span className="text-sm text-slate-500">Or check again tomorrow</span>
      </>
    )
  if (e === "busy")
    return box(
      amber,
      "Live checks are full for today",
      "We run a fixed number of live checks a day, and today's are used up. Your crawler check below is done.",
      primary("Create account", () => onCta("busy"), signupHref),
      "Your report waits in the queue; we'll email you when it's ready."
    )
  if (e === "unreachable") {
    const why = REASON.find(([re]) => re.test(view.reason ?? ""))?.[1] ?? "The site refused our request, usually because of bot protection or a firewall."
    return box(
      "bg-red-50 border-red-200",
      `We couldn't read ${domain}`,
      `${why} The crawler check below shows whether AI bots get through.`,
      primary("Check a different URL", onOtherUrl),
      "This didn't count toward your 3 checks."
    )
  }
  if (e === "questions_failed")
    return box(
      amber,
      "We couldn't write questions from your homepage",
      "Usually the page has too little readable text, which is common when it loads with JavaScript. Sometimes the error is ours.",
      primary("Try again", onRetry),
      "This didn't count toward your 3 checks."
    )
  if (e === "invalid_url")
    return box(amber, "That doesn't look like a website address", "Enter it like yourcompany.com.", primary("Check a different URL", onOtherUrl))
  return box(
    amber,
    "The check didn't finish",
    "One of the assistants or our side failed this time. Try again — if the answers came in meanwhile, they appear at once.",
    primary("Try again", onRetry),
    "This didn't count toward your 3 checks."
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
}: {
  view: TeaserView | null
  domain: string
  elapsed: number
  signupHref: string
  onCta: (where: string) => void
  onRetry: () => void
  onOtherUrl: () => void
}) {
  const shown = view?.domain || domain
  const waiting = !view || view.status === "running"
  return (
    <div className={`bg-white border border-black/10 rounded-2xl overflow-hidden ${waiting ? "min-h-[560px]" : ""}`}>
      <div className="px-5 sm:px-6 pt-4 pb-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">AI answers · {shown}</p>
      </div>
      {waiting && <Waiting view={view} elapsed={elapsed} />}
      {view?.status === "done" && view.summary && <Result view={view} signupHref={signupHref} onCta={onCta} />}
      {view?.status === "failed" && (
        <Failed view={view} domain={shown} signupHref={signupHref} onCta={onCta} onRetry={onRetry} onOtherUrl={onOtherUrl} />
      )}
    </div>
  )
}
