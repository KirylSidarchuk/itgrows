import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { vmAuthorized, ENGINE_LABEL, ENGINE_ORDER, unsubscribeUrl, type RunSummary } from "@/lib/geo-check"
import { clientOwnsSql } from "@/lib/geo-role"
import { GEO_PRICES } from "@/lib/geo-pricing"

// Called by the VM worker when a day-0 or weekly report is ready. Emails each follower of the site
// who followed before the report finished and has not been told about this run yet — anyone who
// follows later sees it in the cabinet straight away. The day-0 email is the answer to their own
// sign-up and always goes. The weekly re-check is part of the plan, so weekly mail goes only to a
// follower who pays the plan for the site or is a client we set up by hand with the site connected
// (geo_clients, lib/geo-role.ts), and has not unsubscribed.
// The detailed report is free since 27 Oct 2026 and opens whole in the cabinet. A client's day-0 email gives
// the count per assistant and links the report. Since 22 Nov 2026 (Venture OS task 74) a follower not on
// the plan gets one short email: the count, the list of who is named instead of them, the report link and
// two ways in: book 15 minutes, or reply START (we answer with the invoice). No method, no per-assistant
// breakdown, and no second email: nothing else is sent after it (geo_report_email marks it sent once).
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

const button = (label: string, href = REPORT) =>
  `<p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${label}</a></p>`

const SUPPORT = `${APP}/business/dashboard/support`
const START_TO = OWNER

function readyEmail(
  first: string,
  domain: string,
  business: string,
  questions: number,
  samples: number,
  s: RunSummary,
  client: boolean,
  accountSource: string | null = null
) {
  const who = esc(business || domain)
  const href = `${REPORT}?site=${encodeURIComponent(domain)}`
  const subject = `${domain}: named in ${s.named} of ${s.of} AI answers`
  if (!client) return leadEmail(first, domain, who, questions, s, href, subject, accountSource)
  const perEngine = ENGINE_ORDER.filter((e) => s.engines[e])
    .map((e) => `${ENGINE_LABEL[e]} ${s.engines[e].named}/${s.engines[e].of}`)
    .join(" &nbsp;·&nbsp; ")
  const rivals = s.named_instead.slice(0, 2)
  const source = s.sources?.[0]
  const html = wrap(`<p>Hi ${esc(first)},</p>
<p>Your AI visibility report for <strong>${esc(domain)}</strong> is ready. We asked ChatGPT, Claude, Gemini and Perplexity ${questions} questions your buyers ask, ${samples === 1 ? "once each" : `${samples} times each`}.</p>
<div style="background:#f8f7f6;border-radius:12px;padding:16px 18px;margin:18px 0">
  <div style="font-size:30px;font-weight:800;line-height:1.1;color:#7c3aed">${s.named} <span style="color:#94a3b8;font-size:18px">of ${s.of}</span></div>
  <div style="color:#555;font-size:13px;margin-top:2px">answers named ${who}</div>
  <div style="margin-top:10px;font-size:13px;color:#333">${perEngine}</div>
</div>
${rivals.length ? `<p style="font-size:14px">Named instead: ${rivals.map((r) => `<strong>${esc(r.name)}</strong> (${r.count})`).join(", ")}.</p>` : ""}
${source ? `<p style="font-size:14px">Most-cited site in your field: <strong>${esc(source.domain)}</strong> (${source.count} answers).</p>` : ""}
${button("See every answer →", href)}
<p style="color:#555;font-size:13px">We re-check every two weeks and tell you what changed.</p>`)
  return { subject, html }
}

