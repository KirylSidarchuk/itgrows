"use client"

import { useEffect, useState } from "react"

// Google Ads conversions for GEO payments (account ItGrows, tag AW-18160234884). Mounted in the GEO
// cabinet layout (app/business/dashboard/layout.tsx). Stripe brings the buyer back with ?cs=<Checkout
// Session id>; this asks /api/geo/conversion what was paid and sends it once: "GEO plan bought" (the
// first payment), with the real amount and currency and the session id as transaction_id, so Google
// counts a reload of the page only once. The detailed report is free since 27 Oct 2026: nothing is
// sent for it here (its old "GEO report bought" action is no longer fired). gtag runs under
// Google Consent Mode basic (app/layout.tsx): the call is queued and reaches Google only after "Accept".
// The same payment goes to the Meta pixel "ItGrows.ai" as Purchase, with the session id as eventID;
// the pixel loads only after "Accept" (components/consent/ConsentedTrackers.tsx), and without it
// nothing is sent to Meta.

const SEND_TO = {
  plan: "AW-18160234884/tFwGCPK47qYdEITjvNND",
} as const

type Paid = { ready: true; kind: keyof typeof SEND_TO; id: string; value: number; currency: string }

const sent = new Set<string>()

type Fbq = (...args: unknown[]) => void

// gtag.js and the Meta pixel can load a moment after this runs; try again briefly.
function soon(fire: () => boolean) {
  if (fire()) return
  let tries = 0
  const t = setInterval(() => {
    if (fire() || ++tries > 20) clearInterval(t)
  }, 300)
}

function send(p: Paid) {
  soon(() => {
    if (typeof window.gtag !== "function") return false
    window.gtag("event", "conversion", { send_to: SEND_TO[p.kind], value: p.value, currency: p.currency, transaction_id: p.id })
    return true
  })
  soon(() => {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq
    if (typeof fbq !== "function") return false
    fbq("track", "Purchase", { value: p.value, currency: p.currency, content_name: "GEO plan" }, { eventID: p.id })
    return true
  })
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
