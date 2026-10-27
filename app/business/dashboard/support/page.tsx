"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { card } from "../visibility/parts"

// "Write to us": one message box, the account email shown (replies go there), and optionally the
// site the message is about. Posts to /api/business/contact, which emails and pings us; the page
// only says "sent" when the server says the email went out. ?site= picks a followed site; ?report=
// (from "contact us and we'll run it for you", past the free report) starts the message with the
// request for that site's report.

const FALLBACK = "kiryl@itgrows.ai"

function errorText(status: number, code: string | undefined) {
  if (status === 429 || code === "rate_limited")
    return `You have sent 5 messages in the last 24 hours. Please write again tomorrow, or email ${FALLBACK}.`
  if (status === 401) return "Your session has ended. Sign in again and send the message once more."
  if (code === "empty") return "Write your message first."
  return `That did not go through. Email ${FALLBACK} and we will pick it up from there.`
}

export default function SupportPage() {
  const { data: session, status } = useSession()
  const email = session?.user?.email ?? ""
  const [sites, setSites] = useState<string[]>([])
  const [site, setSite] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const wanted = params.get("site") ?? ""
    const report = (params.get("report") ?? "").trim().slice(0, 200)
    // Said once the sites are in, so the box is filled in the same render as the list.
    const prefill = () => {
      if (report) setMessage((m) => m || `Please run the AI visibility report for ${report}.`)
    }
    fetch("/api/geo/report", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { sites: [] }))
      .then((j: { sites?: { domain: string }[] }) => {
        const domains = (j.sites ?? []).map((s) => s.domain)
        setSites(domains)
        prefill()
        if (domains.includes(wanted)) setSite(wanted)
        // A request for another site's report is about that site, not the one already followed.
        else if (domains.length === 1 && !report) setSite(domains[0])
      })
      .catch(() => {
        setSites([])
        prefill()
      })
  }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || busy) return
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/business/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, site: site || null }),
      })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (r.ok && j.ok) {
        setSent(true)
        setMessage("")
      } else {
        setError(errorText(r.status, j.error))
      }
    } catch {
      setError(errorText(0, undefined))
    }
    setBusy(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1916]">Write to us</h1>
        <p className="text-sm text-slate-600 mt-1">
          A question about your report, your articles or your plan. A person reads every message and replies by email.
        </p>
      </header>

      <section className={card}>
        {sent ? (
          <div>
            <h2 className="font-extrabold text-lg text-[#1b1916]">Message sent</h2>
            <p className="text-sm text-slate-600 mt-2">
              We will reply to <span className="font-medium text-[#1b1916] break-all">{email || "your account email"}</span>.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-5 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Write another message
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Your email</p>
              <p className="mt-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-[#1b1916] break-all">
                {status === "loading" ? "…" : email || "No email on this account"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Replies go to this address.</p>
            </div>

            {sites.length > 0 && (
              <div>
                <label htmlFor="contact-site" className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Which site is this about <span className="normal-case font-medium">(optional)</span>
                </label>
                <select
                  id="contact-site"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-[#1b1916] focus:outline-none focus:border-violet-500"
                >
                  <option value="">No specific site</option>
                  {sites.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="contact-message" className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                maxLength={5000}
                required
                placeholder="What would you like to ask or tell us?"
                className="mt-1.5 block w-full rounded-xl bg-white border border-slate-200 px-3.5 py-3 text-sm text-[#1b1916] placeholder:text-slate-400 focus:outline-none focus:border-violet-500 resize-y"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !message.trim()}
              className="w-full sm:w-auto rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 text-sm font-semibold"
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
