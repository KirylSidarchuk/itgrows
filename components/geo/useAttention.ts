"use client"

import { useEffect } from "react"
import { splitLocale } from "@/lib/i18n/config"

// How long a screen of the AI-visibility funnel was in front of the visitor, and how far down it was read
// (5 Nov 2026, after the funnel research: of 43 visits from the ads 22 were a single page view, and nothing told
// two seconds from two minutes; the recordings only see the few who accept cookies). No cookie, no id, nothing
// kept in the browser, so the events of one visit are never joined up: each kind goes out at most once per
// screen shown, and the counts are read side by side (/root/geo_check/attention_report.py on the VM).
//
// geo_attention, props { screen, at, s, blocks, far, src, domain? }:
//   at "open"   the screen is in front of the visitor for the first time: the count the others are read against;
//   at "mark"   s visible seconds reached: 5, 15, 30, 60, 120;
//   at "leave"  the tab was hidden, the page closed or the screen ended; s is the visible seconds so far. The
//               first leave of a screen says first: true (who left before 5 seconds); ended: true when the page
//               ended the screen (the check started, the result came) rather than the visitor leaving. A later
//               leave goes out only with blocks seen since;
//   blocks      the blocks seen since the last event: a block is seen once it has sat in the top three quarters
//               of the screen for a second, and each name is listed once per screen;
//   far         the block lowest on the page seen so far (by where it stood when it was seen);
//   src         where this page load came from: google, meta, the utm_source, ref:<ref>, a referring host, direct.
// A block is an element with data-attention (the result, the report) or a section of the home page with an id.
// Only time with the tab in front counts.

const MARKS = [5, 15, 30, 60, 120]
const BLOCKS = "[data-attention], section[id^='geo-'], section#apply"
const SEEN_AFTER_MS = 1000

let arrivedFrom: string | null = null

/** Where this page load came from, worked out once: the address loses its tags as the visitor moves on. */
function source(): string {
  if (arrivedFrom) return arrivedFrom
  let src = "direct"
  try {
    const q = new URLSearchParams(location.search)
    const utm = (q.get("utm_source") ?? "").toLowerCase().slice(0, 40)
    const ref = q.get("ref")
    if (q.has("gclid") || q.has("gbraid") || q.has("wbraid") || q.has("gad_source") || utm === "google") src = "google"
    else if (q.has("fbclid") || /^(meta|facebook|fb|ig|instagram)$/.test(utm)) src = "meta"
    else if (utm) src = utm
    else if (ref) src = "ref:" + ref.slice(0, 20)
    else if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "")
      src = host === location.hostname.replace(/^www\./, "") ? "internal" : host
    }
  } catch {
    // A malformed address or referrer: "direct".
  }
  arrivedFrom = src
  return src
}

const blockName = (el: Element) => (el as HTMLElement).dataset.attention || el.id || el.tagName.toLowerCase()

/** Counts this screen while `screen` is set; a new value ends the old screen and starts the new one. */
export function useAttention(screen: string | null, domain?: string) {
  useEffect(() => {
    if (!screen || typeof IntersectionObserver === "undefined" || typeof MutationObserver === "undefined") return
    const watched = new Set<Element>()
    const inBand = new Set<Element>()
    const seen = new Set<Element>()
    const seenNames = new Set<string>()
    const timers = new Map<Element, number>()
    let fresh: string[] = []
    let far: { name: string; y: number } | null = null
    let shownMs = 0
    let since: number | null = null
    let nextMark = 0
    let opened = false
    let leaves = 0

    const seconds = () => Math.floor((shownMs + (since === null ? 0 : performance.now() - since)) / 1000)
    const send = (at: "open" | "mark" | "leave", s: number, more?: Record<string, unknown>) => {
      const blocks = fresh
      fresh = []
      try {
        const body = JSON.stringify({
          event: "geo_attention",
          path: splitLocale(location.pathname).path,
          props: { screen, at, s, blocks, far: far?.name ?? null, src: source(), ...(domain ? { domain } : {}), ...more },
        })
        if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {})
      } catch {
        // Analytics never gets in the way.
      }
    }
    const dwell = (el: Element) => {
      if (since === null || seen.has(el) || timers.has(el)) return
      timers.set(
        el,
        window.setTimeout(() => {
          timers.delete(el)
          if (since === null || !inBand.has(el) || seen.has(el) || !el.isConnected) return
          seen.add(el)
          // A view the page draws again (a report opened from the history) brings new elements with old names.
          const name = blockName(el)
          const y = el.getBoundingClientRect().top + window.scrollY
          if (!far || y > far.y) far = { name, y }
          if (seenNames.has(name)) return
          seenNames.add(name)
          fresh.push(name)
        }, SEEN_AFTER_MS)
      )
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            inBand.add(e.target)
            dwell(e.target)
          } else {
            inBand.delete(e.target)
            const t = timers.get(e.target)
            if (t !== undefined) clearTimeout(t)
            timers.delete(e.target)
          }
        }
      },
      // The top three quarters: a heading the page scrolls to sits near the top; one peeking in at the bottom is not read.
      { rootMargin: "0px 0px -25% 0px" }
    )
    const scan = () =>
      document.querySelectorAll(BLOCKS).forEach((el) => {
        if (watched.has(el)) return
        watched.add(el)
        io.observe(el)
      })
    // The result and the report arrive after the page: new blocks are picked up as they appear.
    let scanTimer: number | undefined
    const mo = new MutationObserver(() => {
      if (scanTimer === undefined)
        scanTimer = window.setTimeout(() => {
          scanTimer = undefined
          scan()
        }, 300)
    })

    const show = () => {
      if (since !== null) return
      since = performance.now()
      if (!opened) {
        opened = true
        send("open", 0)
      }
      inBand.forEach(dwell)
    }
    const hide = (ended: boolean) => {
      if (since === null) return
      shownMs += performance.now() - since
      since = null
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      if (leaves === 0 || fresh.length) send("leave", seconds(), { first: leaves === 0, ...(ended ? { ended: true } : {}) })
      leaves++
    }
    const onVisibility = () => (document.visibilityState === "visible" ? show() : hide(false))
    const onPageHide = () => hide(false)
    const tick = window.setInterval(() => {
      if (since === null) return
      const s = seconds()
      while (nextMark < MARKS.length && s >= MARKS[nextMark]) send("mark", MARKS[nextMark++])
    }, 1000)

    scan()
    mo.observe(document.body, { childList: true, subtree: true })
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onVisibility)
    if (document.visibilityState === "visible") show()
    return () => {
      hide(true)
      clearInterval(tick)
      clearTimeout(scanTimer)
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onVisibility)
    }
  }, [screen, domain])
}
