"use client"

import { useEffect } from "react"

// The blocks of "/" (cards, stages, panels, questions: whatever carries the class "reveal") fade in and
// rise 12px once, as they scroll into view; a grid's children that come in together follow each other
// by 60 ms. The owner's request of 30 Oct 2026 to bring the site alive; on a phone, with no hover, this
// is what moves.
// Safe by construction: the server HTML has every block at full opacity, and app/globals.css hides a
// ".reveal" block only under <html class="js-reveal">, which this script alone adds, and only with no
// "reduce motion" preference (the CSS asks again), with IntersectionObserver, and not for a crawler's
// browser. Without JavaScript, for a crawler and with reduced motion, nothing is ever hidden. Before the
// class goes on, every block already on screen or above it is marked shown ("is-in"), so the first
// screen never flashes or waits; the rest is shown when it enters the view ("is-in reveal-anim") and
// is not watched again. Leaving the page takes the class off, so the next page starts plain.
// The hero, the nav, the footer and the guarantee's footnote never carry "reveal".

const STAGGER_MS = 60
// A long grid entering at once waits at most this many steps.
const MAX_STEPS = 5

export default function ScrollReveal() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      /bot|crawl|spider|slurp|headless|lighthouse|prerender/i.test(navigator.userAgent)
    )
      return
    const io = new IntersectionObserver(
      (entries) => {
        const steps = new Map<Element | null, number>()
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          io.unobserve(el)
          const n = steps.get(el.parentElement) ?? 0
          steps.set(el.parentElement, n + 1)
          el.style.setProperty("--reveal-delay", `${Math.min(n, MAX_STEPS) * STAGGER_MS}ms`)
          el.classList.add("is-in", "reveal-anim")
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    const fold = window.innerHeight
    for (const el of document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)")) {
      if (el.getBoundingClientRect().top < fold) el.classList.add("is-in")
      else io.observe(el)
    }
    const root = document.documentElement
    root.classList.add("js-reveal")
    return () => {
      io.disconnect()
      root.classList.remove("js-reveal")
    }
  }, [])
  return null
}
