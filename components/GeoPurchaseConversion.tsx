"use client"

import { useEffect, useState } from "react"

// Google Ads conversions for GEO payments (account ItGrows, tag AW-18160234884). Mounted in the GEO
// cabinet layout (app/business/dashboard/layout.tsx). Stripe brings the buyer back with ?cs=<Checkout
// Session id>; this asks /api/geo/conversion what was paid and sends it once: "GEO report bought"
// ($49.90) or "GEO plan bought" (the first payment), with the real amount and currency and the
// session id as transaction_id, so Google counts a reload of the page only once. gtag runs under
// Google Consent Mode basic (app/layout.tsx): the call is queued and reaches Google only after "Accept".

const SEND_TO = {
  report: "AW-18160234884/bfDCCKP15qYdEITjvNND",
  plan: "AW-18160234884/tFwGCPK47qYdEITjvNND",
} as const

type Paid = { ready: true; kind: keyof typeof SEND_TO; id: string; value: number; currency: string }

const sent = new Set<string>()

function send(p: Paid) {
  const fire = () => {
    if (typeof window.gtag !== "function") return false
    window.gtag("event", "conversion", { send_to: SEND_TO[p.kind], value: p.value, currency: p.currency, transaction_id: p.id })
    return true
  }
  // gtag.js can load a moment after this runs; try again briefly.
  if (!fire()) {
    let tries = 0
    const t = setInterval(() => {
      if (fire() || ++tries > 20) clearInterval(t)
    }, 300)
  }
}

export default function GeoPurchaseConversion() {
  // Read at the first render: the visibility page clears its query string in its own effect, and a
  // child's effects run before this layout component's.
  const [cs] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("cs")))

  useEffect(() => {
    if (!cs || sent.has(cs)) return
    let stopped = false
    ;(async () => {
      // The payment is complete when Stripe redirects; a few retries cover a slow answer from Stripe.
      for (let i = 0; i < 5 && !stopped; i++) {
        try {
          const r = await fetch(`/api/geo/conversion?cs=${encodeURIComponent(cs)}`, { cache: "no-store" })
          if (r.status >= 400 && r.status < 500) return
          if (r.ok) {
            const j = (await r.json()) as Paid | { ready: false }
            if (j.ready) {
              if (stopped || sent.has(cs)) return
              sent.add(cs)
              send(j)
              return
            }
          }
        } catch {
          // A dropped request is not a failed payment; ask again.
        }
        await new Promise((res) => setTimeout(res, 3000))
      }
    })()
    return () => {
      stopped = true
    }
  }, [cs])

  return null
}
