import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { vmAuthorized, ENGINE_LABEL, ENGINE_ORDER, type RunSummary } from "@/lib/geo-check"

// Called by the VM worker when a day-0 or weekly report is ready. Emails each follower of the site
// who followed before the report finished and has not been told about this run yet — anyone who
// follows later sees it in the cabinet straight away. The VM authenticates with its API token.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const APP = "https://www.itgrows.ai"
const OWNER = "kiryl.sidarchuk@gmail.com"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

function readyEmail(first: string, domain: string, business: string, questions: number, s: RunSummary) {
  const who = esc(business || domain)
  const perEngine = ENGINE_ORDER.filter((e) => s.engines[e])
    .map((e) => `${ENGINE_LABEL[e]} ${s.engines[e].named}/${s.engines[e].of}`)
    .join(" &nbsp;·&nbsp; ")
  const rivals = s.named_instead.slice(0, 3)
  const subject = `${domain}: named in ${s.named} of ${s.of} AI answers`
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1b1916;max-width:560px">
<p>Hi ${esc(first)},</p>
<p>Your day-0 report for <strong>${esc(domain)}</strong> is ready. We asked ChatGPT, Claude, Gemini and Perplexity ${questions} questions your buyers ask.</p>
<div style="background:#f8f7f6;border-radius:12px;padding:16px 18px;margin:18px 0">
  <div style="font-size:30px;font-weight:800;line-height:1.1">${s.named} of ${s.of}</div>
  <div style="color:#555;font-size:13px;margin-top:2px">answers that named ${who}</div>
  <div style="margin-top:10px;font-size:13px;color:#333">${perEngine}</div>
</div>
${rivals.length ? `<p style="font-size:14px">Named instead most often: ${rivals.map((r) => `<strong>${esc(r.name)}</strong> (${r.count})`).join(", ")}.</p>` : ""}
<p style="margin:22px 0"><a href="${APP}/business/dashboard/visibility" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Open the full report →</a></p>
<p style="color:#555;font-size:13px">We measure again in a week and send you what changed.</p>
<p>— Kiryl<br><span style="color:#888">ItGrows</span></p>
</div>`
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
      SELECT r.kind, r.status, r.summary, jsonb_array_length(r.questions) AS n_questions,
             s.id AS site_id, s.domain, s.profile->>'business_name' AS business
      FROM geo_runs r JOIN geo_sites s ON s.id = r.site_id
      WHERE r.id = ${runId}::uuid`)
  )
  if (!run || run.status !== "done" || run.kind === "teaser" || !run.summary) {
    return NextResponse.json({ ok: false, reason: "not_ready" })
  }

  const people = rows(
    await db.execute(sql`
      SELECT u.id, u.email, u.name
      FROM geo_follows f
      JOIN users u ON u.id::text = f.user_id
      JOIN geo_runs r ON r.id = ${runId}::uuid AND f.created_at <= r.finished_at
      WHERE f.site_id = ${run.site_id}
        AND NOT EXISTS (SELECT 1 FROM analytics_events e
                        WHERE e.event = 'geo_report_email' AND e.user_id = u.id AND e.props->>'run' = ${runId})`)
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const p of people) {
    const first = String(p.name ?? "").trim().split(/\s+/)[0] || "there"
    const { subject, html } = readyEmail(
      first,
      String(run.domain),
      String(run.business ?? ""),
      Number(run.n_questions ?? 20),
      run.summary as RunSummary
    )
    try {
      await resend.emails.send({ from: "ItGrows.ai <noreply@itgrows.ai>", to: String(p.email), replyTo: OWNER, subject, html })
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
