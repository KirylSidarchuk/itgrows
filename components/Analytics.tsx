"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { consentedAnonId, hasConsent } from "@/components/consent/consent"

// Stable anonymous id (localStorage) so pre-login and post-login events stitch into one journey.
// Created only after the visitor accepts cookies; before that, events are sent without it.
function anonId(): string {
  return consentedAnonId()
}

// Host only. A full referrer URL can carry the visitor's search terms, which we have no business
// storing, and the host is what answers "where did they come from".
function referrerHost(): string {
  try {
    const r = document.referrer
    if (!r) return "direct"
    const h = new URL(r).hostname.replace(/^www\./, "")
    return h === location.hostname.replace(/^www\./, "") ? "internal" : h
  } catch {
    return "unknown"
  }
}

// First view of this visit. Later navigations refer to our own pages, so only the first one
// knows the real source; a session marker keeps it that way without any cross-visit tracking.
// Before "Accept" the marker lives in memory only (nothing is written to the browser).
let seenInMemory = false

function firstOfVisit(): boolean {
  const first = !seenInMemory
  seenInMemory = true
  if (!hasConsent()) return first
  try {
    const stored = sessionStorage.getItem("itg_seen")
    sessionStorage.setItem("itg_seen", "1")
    return first && !stored
  } catch {
    return false
  }
}

// Ad click ids (Google, Meta) single out one click on an ad: like the itg_gclid cookie, they are
// recorded only after "Accept". Before that they are left out of the event and of its path.
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid"]

function pagePath(): string {
  if (hasConsent()) return location.pathname + location.search
  try {
    const q = new URLSearchParams(location.search)
    for (const k of CLICK_IDS) q.delete(k)
    const rest = q.toString()
    return location.pathname + (rest ? `?${rest}` : "")
  } catch {
    return location.pathname
  }
}

function campaign(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const q = new URLSearchParams(location.search)
    const keys = ["utm_source", "utm_medium", "utm_campaign", "gad_source", ...(hasConsent() ? CLICK_IDS : [])]
    for (const k of keys) {
      const v = q.get(k)
      if (v) out[k] = v.slice(0, 120)
    }
  } catch {
    /* a malformed query string is not worth failing over */
  }
  return out
}

function send(event: string, props: Record<string, unknown>) {
  try {
    const body = JSON.stringify({
      event,
      path: pagePath(),
      anon_id: anonId(),
      props,
    })
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", blob)) return
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {})
  } catch {
    /* analytics must never break the app */
  }
}

// Mounted site-wide (root layout). Auto-captures page views (incl. SPA route changes) and
// every click on an actionable element — no per-button annotation needed. Optional data-ev
// attribute on an element overrides the label for that click.
export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    const entry = firstOfVisit()
    send("page_view", entry
      ? { entry: true, referrer: referrerHost(), ...campaign() }
      : {})
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const start = e.target as HTMLElement | null
      const el = start?.closest?.("button, a, [role='button'], [data-ev]") as HTMLElement | null
      if (!el) return
      const label = (el.getAttribute("data-ev") || el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 80)
      send("click", {
        label,
        tag: el.tagName.toLowerCase(),
        href: (el as HTMLAnchorElement).href || undefined,
        ev: el.getAttribute("data-ev") || undefined,
      })
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}
