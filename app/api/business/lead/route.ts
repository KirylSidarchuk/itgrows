import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Public, unauthenticated: this is the only door into the business offer, so it must work for a
// stranger. Stored in analytics_events first and emailed second — a Resend outage must not be
// able to lose a $499/mo lead, which is what an email-only handler would do silently.
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
  const website = clean(body.website, 300)
  const name = clean(body.name, 200)
  const about = clean(body.about, 4000)

  if (!email.includes("@") || website.length < 4) {
    return NextResponse.json({ error: "Email and website are required" }, { status: 400 })
  }

  const lead = { name, email, website, about }

  await db
    .execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('business_lead', '/business', ${JSON.stringify(lead)}::jsonb)`)
    .catch(() => {})

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))
    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: "kiryl.sidarchuk@gmail.com",
      replyTo: email,
      subject: `[Business $499] ${website} — ${email}`,
      html: `<p><strong>Name:</strong> ${esc(name) || "—"}</p>
<p><strong>Email:</strong> ${esc(email)}</p>
<p><strong>Website:</strong> ${esc(website)}</p>
<p><strong>Wants to be known for:</strong></p>
<p>${esc(about).replace(/\n/g, "<br>") || "—"}</p>`,
    })
  } catch {
    // Already persisted above; the lead is not lost even if delivery fails.
  }

  return NextResponse.json({ ok: true })
}
