"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent")
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem("cookie_consent", "accepted")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 py-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-200 leading-relaxed">
          We use cookies to improve your experience and analyze traffic. By clicking &lsquo;Accept&rsquo;, you agree to our{" "}
          <Link href="/privacy" className="underline text-violet-400 hover:text-violet-300 transition-colors">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm rounded border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
