import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { unsubscribeUrl, vmAuthorized } from "@/lib/geo-check"
import { clientOwnsSql } from "@/lib/geo-role"

// Called by the VM on the 1st (/root/geo_report.py --cabinet --email), once per site: tells the site's clients
// that the month's report is in their account, with the block's counts. Reports live in the cabinet with their
// history; nothing is sent by hand (Kiryl, 2 Nov 2026). Goes to whoever pays for the site or is its client set
// up by hand and has not unsubscribed, once per person, site and month, so the VM may call again. In the
// report's language: German or English (geo_report.py T).

export const dynamic = "force-dynamic"
export const maxDuration = 60

const OWNER = "kiryl.sidarchuk@gmail.com"
const REPORT = "https://www.itgrows.ai/business/dashboard/visibility"

type Row = Record<string, unknown>
interface Results {
  lang: string
  monthName: string
  title: string
  rows: { n: string | null; label: string | null }[]
}
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

function monthlyEmail(domain: string, r: Results, unsub: string) {
  const de = r.lang === "de"
  const counts = r.rows.filter((x) => x.n !== null && x.label).slice(0, 3)
  const box = counts.length
    ? `<div style="background:#f8f7f6;border-radius:12px;padding:16px 18px;margin:18px 0">
  <div style="font-weight:600;margin-bottom:6px">${esc(r.title)}</div>
  ${counts.map((x) => `<div style="margin-top:4px"><strong style="color:#7c3aed">${esc(x.n!)}</strong> ${esc(x.label!)}</div>`).join("\n  ")}
</div>`
    : ""
  const href = `${REPORT}?site=${encodeURIComponent(domain)}`
  const subject = de ? `Ihr Bericht für ${r.monthName}: ${domain}` : `Your ${r.monthName} report for ${domain}`
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1b1916;max-width:560px">
<p>${de ? "Guten Tag," : "Hello,"}</p>
<p>${
    de
      ? `Ihr Bericht für ${esc(r.monthName)} zu <strong>${esc(domain)}</strong> liegt in Ihrem Konto, zusammen mit den früheren Monaten.`
      : `Your ${esc(r.monthName)} report for <strong>${esc(domain)}</strong> is in your account, next to the earlier months.`
  }</p>
${box}
<p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${de ? "Bericht öffnen →" : "Open the report →"}</a></p>
<p style="font-size:13px;color:#555">${de ? "Fragen dazu? Antworten Sie einfach auf diese E-Mail." : "Questions about it? Just reply to this email."}</p>
<p>— Kiryl<br><span style="color:#888">ItGrows</span></p>
<p style="font-size:12px;color:#999;margin-top:24px">${
    de
      ? `Sie erhalten diese E-Mail einmal im Monat, weil ItGrows für ${esc(domain)} arbeitet. <a href="${unsub}" style="color:#999">Abmelden</a>`
      : `You get this once a month because ItGrows works on ${esc(domain)}. <a href="${unsub}" style="color:#999">Unsubscribe</a>`
  }</p>
</div>`
  return { subject, html }
}

export async function POST(req: NextRequest) {
  if (!vmAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as { domain?: string; month?: string }
  const domain = String(body.domain ?? "")
  const month = String(body.month ?? "")
  if (!domain || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "bad_request" }, { status: 400 })

  const [site] = rows(
    await db.execute(sql`
      SELECT s.id, w.data FROM geo_work_results w JOIN geo_sites s ON s.id = w.site_id
      WHERE s.domain = ${domain} AND w.month = ${month}`)
  )
  if (!site) return NextResponse.json({ ok: false, reason: "no_results", sent: 0 })

  const people = rows(
    await db.execute(sql`
      SELECT u.id, u.email, f.id AS follow_id
      FROM geo_follows f JOIN users u ON u.id::text = f.user_id
      WHERE f.site_id = ${site.id as string} AND f.email_monthly
        AND (f.plan = 'paid' OR ${clientOwnsSql(sql.raw("u.id"), sql`${domain}`)})
        AND NOT EXISTS (SELECT 1 FROM analytics_events e
                        WHERE e.event = 'geo_monthly_email' AND e.user_id = u.id
                          AND e.props->>'domain' = ${domain} AND e.props->>'month' = ${month})`)
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0
  for (const p of people) {
    const unsub = unsubscribeUrl(String(p.follow_id), true)
    const { subject, html } = monthlyEmail(domain, site.data as Results, unsub)
    try {
      // Resend answers an error instead of throwing it.
      const { error } = await resend.emails.send({
        from: "ItGrows.ai <noreply@itgrows.ai>",
        to: String(p.email),
        replyTo: OWNER,
        subject,
        html,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      })
      if (error) throw new Error(error.message)
      await db.execute(sql`
        INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${p.id as string}, 'geo_monthly_email', '/business/dashboard/visibility',
                ${JSON.stringify({ domain, month })}::jsonb)`)
      sent++
    } catch (err) {
      console.error("[geo-monthly] send failed:", err)
      failed++
    }
  }
  // Not 200 when someone is still owed the email: the VM says so to Kiryl, and a second call sends only to them.
  if (failed) return NextResponse.json({ ok: false, sent, failed }, { status: 502 })
  return NextResponse.json({ ok: true, sent })
}
