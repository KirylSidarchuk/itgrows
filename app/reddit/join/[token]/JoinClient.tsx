"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function JoinClient({ token, productName, email }: { token: string; productName: string; email: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ redditUsername: "", communities: "", accountNote: "" })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function join(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr("")
    try {
      const res = await fetch(`/api/reddit/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not join")
      router.push(`/reddit/app/${d.projectId}`)
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not join")
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-bold">Join the {productName} Reddit team</h1>
        <p className="text-slate-600">
          Every morning you will get 3–5 tasks in your own communities, with the reply drafted. You post from your own account,
          say that you work on {productName}, and paste the link. Joining as {email}.
        </p>
      </div>
      <form onSubmit={join} className="bg-white border border-black/10 rounded-2xl p-6 grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Your Reddit username</span>
          <input id="join-username" required value={form.redditUsername} onChange={set("redditUsername")} placeholder="u/name" className="border border-black/15 rounded-xl px-3.5 py-2.5" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Communities you will work in</span>
          <input id="join-communities" value={form.communities} onChange={set("communities")} placeholder="r/3Dprinting, r/functionalprint" className="border border-black/15 rounded-xl px-3.5 py-2.5" />
          <span className="text-xs text-slate-500">Agree these with your teammates first. If two people pick the same one, the page will show it.</span>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Your account: age and karma</span>
          <input id="join-note" value={form.accountNote} onChange={set("accountNote")} placeholder="new account / 2 years, 1,500 karma" className="border border-black/15 rounded-xl px-3.5 py-2.5" />
          <span className="text-xs text-slate-500">New accounts start with answers that do not mention the product, to build karma first.</span>
        </label>
        {err && <p className="text-sm text-rose-700">{err}</p>}
        <div>
          <button type="submit" disabled={busy} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5">
            {busy ? "Joining…" : "Join the team"}
          </button>
        </div>
      </form>
    </div>
  )
}
