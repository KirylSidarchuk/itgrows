"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { GeoPrices } from "@/lib/geo-pricing"
import {
  PROMO_WHEEL,
  REWARD_INTERVAL,
  REWARD_TEXT,
  WHEEL_REWARDS,
  rewardDetail,
  type PromoView,
  type WheelReward,
} from "@/lib/geo-promo"

// The launch-rewards wheel in the GEO cabinet (the rules: lib/geo-promo.ts): at the end of the report,
// next to "Start the plan" (visibility/parts.tsx YourPlan), and on the plan page above the ways to pay
// (plan/page.tsx, which also shows the prices with the reward). Everyone wins one of four rewards; the
// reward is drawn on the server when "Spin the wheel" is pressed (POST /api/geo/promo/spin) and the
// wheel then turns to it, for about 2.5 s, landing inside its segment, never on an edge. With
// prefers-reduced-motion it does not turn: the result shows at once. The wheel itself is a picture
// (aria-hidden); the four rewards are listed as text, the button is a real button and the result is
// announced. After the spin: the reward, what it gives at the account's prices, the date it ends and
// what is left of it. Nothing shows while the state loads, for a site the reward is not for, or for an
// account that cannot spin (paying, a client set up by hand, no report yet, or the wheel off).

const SPIN_MS = 2500
const TURNS = 5
/** The segments, clockwise from the top, in the order of WHEEL_REWARDS; white text on each is 5.4:1 or more. */
const SEG_COLORS = ["#7c3aed", "#0e7490", "#6d28d9", "#155e75"]
/** The CTA of each way to pay on the plan page. */
const OPTION_CTA = { month: "Start monthly", quarter: "Pay 3 months", year: "Pay a year" } as const

