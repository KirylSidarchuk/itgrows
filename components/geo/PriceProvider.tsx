"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ONE_PRICE_MONTH, geoPrices, type GeoPrices } from "@/lib/geo-pricing"
import { EARLIER_VISIT_KEYS, EARLIER_VISIT_STAMP } from "@/lib/geo-price-earlier-visit"
import type { PriceClientState } from "@/lib/geo-price-server"

// The visitor's price for the client components of a page (components/geo/PriceScope.tsx hands it down
// from the server, so the first HTML already has it, with no jump), and the page's small talk with the
// server (/api/geo/price, none of it needs a consent because it carries only the random id):
//   settle  once, for a visitor assigned on this visit: the browser's own check is added here, and the
//           pin is made final. The browser may remember an earlier visit the server could not recognise:
//           localStorage held cookie_consent, itg_anon or the like when this visit began
//           (lib/geo-price-earlier-visit.ts). The server then re-pins to the one price, and the page
//           follows at once: the card from this state, the rest with router.refresh(). On a page the
//           router fetched, the settle also carries the id and the pin, for the server to set the cookies.
//   ref     a sales link has just taken a visitor out of the test;
//   seen    the price card came into view (usePriceCardSeen, app/business/PricingPlans.tsx).
// Without a provider, on the cabinet's pages, everything reads the one price.

function browserRemembers(): boolean {
  try {
    // What was there when the visit began; what is there now may have been written during this visit.
    const stamp = sessionStorage.getItem(EARLIER_VISIT_STAMP)
    if (stamp !== null) return stamp === "1"
    return EARLIER_VISIT_KEYS.some((k) => localStorage.getItem(k) !== null)
  } catch {
    return false
  }
}

function arrival() {
  try {
    const q = new URLSearchParams(location.search)
    const utm: Record<string, string> = {}
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = q.get(k)
      if (v) utm[k] = v.slice(0, 120)
    }
    // Host only, as our analytics: a full referrer can carry search terms.
    const from = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""
    return { source: from && from !== location.hostname.replace(/^www\./, "") ? from.slice(0, 120) : null, utm, path: location.pathname.slice(0, 200) }
  } catch {
    return { source: null, utm: {}, path: null }
  }
}

async function post(body: Record<string, unknown>): Promise<{ monthCents?: number; refresh?: boolean }> {
  try {
    const res = await fetch("/api/geo/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    })
    return res.ok ? await res.json() : {}
  } catch {
    return {}
  }
}

const PriceContext = createContext<{ monthCents: number; seen: () => void }>({ monthCents: ONE_PRICE_MONTH, seen: () => {} })

export default function PriceProvider({ monthCents, state, verdict, token, event, id, pin, children }: PriceClientState & { children: ReactNode }) {
  const router = useRouter()
  const [repinned, setRepinned] = useState<number | null>(null)
  const settled = useRef<Promise<unknown>>(Promise.resolve())
  const talked = useRef(false)
  const seenSent = useRef(false)

  useEffect(() => {
    if (talked.current) return
    talked.current = true
    if (state === "new") {
      settled.current = post({ action: "settle", verdict, token, id, pin, local: browserRemembers(), ...arrival() }).then((r) => {
        if (r.monthCents && r.monthCents !== monthCents) {
          setRepinned(r.monthCents)
          router.refresh()
        }
      })
    } else if (event === "ref") {
      void post({ action: "ref" }).then((r) => {
        if (r.refresh) router.refresh()
      })
    }
    // Once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inTest = repinned === null && (state === "test" || (state === "new" && verdict === "ok"))
  const seen = useCallback(() => {
    if (!inTest || seenSent.current) return
    seenSent.current = true
    void settled.current.then(() => post({ action: "seen" }))
  }, [inTest])

  const value = useMemo(() => ({ monthCents: repinned ?? monthCents, seen }), [repinned, monthCents, seen])
  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
}

/** The plan's prices this visitor sees. */
export function usePlanPrices(): GeoPrices {
  const { monthCents } = useContext(PriceContext)
  return useMemo(() => geoPrices(monthCents), [monthCents])
}

/** Call when the price card comes into view; counted once per visitor, for a visitor in the test. */
export function usePriceCardSeen(): () => void {
  return useContext(PriceContext).seen
}
