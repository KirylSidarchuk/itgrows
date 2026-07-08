"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Fire-and-forget first-party page-view beacon. Vercel Analytics visits aren't queryable
// from code, so this feeds the daily Telegram report's visit count. Only real browsers
// (JS on) hit it, which naturally filters most bots — same as Vercel's "visitors".
export default function VisitBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    try {
      const body = JSON.stringify({ path: pathname })
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track/visit", new Blob([body], { type: "application/json" }))
      } else {
        fetch("/api/track/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch { /* ignore */ }
  }, [pathname])
  return null
}
