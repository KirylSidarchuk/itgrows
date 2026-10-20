import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { vmAuthorized, ENGINE_LABEL, ENGINE_ORDER, unsubscribeUrl, type RunSummary } from "@/lib/geo-check"

// Called by the VM worker when a day-0 or weekly report is ready. Emails each follower of the site
// who followed before the report finished and has not been told about this run yet — anyone who
// follows later sees it in the cabinet straight away. Weekly mail goes only to followers who have
// not unsubscribed; the day-0 email is the answer to their own sign-up and always goes.
// The VM authenticates with its API token.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const APP = "https://www.itgrows.ai"
const OWNER = "kiryl.sidarchuk@gmail.com"
const REPORT = `${APP}/business/dashboard/visibility`

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s)

interface WeeklySummary extends RunSummary {
  previous?: { kind: string; named: number; of: number }
  changes?: (
    | { type: "new"; engine: string; q: string }
    | { type: "lost"; engine: string; q: string }
    | { type: "rival"; name: string; count: number }
  )[]
}

const wrap = (body: string, footer = "") => `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1b1916;max-width:560px">
${body}
<p>— Kiryl<br><span style="color:#888">ItGrows</span></p>
${footer}
</div>`

const button = (label: string) =>
  `<p style="margin:22px 0"><a href="${REPORT}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${label}</a></p>`

function readyEmail(first: string, domain: string, business: string, questions: number, samples: number, s: RunSummary) {
  const who = esc(business || domain)
  const perEngine = ENGINE_ORDER.filter((e) => s.engines[e])
    .map((e) => `${ENGINE_LABEL[e]} ${s.engines[e].named}/${s.engines[e].of}`)
    .join(" &nbsp;·&nbsp; ")
  const rivals = s.named_instead.slice(0, 2)
  const source = s.sources?.[0]
  const subject = `${domain}: named in ${s.named} of ${s.of} AI answers`
  const html = wrap(`<p>Hi ${esc(first)},</p>
<p>Your AI visibility report for <strong>${esc(domain)}</strong> is ready. We asked ChatGPT, Claude, Gemini and Perplexity ${questions} questions your buyers ask, ${samples} times each.</p>
<div style="background:#f8f7f6;border-radius:12px;padding:16px 18px;margin:18px 0">
  <div style="font-size:30px;font-weight:800;line-height:1.1;color:#7c3aed">${s.named} <span style="color:#94a3b8;font-size:18px">of ${s.of}</span></div>
  <div style="color:#555;font-size:13px;margin-top:2px">answers named ${who}</div>
  <div style="margin-top:10px;font-size:13px;color:#333">${perEngine}</div>
</div>
${rivals.length ? `<p style="font-size:14px">Named instead: ${rivals.map((r) => `<strong>${esc(r.name)}</strong> (${r.count})`).join(", ")}.</p>` : ""}
${source ? `<p style="font-size:14px">Most-cited site in your field: <strong>${esc(source.domain)}</strong> (${source.count} answers).</p>` : ""}
${button("See every answer →")}
<p style="color:#555;font-size:13px">We'll re-check every week and tell you what changed.</p>`)
  return { subject, html }
}

function weeklyEmail(first: string, domain: string, business: string, free: boolean, s: WeeklySummary, unsub: string) {
  const who = esc(business || domain)
  const prev = s.previous
  const prevText = prev ? ` (${prev.kind === "baseline" ? "day 0, same questions" : "last week"}: ${prev.named})` : ""
  const lines = (s.changes ?? []).slice(0, 2).map((c) =>
    c.type === "new"
      ? `${ENGINE_LABEL[c.engine]} now names you for “${esc(cut(c.q, 60))}”`
      : c.type === "lost"
        ? `${ENGINE_LABEL[c.engine]} no longer names you for “${esc(cut(c.q, 60))}”`
        : `${esc(c.name)} newly named instead of you, in ${c.count} answers`
  )
  const subject = `${domain} in AI answers this week: ${s.named} of ${s.of}`
  const html = wrap(
    `<p>Hi ${esc(first)},</p>
<p>This week the assistants named ${who} in <strong>${s.named} of ${s.of}</strong> answers${prevText}.</p>
${lines.length ? `<p style="margin-bottom:4px"><strong>What changed</strong></p><ul style="margin-top:0;padding-left:18px">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` : "<p>No changes since last week.</p>"}
<p style="color:#555;font-size:13px">One week is noise; the 4-week average is the signal.</p>
${button("See details →")}
${free ? `<p style="font-size:13px;color:#555">Free plan: 5 questions, 1 ask each. <a href="${APP}/business#pricing" style="color:#7c3aed">What the paid plan adds →</a></p>` : ""}`,
    `<p style="font-size:12px;color:#999;margin-top:24px">You get this weekly because you follow ${esc(domain)} on ItGrows. <a href="${unsub}" style="color:#999">Unsubscribe</a></p>`
  )
  return { subject, html }
}

export async function POST(req: NextRequest) {
  if (!vmAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as { run_id?: string }
  const runId = String(body.run_id ?? "")
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return NextResponse.json({ error: "bad_run" }, { status: 400 })

  const [run] = rows(
    await db.execute(sql`
      SELECT r.kind, r.status, r.summary, r.samples, jsonb_array_length(r.questions) AS n_questions,
             s.id AS site_id, s.domain, s.profile->>'business_name' AS business
      FROM geo_runs r JOIN geo_sites s ON s.id = r.site_id
      WHERE r.id = ${runId}::uuid`)
  )
  if (!run || run.status !== "done" || run.kind === "teaser" || !run.summary) {
    return NextResponse.json({ ok: false, reason: "not_ready" })
  }
  const weekly = run.kind === "weekly"

  const people = rows(
    await db.execute(sql`
      SELECT u.id, u.email, u.name, f.id AS follow_id, f.plan
      FROM geo_follows f
      JOIN users u ON u.id::text = f.user_id
      JOIN geo_runs r ON r.id = ${runId}::uuid AND f.created_at <= r.finished_at
      WHERE f.site_id = ${run.site_id}
        AND (${!weekly} OR f.email_weekly)
        AND NOT EXISTS (SELECT 1 FROM analytics_events e
                        WHERE e.event = 'geo_report_email' AND e.user_id = u.id AND e.props->>'run' = ${runId})`)
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const p of people) {
    const first = String(p.name ?? "").trim().split(/\s+/)[0] || "there"
    const unsub = unsubscribeUrl(String(p.follow_id))
    const { subject, html } = weekly
      ? weeklyEmail(first, String(run.domain), String(run.business ?? ""), p.plan !== "paid", run.summary as WeeklySummary, unsub)
      : readyEmail(first, String(run.domain), String(run.business ?? ""), Number(run.n_questions ?? 20), Number(run.samples ?? 3), run.summary as RunSummary)
    try {
      await resend.emails.send({
        from: "ItGrows.ai <noreply@itgrows.ai>",
        to: String(p.email),
        replyTo: OWNER,
        subject,
        html,
        ...(weekly ? { headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      })
      await db.execute(sql`
        INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${p.id as string}, 'geo_report_email', '/business/dashboard/visibility',
                ${JSON.stringify({ run: runId, domain: run.domain, kind: run.kind })}::jsonb)`)
      sent++
    } catch (err) {
      console.error("[geo-notify] send failed:", err)
    }
  }
  return NextResponse.json({ ok: true, sent })
}
