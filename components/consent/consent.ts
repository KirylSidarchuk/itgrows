// Cookie consent: one place that knows the visitor's choice and tells everything else.
//
// The choice lives in localStorage under "cookie_consent" ("accepted" | "declined"), the same key the
// old banner used, so earlier choices carry over. Nothing optional (Contentsquare, Clarity, Vercel
// Analytics, the itg_gclid cookie, the itg_anon id, the ad click id in our own analytics) is stored or
// loaded until it reads "accepted".
// The Google tag runs in Advanced Consent Mode (app/layout.tsx): gtag.js loads on every page with
// consent denied, so Google gets only cookieless pings without the ad click id; "Accept" grants consent,
// "Decline" keeps it denied.
//
// Reopening the settings from anywhere (the footer, the privacy page, any component):
//   - a link:        <a href="#cookie-settings">Cookie settings</a>   (or any element with data-cookie-settings)
//   - from code:     window.openCookieSettings()
//   - as an event:   window.dispatchEvent(new Event("itg:cookie-settings"))
//   - from React:    import { openCookieSettings } from "@/components/consent/consent"

import { useSyncExternalStore } from "react"

export type ConsentChoice = "accepted" | "declined"
// "unset" = the visitor has not chosen yet; "unknown" = server render, before the browser is read.
export type ConsentState = ConsentChoice | "unset" | "unknown"

export const CONSENT_KEY = "cookie_consent"
export const OPEN_SETTINGS_EVENT = "itg:cookie-settings"
export const SETTINGS_HASH = "#cookie-settings"
const CHANGE_EVENT = "itg:consent-change"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    clarity?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _uxa?: { push: (command: unknown[]) => unknown }
    openCookieSettings?: () => void
    // Defined by the inline script in app/layout.tsx.
    itgGoogleTag?: { load: () => void; discard: () => void }
  }
}

// Fallback for browsers that refuse localStorage: the choice made on this page still counts here.
let memoryChoice: ConsentChoice | null = null
let settingsOpen = false
let storageHooked = false

function storedChoice(): ConsentChoice | "unset" {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === "accepted" || v === "declined" ? v : "unset"
  } catch {
    return "unset"
  }
}

export function readConsent(): ConsentChoice | "unset" {
  const stored = storedChoice()
  return stored === "unset" && memoryChoice ? memoryChoice : stored
}

export function hasConsent(): boolean {
  return readConsent() === "accepted"
}

// "Accept": Google is told consent is granted. "Decline": Google is told it is denied (cookieless pings only).
export function applyGoogleConsent(granted: boolean) {
  try {
    if (granted) window.itgGoogleTag?.load()
    else window.itgGoogleTag?.discard()
  } catch {
    /* a blocked tag must never break the page */
  }
}

function stopLoadedTrackers() {
  try {
    window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" })
    window.clarity?.("consent", false)
  } catch {
    /* ignore */
  }
  try {
    window._uxa?.push(["optout"])
  } catch {
    /* ignore */
  }
  try {
    window.fbq?.("consent", "revoke")
  } catch {
    /* ignore */
  }
}

// Cookies the optional tools set on our own domain, plus our own optional items.
const OPTIONAL_COOKIE = /^(itg_gclid|_gcl_.*|_clck|_clsk|_cs_.*|_fbp|_fbc)$/

function clearOptionalStorage() {
  try {
    const host = location.hostname
    const parts = host.split(".")
    const domains = ["", host, "." + host]
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."))
    for (const pair of document.cookie.split(";")) {
      const name = pair.split("=")[0]?.trim()
      if (!name || !OPTIONAL_COOKIE.test(name)) continue
      for (const d of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`
      }
    }
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem("itg_anon")
  } catch {
    /* ignore */
  }
  try {
    // Visit markers: itg_seen (components/Analytics.tsx), itgrows_welcome_tracked (app/welcome),
    // itg_trial_fired_<checkout> (components/AdsConversion.tsx).
    for (const key of Object.keys(sessionStorage)) {
      if (key === "itg_seen" || key === "itgrows_welcome_tracked" || key.startsWith("itg_trial_fired_")) sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}

function emit() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    /* ignore */
  }
}

// Records the choice, tells Google, and lets trackers and ids react. Withdrawing an earlier "accepted"
// reloads the page: scripts that already ran cannot be unloaded any other way.
export function setConsent(choice: ConsentChoice) {
  const before = readConsent()
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    /* private mode: the in-memory choice still applies to this page */
  }
  memoryChoice = choice
  settingsOpen = false
  applyGoogleConsent(choice === "accepted")
  if (choice === "declined") {
    stopLoadedTrackers()
    clearOptionalStorage()
  }
  emit()
  if (before === "accepted" && choice === "declined") {
    try {
      location.reload()
    } catch {
      /* ignore */
    }
  }
}

// One listener per page for a choice made in another tab.
function hookStorage() {
  if (storageHooked) return
  storageHooked = true
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== CONSENT_KEY && e.key !== null) return
    const now = storedChoice()
    memoryChoice = null
    if (now !== "unset") applyGoogleConsent(now === "accepted")
    if (now !== "accepted") stopLoadedTrackers()
    emit()
  })
}

export function subscribeConsent(onChange: () => void): () => void {
  hookStorage()
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

// ---- "Cookie settings" panel open/closed (shared by the banner and whoever opens it) ----

export function isSettingsOpen(): boolean {
  return settingsOpen
}

export function openCookieSettings() {
  settingsOpen = true
  emit()
}

export function closeCookieSettings() {
  settingsOpen = false
  emit()
}

// Our own analytics id: created only after "Accept". Before that, events go out without one.
export function consentedAnonId(): string {
  if (!hasConsent()) return ""
  try {
    let a = localStorage.getItem("itg_anon")
    if (!a) {
      a =
        (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
        String(Date.now()) + Math.random().toString(36).slice(2)
      localStorage.setItem("itg_anon", a)
    }
    return a
  } catch {
    return ""
  }
}

// ---- React hooks ----

const serverConsent = (): ConsentState => "unknown"
const serverClosed = () => false

export function useConsent(): ConsentState {
  return useSyncExternalStore<ConsentState>(subscribeConsent, readConsent, serverConsent)
}

export function useSettingsOpen(): boolean {
  return useSyncExternalStore(subscribeConsent, isSettingsOpen, serverClosed)
}
