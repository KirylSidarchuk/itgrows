"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Question = { id: string; question: string; why: string }
type Profile = {
  product_name?: string
  one_liner?: string
  buyer?: string
  competitors?: string[]
  queries?: string[]
}
type Strategy = {
  summary: string
  subreddits: { name: string; why: string; mode: string; rule_notes: string; brand_mentions_per_week: number }[]
  weekly_targets: { replies: number; posts: number; warmup: number }
  warmup: string
  post_ideas: { subreddit: string; title: string; format: string; needs: string }[]
  principles: string[]
}
type Project = {
  id: string
  siteUrl: string
  goal: string
  status: string
  profile: Profile | null
  questions: Question[] | null
  answers: Record<string, string> | null
  redditUsername: string | null
  strategy: Strategy | null
  lastRunAt: string | null
  error: string | null
}
type Plan = {
  day: string
  summary: string | null
  skipped: { thread_id: string; reason: string; title?: string; url?: string; subreddit?: string }[] | null
}
type Task = {
  id: string
  day: string
  kind: string
  priority: string
  subreddit: string | null
  title: string | null
  url: string | null
  why: string | null
  draft: string | null
  checks: string[] | null
  mentionsBrand: boolean
  status: string
  doneUrl: string | null
  skipReason: string | null
  verifyStatus: string | null
  assigneeEmail: string | null
  doneByEmail: string | null
  result: { score?: number | null; replies?: number | null; reply_quotes?: string[] } | null
}
type Member = { email: string; redditUsername: string | null; communities: string[]; accountNote: string | null }
type Note = { id: string; subreddit: string | null; body: string; authorEmail: string; createdAt: string }
type Data = { project: Project; plans: Plan[]; tasks: Task[]; role: "owner" | "member"; me: string; members: Member[]; notes: Note[]; teamChat: boolean }

const todayUTC = () => new Date().toISOString().slice(0, 10)

const KIND: Record<string, string> = { reply: "Reply", post: "Post", warmup: "Warm-up" }
const PRIORITY: Record<string, string> = {
  P0: "bg-rose-100 text-rose-800",
  P1: "bg-amber-100 text-amber-800",
  P2: "bg-slate-200 text-slate-700",
}
const VERIFY: Record<string, { label: string; cls: string }> = {
  pending: { label: "We check it within a day", cls: "bg-slate-100 text-slate-700" },
  visible: { label: "Still up", cls: "bg-emerald-100 text-emerald-800" },
  removed: { label: "Removed by moderators", cls: "bg-rose-100 text-rose-800" },
  not_found: { label: "Could not find it", cls: "bg-amber-100 text-amber-800" },
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error || "Something went wrong")
  return d
}