/** The one email after a new free report (task 74): who is named instead, then 15 minutes or START. */
function leadEmail(
  first: string,
  domain: string,
  who: string,
  questions: number,
  s: RunSummary,
  href: string,
  subject: string,
  accountSource: string | null
) {
  // Real names from this report only: no blanks, no repeats, at most 5, fewer if the report has fewer.
  const seen = new Set<string>()
  const rivals = [...s.named_instead]
    .sort((a, b) => b.count - a.count)
    .filter((r) => {
      const k = String(r.name ?? "").trim().toLowerCase()
      if (!k || seen.has(k) || !(r.count > 0)) return false
      seen.add(k)
      return true
    })
    .slice(0, 5)
  const call = `${SUPPORT}?site=${encodeURIComponent(domain)}&walkthrough=1`
  const start = `mailto:${START_TO}?subject=${encodeURIComponent(`START ${domain}`)}&body=${encodeURIComponent(
    `START ${domain}\n\nCompany name and billing address for the invoice:\n`
  )}`
  const cta = (label: string, link: string, solid: boolean) =>
    `<a href="${link}" style="display:inline-block;margin:0 8px 10px 0;${
      solid ? "background:#7c3aed;color:#ffffff;" : "background:#ffffff;color:#7c3aed;border:2px solid #7c3aed;"
    }text-decoration:none;font-weight:600;padding:11px 18px;border-radius:10px">${label}</a>`
  const html = wrap(`<p>Hi ${esc(first)},</p>
<p>Your report for <strong>${esc(domain)}</strong> is ready. Asked ${questions} questions your buyers ask, ChatGPT, Claude, Gemini and Perplexity named ${who} in <strong>${s.named} of ${s.of}</strong> answers.</p>
${
  rivals.length
    ? `<p style="margin-bottom:4px"><strong>Named instead of you:</strong></p>
<ul style="margin-top:0;padding-left:18px">${rivals
        .map((r) => `<li>${esc(r.name)} <span style="color:#777">(${r.count} ${r.count === 1 ? "answer" : "answers"})</span></li>`)
        .join("")}</ul>`
    : ""
}
<p style="font-size:14px"><a href="${href}" style="color:#7c3aed;font-weight:600">See every answer in your report →</a></p>
<p style="margin-bottom:12px">Want them to name you instead?</p>
<div>${cta("Book 15 minutes", call, true)}${cta("Reply START", start, false)}</div>
<p style="font-size:13px;color:#555">START: we send the invoice within a day and begin. ${GEO_PRICES.month.label} a month + ${GEO_PRICES.setup.label} one-time setup, the same public price for everyone.</p>
${accountSource === "meta_form" || accountSource === "site_email" ? `<p style="font-size:12px;color:#777">You asked for this report ${accountSource === "meta_form" ? "through our form on Facebook or Instagram" : "on our site"}, so we opened an account for this email. To open the report, enter this email on the next screen and we'll send you a one-time code.</p>` : ""}`)
  return { subject, html }
}

function weeklyEmail(first: string, domain: string, business: string, s: WeeklySummary, unsub: string) {
  const who = esc(business || domain)
  const prev = s.previous
  const prevText = prev ? ` (${prev.kind === "baseline" ? "day 0, same questions" : "last check"}: ${prev.named})` : ""
  const lines = (s.changes ?? []).slice(0, 2).map((c) =>
    c.type === "new"
      ? `${ENGINE_LABEL[c.engine]} now names you for “${esc(cut(c.q, 60))}”`
      : c.type === "lost"
        ? `${ENGINE_LABEL[c.engine]} no longer names you for “${esc(cut(c.q, 60))}”`
        : `${esc(c.name)} newly named instead of you, in ${c.count} answers`
  )
  const subject = `${domain} in AI answers, latest check: ${s.named} of ${s.of}`
  const html = wrap(
    `<p>Hi ${esc(first)},</p>
<p>In this check the assistants named ${who} in <strong>${s.named} of ${s.of}</strong> answers${prevText}.</p>
${lines.length ? `<p style="margin-bottom:4px"><strong>What changed</strong></p><ul style="margin-top:0;padding-left:18px">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` : "<p>No changes since the last check.</p>"}
<p style="color:#555;font-size:13px">One check is noise; the average of the last 4 checks is the signal.</p>
${button("See details →", `${REPORT}?site=${encodeURIComponent(domain)}`)}`,
    `<p style="font-size:12px;color:#999;margin-top:24px">You get this every two weeks because you follow ${esc(domain)} on ItGrows. <a href="${unsub}" style="color:#999">Unsubscribe</a></p>`
  )
  return { subject, html }
}

export async function POST(req: NextRequest) {
  if (!vmAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as { run_id?: string; user_id?: string }
  const runId = String(body.run_id ?? "")
  // /api/geo/report-request: an account that followed a site whose report already exists gets it, alone.
  const onlyUser = /^[0-9a-f-]{36}$/i.test(String(body.user_id ?? "")) ? String(body.user_id) : ""
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
      SELECT * FROM (
        SELECT u.id, u.email, u.name, u.source, f.id AS follow_id, f.email_weekly,
               (f.plan = 'paid' OR ${clientOwnsSql(sql.raw("u.id"), sql`${String(run.domain)}`)}) AS client
        FROM geo_follows f
        JOIN users u ON u.id::text = f.user_id
        JOIN geo_runs r ON r.id = ${runId}::uuid AND (f.created_at <= r.finished_at OR u.id::text = ${onlyUser})
        WHERE f.site_id = ${run.site_id}
      ) u
      WHERE (${!weekly} OR (u.email_weekly AND u.client))
        AND (${onlyUser} = '' OR u.id::text = ${onlyUser})
        AND NOT EXISTS (SELECT 1 FROM analytics_events e
                        WHERE e.event = 'geo_report_email' AND e.user_id = u.id AND e.props->>'run' = ${runId})`)
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0
  for (const p of people) {
    // An account opened from just an email has no name yet: its "name" is the address before the @.
    const first = (p.source === "site_email" ? "" : String(p.name ?? "").trim().split(/\s+/)[0]) || "there"
    const unsub = unsubscribeUrl(String(p.follow_id))
    const { subject, html } = weekly
      ? weeklyEmail(first, String(run.domain), String(run.business ?? ""), run.summary as WeeklySummary, unsub)
      : readyEmail(
          first,
          String(run.domain),
          String(run.business ?? ""),
          Number(run.n_questions ?? 20),
          Number(run.samples ?? 3),
          run.summary as RunSummary,
          p.client === true,
          (p.source as string | null) ?? null
        )
    try {
      // Resend answers an error instead of throwing it.
      const { error } = await resend.emails.send({
        from: "ItGrows.ai <noreply@itgrows.ai>",
        to: String(p.email),
        replyTo: OWNER,
        subject,
        html,
        ...(weekly ? { headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      })
      if (error) throw new Error(error.message)
      await db.execute(sql`
        INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${p.id as string}, 'geo_report_email', '/business/dashboard/visibility',
                ${JSON.stringify({ run: runId, domain: run.domain, kind: run.kind })}::jsonb)`)
      sent++
    } catch (err) {
      console.error("[geo-notify] send failed:", err)
      failed++
    }
  }
  // Not 200 when someone is still owed the email: the VM tries again (those already sent are recorded and
  // skipped) and then tells Kiryl.
  if (failed) return NextResponse.json({ ok: false, sent, failed }, { status: 502 })
  return NextResponse.json({ ok: true, sent })
}
