"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Stable anonymous id (localStorage) so pre-login and post-login events stitch into one journey.
function anonId(): string {
  try {
    let a = localStorage.getItem("itg_anon")
    if (!a) {
      a = (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2)
      localStorage.setItem("itg_anon", a)
    }
    return a
  } catch {
    return ""
  }
}

function send(event: string, props: Record<string, unknown>) {
  try {
    const body = JSON.stringify({
      event,
      path: location.pathname + location.search,
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
    send("page_view", {})
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
