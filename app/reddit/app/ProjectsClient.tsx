"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type ProjectRow = {
  id: string
  siteUrl: string
  goal: string
  status: string
  profile: { product_name?: string; one_liner?: string } | null
  lastRunAt: string | null
  role: "owner" | "member"
}

const STATUS: Record<string, { label: string; cls: string }> = {
  analyzing: { label: "Reading your site", cls: "bg-amber-100 text-amber-800" },
  questions: { label: "Waiting for your answers", cls: "bg-violet-100 text-violet-800" },
  active: { label: "Running daily", cls: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Paused", cls: "bg-slate-200 text-slate-700" },
  error: { label: "Needs attention", cls: "bg-rose-100 text-rose-800" },
}

const GOALS = [
  "App installs from people asking for an app like ours",
  "Sign-ups or demo requests from buyers comparing tools",
  "Being named in the threads Google shows for our category",
]

export default function ProjectsClient() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [canCreate, setCanCreate] = useState(false)
  const [siteUrl, setSiteUrl] = useState("")
  const [goal, setGoal] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/reddit/projects")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => {
        setProjects(d.projects ?? [])
        setCanCreate(!!d.canCreate)
      })
      .catch(() => setProjects([]))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/reddit/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl, goal }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not create the project")
      router.push(`/reddit/app/${d.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the project")
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-10">
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Your Reddit plans</h1>
        <p className="text-slate-600">
          Every morning each project gets 3–5 things to do on Reddit, with the text ready. You post; we check what happened.
        </p>
      </section>

      {projects && projects.length > 0 && (
        <section className="grid gap-3">
          {projects.map((p) => {
            const s = STATUS[p.status] ?? { label: p.status, cls: "bg-slate-200 text-slate-700" }
            return (
              <Link
                key={p.id}
                href={`/reddit/app/${p.id}`}
                className="bg-white border border-black/10 rounded-2xl p-5 hover:border-violet-400 transition-colors grid gap-1"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-lg">{p.profile?.product_name || p.siteUrl.replace(/^https?:\/\//, "")}</span>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${s.cls}`}>{s.label}</span>
                  {p.role === "member" && <span className="text-xs text-slate-500">you are on the team</span>}
                </div>
                <span className="text-sm text-slate-500 break-all">{p.siteUrl}</span>
                <span className="text-sm text-slate-700">Goal: {p.goal}</span>
              </Link>
            )
          })}
        </section>
      )}

      {projects && !canCreate && projects.length === 0 && (
        <p className="text-slate-600">You are not on any project yet. Ask the project owner to add this email to their team.</p>
      )}

      {canCreate && (
      <section className="bg-white border border-black/10 rounded-2xl p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-1">New project</h2>
        <p className="text-sm text-slate-600 mb-5">
          We read your site, ask a few questions it does not answer, then start the daily plan.
        </p>
        <form onSubmit={create} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Website</span>
            <input
              id="reddit-site"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="yourproduct.com"
              className="border border-black/15 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-violet-500"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">What should Reddit bring you?</span>
            <textarea
              id="reddit-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="For example: installs from people asking which app to use for X"
              className="border border-black/15 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-violet-500"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGoal(g)}
                className="text-xs border border-black/10 rounded-full px-3 py-1.5 text-slate-700 hover:border-violet-400"
              >
                {g}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5"
            >
              {busy ? "Creating…" : "Create and read my site"}
            </button>
          </div>
        </form>
      </section>
      )}
    </div>
  )
}
