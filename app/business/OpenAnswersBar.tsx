"use client"

import { useEffect, useRef } from "react"

// The phone bar of the quick check: a link to sign-up pinned to the bottom of the screen while the
// account offer inside the answers card is scrolled away (AuditForm decides when it is mounted).
// Phones only (sm:hidden). `onSeen` fires once at least half of it is on screen — on a wider screen
// it is never displayed, so it never fires there. AuditForm does not mount it while the cookie banner
// is up (the banner would cover it, z-50 over z-40, and the observer cannot tell), nor before the page
// has settled after the result.

export default function OpenAnswersBar({
  href,
  label,
  onClick,
  onSeen,
}: {
  href: string
  label: string
  onClick: () => void
  onSeen: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) onSeen()
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [onSeen])

  // Room under the page's last line while the bar is up, so it never covers the footer.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 639.98px)").matches) return
    const body = document.body
    const before = body.style.paddingBottom
    body.style.paddingBottom = "5.5rem"
    return () => {
      body.style.paddingBottom = before
    }
  }, [])

  return (
    <div
      ref={ref}
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <a
        href={href}
        onClick={onClick}
        className="flex items-center justify-center w-full min-h-12 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
      >
        {label}
      </a>
    </div>
  )
}
