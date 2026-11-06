"use client"

// The two charts of the AI-visibility page.
//
// GrowthChart (WeeklyHero, on the plan and in the public sample): every check measured the same way, day 0
// first, as a line over time up to day 90, the day the growth guarantee compares with day 0. Only measured
// counts; the checks still to come are empty marks on the axis.
//
// Forecast (an account without the plan, under the day-0 report): what the plan brings in 1, 3, 6 and 12
// months, worked out from the site's own report: how often it is named today and how often the business
// named most instead of it. 6 Nov 2026, Kiryl: "нужно агрессивно и уверенно, по максималке надо делать
// прогноз, я сам отвечаю за это"; it is the one projection on the page (parts.tsx keeps "nothing is
// projected" for every other card). The numbers come only from planForecast below.

import { useCallback, useEffect, useState } from "react"
import { rivalOf } from "@/lib/geo-names"

const VIOLET = "#7c3aed"
const VIOLET_SOFT = "#c4b5fd"
const GRID = "#e2e8f0"
const AXIS = "#cbd5e1"
const MUTED = "#64748b"
const INK = "#1b1916"
const GRAY = "#94a3b8"

const DAY = 24 * 60 * 60 * 1000
const CHECK_EVERY_DAYS = 14
const GUARANTEE_DAYS = 90

/** The rendered width of an element, so the SVG draws in real pixels and its text stays 11px on a phone. A
 *  callback ref: a chart that renders nothing at first (too few points) still measures once it draws. */
function useWidth<T extends HTMLElement>(initial = 640) {
  const [el, setEl] = useState<T | null>(null)
  const [w, setW] = useState(initial)
  useEffect(() => {
    if (!el) return
    const set = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width)))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  const ref = useCallback((node: T | null) => setEl(node), [])
  return [ref, w] as const
}

/** A tooltip at most this wide wraps, so it can be kept inside the chart. */
const TIP_W = 240

/** The tooltip's left edge: centred on the point, kept inside the chart. */
function tipLeft(x: number, width: number) {
  const w = Math.min(TIP_W, width)
  return Math.min(Math.max(0, x - w / 2), width - w)
}

/** A round top for the y axis and its step: 0-6 by 1, then 2, 5, 10. */
function yScale(top: number) {
  const step = top <= 6 ? 1 : top <= 12 ? 2 : top <= 30 ? 5 : 10
  return { max: Math.ceil(top / step) * step, step }
}

type Anchor = "start" | "middle" | "end"

/** Where an axis label sits: from the left edge near the start of the axis, from the right near its end. */
function anchorAt(x: number, left: number, right: number): Anchor {
  return x < left + 30 ? "start" : x > right - 30 ? "end" : "middle"
}

/** Labels along an axis, most important first, kept only where they do not run into one already kept
 *  (11px text: about 6.3px a character). */
function spaced<T extends { x: number; text: string; rank: number; anchor: Anchor }>(labels: T[], gap = 8): T[] {
  const span = (l: T) => {
    const w = l.text.length * 6.3
    const a = l.anchor === "start" ? l.x : l.anchor === "end" ? l.x - w : l.x - w / 2
    return [a, a + w] as const
  }
  const kept: T[] = []
  for (const l of [...labels].sort((a, b) => a.rank - b.rank)) {
    const [a, b] = span(l)
    if (kept.every((k) => { const [c, d] = span(k); return b + gap <= c || d + gap <= a })) kept.push(l)
  }
  return kept
}

const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

// ── growth ─────────────────────────────────────────────────────────────────────────────────────

export interface GrowthPoint {
  id?: string
  /** When the check finished (ISO). */
  at: string
  /** "Day 0" for the starting point; the date otherwise. */
  label?: string
  named: number
  of: number
  /** Per assistant; missing for day 0 read the weekly way (only its totals are kept). */
  engines?: Record<string, { named: number; of: number }>
  partial?: boolean
}

