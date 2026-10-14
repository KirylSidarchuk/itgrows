import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { notifyOwner } from "@/lib/telegram"

// Public: a request to join the closed beta of the Reddit planner. Stored first, announced
// second, the same order as /api/business/lead, so a mail outage cannot lose a request.
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
  const goal = clean(body.goal, 2000)
  if (!email.includes("@") || website.length < 4) {
    return NextResponse.json({ error: "Email and website are required" }, { status: 400 })
  }

  const request = { email, website, goal }
  await db
    .execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('reddit_beta_request', '/reddit', ${JSON.stringify(request)}::jsonb)`)
    .catch(() => {})

  notifyOwner(`Reddit beta request: ${email}\n${website}\nGoal: ${goal || "—"}`)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))
    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: "kiryl.sidarchuk@gmail.com",
      replyTo: email,
      subject: `[Reddit beta] ${website} — ${email}`,
      html: `<p><strong>Email:</strong> ${esc(email)}</p>
<p><strong>Website:</strong> ${esc(website)}</p>
<p><strong>Goal:</strong></p>
<p>${esc(goal).replace(/\n/g, "<br>") || "—"}</p>`,
    })
  } catch {
    // Already stored and announced in Telegram.
  }

  return NextResponse.json({ ok: true })
}
