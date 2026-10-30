"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/LocaleProvider"
import ns from "@/lib/i18n/messages/contactForm"
import { SHINE_BUTTON } from "@/components/geo/motion"

// Google Ads conversion for a submitted message. Fired only after the API confirms the message was
// received, so the campaign optimises against messages we actually got rather than button presses.
const LEAD_CONVERSION = "AW-18160234884/1-4fCM7GhuAcEITjvNND"

// Caps mirror app/api/contact/route.ts, so the browser stops a visitor before the server would.
const MAX = { name: 200, company: 200, email: 254, message: 5000 }

// "Write to us" on the home page (#apply): any question, not only a request for the plan.
export default function ContactForm() {
  const m = useT(ns)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  // `hp` is the honeypot: hidden from people, filled by bots, rejected by the server.
  const [form, setForm] = useState({ name: "", company: "", email: "", message: "", hp: "" })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.email.trim().includes("@") && form.message.trim().length >= 5

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(
          j.error === "email" ? m.errEmail : j.error === "message" ? m.errMessage : m.errGeneric
        )
        return
      }
      try {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void }
        w.gtag?.("event", "conversion", { send_to: LEAD_CONVERSION })
      } catch {
        // Reporting must never cost us the confirmation the visitor is waiting for.
      }
      setSent(true)
    } catch {
      setError(m.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="bg-white border border-black/10 rounded-2xl p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="font-bold text-lg">{m.thanks}</p>
      </div>
    )
  }

  const field =
    "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"

  return (
    <form onSubmit={submit} className="relative bg-white border border-black/10 rounded-2xl p-6 sm:p-7 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-semibold mb-1.5">{m.name}</label>
          <input id="cf-name" className={field} value={form.name} onChange={set("name")} maxLength={MAX.name} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="cf-company" className="block text-sm font-semibold mb-1.5">{m.company}</label>
          <input id="cf-company" className={field} value={form.company} onChange={set("company")} maxLength={MAX.company} autoComplete="organization" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-email" className="block text-sm font-semibold mb-1.5">
          {m.email} <span className="text-violet-600">*</span>
        </label>
        <input
          id="cf-email"
          type="email"
          required
          className={field}
          value={form.email}
          onChange={set("email")}
          maxLength={MAX.email}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="cf-message" className="block text-sm font-semibold mb-1.5">
          {m.message} <span className="text-violet-600">*</span>
        </label>
        <textarea
          id="cf-message"
          required
          rows={5}
          minLength={5}
          maxLength={MAX.message}
          className={`${field} resize-y`}
          value={form.message}
          onChange={set("message")}
        />
      </div>

      {/* Honeypot: off-screen and out of the tab order; a person never fills it. */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="cf-hp">{m.honeypot}</label>
        <input id="cf-hp" name="hp_extra" tabIndex={-1} autoComplete="off" value={form.hp} onChange={set("hp")} />
      </div>

      {error && <p className="text-sm text-red-600 leading-relaxed">{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy}
        className={`w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3.5 text-base font-semibold flex items-center justify-center gap-2 ${SHINE_BUTTON}`}
      >
        {busy ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {m.sending}
          </>
        ) : (
          m.send
        )}
      </button>
    </form>
  )
}
