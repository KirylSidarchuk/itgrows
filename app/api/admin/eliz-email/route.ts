import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: one-off founder email to Elizabeth (owner-approved 2026-08-01). Remove after send.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const TO = "eamcguire67.em@gmail.com"

const HTML = `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1f2937; font-size: 16px; line-height: 1.65;">
  <p>Hi Elizabeth,</p>
  <p>Kiryl here, founder of ItGrows. First &mdash; thank you. You've been with us since the early days, and having someone leading in enterprise transformation and operational strategy trust ItGrows with their voice genuinely means a lot.</p>
  <p>You recently moved to the <strong>Duo</strong> plan, so I wanted to reach out personally and make sure you're getting the full value of it. I also just went through your account by hand to confirm everything is publishing on schedule &mdash; you're all set.</p>
  <p><strong>What Duo gives you:</strong></p>
  <p>&bull; ItGrows writes and auto-publishes in your voice across <strong>two accounts</strong>, not one &mdash; e.g. your LinkedIn <em>and</em> X together, or your personal profile <em>and</em> a company page &mdash; so you stay consistent on both channels.<br/>
  &bull; You still <strong>approve every post</strong> before it goes out (or edit it, or skip it).<br/>
  &bull; One voice/DNA, tuned to your niche, feeding both channels on schedule.</p>
  <p>Right now your LinkedIn is connected and running &mdash; but your <strong>second Duo slot is still open</strong>. If you tell me where else you want to show up (X? a company page?), I'll help you get it set up so both channels are working for you.</p>
  <p>And a few things I'd genuinely love to hear from you:</p>
  <p>&bull; How's the content landing so far &mdash; does it sound like <em>you</em>?<br/>
  &bull; What's the main outcome you want from showing up (inbound clients, board/advisory visibility, speaking, hiring)?<br/>
  &bull; Anything you'd want more &mdash; or less &mdash; of in the posts?</p>
  <p>If anything isn't working the way you expect, just reply &mdash; I read every message myself and I'll personally sort it out, including connecting your second account for you if you'd like.</p>
  <p>Thank you again for being one of the people we build this for.</p>
  <p>&mdash; Kiryl<br/><span style="color:#6b7280; font-size:14px;">Founder, ItGrows.ai</span></p>
</div>`

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (req.nextUrl.searchParams.get("confirm") !== "yes") return NextResponse.json({ note: "add &confirm=yes to send", to: TO })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "Kiryl Sidarchuk <kiryl@itgrows.ai>",
    replyTo: "kiryl@itgrows.ai",
    to: TO,
    subject: "Thank you — and making the most of your Duo plan",
    html: HTML,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try {
    await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      SELECT id, 'founder_email_sent', '/email', '{"tag":"elizabeth_duo_welcome"}'::jsonb FROM users WHERE lower(email)=${TO}`)
  } catch { /* logging must not block send */ }
  return NextResponse.json({ sent: true, id: data?.id })
}