export default function ProjectClient({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [teamChat, setTeamChat] = useState(false)
  const [role, setRole] = useState<"owner" | "member">("member")
  const [me, setMe] = useState("")
  const [who, setWho] = useState<"mine" | "all">("all")
  const [loadError, setLoadError] = useState("")

  const apply = useCallback((d: Data) => {
    setProject(d.project)
    setPlans(d.plans)
    setTasks(d.tasks)
    setMembers(d.members ?? [])
    setNotes(d.notes ?? [])
    setTeamChat(!!d.teamChat)
    setRole(d.role)
    setMe(d.me)
    // Someone who posts sees their own list first; the owner who does not post sees everyone's.
    if ((d.members ?? []).some((m) => m.email === d.me && m.redditUsername)) setWho("mine")
    setLoadError("")
  }, [])
  const fail = useCallback((e: unknown) => setLoadError(e instanceof Error ? e.message : "Could not load the project"), [])

  const load = useCallback(() => {
    api(`/api/reddit/projects/${id}`).then(apply).catch(fail)
  }, [id, apply, fail])

  useEffect(() => {
    let alive = true
    api(`/api/reddit/projects/${id}`)
      .then((d) => alive && apply(d))
      .catch((e) => alive && fail(e))
    return () => {
      alive = false
    }
  }, [id, apply, fail])

  const today = todayUTC()
  const todayPlan = plans.find((p) => p.day === today) ?? null
  const waiting = project && (project.status === "analyzing" || (project.status === "active" && !todayPlan))

  // The worker runs every ten minutes; while something is being prepared the page checks back
  // on its own instead of asking the person to refresh.
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [waiting, load])

  const updateTask = (t: Task) => setTasks((all) => all.map((x) => (x.id === t.id ? t : x)))

  if (loadError && !project) return <p className="text-rose-700">{loadError}</p>
  if (!project) return <p className="text-slate-500">Loading…</p>

  const name = project.profile?.product_name || project.siteUrl.replace(/^https?:\/\//, "")
  const isOwner = role === "owner"
  const team = members.filter((m) => m.redditUsername)
  const label = (email: string | null) => {
    const m = members.find((x) => x.email === email)
    return m?.redditUsername ? `u/${m.redditUsername}` : email
  }
  const shown = team.length > 0 && who === "mine" ? tasks.filter((t) => t.assigneeEmail === me) : tasks
  const todays = shown.filter((t) => t.day === today)
  const earlier = shown.filter((t) => t.day !== today)

  return (
    <div className="grid gap-8">
      <Header project={project} name={name} onChange={setProject} isOwner={isOwner} />

      {project.status === "analyzing" && (
        <Notice>
          Reading {project.siteUrl}. This takes up to ten minutes; the page updates by itself.
        </Notice>
      )}

      {project.status === "error" && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 grid gap-3">
          <p className="text-rose-800 text-sm">
            Something failed: {project.error || "unknown error"}. Retrying usually helps; if it fails again, check that the site opens without a login.
          </p>
          <div>
            <button
              className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-4 py-2"
              onClick={async () => setProject((await api(`/api/reddit/projects/${id}`, { method: "PATCH", body: JSON.stringify({ action: "retry" }) })).project)}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {project.status === "questions" &&
        (isOwner ? (
          <Questions project={project} onSaved={(p) => { setProject(p); load() }} activate />
        ) : (
          <Notice>The project owner is answering a few questions about the product. Tasks start after that.</Notice>
        ))}

      {(project.status === "active" || project.status === "paused") && (
        <>
          <Results tasks={tasks} members={team} />

          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-bold">Today</h2>
                <span className="text-sm text-slate-500">{today}</span>
              </div>
              {team.length > 0 && (
                <div className="flex rounded-xl border border-black/10 bg-white p-0.5 text-sm">
                  {(["mine", "all"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWho(w)}
                      className={`px-3 py-1.5 rounded-lg ${who === w ? "bg-violet-600 text-white" : "text-slate-600"}`}
                    >
                      {w === "mine" ? "My tasks" : "Whole team"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {todayPlan?.summary && <p className="text-slate-700">{todayPlan.summary}</p>}
            {!todayPlan && project.status === "active" && (
              <Notice>
                {plans.length === 0
                  ? "Your first plan is being prepared: finding threads, checking them and writing drafts. Usually within 15 minutes."
                  : "Today's plan is being prepared. New plans arrive every morning around 05:00 UTC."}
              </Notice>
            )}
            {project.status === "paused" && <Notice>Paused. No new plans until you resume.</Notice>}
            {todays.map((t) => (
              <TaskCard key={t.id} task={t} onUpdate={updateTask} assignee={team.length > 0 ? label(t.assigneeEmail) : null} team={team} />
            ))}
            {todayPlan && todays.length === 0 && (
              <Notice>
                {who === "mine" && team.length > 0
                  ? "Nothing for you today. Switch to Whole team to see the others' tasks."
                  : "Nothing worth doing today: the threads found were not good enough. That is a valid answer, not a failure."}
              </Notice>
            )}
            {todayPlan?.skipped && todayPlan.skipped.length > 0 && <Skipped items={todayPlan.skipped} />}
          </section>

          <Team projectId={project.id} members={members} isOwner={isOwner} me={me} teamChat={teamChat} onChange={load} />

          <Notes projectId={project.id} notes={notes} me={me} isOwner={isOwner} label={label} onChange={load} />

          {project.strategy && <StrategyView s={project.strategy} />}

          {earlier.length > 0 && <History tasks={earlier} onUpdate={updateTask} label={team.length > 0 ? label : null} team={team} />}

          {isOwner && (
            <details className="bg-white border border-black/10 rounded-2xl p-5">
              <summary className="font-semibold cursor-pointer">Your answers</summary>
              <p className="text-sm text-slate-600 mt-2 mb-4">Changes apply from the next plan.</p>
              <Questions project={project} onSaved={setProject} />
            </details>
          )}
        </>
      )}
    </div>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-dashed border-black/15 rounded-2xl p-5 text-sm text-slate-600">{children}</div>
}

function Header({ project, name, onChange, isOwner }: { project: Project; name: string; onChange: (p: Project) => void; isOwner: boolean }) {
  const [busy, setBusy] = useState(false)
  async function act(action: "pause" | "activate") {
    setBusy(true)
    try {
      onChange((await api(`/api/reddit/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ action }) })).project)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="grid gap-2">
      <Link href="/reddit/app" className="text-sm text-slate-500 hover:text-[#1b1916]">
        ← All projects
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{name}</h1>
        {isOwner && project.status === "active" && (
          <button disabled={busy} onClick={() => act("pause")} className="text-sm border border-black/15 rounded-xl px-3.5 py-2 hover:border-black/30">
            Pause
          </button>
        )}
        {isOwner && project.status === "paused" && (
          <button disabled={busy} onClick={() => act("activate")} className="text-sm rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3.5 py-2">
            Resume
          </button>
        )}
      </div>
      {project.profile?.one_liner && <p className="text-slate-600">{project.profile.one_liner}</p>}
      <p className="text-sm text-slate-700">
        <span className="font-semibold">Goal:</span> {project.goal}
      </p>
    </section>
  )
}

function Questions({ project, onSaved, activate }: { project: Project; onSaved: (p: Project) => void; activate?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>(project.answers ?? {})
  const [username, setUsername] = useState(project.redditUsername ?? "")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg("")
    try {
      const d = await api(`/api/reddit/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ answers, redditUsername: username, ...(activate ? { action: "activate" } : {}) }),
      })
      onSaved(d.project)
      setMsg("Saved")
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  const p = project.profile
  return (
    <form onSubmit={save} className="grid gap-6">
      {activate && p && (
        <div className="bg-white border border-black/10 rounded-2xl p-5 grid gap-2 text-sm">
          <h2 className="text-lg font-bold">What we understood from your site</h2>
          {p.buyer && (
            <p>
              <span className="font-semibold">Buyers:</span> {p.buyer}
            </p>
          )}
          {p.competitors && p.competitors.length > 0 && (
            <p>
              <span className="font-semibold">Compared against:</span> {p.competitors.join(", ")}
            </p>
          )}
          {p.queries && p.queries.length > 0 && (
            <p>
              <span className="font-semibold">We will look for threads like:</span> {p.queries.slice(0, 8).join(" · ")}
            </p>
          )}
          <p className="text-slate-500">If something here is wrong, say so in the answers below.</p>
        </div>
      )}
      <div className="bg-white border border-black/10 rounded-2xl p-5 grid gap-5">
        {activate && <h2 className="text-lg font-bold">A few questions your site does not answer</h2>}
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Reddit username that will post</span>
          <input
            id="reddit-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="u/yourname"
            className="border border-black/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500 max-w-sm"
          />
          <span className="text-xs text-slate-500">Used to find your comments when we check them.</span>
        </label>
        {(project.questions ?? []).map((q) => (
          <label key={q.id} className="grid gap-1.5">
            <span className="text-sm font-semibold">{q.question}</span>
            <span className="text-xs text-slate-500">{q.why}</span>
            <textarea
              id={`answer-${q.id}`}
              rows={3}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              className="border border-black/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500"
            />
          </label>
        ))}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5"
          >
            {activate ? "Start the daily plan" : "Save answers"}
          </button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </div>
    </form>
  )
}

function TaskCard({ task, onUpdate, assignee, team = [] }: { task: Task; onUpdate: (t: Task) => void; assignee?: string | null; team?: Member[] }) {
  const [mode, setMode] = useState<"idle" | "done" | "skip" | "handoff">("idle")
  const [to, setTo] = useState("")
  const [url, setUrl] = useState("")
  const [reason, setReason] = useState("")
  const [err, setErr] = useState("")
  const [copied, setCopied] = useState(false)

  async function send(body: Record<string, string>) {
    setErr("")
    try {
      onUpdate((await api(`/api/reddit/tasks/${task.id}`, { method: "POST", body: JSON.stringify(body) })).task)
      setMode("idle")
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save")
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(task.draft ?? "")
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setErr("Copy is blocked here; select the text and copy it by hand.")
    }
  }

  const v = task.verifyStatus ? VERIFY[task.verifyStatus] : null
  return (
    <article className={`bg-white border rounded-2xl p-5 grid gap-3 ${task.status === "todo" ? "border-black/10" : "border-black/5 opacity-90"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${PRIORITY[task.priority] ?? PRIORITY.P2}`}>{task.priority}</span>
        <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-violet-100 text-violet-800">{KIND[task.kind] ?? task.kind}</span>
        {task.subreddit && <span className="text-sm text-slate-500">{task.subreddit}</span>}
        {task.mentionsBrand && <span className="text-xs text-slate-500">mentions your product, with disclosure</span>}
        {assignee && <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-cyan-100 text-cyan-800 ml-auto">{assignee}</span>}
      </div>
      <h3 className="font-semibold leading-snug">
        {task.url ? (
          <a href={task.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet-700 underline-offset-2 hover:underline">
            {task.title}
          </a>
        ) : (
          task.title
        )}
      </h3>
      {task.why && <p className="text-sm text-slate-600">{task.why}</p>}

      {task.draft && (
        <div className="bg-[#f6f5f4] rounded-xl p-4 grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Draft</span>
            <button onClick={copy} className="text-xs border border-black/10 bg-white rounded-lg px-2.5 py-1 hover:border-violet-400">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.draft}</p>
        </div>
      )}

      {task.checks && task.checks.length > 0 && task.status === "todo" && (
        <div className="text-sm">
          <span className="font-semibold">Before posting:</span>
          <ul className="list-disc pl-5 text-slate-700 mt-1 grid gap-0.5">
            {task.checks.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {task.status === "todo" && mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode("done")} className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2">
            I posted it
          </button>
          <button onClick={() => setMode("skip")} className="rounded-xl border border-black/15 text-sm px-4 py-2 hover:border-black/30">
            Skip
          </button>
          {team.length > 1 && (
            <button onClick={() => setMode("handoff")} className="rounded-xl border border-black/15 text-sm px-4 py-2 hover:border-black/30">
              Hand over
            </button>
          )}
        </div>
      )}
      {task.status === "todo" && mode === "handoff" && (() => {
        const others = team.filter((m) => m.email !== task.assigneeEmail)
        const target = others.find((m) => m.email === to)
        const owner = team.find((m) => task.subreddit && m.communities.includes(task.subreddit))
        const warn = target && task.subreddit && owner && owner.email !== target.email
          ? `${task.subreddit} is u/${owner.redditUsername}'s community. Hand over only if they agree.`
          : ""
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (to) send({ action: "handoff", to })
            }}
            className="grid gap-2"
          >
            <div className="flex flex-wrap gap-2">
              <select
                id={`handoff-${task.id}`}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-black/15 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="">Choose a teammate…</option>
                {others.map((m) => (
                  <option key={m.email} value={m.email}>
                    u/{m.redditUsername}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={!to} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2">
                Hand over
              </button>
              <button type="button" onClick={() => setMode("idle")} className="text-sm text-slate-500 px-2">
                Cancel
              </button>
            </div>
            {warn && <p className="text-sm text-amber-700">{warn}</p>}
          </form>
        )
      })()}
      {task.status === "todo" && mode === "done" && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send({ action: "done", url })
          }}
          className="grid gap-2"
        >
          <label className="text-sm font-semibold" htmlFor={`done-${task.id}`}>
            Link to your comment or post (Share → Copy link)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id={`done-${task.id}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.reddit.com/r/…/comments/…"
              className="flex-1 min-w-0 border border-black/15 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500"
              required
            />
            <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2">
              Save
            </button>
            <button type="button" onClick={() => setMode("idle")} className="text-sm text-slate-500 px-2">
              Cancel
            </button>
          </div>
        </form>
      )}
      {task.status === "todo" && mode === "skip" && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send({ action: "skip", reason })
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            id={`skip-${task.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why skip? (optional, helps tomorrow's plan)"
            className="flex-1 min-w-0 border border-black/15 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500"
          />
          <button type="submit" className="rounded-xl border border-black/15 text-sm px-4 py-2">
            Skip
          </button>
          <button type="button" onClick={() => setMode("idle")} className="text-sm text-slate-500 px-2">
            Cancel
          </button>
        </form>
      )}

      {task.status === "done" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-emerald-700">Posted</span>
          {task.doneUrl && (
            <a href={task.doneUrl} target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:underline break-all">
              open
            </a>
          )}
          {v && <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${v.cls}`}>{v.label}</span>}
          {task.result?.replies != null && <span className="text-slate-600">{task.result.replies} replies</span>}
          {task.result?.score != null && <span className="text-slate-600">score {task.result.score}</span>}
          <button onClick={() => send({ action: "undo" })} className="text-xs text-slate-500 hover:text-slate-800 ml-auto">
            Undo
          </button>
        </div>
      )}
      {task.status === "skipped" && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold">Skipped</span>
          {task.skipReason && <span>— {task.skipReason}</span>}
          <button onClick={() => send({ action: "undo" })} className="text-xs text-slate-500 hover:text-slate-800 ml-auto">
            Undo
          </button>
        </div>
      )}
      {task.result?.reply_quotes && task.result.reply_quotes.length > 0 && (
        <ul className="text-sm text-slate-600 grid gap-1 border-l-2 border-black/10 pl-3">
          {task.result.reply_quotes.slice(0, 3).map((q, i) => (
            <li key={i}>“{q}”</li>
          ))}
        </ul>
      )}
      {err && <p className="text-sm text-rose-700">{err}</p>}
    </article>
  )
}

function Skipped({ items }: { items: NonNullable<Plan["skipped"]> }) {
  return (
    <details className="bg-white border border-black/10 rounded-2xl p-5">
      <summary className="font-semibold cursor-pointer">Threads we looked at and left alone ({items.length})</summary>
      <ul className="mt-3 grid gap-3 text-sm">
        {items.map((s) => (
          <li key={s.thread_id} className="grid gap-0.5">
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {s.subreddit} · {s.title}
              </a>
            ) : (
              <span className="font-medium">{s.title}</span>
            )}
            <span className="text-slate-600">{s.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Results({ tasks, members }: { tasks: Task[]; members: Member[] }) {
  const r = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done")
    return {
      done: done.length,
      up: done.filter((t) => t.verifyStatus === "visible").length,
      removed: done.filter((t) => t.verifyStatus === "removed").length,
      replies: done.reduce((n, t) => n + (Number(t.result?.replies) || 0), 0),
    }
  }, [tasks])
  const per = members.map((m) => {
    const done = tasks.filter((t) => t.status === "done" && (t.doneByEmail ?? t.assigneeEmail) === m.email)
    return {
      who: `u/${m.redditUsername}`,
      open: tasks.filter((t) => t.status === "todo" && t.assigneeEmail === m.email).length,
      done: done.length,
      up: done.filter((t) => t.verifyStatus === "visible").length,
      removed: done.filter((t) => t.verifyStatus === "removed").length,
    }
  })
  const cells = [
    { n: r.done, l: "posted, last 30 days" },
    { n: r.up, l: "confirmed still up" },
    { n: r.removed, l: "removed by moderators" },
    { n: r.replies, l: "replies to your comments" },
  ]
  return (
    <section className="grid gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-black/10 border border-black/10 rounded-2xl overflow-hidden">
        {cells.map((c) => (
          <div key={c.l} className="bg-white p-4">
            <div className="text-2xl font-bold tabular-nums">{c.n}</div>
            <div className="text-xs text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>
      {per.length > 0 && (
        <div className="overflow-x-auto bg-white border border-black/10 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2">Person</th>
                <th className="px-4 py-2">Open tasks</th>
                <th className="px-4 py-2">Posted</th>
                <th className="px-4 py-2">Still up</th>
                <th className="px-4 py-2">Removed</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {per.map((r) => (
                <tr key={r.who} className="border-t border-black/5">
                  <td className="px-4 py-2 font-medium">{r.who}</td>
                  <td className="px-4 py-2">{r.open}</td>
                  <td className="px-4 py-2">{r.done}</td>
                  <td className="px-4 py-2">{r.up}</td>
                  <td className="px-4 py-2">{r.removed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function StrategyView({ s }: { s: Strategy }) {
  return (
    <details className="bg-white border border-black/10 rounded-2xl p-5" open={false}>
      <summary className="font-semibold cursor-pointer">Two-week strategy</summary>
      <div className="grid gap-4 mt-3 text-sm">
        <p className="text-slate-700">{s.summary}</p>
        <p>
          <span className="font-semibold">Per week:</span> {s.weekly_targets.replies} replies, {s.weekly_targets.posts} posts,{" "}
          {s.weekly_targets.warmup} warm-up answers
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">Community</th>
                <th className="py-2 pr-3">How</th>
                <th className="py-2 pr-3">Product mentions / week</th>
                <th className="py-2">Rules and why</th>
              </tr>
            </thead>
            <tbody>
              {s.subreddits.map((r) => (
                <tr key={r.name} className="border-t border-black/5 align-top">
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{r.name}</td>
                  <td className="py-2 pr-3">{r.mode}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.brand_mentions_per_week}</td>
                  <td className="py-2 text-slate-600">
                    {r.rule_notes} {r.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.warmup && (
          <p>
            <span className="font-semibold">Warm-up:</span> {s.warmup}
          </p>
        )}
        {s.post_ideas.length > 0 && (
          <div>
            <span className="font-semibold">Post ideas:</span>
            <ul className="list-disc pl-5 mt-1 grid gap-1">
              {s.post_ideas.map((p, i) => (
                <li key={i}>
                  {p.subreddit}: {p.title} <span className="text-slate-500">({p.format}; needs {p.needs})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  )
}

function History({ tasks, onUpdate, label, team }: { tasks: Task[]; onUpdate: (t: Task) => void; label: ((email: string | null) => string | null) | null; team: Member[] }) {
  const days = Array.from(new Set(tasks.map((t) => t.day)))
  return (
    <details className="bg-white border border-black/10 rounded-2xl p-5">
      <summary className="font-semibold cursor-pointer">Earlier days</summary>
      <div className="grid gap-6 mt-4">
        {days.map((d) => (
          <div key={d} className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-500">{d}</h3>
            {tasks
              .filter((t) => t.day === d)
              .map((t) => (
                <TaskCard key={t.id} task={t} onUpdate={onUpdate} assignee={label ? label(t.assigneeEmail) : null} team={team} />
              ))}
          </div>
        ))}
      </div>
    </details>
  )
}

function Team({ projectId, members, isOwner, me, teamChat, onChange }: { projectId: string; members: Member[]; isOwner: boolean; me: string; teamChat: boolean; onChange: () => void }) {
  const mine = members.find((m) => m.email === me)
  const taken: Record<string, string[]> = {}
  for (const m of members) for (const c of m.communities) (taken[c] ??= []).push(m.redditUsername ? `u/${m.redditUsername}` : m.email)
  const clashes = Object.entries(taken).filter(([, who]) => who.length > 1)
  const empty = { email: "", redditUsername: "", communities: "", accountNote: "" }
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr("")
    try {
      await api(`/api/reddit/projects/${projectId}/members`, { method: "POST", body: JSON.stringify(form) })
      setForm(empty)
      onChange()
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  async function remove(email: string) {
    setErr("")
    try {
      await api(`/api/reddit/projects/${projectId}/members?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      onChange()
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not remove")
    }
  }

  async function saveMine(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr("")
    try {
      await api(`/api/reddit/projects/${projectId}/members`, { method: "PATCH", body: JSON.stringify(form) })
      setForm(empty)
      onChange()
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  if (!isOwner && members.length === 0) return null
  return (
    <details className="bg-white border border-black/10 rounded-2xl p-5" open={isOwner && members.length === 0 ? false : undefined}>
      <summary className="font-semibold cursor-pointer">Team ({members.length})</summary>
      <div className="grid gap-4 mt-3 text-sm">
        <p className="text-slate-600">
          Each person posts from their own Reddit account and gets tasks only in their own communities, so two people
          from your company never reply in the same thread. Product mentions are counted for the whole team. Communities
          nobody owns are split between people. Teammates must never vote for or reply to each other: Reddit bans every
          account involved.
        </p>
        {clashes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-900">
            {clashes.map(([c, who]) => (
              <p key={c}>
                {c} is chosen by {who.join(" and ")}. Decide who keeps it; until then each thread there still goes to one person only.
              </p>
            ))}
          </div>
        )}
        <p className="text-slate-600">
          {teamChat
            ? "The team's Telegram group is connected: the day's tasks, removals and the weekly summary go there."
            : "No Telegram group connected yet."}
        </p>
        {members.length > 0 && (
          <ul className="grid gap-2">
            {members.map((m) => (
              <li key={m.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-black/5 rounded-xl px-3 py-2">
                <span className="font-semibold">{m.redditUsername ? `u/${m.redditUsername}` : "no Reddit account yet"}</span>
                <span className="text-slate-500 break-all">{m.email}</span>
                <span className="text-slate-700">{m.communities.length ? m.communities.join(", ") : "any community"}</span>
                {m.accountNote && <span className="text-slate-500">· {m.accountNote}</span>}
                {isOwner && (
                  <span className="ml-auto flex gap-3">
                    <button
                      className="text-xs text-violet-700 hover:underline"
                      onClick={() =>
                        setForm({
                          email: m.email,
                          redditUsername: m.redditUsername ?? "",
                          communities: m.communities.join(", "),
                          accountNote: m.accountNote ?? "",
                        })
                      }
                    >
                      Edit
                    </button>
                    <button className="text-xs text-slate-500 hover:text-rose-700" onClick={() => remove(m.email)}>
                      Remove
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {isOwner && <Invites projectId={projectId} />}
        {!isOwner && mine && (
          <form onSubmit={saveMine} className="grid gap-3 border-t border-black/5 pt-4">
            <span className="font-semibold">Your details</span>
            <div className="grid sm:grid-cols-3 gap-3">
              <input id="mine-username" placeholder={mine.redditUsername ? `u/${mine.redditUsername}` : "u/name"} value={form.redditUsername} onChange={set("redditUsername")} className="border border-black/15 rounded-xl px-3 py-2" />
              <input id="mine-communities" placeholder={mine.communities.join(", ") || "r/…, r/…"} value={form.communities} onChange={set("communities")} className="border border-black/15 rounded-xl px-3 py-2" />
              <input id="mine-note" placeholder={mine.accountNote || "account age and karma"} value={form.accountNote} onChange={set("accountNote")} className="border border-black/15 rounded-xl px-3 py-2" />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="submit"
                disabled={busy}
                onClick={() =>
                  setForm((f) => ({
                    email: me,
                    redditUsername: f.redditUsername || mine.redditUsername || "",
                    communities: f.communities || mine.communities.join(", "),
                    accountNote: f.accountNote || mine.accountNote || "",
                  }))
                }
                className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold px-4 py-2"
              >
                Save my details
              </button>
              <span className="text-slate-500">Empty fields keep what is there now.</span>
            </div>
            {err && <p className="text-rose-700">{err}</p>}
          </form>
        )}
        {isOwner && (
          <form onSubmit={save} className="grid gap-3 border-t border-black/5 pt-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="font-semibold">Their email</span>
                <input id="member-email" type="email" required value={form.email} onChange={set("email")} className="border border-black/15 rounded-xl px-3 py-2" />
              </label>
              <label className="grid gap-1">
                <span className="font-semibold">Their Reddit username</span>
                <input id="member-username" value={form.redditUsername} onChange={set("redditUsername")} placeholder="u/name" className="border border-black/15 rounded-xl px-3 py-2" />
              </label>
              <label className="grid gap-1">
                <span className="font-semibold">Their communities</span>
                <input id="member-communities" value={form.communities} onChange={set("communities")} placeholder="r/3Dprinting, r/functionalprint" className="border border-black/15 rounded-xl px-3 py-2" />
              </label>
              <label className="grid gap-1">
                <span className="font-semibold">Account age and karma</span>
                <input id="member-note" value={form.accountNote} onChange={set("accountNote")} placeholder="new account / 2 years, 1,500 karma" className="border border-black/15 rounded-xl px-3 py-2" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy} className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold px-4 py-2">
                Save teammate
              </button>
              <span className="text-slate-500">They sign in at itgrows.ai/reddit/app with this email. Tasks for them start with the next plan.</span>
            </div>
            {err && <p className="text-rose-700">{err}</p>}
          </form>
        )}
      </div>
    </details>
  )
}

function Invites({ projectId }: { projectId: string }) {
  const [invites, setInvites] = useState<{ token: string; url: string; expiresAt: string }[] | null>(null)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    let alive = true
    api(`/api/reddit/projects/${projectId}/invites`)
      .then((d) => alive && setInvites(d.invites))
      .catch(() => alive && setInvites([]))
    return () => {
      alive = false
    }
  }, [projectId])

  async function create() {
    setMsg("")
    try {
      const d = await api(`/api/reddit/projects/${projectId}/invites`, { method: "POST" })
      setInvites((l) => [d.invite, ...(l ?? [])])
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Could not create the link")
    }
  }

  async function revoke(token: string) {
    await api(`/api/reddit/projects/${projectId}/invites?token=${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => {})
    setInvites((l) => (l ?? []).filter((i) => i.token !== token))
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setMsg("Link copied")
    } catch {
      setMsg("Copy is blocked here; select the link and copy it by hand.")
    }
  }

  return (
    <div className="grid gap-2 border-t border-black/5 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">Invite link</span>
        <button type="button" onClick={create} className="rounded-xl border border-black/15 px-3 py-1.5 hover:border-violet-400">
          Create a link
        </button>
        <span className="text-slate-500">Each person opens it, signs in with their own email and fills in their Reddit account. Valid 7 days.</span>
      </div>
      {(invites ?? []).map((i) => (
        <div key={i.token} className="flex flex-wrap items-center gap-2 bg-[#f6f5f4] rounded-xl px-3 py-2">
          <span className="font-mono text-xs break-all flex-1 min-w-0">{i.url}</span>
          <button type="button" onClick={() => copy(i.url)} className="text-xs border border-black/10 bg-white rounded-lg px-2.5 py-1">
            Copy
          </button>
          <button type="button" onClick={() => revoke(i.token)} className="text-xs text-slate-500 hover:text-rose-700">
            Revoke
          </button>
        </div>
      ))}
      {msg && <p className="text-slate-600">{msg}</p>}
    </div>
  )
}

function Notes({
  projectId,
  notes,
  me,
  isOwner,
  label,
  onChange,
}: {
  projectId: string
  notes: Note[]
  me: string
  isOwner: boolean
  label: (email: string | null) => string | null
  onChange: () => void
}) {
  const [sub, setSub] = useState("")
  const [body, setBody] = useState("")
  const [err, setErr] = useState("")

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setErr("")
    try {
      await api(`/api/reddit/projects/${projectId}/notes`, { method: "POST", body: JSON.stringify({ subreddit: sub, body }) })
      setSub("")
      setBody("")
      onChange()
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not save")
    }
  }

  async function remove(id: string) {
    await api(`/api/reddit/projects/${projectId}/notes?note=${id}`, { method: "DELETE" }).catch(() => {})
    onChange()
  }

  return (
    <details className="bg-white border border-black/10 rounded-2xl p-5">
      <summary className="font-semibold cursor-pointer">Notes on communities ({notes.length})</summary>
      <div className="grid gap-4 mt-3 text-sm">
        <p className="text-slate-600">
          What you learn about a community, for everyone on the team: a removal and why, what a moderator allowed, a rule that
          is not written down. Tomorrow&apos;s plan reads these.
        </p>
        <form onSubmit={add} className="grid sm:grid-cols-[10rem_1fr_auto] gap-2">
          <input id="note-sub" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="r/community" className="border border-black/15 rounded-xl px-3 py-2" />
          <input id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Removed for linking in the first line; mods allow a link only when asked" className="border border-black/15 rounded-xl px-3 py-2 min-w-0" required />
          <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2">
            Add
          </button>
        </form>
        {err && <p className="text-rose-700">{err}</p>}
        <ul className="grid gap-2">
          {notes.map((n) => (
            <li key={n.id} className="border border-black/5 rounded-xl px-3 py-2 grid gap-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {n.subreddit && <span className="font-semibold text-slate-700">{n.subreddit}</span>}
                <span>{label(n.authorEmail)}</span>
                <span>{n.createdAt.slice(0, 10)}</span>
                {(isOwner || n.authorEmail === me) && (
                  <button onClick={() => remove(n.id)} className="ml-auto hover:text-rose-700">
                    Delete
                  </button>
                )}
              </div>
              <span>{n.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
