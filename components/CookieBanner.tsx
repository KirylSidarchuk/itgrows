"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  OPEN_SETTINGS_EVENT,
  SETTINGS_HASH,
  closeCookieSettings,
  consentedAnonId,
  openCookieSettings,
  setConsent,
  useConsent,
  useSettingsOpen,
  type ConsentChoice,
} from "@/components/consent/consent"
import { GEO_SANS, isGeoPage } from "@/lib/geo-pages"
import { t } from "@/lib/i18n/messages"
import { usePageLocale } from "@/lib/i18n/page-locale"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/cookieBanner"

// The banner sits in the root layout, outside the pages' LocaleProvider: its language is <html lang>,
// which the layout sets for each request and LocaleProvider updates on client navigation
// (lib/i18n/page-locale.ts). It is outside the pages' wrapper too, in <body>, so on the GEO pages it
// names their type itself (GEO_SANS); without it the banner came out in the browser's default serif.
//
// Which banner a page gets (27.10). The GEO site, in every language (lib/geo-pages.ts isGeoPage: its
// home, /business and everything under it, the GEO cabinet and guides included, the blog, /about and
// the legal pages) gets the compact phone banner at the top and the GEO type. Every other page keeps
// the production banner exactly as it was: first of all the LinkedIn/X product (/personal, /company,
// /cabinet, /dashboard, /reddit…), and /login and /signup, which that product shares.

// Keeps a record of each choice in our own analytics (no id unless the visitor accepted).
function recordChoice(choice: ConsentChoice) {
  try {
    const body = JSON.stringify({
      event: "cookie_consent",
      path: location.pathname,
      anon_id: consentedAnonId(),
      props: { choice },
    })
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", blob)) return
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {})
  } catch {
    /* never block the choice on analytics */
  }
}

function choose(choice: ConsentChoice) {
  if (choice === "declined") {
    recordChoice(choice)
    setConsent(choice)
  } else {
    setConsent(choice)
    recordChoice(choice)
  }
}

