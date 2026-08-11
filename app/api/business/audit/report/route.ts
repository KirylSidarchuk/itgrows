import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// A softer ask than "request access": the visitor already has their result on screen and is
// asking for it in writing. Stored first, emailed second — a Resend outage must not lose the
// only contact detail we captured.
export const dynamic = "force-dynamic"

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const email = clean(body.email, 200)
  const site = clean(body.site, 300)
  if (!email.includes("@") || !site) {
    return NextResponse.json({ error: "Email and site are required" }, { status: 400 })
  }

  // Keep the audit alongside the address: whoever writes the report should not have to re-run it,
  // and it is the record of what the visitor was actually shown.
  const audit = body.audit && typeof body.audit === "object" ? body.audit : {}

  await db
    .execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('audit_report_request', '/business', ${JSON.stringify({ email, site, audit })}::jsonb)`)
    .catch(() => {})

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))
    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: "kiryl.sidarchuk@gmail.com",
      replyTo: email,
      subject: `[Audit report] ${site} — ${email}`,
      html: `<p><strong>${esc(email)}</strong> asked for the full report on <strong>${esc(site)}</strong>.</p>
<p>What they were shown:</p>
<pre style="background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px;overflow:auto">${esc(
        JSON.stringify(audit, null, 2)
      )}</pre>`,
    })
  } catch {
    // Already persisted above.
  }

  return NextResponse.json({ ok: true })
}