export function GrowthChart({
  points,
  engines,
  labels,
  dayZero,
  upcoming,
  guarantee,
  onOpen,
}: {
  points: GrowthPoint[]
  /** The assistants of the latest check, in order, with their names. */
  engines: string[]
  labels: Record<string, string>
  /** The first point is day 0: the dashed line at its level and the day-90 mark. */
  dayZero: boolean
  /** Empty marks for the checks still to come, every two weeks up to day 90 (the live cabinet). */
  upcoming: boolean
  /** Day 90 is the guarantee's check (a site on the plan, and the sample). */
  guarantee: boolean
  onOpen?: (id: string) => void
}) {
  const [box, width] = useWidth<HTMLDivElement>()
  const [pick, setOnly] = useState<string>("all")
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return null

  // An assistant that could not be checked is kept as {named: 0, of: 0}: not measured, never "named 0".
  const checked = (p: GrowthPoint, e: string) => {
    const v = p.engines?.[e]
    return v && v.of > 0 ? v : undefined
  }
  // The filter offers the assistants measured in at least one check; a choice the site does not have
  // (another site's, kept across a switch) reads as all of them.
  const offered = engines.filter((e) => points.some((p) => checked(p, e)))
  const only = offered.includes(pick) ? pick : "all"
  const valueOf = (p: GrowthPoint) => (only === "all" ? { named: p.named, of: p.of } : checked(p, only))
  const shown = points.map((p, i) => ({ p, i, v: valueOf(p) })).filter((x): x is { p: GrowthPoint; i: number; v: { named: number; of: number } } => Boolean(x.v))
  const last = points[points.length - 1]
  const t0 = Date.parse(points[0].at)
  const tLast = Date.parse(last.at)
  const t90 = t0 + GUARANTEE_DAYS * DAY
  const future: number[] = []
  if (upcoming) for (let t = tLast + CHECK_EVERY_DAYS * DAY; t <= Math.max(t90, tLast + CHECK_EVERY_DAYS * DAY); t += CHECK_EVERY_DAYS * DAY) future.push(t)
  const tEnd = Math.max(tLast, dayZero ? t90 : tLast, future[future.length - 1] ?? tLast)

  const H = 210
  const L = 30
  const R = width - 14
  const T = 22
  const B = H - 34
  const x = (t: number) => L + ((R - L) * (t - t0)) / Math.max(DAY, tEnd - t0)
  const top = Math.max(3, ...shown.map((s) => s.v.named))
  const { max, step } = yScale(Math.ceil(top * 1.25))
  const y = (v: number) => B - ((B - T) * v) / max
  const base = dayZero ? valueOf(points[0]) : undefined
  const xy = shown.map((s) => [x(Date.parse(s.p.at)), y(s.v.named)] as const)
  const line = xy.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ")
  const area = xy.length > 1 ? `${line} L${xy[xy.length - 1][0].toFixed(1)},${B} L${xy[0][0].toFixed(1)},${B} Z` : ""

  const at = (xx: number, text: string, rank: number, strong: boolean) => ({ x: xx, text, rank, strong, anchor: anchorAt(xx, L, R) })
  const xLabels = spaced([
    ...shown.map((s, k) => at(xy[k][0], s.p.label ?? fmtDay(Date.parse(s.p.at)), k === 0 ? 0 : k === shown.length - 1 ? 1 : 4, true)),
    ...(dayZero ? [at(x(t90), "Day 90", 2, true)] : []),
    ...future.filter((t) => Math.abs(t - t90) > DAY).map((t) => at(x(t), fmtDay(t), 5, false)),
  ])
  const latest = valueOf(last)
  // The day-0 level's label: left of the day-90 mark while day 90 is ahead, at the end once it is past.
  const baseX = dayZero && t90 >= tLast ? x(t90) - 8 : R
  const end = xy.length > 0 ? xy[xy.length - 1] : null
  const endRight = end ? end[0] > R - 30 : false
  const endText = latest ? String(latest.named).length * 7.5 : 0
  const endSpan = end ? (endRight ? [end[0] - endText, end[0]] : [end[0] + 9, end[0] + 9 + endText]) : [0, 0]
  const baseSpan = [baseX - 9 * 6.3, baseX]
  const clash =
    base !== undefined &&
    end !== null &&
    Math.abs(end[1] - 8 - (y(base.named) - 6)) < 14 &&
    endSpan[0] < baseSpan[1] + 4 &&
    baseSpan[0] < endSpan[1] + 4
  // "Guarantee check" reads leftwards from the day-90 mark while there is room, else rightwards.
  const guaranteeLeft = x(t90) - L > 130
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  const h = hover === null ? null : shown.find((s) => s.i === hover)
  const hk = h ? shown.indexOf(h) : -1

  return (
    <div className="mt-5">
      {offered.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show the answers of">
          {["all", ...offered].map((e) => {
            const v = e === "all" ? last.named : checked(last, e)?.named
            return (
              <button
                key={e}
                type="button"
                onClick={() => setOnly(e)}
                aria-pressed={only === e}
                className={`text-xs font-semibold rounded-full px-3 py-1.5 tabular-nums ${
                  only === e ? "bg-violet-600 text-white" : "bg-[#f8f7f6] text-slate-700 hover:bg-violet-50"
                }`}
              >
                {e === "all" ? "All assistants" : labels[e]}
                {v !== undefined && ` · ${v}`}
              </button>
            )
          })}
        </div>
      )}
      <div ref={box} className="relative mt-2">
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          className="block max-w-full"
          role="group"
          aria-label={`Answers that named you, check by check: ${shown.map((s) => `${s.p.label ?? fmtDay(Date.parse(s.p.at))} ${s.v.named} of ${s.v.of}`).join(", ")}`}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={L - 7} y={y(v) + 4} fontSize={11} fill={MUTED} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {base && (
            <>
              <line x1={L} x2={R} y1={y(base.named) - 0.5} y2={y(base.named) - 0.5} stroke={GRAY} strokeWidth={1.5} strokeDasharray="4 4" />
              <text x={baseX} y={y(base.named) - 6} fontSize={11} fill={MUTED} textAnchor="end">
                Day 0: {base.named}
              </text>
            </>
          )}
          {dayZero && (
            <>
              <line x1={x(t90)} x2={x(t90)} y1={T - 6} y2={B} stroke={VIOLET} strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
              {guarantee && (
                <text x={guaranteeLeft ? x(t90) - 5 : x(t90) + 5} y={T + 4} fontSize={11} fill={MUTED} textAnchor={guaranteeLeft ? "end" : "start"}>
                  Guarantee check
                </text>
              )}
            </>
          )}
          {area && <path d={area} fill={VIOLET} fillOpacity={0.1} />}
          {xy.length > 1 && <path d={line} fill="none" stroke={VIOLET} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {future.map((t) => (
            <circle key={t} cx={x(t)} cy={B} r={3.5} fill="#fff" stroke={AXIS} strokeWidth={1.5} />
          ))}
          {xLabels.map((l) => (
            <text key={`${l.x}-${l.text}`} x={l.x} y={B + 19} fontSize={11} fill={l.strong ? INK : MUTED} textAnchor={l.anchor}>
              {l.text}
            </text>
          ))}
          {shown.map((s, k) => {
            const [cx, cy] = xy[k]
            const open = onOpen && s.p.id ? () => onOpen(s.p.id as string) : undefined
            return (
              <g
                key={s.i}
                role={open ? "button" : undefined}
                tabIndex={open ? 0 : undefined}
                aria-label={`${s.p.label ?? fmtDay(Date.parse(s.p.at))}: named in ${s.v.named} of ${s.v.of}${s.p.partial ? " (partial)" : ""}${open ? ", open this report" : ""}`}
                onMouseEnter={() => setHover(s.i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(s.i)}
                onBlur={() => setHover(null)}
                onClick={open}
                onKeyDown={(e) => {
                  if (open && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    open()
                  }
                }}
                className={open ? "cursor-pointer outline-none" : undefined}
              >
                <circle cx={cx} cy={cy} r={14} fill="transparent" />
                <circle cx={cx} cy={cy} r={hover === s.i ? 6 : 4.5} fill={s.p.partial ? VIOLET_SOFT : VIOLET} stroke="#fff" strokeWidth={2} />
              </g>
            )
          })}
          {latest && end && !clash && (
            <text x={endRight ? end[0] : end[0] + 9} y={end[1] - 8} fontSize={13} fontWeight={700} fill={INK} textAnchor={endRight ? "end" : "start"}>
              {latest.named}
            </text>
          )}
        </svg>
        {h && hk >= 0 && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs shadow-sm w-max"
            style={{ left: tipLeft(xy[hk][0], width), top: Math.max(0, xy[hk][1] - 64), maxWidth: Math.min(TIP_W, width) }}
          >
            <p className="font-bold text-[#1b1916]">
              {h.p.label ? `${h.p.label} · ${fmtDay(Date.parse(h.p.at))}` : fmtDay(Date.parse(h.p.at))}: {h.v.named} of {h.v.of}
              {h.p.partial ? " (partial)" : ""}
            </p>
            {only === "all" && h.p.engines && (
              <p className="text-slate-500 mt-0.5">
                {engines
                  .map((e) => {
                    const v = h.p.engines?.[e]
                    return v ? `${labels[e]} ${v.of > 0 ? v.named : "not checked"}` : ""
                  })
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── forecast ───────────────────────────────────────────────────────────────────────────────────

export interface PlanForecast {
  today: number
  of: number
  /** Answers that name the site after 1, 3, 6 and 12 months on the plan. */
  m1: number
  m3: number
  m6: number
  m12: number
}

/** The forecast (6 Nov 2026, Kiryl): in a year 1.5 times the business named most today, or 20 more answers than
 *  today when that is more; never above 80% of the answers (or 4 more than today, when that is higher). The year
 *  is reached 12% of the way in a month, 40% in three (above today: the guarantee's check), 70% in six, and by
 *  six months past the business named most whenever the year is. Each step above the last. Null when there is
 *  next to no room left (fewer than 4 answers to gain) or nothing was measured. */
export function planForecast(today: number, of: number, rival: number): PlanForecast | null {
  if (!(of > 0) || today < 0 || today >= of) return null
  const cap = Math.max(Math.floor(of * 0.8), Math.min(of, today + 4))
  const m12 = Math.min(cap, Math.max(Math.ceil(rival * 1.5), today + 20))
  if (m12 - today < 4) return null
  const at = (k: number) => Math.round(today + k * (m12 - today))
  const m1 = Math.max(today + 1, at(0.12))
  const m3 = Math.max(m1 + 1, at(0.4))
  const m6 = Math.min(m12 - 1, Math.max(m3 + 1, at(0.7), rival > today && rival < m12 ? rival + 1 : 0))
  return { today, of, m1, m3, m6, m12 }
}

const MONTHS = [0, 1, 3, 6, 12] as const
const PERIOD: Record<number, string> = { 0: "Today", 1: "1 month", 3: "3 months", 6: "6 months", 12: "12 months" }

function times(a: number, b: number) {
  const r = Math.floor((a / b) * 10) / 10
  return `${Number.isInteger(r) ? r : r.toFixed(1)}×`
}

export function Forecast({
  named,
  of,
  namedInstead,
  planHref,
  onStart,
}: {
  /** Day 0: answers that named the site, out of `of`. */
  named: number
  of: number
  namedInstead: { name: string; count: number }[]
  planHref: string
  onStart?: () => void
}) {
  const [box, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const rival = rivalOf(namedInstead)
  const f = planForecast(named, of, rival?.count ?? 0)
  // The most any name got, whatever it is: "named most" has to hold against the whole list on the page.
  const most = Math.max(0, ...namedInstead.map((n) => n.count))
  if (!f) return null
  const ahead = rival && rival.count > f.today ? rival : null
  const passAt = ahead ? (f.m6 > ahead.count ? 6 : f.m12 > ahead.count ? 12 : null) : null
  const values = [f.today, f.m1, f.m3, f.m6, f.m12]

  const headline =
    ahead && passAt === 6
      ? `In 6 months, AI assistants will name you more often than ${ahead.name}`
      : ahead && passAt === 12
        ? `In a year, AI assistants will name you more often than ${ahead.name}`
        : f.today === 0
          ? `In a year, AI assistants will name you in ${f.m12} of ${f.of} answers`
          : f.m12 >= 2 * f.today
            ? `In a year, AI assistants will name you ${times(f.m12, f.today)} as often`
            : `In a year, AI assistants will name you in ${f.m12} of ${f.of} answers`
  const sub =
    f.today === 0
      ? `Today they name you in none of ${f.of}.${ahead ? ` ${ahead.name}: ${ahead.count}.` : ""}`
      : `${f.m12} of ${f.of} answers in a year. ${f.today} today.`
  const notes = [
    "Today, from your report",
    f.today > 0 && f.m1 >= 2 * f.today ? `${times(f.m1, f.today)} today` : `+${f.m1 - f.today} on today`,
    f.today === 0 ? "Guaranteed: more than today*" : `Guaranteed: more than ${f.today}*`,
    ahead && passAt === 6 ? `Ahead of ${ahead.name}` : `+${f.m6 - f.today} on today`,
    f.m12 > most ? "Named most for your questions" : `+${f.m12 - f.today} on today`,
  ]

  const H = 236
  const L = 30
  const R = width - 14
  const T = 34
  const B = H - 36
  const { max, step } = yScale(Math.ceil(Math.max(f.m12, rival?.count ?? 0) * 1.15))
  const y = (v: number) => B - ((B - T) * v) / max
  const xs = MONTHS.map((m) => L + 16 + (R - L - 32) * Math.sqrt(m / 12))
  const xy = values.map((v, i) => [xs[i], y(v)] as const)
  const line = xy.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ")
  const area = `${line} L${xs[4].toFixed(1)},${B} L${xs[0].toFixed(1)},${B} Z`
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
  const phone = width < 480

  return (
    <section data-attention="report-forecast" className="rounded-2xl bg-white/90 border border-white shadow-sm p-5 sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Forecast with the plan</p>
      <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">{headline}</h2>
      <p className="text-sm text-slate-600 mt-1">{sub}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block w-4 h-[3px] rounded-full bg-violet-600" />
          With the plan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block w-4 border-t-2 border-dotted border-slate-400" />
          Without it
        </span>
        {rival && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span aria-hidden className="inline-block w-4 border-t-2 border-dashed border-slate-400" />
            <span className="truncate">{short(rival.name, 40)} today</span>
          </span>
        )}
      </div>
      <div ref={box} className="relative mt-2">
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          className="block max-w-full"
          role="group"
          aria-label={`Forecast with the plan: ${MONTHS.map((m, i) => `${PERIOD[m]} ${values[i]} of ${f.of}`).join(", ")}. Without the plan: ${f.today}.${rival ? ` ${rival.name} today: ${rival.count}.` : ""}`}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={L - 7} y={y(v) + 4} fontSize={11} fill={MUTED} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {rival && (
            <>
              <line x1={L} x2={R} y1={y(rival.count)} y2={y(rival.count)} stroke={GRAY} strokeWidth={1.5} strokeDasharray="6 4" />
              <text x={L + 4} y={y(rival.count) - 7} fontSize={11} fill={MUTED}>
                {short(rival.name, phone ? 22 : 40)} today: {rival.count}
              </text>
            </>
          )}
          <line x1={xs[0]} x2={xs[4]} y1={y(f.today)} y2={y(f.today)} stroke={GRAY} strokeWidth={2} strokeDasharray="2 4" />
          <text x={xs[4] - 8} y={y(f.today) - 7} fontSize={11} fill={MUTED} textAnchor="end">
            without the plan: {f.today}
          </text>
          <path d={area} fill={VIOLET} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={VIOLET} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {xy.map(([cx, cy], i) => (
            <g
              key={i}
              tabIndex={0}
              aria-label={`${PERIOD[MONTHS[i]]}: ${values[i]} of ${f.of}. ${notes[i]}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <circle cx={cx} cy={cy} r={16} fill="transparent" />
              <circle cx={cx} cy={cy} r={i === 3 && passAt === 6 ? 6.5 : 5} fill={VIOLET} stroke="#fff" strokeWidth={2} />
              <text x={cx} y={cy - 12} fontSize={i >= 3 ? 15 : 13} fontWeight={700} fill={INK} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
                {values[i]}
              </text>
              {i > 0 && <circle cx={cx} cy={B} r={3.5} fill="#fff" stroke={AXIS} strokeWidth={1.5} />}
              <text x={cx} y={B + 20} fontSize={11} fill={INK} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
                {phone ? PERIOD[MONTHS[i]].replace(" months", " mo").replace(" month", " mo") : PERIOD[MONTHS[i]]}
              </text>
            </g>
          ))}
          {ahead && passAt && !phone && (
            <g>
              <rect x={xs[passAt === 6 ? 3 : 4] - (passAt === 6 ? 62 : 124)} y={y(values[passAt === 6 ? 3 : 4]) - 50} width={124} height={22} rx={11} fill="#ede9fe" />
              <text x={xs[passAt === 6 ? 3 : 4] - (passAt === 6 ? 0 : 62)} y={y(values[passAt === 6 ? 3 : 4]) - 35} fontSize={12} fontWeight={700} fill="#5b21b6" textAnchor="middle">
                Ahead of {short(ahead.name, 9)}
              </text>
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs shadow-sm w-max"
            style={{ left: tipLeft(xy[hover][0], width), top: Math.max(0, xy[hover][1] + 14), maxWidth: Math.min(TIP_W, width) }}
          >
            <p className="font-bold text-[#1b1916]">
              {PERIOD[MONTHS[hover]]}: {values[hover]} of {f.of}
            </p>
            <p className="text-slate-500 mt-0.5">{notes[hover]}</p>
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {MONTHS.slice(1).map((m, k) => {
          const i = k + 1
          const lead = ahead !== null && ((passAt === 6 && i === 3) || (passAt === 12 && i === 4))
          return (
            <div key={m} className={`rounded-xl p-3 ${lead ? "bg-violet-50" : "bg-[#f8f7f6]"}`}>
              <p className={`text-[11px] font-bold uppercase tracking-wide ${lead ? "text-violet-700" : "text-slate-500"}`}>{PERIOD[m]}</p>
              <p className={`mt-1 text-2xl font-extrabold tabular-nums ${lead ? "text-violet-700" : ""}`}>
                {values[i]}
                <span className="text-sm font-bold text-slate-400">/{f.of}</span>
              </p>
              <p className={`text-xs mt-0.5 break-words ${lead ? "text-violet-800" : "text-slate-600"}`}>{notes[i]}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-sm font-bold">In 90 days, AI assistants will name you more often than on launch day — or we work for free.*</p>
        <a
          href={planHref}
          onClick={onStart}
          className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-bold"
        >
          Start the plan
        </a>
      </div>
    </section>
  )
}
