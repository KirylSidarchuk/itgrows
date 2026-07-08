"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

/**
 * Google + LinkedIn one-click sign-in buttons.
 * Redirect-based (redirect: true) so the OAuth flow leaves and returns to callbackUrl.
 */
export default function OAuthButtons({ callbackUrl = "/cabinet" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState<"google" | "linkedin" | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => { setLoading("google"); signIn("google", { callbackUrl }) }}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-black/15 bg-white hover:bg-slate-50 text-[#1b1916] text-sm font-semibold transition-colors disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        {loading === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={() => { setLoading("linkedin"); signIn("linkedin", { callbackUrl }) }}
        disabled={loading !== null}
        className="order-first w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-black/15 bg-white hover:bg-slate-50 text-[#1b1916] text-sm font-semibold transition-colors disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
        {loading === "linkedin" ? "Redirecting…" : "Continue with LinkedIn"}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-slate-400">or</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>
    </div>
  )
}
