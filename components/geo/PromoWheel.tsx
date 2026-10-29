import { WHEEL_REWARDS, type WheelReward } from "@/lib/geo-promo"

// The launch-rewards wheel as a picture (the rules: lib/geo-promo.ts), shared by the cabinet
// (app/business/dashboard/launch-wheel.tsx) and the exit-intent wheel on the website
// (components/geo/ExitWheelModal.tsx). Four segments in the order of WHEEL_REWARDS, clockwise from the
// top, and a pointer at the top. The reward is drawn on the server; the wheel only turns to it, for
// about 2.5 s, landing inside its segment, never on an edge (spinAngle), and does not turn with
// prefers-reduced-motion. It is a picture (aria-hidden): whoever shows it lists the rewards as text.

export const SPIN_MS = 2500
const TURNS = 5
/** The segments, clockwise from the top, in the order of WHEEL_REWARDS; white text on each is 5.4:1 or more. */
export const SEG_COLORS = ["#7c3aed", "#0e7490", "#6d28d9", "#155e75"]

/** The wheel's turn that puts the reward's segment under the pointer at the top. */
export const restAngle = (r: WheelReward) => (360 - (WHEEL_REWARDS.indexOf(r) * 90 + 45)) % 360

/** Where a spin ends: a few turns (none when `still`) and anywhere inside the reward's segment but its
 *  outer quarters, so it lands clearly on the reward. */
export function spinAngle(r: WheelReward, still: boolean): number {
  const jitter = (Math.random() - 0.5) * 40
  return (still ? 0 : TURNS * 360) + restAngle(r) + jitter
}

/** The visitor asked for less motion: the wheel does not turn, the result shows at once. */
export function prefersStill(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

function segment(i: number) {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return `${(100 + 96 * Math.sin(a)).toFixed(2)} ${(100 - 96 * Math.cos(a)).toFixed(2)}`
  }
  return `M100 100 L${p(i * 90)} A96 96 0 0 1 ${p((i + 1) * 90)} Z`
}

/** A label line's size: 12, as the cabinet's English labels, smaller for a longer line (another
 *  language) so that it stays inside its segment (about 100 units wide at the first line, 84 at the second). */
const fit = (text: string, width: number) => Math.min(12, Math.round((width / (Math.max(1, text.length) * 0.62)) * 10) / 10)

/**
 * The wheel at `angle` (degrees; `animate` turns it there). `won`: the reward landed on, the other
 * segments dimmed. `labels`: two short lines per segment, in the page's language. `className`: its
 * size (the cabinet's by default).
 */
export function PromoWheel({
  angle,
  animate,
  won,
  labels,
  className = "w-36 h-36 sm:w-40 sm:h-40",
}: {
  angle: number
  animate: boolean
  won: WheelReward | null
  labels: Readonly<Record<WheelReward, readonly string[]>>
  className?: string
}) {
  return (
    <div className={`relative mx-auto shrink-0 ${className}`} aria-hidden>
      <div
        className="absolute inset-0 motion-reduce:transition-none!"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: animate ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.65, 0.18, 1)` : "none",
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {WHEEL_REWARDS.map((r, i) => {
            const [top = "", bottom = ""] = labels[r]
            return (
              <g key={r} opacity={won && won !== r ? 0.4 : 1}>
                <path d={segment(i)} fill={SEG_COLORS[i]} stroke="#1b1916" strokeWidth="2" />
                <g transform={`rotate(${i * 90 + 45} 100 100)`}>
                  <text x="100" y="40" textAnchor="middle" fill="#fff" fontSize={fit(top, 100)} fontWeight="800">
                    {top}
                  </text>
                  <text x="100" y="55" textAnchor="middle" fill="#fff" fontSize={fit(bottom, 84)} fontWeight="800">
                    {bottom}
                  </text>
                </g>
              </g>
            )
          })}
          <circle cx="100" cy="100" r="15" fill="#1b1916" stroke="#fff" strokeWidth="3" />
        </svg>
      </div>
      <svg viewBox="0 0 24 20" className="absolute left-1/2 -top-1.5 w-6 h-5 -translate-x-1/2">
        <path d="M2 2 H22 L12 18 Z" fill="#fff" stroke="#1b1916" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
