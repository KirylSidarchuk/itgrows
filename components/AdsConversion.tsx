"use client"

import { useEffect } from "react"
import { hasConsent, subscribeConsent } from "@/components/consent/consent"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// "Trial started (card)" conversion (Google Ads AW-18160234884). Fires on a real
// card-required Stripe checkout success (trial start = money-adjacent buyer signal).
const TRIAL_CONVERSION = "AW-18160234884/ESZmCNuErMgcEITjvNND"

function setCookie(name: string, value: string, days: number) {
  const d = new Date()
  d.setTime(d.getTime() + days * 86400000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
}

// The click id from the landing URL waits here, in memory only, until the visitor accepts cookies.
// "Decline" or leaving the site without choosing = it is never stored.
let pendingClickId: string | null = null

function storeClickIdIfAllowed() {
  if (!pendingClickId || !hasConsent()) return
  try {
    setCookie("itg_gclid", pendingClickId, 90)
    pendingClickId = null
  } catch {
    /* ignore */
  }
}

// Conversions already sent on this page, for visitors who have not accepted (no sessionStorage then).
const firedInMemory = new Set<string>()

function alreadyFired(key: string): boolean {
  if (firedInMemory.has(key)) return true
  if (!hasConsent()) return false
  try {
    return !!sessionStorage.getItem(key)
  } catch {
    return false
  }
}

function markFired(key: string) {
  firedInMemory.add(key)
  if (!hasConsent()) return
  try {
    sessionStorage.setItem(key, "1")
  } catch {
    /* ignore */
  }
}

// Mounted once site-wide (root layout). Two jobs:
//  1) Capture the Google click id on any landing so paid conversions can be attributed
//     (stored 90d in itg_gclid only after "Accept"; passed into Stripe checkout metadata).
//  2) Fire the trial-start conversion when a checkout success page is reached. gtag runs in Basic
//     Consent Mode (app/layout.tsx): before "Accept" the call waits in a local queue and nothing goes
//     to Google; it is sent if the visitor accepts on this page and dropped if they decline.
export default function AdsConversion() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    try {
      const params = new URLSearchParams(window.location.search)

      const gclid = params.get("gclid") || params.get("gbraid") || params.get("wbraid")
      if (gclid) {
        pendingClickId = gclid
        storeClickIdIfAllowed()
        if (pendingClickId) unsubscribe = subscribeConsent(storeClickIdIfAllowed)
      }

      if (params.get("itg_conv") === "trial") {
        const sid = params.get("session_id") || params.get("company_plan") || ""
        const key = `itg_trial_fired_${sid || "1"}`
        if (!alreadyFired(key)) {
          const value = Number(params.get("v")) || 49

          const fire = () => {
            if (typeof window.gtag !== "function") return false
            window.gtag("event", "conversion", {
              send_to: TRIAL_CONVERSION,
              value,
              currency: "USD",
              transaction_id: sid || String(Date.now()),
            })
            markFired(key)
            return true
          }

          // gtag can hydrate slightly after this effect; retry briefly.
          if (!fire()) {
            let tries = 0
            const t = setInterval(() => {
              if (fire() || ++tries > 20) clearInterval(t)
            }, 300)
          }
        }
      }
    } catch {
      /* never break navigation on analytics */
    }
    return () => unsubscribe?.()
  }, [])

  return null
}
