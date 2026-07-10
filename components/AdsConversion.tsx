"use client"

import { useEffect } from "react"

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

// Mounted once site-wide (root layout). Two jobs:
//  1) Capture the Google click id on any landing so paid conversions can be attributed
//     (stored 90d; passed into Stripe checkout metadata for offline/enhanced conversions).
//  2) Fire the trial-start conversion when a checkout success page is reached.
export default function AdsConversion() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)

      const gclid = params.get("gclid") || params.get("gbraid") || params.get("wbraid")
      if (gclid) setCookie("itg_gclid", gclid, 90)

      if (params.get("itg_conv") !== "trial") return

      const sid = params.get("session_id") || params.get("company_plan") || ""
      const key = `itg_trial_fired_${sid || "1"}`
      if (sessionStorage.getItem(key)) return

      const value = Number(params.get("v")) || 49

      const fire = () => {
        if (typeof window.gtag !== "function") return false
        window.gtag("event", "conversion", {
          send_to: TRIAL_CONVERSION,
          value,
          currency: "USD",
          transaction_id: sid || String(Date.now()),
        })
        sessionStorage.setItem(key, "1")
        return true
      }

      // gtag can hydrate slightly after this effect; retry briefly.
      if (!fire()) {
        let tries = 0
        const t = setInterval(() => {
          if (fire() || ++tries > 20) clearInterval(t)
        }, 300)
      }
    } catch {
      /* never break navigation on analytics */
    }
  }, [])

  return null
}
