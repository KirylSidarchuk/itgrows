import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: one-off founder email to Robert (owner-approved 2026-07-14). Remove after send.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const TO = "robert.bayne@mutualofomaha.com"

const HTML = `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1f2937; font-size: 16px; line-height: 1.65;">
  <p>Hi Robert,</p>
  <p>I'm the founder of ItGrows &mdash; I saw you set everything up yesterday: LinkedIn connected, your profile brief filled, and a full content plan generated. That's further than 95% of people get.</p>
  <p>Right now <strong>26 posts are sitting in your queue</strong>, written in your voice for a financial professional's audience. Honest heads-up: they're scheduled to specific time slots, and <strong>the first 2 have already passed theirs unpublished</strong>. Every day you wait, one more slot goes by.</p>
  <p>Two things I suspect you're weighing:</p>
  <p><strong>&ldquo;Is it worth $49/month?&rdquo;</strong> &mdash; One post a day is roughly what a ghostwriter charges $2,500/month for. But the real math for a financial representative is simpler: if consistent LinkedIn presence brings you <strong>one</strong> client conversation a quarter, it's paid for the year.</p>
  <p><strong>&ldquo;What about compliance?&rdquo;</strong> &mdash; Fair concern in your industry. Nothing publishes without you: <strong>you review and approve every post before it goes out</strong> (or edit it, or kill it). Autopilot means the writing and scheduling are automatic &mdash; the judgment stays yours.</p>
  <p>The 14-day trial is free &mdash; you won't be charged today, and you can cancel in one click any time before it ends. Your 26 posts start going out the moment you turn it on.</p>
  <p style="margin: 28px 0;">
    <a href="https://www.itgrows.ai/cabinet" style="background: #7c3aed; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600;">Turn on autopilot &rarr;</a>
  </p>
  <p>If the price is the issue or something else held you back &mdash; just reply to this email. I read every answer myself.</p>
  <p>&mdash; Kiryl<br/><span style="color:#6b7280; font-size:14px;">Founder, ItGrows.ai</span></p>
</div>`

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "Kiryl Sidarchuk <kiryl@itgrows.ai>",
    replyTo: "kiryl@itgrows.ai",
    to: TO,
    subject: "Your 26 LinkedIn posts are scheduled — 2 already missed their slot",
    html: HTML,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try {
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      SELECT id, 'founder_email_sent', '/email', '{"subject":"26 posts, 2 missed"}'::jsonb FROM users WHERE lower(email) = ${TO}`)
  } catch { /* logging must not fail the send report */ }
  return NextResponse.json({ sent: true, id: data?.id })
}
