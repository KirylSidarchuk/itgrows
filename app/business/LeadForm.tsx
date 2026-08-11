"use client"

import { useState } from "react"

// Deliberately a request form, not a checkout. Onboarding starts with an hour of conversation
// about the customer's positions, so an unattended $499 subscription would sell something we
// cannot yet deliver unattended.
export default function LeadForm() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", website: "", about: "" })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.email.includes("@") && form.website.trim().length > 3

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/business/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("failed")
      setSent(true)
    } catch {
      setError("That did not go through. Email kiryl@itgrows.ai and we will pick it up from there.")
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white border border-black/10 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="font-bold text-lg mb-2">Got it.</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          We will look at your site properly before replying, so expect a real answer within a day — not an
          autoresponder.
        </p>
      </div>
    )
  }

  const field = "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"

  return (
    <form onSubmit={submit} className="bg-white border border-black/10 rounded-2xl p-6 sm:p-7 space-y-4">
      <div>
        <label htmlFor="lf-name" className="block text-sm font-semibold mb-1.5">Your name</label>
        <input id="lf-name" className={field} value={form.name} onChange={set("name")} placeholder="Jane Whitfield" autoComplete="name" />
      </div>
      <div>
        <label htmlFor="lf-email" className="block text-sm font-semibold mb-1.5">
          Work email <span className="text-violet-600">*</span>
        </label>
        <input id="lf-email" type="email" required className={field} value={form.email} onChange={set("email")} placeholder="jane@practice.com" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="lf-site" className="block text-sm font-semibold mb-1.5">
          Your website <span className="text-violet-600">*</span>
        </label>
        <input id="lf-site" required className={field} value={form.website} onChange={set("website")} placeholder="practice.com" />
      </div>
      <div>
        <label htmlFor="lf-about" className="block text-sm font-semibold mb-1.5">What should you be known for?</label>
        <textarea id="lf-about" rows={4} className={`${field} resize-y`} value={form.about} onChange={set("about")} placeholder="The questions your buyers ask, and the position you want to be the reference for." />
      </div>

      {error && <p className="text-sm text-red-600 leading-relaxed">{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy}
        className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3.5 text-base font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {busy ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>) : "Request access →"}
      </button>
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        No card, no call scheduled automatically. We read it, then write back.
      </p>
    </form>
  )
}