/** The account's wheel state (GET /api/geo/promo/spin); null while it loads or if it could not be read. */
export function usePromo(on = true): [PromoView | null, (v: PromoView) => void] {
  const [promo, setPromo] = useState<PromoView | null>(null)
  useEffect(() => {
    if (!on) return
    let current = true
    fetch("/api/geo/promo/spin", { cache: "no-store" })
      .then(async (r) => {
        const j = (r.ok ? await r.json().catch(() => null) : null) as PromoView | null
        if (current && j && typeof j.canSpin === "boolean") setPromo(j)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [on])
  return [promo, setPromo]
}

/** The reward this account can use now for the site, or null. */
export function liveReward(promo: PromoView | null, site: string | null | undefined): WheelReward | null {
  const r = promo?.reward
  return r && r.live && !r.used && r.site === site ? r.id : null
}

// The clock, to the minute, for the countdown; 0 before the page runs in the browser.
const subscribeMinute = (cb: () => void) => {
  const t = setInterval(cb, 15_000)
  return () => clearInterval(t)
}
const minuteNow = () => Math.floor(Date.now() / 60_000)

/** Now in ms, updated every minute; 0 on the server. */
export function useMinuteNow(): number {
  return useSyncExternalStore(subscribeMinute, minuteNow, () => 0) * 60_000
}

export const fmtUntil = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

/** "6 days 23 h left", "5 h 12 min left". */
export function timeLeft(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d >= 1) return `${d} day${d === 1 ? "" : "s"} ${h} h left`
  if (h >= 1) return `${h} h ${m} min left`
  return `${m} min left`
}

/** The wheel's turn that puts the reward's segment under the pointer at the top. */
const restAngle = (r: WheelReward) => (360 - (WHEEL_REWARDS.indexOf(r) * 90 + 45)) % 360

function segment(i: number) {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return `${(100 + 96 * Math.sin(a)).toFixed(2)} ${(100 - 96 * Math.cos(a)).toFixed(2)}`
  }
  return `M100 100 L${p(i * 90)} A96 96 0 0 1 ${p((i + 1) * 90)} Z`
}

function Wheel({ angle, animate, won }: { angle: number; animate: boolean; won: WheelReward | null }) {
  return (
    <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40 shrink-0" aria-hidden>
      <div
        className="absolute inset-0 motion-reduce:transition-none!"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: animate ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.65, 0.18, 1)` : "none",
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {WHEEL_REWARDS.map((r, i) => (
            <g key={r} opacity={won && won !== r ? 0.4 : 1}>
              <path d={segment(i)} fill={SEG_COLORS[i]} stroke="#1b1916" strokeWidth="2" />
              <g transform={`rotate(${i * 90 + 45} 100 100)`}>
                <text x="100" y="40" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
                  {REWARD_TEXT[r].segment[0]}
                </text>
                <text x="100" y="55" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
                  {REWARD_TEXT[r].segment[1]}
                </text>
              </g>
            </g>
          ))}
          <circle cx="100" cy="100" r="15" fill="#1b1916" stroke="#fff" strokeWidth="3" />
        </svg>
      </div>
      <svg viewBox="0 0 24 20" className="absolute left-1/2 -top-1.5 w-6 h-5 -translate-x-1/2">
        <path d="M2 2 H22 L12 18 Z" fill="#fff" stroke="#1b1916" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/**
 * The wheel, or the reward won, for one site. `promo` from usePromo (nothing shows while it is null);
 * `onChange` gets the state with the reward once the wheel has landed. `where`: the end of the report
 * (with a link to the plan page, on the reward's way to pay) or the plan page.
 */
export function LaunchRewards({
  promo,
  onChange,
  site,
  prices,
  where,
  planHref,
}: {
  promo: PromoView | null
  onChange: (v: PromoView) => void
  site: string
  prices: GeoPrices | null
  where: "report" | "plan"
  /** The report only: the plan page for this site. */
  planHref?: string
}) {
  const [spin, setSpin] = useState<{ angle: number; animate: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [said, setSaid] = useState("")
  const seen = useRef(false)
  const now = useMinuteNow()

  const reward = promo?.reward && promo.reward.site === site ? promo.reward : null
  const spinnable = Boolean(PROMO_WHEEL.enabled && promo?.canSpin && promo.site === site && !promo.reward)

  // geo_wheel_seen: the wheel was on screen, ready to spin, once per page load.
  useEffect(() => {
    if (!spinnable || seen.current) return
    seen.current = true
    fetch("/api/geo/promo/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ where, domain: site }),
      keepalive: true,
    }).catch(() => {})
  }, [spinnable, where, site])

  async function go() {
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/geo/promo/spin", { method: "POST" })
      const j = (await r.json().catch(() => ({}))) as PromoView & { error?: string }
      const won = r.ok ? j.reward : null
      if (!won) {
        setError(
          j.error === "not_eligible" || j.error === "off"
            ? "The launch rewards are not available for this account."
            : "That didn't go through. Try again in a minute."
        )
        setBusy(false)
        return
      }
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      // Anywhere inside the segment but its outer quarters: it lands clearly on the reward.
      const jitter = (Math.random() - 0.5) * 40
      setSpin({ angle: (still ? 0 : TURNS * 360) + restAngle(won.id) + jitter, animate: !still })
      window.setTimeout(
        () => {
          setSpin((s) => (s ? { ...s, animate: false } : s))
          setSaid(`Your reward: ${REWARD_TEXT[won.id].title}, valid until ${fmtUntil(won.expiresAt)}.`)
          setBusy(false)
          onChange(j)
        },
        still ? 0 : SPIN_MS + 100
      )
    } catch {
      setError("That didn't go through. Try again in a minute.")
      setBusy(false)
    }
  }

  const live = reward && reward.live && !reward.used ? reward : null
  const ended = reward && !reward.live && !reward.used && now > 0 && Date.parse(reward.expiresAt) <= now ? reward : null
  if (!promo || (!spinnable && !live && !(ended && where === "plan") && !spin)) {
    return <p aria-live="polite" className="sr-only">{said}</p>
  }

  const box = "mt-5 rounded-xl border border-white/15 bg-white/[0.06] p-4 sm:p-5"
  if (ended && !spin) {
    return (
      <p className="mt-4 text-sm text-white/60">
        Your launch reward ({REWARD_TEXT[ended.id].title.toLowerCase()}) ended on {fmtUntil(ended.expiresAt)}.
      </p>
    )
  }

  const shown = live && !busy ? live : null
  const angle = spin?.angle ?? (shown ? restAngle(shown.id) : 0)
  return (
    <div className={box}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Wheel angle={angle} animate={Boolean(spin?.animate)} won={shown?.id ?? null} />
        <div className="min-w-0 flex-1">
          {shown ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">Your launch reward</p>
              <p className="mt-1 font-extrabold text-lg leading-snug">{REWARD_TEXT[shown.id].title}</p>
              {prices && <p className="mt-1 text-sm text-white/80">{rewardDetail(shown.id, prices)}</p>}
              <p className="mt-2 text-sm text-white/80">
                For {shown.site}, valid until <b className="text-white">{fmtUntil(shown.expiresAt)}</b>
                {now > 0 && <> ({timeLeft(Date.parse(shown.expiresAt) - now)})</>}.
              </p>
              {where === "plan" ? (
                <p className="mt-2 text-sm text-white/60">It applies when you choose “{OPTION_CTA[REWARD_INTERVAL[shown.id]]}” below.</p>
              ) : (
                planHref && (
                  <a
                    href={`${planHref}&interval=${REWARD_INTERVAL[shown.id]}`}
                    className="mt-3 inline-block text-sm font-semibold text-cyan-200 hover:text-white hover:underline"
                  >
                    Use it on the plan page →
                  </a>
                )
              )}
            </>
          ) : (
            <>
              <p className="font-extrabold text-lg leading-snug">Everyone wins one of four launch rewards</p>
              <p className="mt-1 text-sm text-white/75 leading-relaxed">
                One spin per account, each reward with the same chance. It is for {site} and your first plan payment, for{" "}
                {PROMO_WHEEL.validDays} days from your spin.
              </p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm text-white/85">
                {WHEEL_REWARDS.map((r, i) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEG_COLORS[i] }} />
                    {REWARD_TEXT[r].title}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={go}
                  disabled={busy}
                  className="rounded-xl bg-cyan-300 text-[#1b1916] hover:bg-cyan-200 disabled:opacity-70 px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
                >
                  {busy ? "Spinning…" : "Spin the wheel"}
                </button>
                <a href="/terms#launch-rewards" className="text-xs text-white/60 hover:text-white underline underline-offset-2">
                  Terms
                </a>
              </div>
              {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            </>
          )}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{said}</p>
    </div>
  )
}

/** The end of the report: the wheel, or the reward won, under "Start the plan" (its own state). */
export function ReportRewards({ site, prices, planHref }: { site: string; prices: GeoPrices | null; planHref: string }) {
  const [promo, setPromo] = usePromo(PROMO_WHEEL.enabled || PROMO_WHEEL.honourWon)
  return <LaunchRewards promo={promo} onChange={setPromo} site={site} prices={prices} where="report" planHref={planHref} />
}
