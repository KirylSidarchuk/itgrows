"use client"

import { useEffect, useId, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { consentedAnonId } from "@/components/consent/consent"
import { PromoWheel, SEG_COLORS, SPIN_MS, prefersStill, spinAngle } from "@/components/geo/PromoWheel"
import { markExitWheelSpun } from "@/lib/geo-exit-wheel"
import { holdGuestReward, rewardUntil } from "@/lib/geo-guest-reward"
import { GEO_SANS } from "@/lib/geo-pages"
import { PROMO_WHEEL, WHEEL_REWARDS, isWheelReward, type GuestPromoView, type WheelReward } from "@/lib/geo-promo"
import type { Locale } from "@/lib/i18n/config"
import { t } from "@/lib/i18n/messages"
import { localePath } from "@/lib/i18n/paths"
import { usePageLocale } from "@/lib/i18n/page-locale"
import ns from "@/lib/i18n/messages/exitWheel"

// The launch-rewards wheel offered when a signed-out visitor on a computer moves to leave a public GEO
// page (opened by ./ExitWheel.tsx, which loads this file only then; the rules: lib/geo-promo.ts).
// A dialog: labelled by its title, focus moves in and stays in (Tab cycles), Esc, the close button,
// "No thanks" and a click on the backdrop close it, and focus goes back to where it was. Honest: no
// timer, no prices (they are only inside the account), a plain "No thanks", and the odds said (each
// reward the same chance). The reward is drawn on the server (POST /api/geo/promo/guest-spin) and the
// wheel turns to it (not with prefers-reduced-motion). After the spin: the reward, the date it is kept
// until, what claims it (the site, an account, the free report), and "Claim my reward", which closes
// the dialog and puts the cursor in the address field of the quick check on this page
// (app/business/AuditForm.tsx), or on the home page in this language. From then on the reward is
// reminded at that form, at the check's account offer and on /signup and /login
// (components/geo/GuestRewardNote.tsx; handed over here with holdGuestReward, no request).
// Texts: lib/i18n/messages/exitWheel.ts, in the page's language (<html lang>).
// Counted like every public-page event (/api/track, an id only after "Accept"): geo_wheel_exit_seen
// (props.lang, props.path) when it opens, geo_wheel_exit_spin (props.reward, .lang, .path, .fresh).

const API = "/api/geo/promo/guest-spin"
/** The address field of the quick check (app/business/AuditForm.tsx). */
const CHECK_FIELD = "input[data-geo-check-site]"
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** This browser already has a reward from the website's wheel (it then never opens here again). */
export async function rewardKept(): Promise<boolean> {
  try {
    const r = await fetch(API, { cache: "no-store" })
    const j = (r.ok ? await r.json() : null) as GuestPromoView | null
    if (!j?.reward) return false
    markExitWheelSpun(j.reward.expiresAt)
    holdGuestReward(j.reward)
    return true
  } catch {
    return false
  }
}

function track(event: string, props: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ event, path: location.pathname, anon_id: consentedAnonId(), props })
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", blob)) return
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {})
  } catch {
    // Analytics never gets in the way.
  }
}

function reveal(field: HTMLInputElement) {
  field.scrollIntoView({ block: "center", behavior: prefersStill() ? "auto" : "smooth" })
  field.focus({ preventScroll: true })
}

/** The quick check's address field on this page; else the home page in this language, and its field
 *  once it is there. */
function goToCheck(push: (href: string) => void, locale: Locale) {
  const field = document.querySelector<HTMLInputElement>(CHECK_FIELD)
  if (field) return reveal(field)
  push(`${localePath(locale, "/")}#geo-check`)
  const until = Date.now() + 10_000
  const timer = window.setInterval(() => {
    const there = document.querySelector<HTMLInputElement>(CHECK_FIELD)
    if (there) {
      window.clearInterval(timer)
      reveal(there)
    } else if (Date.now() > until) window.clearInterval(timer)
  }, 100)
}

type Won = { id: WheelReward; expiresAt: string }