// Shown until the visitor accepts or declines; reopened by any "Cookie settings" link or call
// (see components/consent/consent.ts for the ways to open it).
export default function CookieBanner() {
  const consent = useConsent()
  const settingsOpen = useSettingsOpen()
  const [details, setDetails] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState<boolean | null>(null)
  const c = t(usePageLocale(), ns)
  const geo = isGeoPage(usePathname())

  useEffect(() => {
    window.openCookieSettings = openCookieSettings
    const onOpenEvent = () => openCookieSettings()
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(`[data-cookie-settings], a[href$="${SETTINGS_HASH}"]`)
      if (!el) return
      e.preventDefault()
      openCookieSettings()
    }
    const fromHash = () => {
      if (window.location.hash !== SETTINGS_HASH) return
      openCookieSettings()
      try {
        window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenEvent)
    window.addEventListener("hashchange", fromHash)
    document.addEventListener("click", onClick, true)
    fromHash()
    return () => {
      window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenEvent)
      window.removeEventListener("hashchange", fromHash)
      document.removeEventListener("click", onClick, true)
      if (window.openCookieSettings === openCookieSettings) delete window.openCookieSettings
    }
  }, [])

  if (consent === "unknown") return null
  const chosen = consent === "accepted" || consent === "declined"
  if (chosen && !settingsOpen) return null

  const showSettings = settingsOpen || details
  const toggleValue = analyticsOn ?? consent === "accepted"

  function done(choice: ConsentChoice) {
    setDetails(false)
    setAnalyticsOn(null)
    choose(choice)
  }

  function close() {
    setDetails(false)
    setAnalyticsOn(null)
    closeCookieSettings()
  }

  const policyLink = (
    <Link href="/privacy#cookies" className="underline text-violet-400 hover:text-violet-300 transition-colors">
      Cookie Policy
    </Link>
  )

  // GEO pages. Phones (narrower than 640 px): one short line and three small buttons, fixed at the
  // TOP of the screen (below the notch), so that in no language does the banner cover the "Check my
  // site" button (27.10); the full text is in the settings and the policy. From 640 px up the banner
  // stays at the bottom, as before. The GEO type (GEO_SANS) throughout.
  if (geo) {
    return (
      <div
        role="dialog"
        aria-label="Cookie settings"
        style={{ fontFamily: GEO_SANS }}
        className={`fixed top-0 sm:top-auto sm:bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 sm:px-6 ${
          showSettings
            ? "pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
            : "pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
        } shadow-lg`}
      >
        {!showSettings && (
          <div className="sm:hidden flex flex-col gap-1.5">
            <p className="text-xs leading-4 text-slate-200">
              {rich(c.short, {
                link: (chunk) => (
                  <Link href="/privacy#cookies" className="underline text-violet-400 hover:text-violet-300 transition-colors">
                    {chunk}
                  </Link>
                ),
              })}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetails(true)}
                className="h-8 px-1.5 text-xs text-slate-300 underline hover:text-white transition-colors"
              >
                {c.settings}
              </button>
              <button
                type="button"
                onClick={() => done("declined")}
                className="h-8 px-3 text-xs rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {c.decline}
              </button>
              <button
                type="button"
                onClick={() => done("accepted")}
                className="h-8 px-3 text-xs rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
              >
                {c.accept}
              </button>
            </div>
          </div>
        )}
        {/* From 640 px up and the settings: the production banner's content. */}
        {!showSettings ? (
          <div className="max-w-6xl mx-auto hidden sm:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-200 leading-relaxed">
              We use analytics and advertising cookies only if you accept. Essential cookies for sign-in are always on.{" "}
              {policyLink}
            </p>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDetails(true)}
                className="px-1 py-2 text-sm text-slate-300 underline hover:text-white transition-colors"
              >
                Cookie settings
              </button>
              <button
                type="button"
                onClick={() => done("declined")}
                className="px-4 py-2 text-sm rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => done("accepted")}
                className="px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Cookie settings</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="px-2 py-1 text-lg leading-none text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="flex items-start justify-between gap-4 border-t border-slate-700 pt-3">
              <div className="text-sm">
                <p className="font-medium text-slate-100">Essential</p>
                <p className="text-slate-400">Sign-in, security and your cookie choice.</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 pt-0.5">Always on</span>
            </div>

            <label className="flex items-start justify-between gap-4 border-t border-slate-700 pt-3 cursor-pointer">
              <span className="text-sm">
                <span className="block font-medium text-slate-100">Analytics and advertising</span>
                <span className="block text-slate-400">Google Ads, Microsoft Clarity, Contentsquare, Vercel Analytics.</span>
              </span>
              <span className="relative inline-flex shrink-0 items-center mt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={toggleValue}
                  onChange={(e) => setAnalyticsOn(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-slate-600 transition-colors peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-400">{policyLink}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => done(toggleValue ? "accepted" : "declined")}
                  className="px-4 py-2 text-sm rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => done("accepted")}
                  className="px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Every other page (the LinkedIn/X product, /cabinet and the rest): the production banner,
  // unchanged.
  return (
    <div
      role="dialog"
      aria-label="Cookie settings"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg"
    >
      {!showSettings ? (
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-200 leading-relaxed">
            We use analytics and advertising cookies only if you accept. Essential cookies for sign-in are always on.{" "}
            {policyLink}
          </p>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setDetails(true)}
              className="px-1 py-2 text-sm text-slate-300 underline hover:text-white transition-colors"
            >
              Cookie settings
            </button>
            <button
              type="button"
              onClick={() => done("declined")}
              className="px-4 py-2 text-sm rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => done("accepted")}
              className="px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
            >
              Accept all
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Cookie settings</p>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="px-2 py-1 text-lg leading-none text-slate-400 hover:text-white transition-colors"
            >
              &times;
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-slate-700 pt-3">
            <div className="text-sm">
              <p className="font-medium text-slate-100">Essential</p>
              <p className="text-slate-400">Sign-in, security and your cookie choice.</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400 pt-0.5">Always on</span>
          </div>

          <label className="flex items-start justify-between gap-4 border-t border-slate-700 pt-3 cursor-pointer">
            <span className="text-sm">
              <span className="block font-medium text-slate-100">Analytics and advertising</span>
              <span className="block text-slate-400">Google Ads, Microsoft Clarity, Contentsquare, Vercel Analytics.</span>
            </span>
            <span className="relative inline-flex shrink-0 items-center mt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={toggleValue}
                onChange={(e) => setAnalyticsOn(e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-slate-600 transition-colors peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-3">
            <p className="text-xs text-slate-400">{policyLink}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => done(toggleValue ? "accepted" : "declined")}
                className="px-4 py-2 text-sm rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => done("accepted")}
                className="px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
