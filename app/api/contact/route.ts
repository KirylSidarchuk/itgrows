import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { sendOwner } from "@/lib/telegram"
import { visitSource } from "@/lib/visit-source"

// "Write to us" on the home page (app/business/ContactForm.tsx). Public and unauthenticated, so it
// must work for a stranger. Stored in analytics_events first (event 'site_contact') and emailed
// second: a Resend outage must not lose a message, and a failed insert must not stop the email.
// The visitor gets an error only when neither happened.

export const dynamic = "force-dynamic"

const MAX = { name: 200, company: 200, email: 254, message: 5000 }

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// Postgres jsonb rejects \u0000 and unpaired surrogates; strip control characters and repair those.
const clean = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, (m) => (m.length === 2 ? m : "�"))
    .trim()
// One line: names and addresses go into the subject, where a newline does not belong.
const line = (v: unknown) => clean(v).replace(/\s+/g, " ")
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 })

  // Honeypot: the field is invisible to people. Answer like a success so a bot learns nothing,
  // and store and send nothing.
  if (line(body.hp)) return NextResponse.json({ ok: true })

  const name = line(body.name)
  const company = line(body.company)
  const email = line(body.email)
  const message = clean(body.message)

  if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.length > MAX.email) {
    return NextResponse.json({ error: "email" }, { status: 400 })
  }
  if (message.length < 5 || message.length > MAX.message) {
    return NextResponse.json({ error: "message" }, { status: 400 })
  }
  if (name.length > MAX.name || company.length > MAX.company) {
    return NextResponse.json({ error: "too_long" }, { status: 400 })
  }

  let eventId: string | null = null
  try {
    const row = rows(
      await db.execute(sql`
        INSERT INTO analytics_events (event, path, props)
        VALUES ('site_contact', '/', ${JSON.stringify({ name, company, email, message })}::jsonb)
        RETURNING id`)
    )[0]
    eventId = row?.id ? String(row.id) : null
  } catch (err) {
    console.error("[contact] store failed:", err)
  }

  // A ping for every message that reaches us, as for every other inbound action.
  void sendOwner(`📧 Сообщение с сайта: ${email} — ${company || name || "без имени"}\n📍 ${await visitSource(req.headers)}\n${message.slice(0, 300)}`)

  let emailed = false
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const who = company || name || "no name"
    const { error } = await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: "kiryl.sidarchuk@gmail.com",
      replyTo: email,
      subject: `[Contact] ${who} — ${email}`,
      html: `<p><strong>Name:</strong> ${esc(name) || "—"}</p>
<p><strong>Company:</strong> ${esc(company) || "—"}</p>
<p><strong>Email:</strong> ${esc(email)}</p>
<hr>
<p>${esc(message).replace(/\n/g, "<br>")}</p>`,
      text: `Name: ${name || "-"}\nCompany: ${company || "-"}\nEmail: ${email}\n\n${message}`,
    })
    if (error) console.error("[contact] email failed:", `${error.name}: ${error.message}`)
    else emailed = true
  } catch (err) {
    console.error("[contact] email failed:", err instanceof Error ? err.message : String(err))
  }

  if (eventId) {
    await db
      .execute(sql`UPDATE analytics_events SET props = props || ${JSON.stringify({ emailed })}::jsonb WHERE id = ${eventId}::uuid`)
      .catch(() => {})
  }

  if (!eventId && !emailed) return NextResponse.json({ error: "send_failed" }, { status: 502 })
  return NextResponse.json({ ok: true })
}