export default function ExitWheelModal({ onClose }: { onClose: () => void }) {
  const locale = usePageLocale()
  const m = t(locale, ns)
  const router = useRouter()
  const pathname = usePathname()
  const [openedOn] = useState(pathname)
  const titleId = useId()
  const lineId = useId()
  const claimId = useId()
  const box = useRef<HTMLDivElement>(null)
  const spinRef = useRef<HTMLButtonElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const seen = useRef(false)
  /** "Claim my reward" puts focus in the form: it is not handed back on close. */
  const toForm = useRef(false)
  const [busy, setBusy] = useState(false)
  const [spin, setSpin] = useState<{ angle: number; animate: boolean } | null>(null)
  const [won, setWon] = useState<Won | null>(null)
  const [error, setError] = useState("")
  const [said, setSaid] = useState("")

  const until = (iso: string) => rewardUntil(locale, iso)

  // Open: the page behind stays still (its scrollbar's room kept, so nothing shifts) and focus moves in.
  // Closed: focus goes back where it was.
  useEffect(() => {
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.documentElement
    const body = document.body
    const overflow = root.style.overflow
    const padding = body.style.paddingRight
    const bar = window.innerWidth - root.clientWidth
    root.style.overflow = "hidden"
    if (bar > 0) body.style.paddingRight = `${bar}px`
    spinRef.current?.focus()
    return () => {
      root.style.overflow = overflow
      body.style.paddingRight = padding
      if (!toForm.current && back?.isConnected && back !== body) back.focus()
    }
  }, [])

  // geo_wheel_exit_seen, once.
  useEffect(() => {
    if (seen.current) return
    seen.current = true
    track("geo_wheel_exit_seen", { lang: locale, path: location.pathname })
  }, [locale])

  // Another page (the browser's back button): the dialog goes with the page it opened on.
  useEffect(() => {
    if (pathname !== openedOn) onClose()
  }, [pathname, openedOn, onClose])

  // Esc closes; Tab and Shift+Tab stay inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        if (!busy) onClose()
        return
      }
      if (e.key !== "Tab" || !box.current) return
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
      if (!items.length) return
      const at = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && at <= 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && (at === -1 || at === items.length - 1)) {
        e.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, busy])

  // The reward is on screen: focus moves to "Claim my reward".
  useEffect(() => {
    if (won) ctaRef.current?.focus()
  }, [won])

  async function go() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const r = await fetch(API, { method: "POST" })
      const j = (await r.json().catch(() => ({}))) as GuestPromoView & { error?: string }
      const got = r.ok && j.reward && isWheelReward(j.reward.id) ? j.reward : null
      if (!got) {
        setError(m.failed)
        setBusy(false)
        return
      }
      markExitWheelSpun(got.expiresAt)
      track("geo_wheel_exit_spin", { reward: got.id, lang: locale, path: location.pathname, fresh: Boolean(j.fresh) })
      const still = prefersStill()
      setSpin({ angle: spinAngle(got.id, still), animate: !still })
      window.setTimeout(
        () => {
          setSpin((s) => (s ? { ...s, animate: false } : s))
          setWon({ id: got.id, expiresAt: got.expiresAt })
          setSaid(m.announce(m.rewards[got.id], until(got.expiresAt)))
          setBusy(false)
          // The reminders at the check's form and offer and on sign-up show it from now on.
          holdGuestReward(got)
        },
        still ? 0 : SPIN_MS + 100
      )
    } catch {
      setError(m.failed)
      setBusy(false)
    }
  }

  function claimReward() {
    toForm.current = true
    onClose()
    window.setTimeout(() => goToCheck((href) => router.push(href), locale), 0)
  }

  const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1b1916]/60 p-4"
      style={{ fontFamily: GEO_SANS }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={lineId}
        className="relative w-full max-w-xl rounded-2xl bg-white p-7 text-[#1b1916] shadow-2xl"
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label={m.close}
          className={`absolute right-3 top-3 h-9 w-9 rounded-lg text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-[#1b1916] ${focusRing}`}
        >
          &times;
        </button>
        <h2 id={titleId} className="pr-10 text-2xl font-extrabold leading-tight">
          {m.title}
        </h2>
        <p id={lineId} className="mt-2 text-[15px] leading-relaxed text-slate-600">
          {m.line(PROMO_WHEEL.validDays)}
        </p>

        <div className="mt-6 flex items-center gap-7">
          <PromoWheel angle={spin?.angle ?? 0} animate={Boolean(spin?.animate)} won={won?.id ?? null} labels={m.segments} className="w-48 h-48" />
          <div className="min-w-0 flex-1">
            {won ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">{m.wonLabel}</p>
                <p className="mt-1 text-lg font-extrabold leading-snug">{m.rewards[won.id]}</p>
                <p className="mt-2 text-sm text-slate-700">{m.keptUntil(until(won.expiresAt))}</p>
                <p id={claimId} className="mt-1 text-sm leading-relaxed text-slate-600">
                  {m.claimHow}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-700">{m.odds}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {WHEEL_REWARDS.map((r, i) => (
                    <li key={r} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEG_COLORS[i] }} />
                      {m.rewards[r]}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {won ? (
            <button
              ref={ctaRef}
              type="button"
              onClick={claimReward}
              aria-describedby={claimId}
              className={`rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500 ${focusRing}`}
            >
              {m.cta}
            </button>
          ) : (
            <>
              <button
                ref={spinRef}
                type="button"
                onClick={go}
                aria-disabled={busy}
                className={`rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500 aria-disabled:opacity-70 ${focusRing}`}
              >
                {busy ? m.spinning : m.spin}
              </button>
              <button
                type="button"
                onClick={() => !busy && onClose()}
                className={`rounded-lg px-2 py-3 text-sm font-semibold text-slate-600 hover:text-[#1b1916] hover:underline ${focusRing}`}
              >
                {m.noThanks}
              </button>
            </>
          )}
          <a
            href="/terms#launch-rewards"
            target="_blank"
            rel="noopener"
            className={`ml-auto rounded text-xs text-slate-500 underline underline-offset-2 hover:text-[#1b1916] ${focusRing}`}
          >
            {m.terms}
          </a>
        </div>
        <p aria-live="polite" className="sr-only">
          {said}
        </p>
      </div>
    </div>
  )
}
