import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: one-off founder email to Daniella (owner-approved 2026-07-17). Remove after send.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const TO = "anamandaniella0@gmail.com"

const HTML = `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1f2937; font-size: 16px; line-height: 1.65;">
  <p>Hi Daniella,</p>
  <p>I'm the founder of ItGrows. I saw you set everything up this morning &mdash; LinkedIn connected, your Professional DNA filled in (software-testing content for hiring managers &mdash; great niche), and <strong>28 posts already written in your voice</strong>. You did every hard step in about three minutes.</p>
  <p>Here's the one thing that isn't obvious, so let me spell it out: <strong>those 28 posts won't publish on their own yet.</strong> To flip them from &ldquo;drafted&rdquo; to actually going out on your schedule, you turn on the 14-day trial &mdash; that's the switch that puts your queue live.</p>
  <p>What happens when you do:</p>
  <p>&bull; Your posts start publishing automatically, at the times that get the most reach.<br/>
  &bull; You still <strong>review and approve each one first</strong> &mdash; nothing goes out without you.<br/>
  &bull; The trial is <strong>free for 14 days</strong>, you're not charged today, and you can cancel in one click any time before it ends.</p>
  <p>For a content creator building a name with hiring managers, showing up daily is the whole game &mdash; and this is what removes the &ldquo;I didn't have time to post&rdquo; problem for good.</p>
  <p style="margin: 28px 0;">
    <a href="https://www.itgrows.ai/cabinet" style="background: #7c3aed; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600;">Turn on autopilot &rarr;</a>
  </p>
  <p>And if something was confusing or didn't work &mdash; just reply to this email and tell me. I read every answer myself, and I'll help you get your first posts out.</p>
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
    subject: "Your 28 posts are written — here's the one step left to publish them",
    html: HTML,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try {
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      SELECT id, 'founder_email_sent', '/email', '{"tag":"daniella_next_step"}'::jsonb FROM users WHERE lower(email) = ${TO}`)
  } catch { /* logging must not block send */ }
  return NextResponse.json({ sent: true, id: data?.id })
}
