"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import LocaleLink from "@/components/i18n/LocaleLink"
import { useT } from "@/components/i18n/LocaleProvider"
import signIn from "@/lib/i18n/messages/signIn"

// Two products, two cabinets: the sign-in menu names both, and a signed-in visitor gets a straight
// way back to theirs. The sign-in page keeps the visitor's language (LocaleLink); the cabinets
// themselves have no prefix and are left as they are.
export default function SignIn() {
  const m = useT(signIn)
  const { status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm text-slate-600 hover:text-[#1b1916] font-medium flex items-center gap-1" aria-expanded={open}>
        {status === "authenticated" ? m.openCabinet : m.signIn} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-black/10 bg-white shadow-lg p-1.5 z-50">
          <LocaleLink href={status === "authenticated" ? "/business/dashboard" : "/login?callbackUrl=%2Fbusiness%2Fdashboard"} className="block rounded-lg px-3 py-2.5 hover:bg-[#f3f2f1]">
            <span className="block text-sm font-semibold">{m.geoTitle}</span>
            <span className="block text-xs text-slate-500">{m.geoLine}</span>
          </LocaleLink>
          <LocaleLink href={status === "authenticated" ? "/cabinet" : "/login?callbackUrl=%2Fcabinet"} className="block rounded-lg px-3 py-2.5 hover:bg-[#f3f2f1]">
            <span className="block text-sm font-semibold">{m.liTitle}</span>
            <span className="block text-xs text-slate-500">{m.liLine}</span>
          </LocaleLink>
        </div>
      )}
    </div>
  )
}
