import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

// Nudge the hottest segment: users who set everything up (LinkedIn connected, brief filled,
// posts generated & queued) but never started a trial. Fires once per user (dedup via
// usage_events, so no schema change). Runs daily via vercel.json cron.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] =>
  Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? [])

function postsReadyEmail(name: string, count: number): string {
  const style = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;"
  const heading = count > 0 ? `${count} posts are ready to go` : "Your posts are ready to go"
  const queued = count > 0
    ? `<strong>${count} posts in your voice are written and queued</strong>.`
    : `<strong>your posts are written and queued</strong>.`
  return `
    <div style="${style}">
      <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${heading}</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hey ${name},</p>
        <p style="color: #374151;">You've done the hard part — LinkedIn is connected, your brief is set, and ${queued}</p>
        <p style="color: #374151;">They just won't publish yet. Turn on autopilot to start your <strong>14-day free trial</strong> — your queue goes live and posts start going out automatically. Cancel anytime; no charge during the trial.</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; font-size: 15px;">Turn on autopilot →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Go to your cabinet</a></p>
      </div>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const candidates = rows(await db.execute(sql`
      SELECT u.id, u.email, u.name,
             (SELECT count(*)::int FROM linkedin_posts lp
                WHERE lp.user_id = u.id::text AND lp.status IN ('scheduled','draft')) AS post_count
      FROM users u
      WHERE u.email IS NOT NULL
        AND COALESCE(u.subscription_status, 'inactive') NOT IN ('active', 'trialing', 'past_due')
        AND (u.trial_ends_at IS NULL OR u.trial_ends_at < now())
        AND u.created_at > now() - interval '7 days'
        AND u.created_at < now() - interval '2 hours'
        AND NOT EXISTS (SELECT 1 FROM usage_events e WHERE e.user_id = u.id AND e.action = 'posts_ready_nudge')
        AND EXISTS (SELECT 1 FROM linkedin_posts lp WHERE lp.user_id = u.id::text AND lp.status IN ('scheduled', 'draft'))
      ORDER BY u.created_at DESC
      LIMIT 200`))

    let sent = 0
    for (const c of candidates) {
      const email = c.email as string
      const uid = c.id as string
      const count = Number(c.post_count) || 0
      const name = (c.name as string | null) ?? email.split("@")[0] ?? "there"
      await sendEmail({
        to: email,
        subject: count > 0 ? `Your ${count} posts are ready — turn on autopilot` : "Your posts are ready — turn on autopilot",
        html: postsReadyEmail(name, count),
      })
      await db.execute(sql`INSERT INTO usage_events (user_id, action, ref) VALUES (${uid}, 'posts_ready_nudge', ${String(count)})`)
      sent++
    }

    return NextResponse.json({ sent, total: candidates.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[posts-ready-nudge] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
