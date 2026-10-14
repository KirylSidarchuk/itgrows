"use client"

import { useState } from "react"

// Closed beta, so a request rather than a signup: every project costs real searches and a
// planning model every day, and the first plans are read by a person before anyone else sees
// the product at scale.
export default function RequestForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [form, setForm] = useState({ email: defaultEmail, website: "", goal: "" })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/reddit/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
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
        <h3 className="font-bold text-lg mb-2">Got it.</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          We look at your site and the communities your buyers use before replying, so expect an email within a day or two.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white border border-black/10 rounded-2xl p-6 grid gap-4 text-left">
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold">Work email</span>
        <input
          id="req-email"
          type="email"
          value={form.email}
          onChange={set("email")}
          required
          className="border border-black/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold">Website</span>
        <input
          id="req-website"
          value={form.website}
          onChange={set("website")}
          placeholder="yourproduct.com"
          required
          className="border border-black/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold">What should Reddit bring you?</span>
        <textarea
          id="req-goal"
          value={form.goal}
          onChange={set("goal")}
          rows={3}
          placeholder="Installs, sign-ups, demo calls, being named in the threads people find on Google…"
          className="border border-black/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500"
        />
      </label>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold px-5 py-3"
      >
        {busy ? "Sending…" : "Request beta access"}
      </button>
    </form>
  )
}
