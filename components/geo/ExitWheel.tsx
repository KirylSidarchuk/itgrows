"use client"

import { Suspense, lazy, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { isExitWheelPage } from "@/lib/geo-pages"
import { EXIT_AFTER_MS, exitWheelDone, isDesktop, markExitWheelShown } from "@/lib/geo-exit-wheel"

// The launch-rewards wheel when a visitor moves to leave the website (Kiryl, 29 Oct 2026; the rules:
// lib/geo-promo.ts; app/layout.tsx mounts this, inside SessionProvider, only while PROMO_WHEEL.enabled
// and .exitIntent are on). It opens at most once, and only:
//   - on a public GEO page (lib/geo-pages.ts isExitWheelPage: not the cabinet, the plan, the legal
//     pages, sign-in or the LinkedIn/X product) for a visitor who is signed out;
//   - on a computer (lib/geo-exit-wheel.ts isDesktop: a mouse and a window 1024 px wide or more).
//     Phones and tablets give no exit signal, and search engines demote pages that cover their content
//     with pop-ups on phones;
//   - after 15 s on the site in this tab (from the page load; client navigations keep counting), when
//     the mouse leaves the page through its top edge (mouseout with no relatedTarget, clientY <= 8);
//   - not within 30 days of the last time it was shown, never once spun in this browser, and not when
//     this browser already has a reward (GET /api/geo/promo/guest-spin), nor over another dialog.
// The dialog (ExitWheelModal.tsx) is not in the server HTML or the first page load: its code is
// fetched only on a computer, after the 15 s.

const ExitWheelModal = lazy(() => import("./ExitWheelModal"))

export default function ExitWheel() {
  const pathname = usePathname()
  const { status } = useSession()
  const [open, setOpen] = useState(false)
  const here = status === "unauthenticated" && isExitWheelPage(pathname)

  useEffect(() => {
    if (!here || open || !isDesktop() || exitWheelDone()) return
    let stopped = false
    let armed: ((e: MouseEvent) => void) | null = null
    const timer = window.setTimeout(async () => {
      try {
        const modal = await import("./ExitWheelModal")
        if (stopped || exitWheelDone() || (await modal.rewardKept()) || stopped) return
        const onLeave = (e: MouseEvent) => {
          if (e.relatedTarget || e.clientY > 8) return
          if (!isDesktop() || exitWheelDone() || document.querySelector('[aria-modal="true"]')) return
          document.removeEventListener("mouseout", onLeave)
          armed = null
          markExitWheelShown()
          setOpen(true)
        }
        armed = onLeave
        document.addEventListener("mouseout", onLeave)
      } catch {
        // The wheel never gets in the way of the page.
      }
    }, Math.max(0, EXIT_AFTER_MS - performance.now()))
    return () => {
      stopped = true
      window.clearTimeout(timer)
      if (armed) document.removeEventListener("mouseout", armed)
    }
  }, [here, open])

  if (!open || !here) return null
  return (
    <Suspense fallback={null}>
      <ExitWheelModal onClose={() => setOpen(false)} />
    </Suspense>
  )
}
