import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: one-off founder outreach batch (owner-approved 2026-07-14). Remove after send.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

const wrap = (body: string) => `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1f2937; font-size: 16px; line-height: 1.65;">
${body}
  <p>&mdash; Kiryl<br/><span style="color:#6b7280; font-size:14px;">Founder, ItGrows.ai</span></p>
</div>`

const btn = (label: string) =>
  `<p style="margin: 26px 0;"><a href="https://www.itgrows.ai/cabinet" style="background: #7c3aed; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600;">${label} &rarr;</a></p>`

const EMAILS: { to: string; subject: string; html: string; tag: string }[] = [
  {
    to: "miller64greg@gmail.com",
    tag: "gregory_hot",
    subject: "3 of your 13 posts already missed their slot",
    html: wrap(`
  <p>Hi Gregory,</p>
  <p>I'm the founder of ItGrows. You did the hard part days ago &mdash; LinkedIn connected, profile brief set, and a full content plan generated in your voice.</p>
  <p>Honest status: <strong>10 posts are still queued</strong>, and <strong>3 have already passed their scheduled slot unpublished</strong>. Each day another one goes by.</p>
  <p>For a healthcare executive, consistent LinkedIn presence isn't vanity &mdash; it's how referrals, board invitations and speaking slots find you instead of the other way around. One post a day is what ghostwriters charge $2,500/month for; this is $49.</p>
  <p>And nothing publishes without you &mdash; <strong>you review and approve every post</strong>, or edit it, or kill it.</p>
  <p>The 14-day trial is free: you won't be charged today, cancel in one click any time before it ends. Your queue starts publishing the moment you turn it on.</p>
  ${btn("Turn on autopilot")}
  <p>If something held you back &mdash; reply to this email, I read every answer myself.</p>`),
  },
  {
    to: "abdulraheemkhurram8088@gmail.com",
    tag: "abdul_oauth",
    subject: "The LinkedIn permission screen — here's exactly what it does",
    html: wrap(`
  <p>Hi Abdul,</p>
  <p>I'm the founder of ItGrows. I noticed you clicked &ldquo;Connect LinkedIn&rdquo; and stopped at the permission screen &mdash; totally fair, so here's exactly what it does and doesn't do:</p>
  <p>&bull; It uses <strong>LinkedIn's official API</strong> (we're an approved integration &mdash; no scraping, no risk to your account).<br/>
  &bull; We <strong>never see your password</strong> &mdash; LinkedIn only hands us a revocable permission.<br/>
  &bull; <strong>Nothing is ever posted without your explicit approval</strong> &mdash; you see every post first.<br/>
  &bull; You can disconnect in one click, any time.</p>
  <p>Connecting takes about 20 seconds, and your first posts are generated free &mdash; no card at this step.</p>
  ${btn("Finish connecting")}
  <p>Any doubt at all &mdash; just reply, I answer personally.</p>`),
  },
  {
    to: "devesh.kr.sri@gmail.com",
    tag: "devesh_claim",
    subject: "The posts you generated are saved — one step to claim them",
    html: wrap(`
  <p>Hi Devesh,</p>
  <p>I'm the founder of ItGrows. When you tried the generator, we saved your brief and writing style &mdash; they're still in your account.</p>
  <p>One step left: <strong>connect LinkedIn (about 20 seconds)</strong> and you'll get a full content plan generated in your voice &mdash; <strong>free, no card at this step</strong>. You review everything before anything would ever publish.</p>
  ${btn("Claim my posts")}
  <p>If something didn't work or didn't make sense &mdash; reply and tell me, I read every answer.</p>`),
  },
  {
    to: "ceo@magiscan.app",
    tag: "magiscan_f2f",
    subject: "founder to founder — what stopped you?",
    html: wrap(`
  <p>Hey,</p>
  <p>Kiryl here &mdash; founder of ItGrows (and a solo founder like you; I saw magiscan, nice product). You signed up a few days ago and didn't come back, and at our size every early user's honest opinion is worth more than a hundred visitors.</p>
  <p>So, bluntly: <strong>what stopped you?</strong> Confusing? Not useful? Wrong moment? One line by reply is enough.</p>
  <p>And if you want to give it a real shot &mdash; I'll personally set up your profile and first content plan for magiscan. Free, no card, just reply &ldquo;set it up&rdquo;.</p>`),
  },
  {
    to: "kerrymm411@gmail.com",
    tag: "kerry_question",
    subject: "One honest question",
    html: wrap(`
  <p>Hi Kerry,</p>
  <p>I'm the founder of ItGrows. You created an account a few days ago and didn't come back &mdash; no hard feelings, but I'd genuinely like to know: <strong>what stopped you?</strong> One line by reply is enough; I read every answer myself.</p>
  <p>P.S. If you just ran out of time &mdash; the AI can generate your first LinkedIn posts in about 60 seconds, free, no card:</p>
  ${btn("Generate my posts")}`),
  },
  {
    to: "aicha00980@gmail.com",
    tag: "aicha_question",
    subject: "One honest question",
    html: wrap(`
  <p>Hi Aicha,</p>
  <p>I'm the founder of ItGrows. You created an account a few days ago and didn't come back &mdash; no hard feelings, but I'd genuinely like to know: <strong>what stopped you?</strong> One line by reply is enough; I read every answer myself.</p>
  <p>P.S. If you just ran out of time &mdash; the AI can generate your first LinkedIn posts in about 60 seconds, free, no card:</p>
  ${btn("Generate my posts")}`),
  },
  {
    to: "somsyd@outlook.com",
    tag: "som_winback",
    subject: "Your trial is active until Jul 24 — and one question",
    html: wrap(`
  <p>Hi Som,</p>
  <p>Kiryl here, founder of ItGrows. I saw you started a trial and cancelled the same day &mdash; the cancellation stands, <strong>you won't be charged anything</strong>, no action needed.</p>
  <p>I just want to learn from it: <strong>what put you off?</strong> Setup? Content quality? Price? One line by reply would honestly help me more than you'd think.</p>
  <p>And if anything made you curious again &mdash; your trial is technically active until <strong>July 24</strong>; reply and I'll personally get everything set up for you in minutes.</p>`),
  },
]

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const results: Record<string, string> = {}
  for (const e of EMAILS) {
    const { data, error } = await resend.emails.send({
      from: "Kiryl Sidarchuk <kiryl@itgrows.ai>",
      replyTo: "kiryl@itgrows.ai",
      to: e.to,
      subject: e.subject,
      html: e.html,
    })
    results[e.to] = error ? `ERROR: ${error.message}` : `sent ${data?.id}`
    if (!error) {
      try {
        await db.execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
          SELECT id, 'founder_email_sent', '/email', ${JSON.stringify({ tag: e.tag })}::jsonb FROM users WHERE lower(email) = ${e.to}`)
      } catch { /* logging must not block sends */ }
    }
    await new Promise((r) => setTimeout(r, 600)) // Resend rate-limit safety
  }
  return NextResponse.json({ results })
}
