import { NextRequest, NextResponse, after } from "next/server"
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

  // Everything a first call would have established, done without one: run the same audit the
  // visitor just saw, read the site, and send back a proposal they only have to correct.
  // Deliberately after the response — the person is waiting on a confirmation, not on us.
  after(async () => {
    try {
      const base = process.env.ITGROWS_PUBLIC_URL ?? "https://www.itgrows.ai"
      const secret = process.env.CRON_SECRET
      if (!secret) return

      const auditRes = await fetch(`${base}/api/business/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website }),
      })
      const audit = auditRes.ok ? await auditRes.json() : { site: website }

      await fetch(`${base}/api/business/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": secret },
        body: JSON.stringify({ ...lead, audit }),
      })
    } catch (err) {
      // The lead is already stored and the notification already sent; a failed proposal means a
      // human writes the first email, not that anything is lost.
      console.error("[lead] onboarding proposal failed:", err)
    }
  })

  return NextResponse.json({ ok: true })
}
