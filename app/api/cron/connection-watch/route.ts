import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { notifyOwner } from "@/lib/telegram"

// Runs three hours before the publish crons. A LinkedIn token can be revoked at any time -- when a
// customer re-authorises the same app from a second account, LinkedIn silently kills the first grant
// -- and nothing in our own tables changes, so the break stays invisible until the customer notices
// they have gone quiet. That is exactly how a paying customer sat unpublished for ten days. Ask
// LinkedIn directly whether each token still works, and only speak up when something is wrong.
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Only accounts that are actually meant to publish: a paying/trialing owner with a queue.
    const accounts = rows(await db.execute(sql`
      SELECT la.id, la.access_token, la.page_type, la.page_name, u.email, u.name,
             (SELECT count(*)::int FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'scheduled') AS queued,
             (SELECT to_char(min(lp.scheduled_for), 'MM-DD HH24:MI') FROM linkedin_posts lp
                WHERE lp.linkedin_account_id = la.id AND lp.status = 'scheduled') AS next_post
      FROM linkedin_accounts la
      JOIN users u ON u.id::text = la.user_id
      WHERE u.subscription_status IN ('active', 'trialing')`))

    const withQueue = accounts.filter((a) => (a.queued as number) > 0)
    const broken: string[] = []

    await Promise.all(withQueue.map(async (a) => {
      // Personal and company connections come from two LinkedIn apps with different scopes, so each
      // token has to be probed against an API its own app is allowed to call.
      const url = a.page_type === "organization"
        ? "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=1"
        : "https://api.linkedin.com/v2/userinfo"
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${a.access_token as string}` } })
        if (res.status === 401) {
          broken.push(`• ${a.name ?? a.email} (${a.email}) — ${a.page_name ?? a.page_type}: token revoked. ${a.queued} posts queued, next ${a.next_post} UTC.`)
        } else if (!res.ok) {
          broken.push(`• ${a.name ?? a.email} (${a.email}) — ${a.page_name ?? a.page_type}: LinkedIn returned ${res.status}. ${a.queued} posts queued, next ${a.next_post} UTC.`)
        }
      } catch {
        // A network blip is not evidence of a broken connection; stay quiet rather than cry wolf.
      }
    }))

    if (broken.length > 0) {
      notifyOwner(
        `⚠️ LinkedIn connection broken — nothing will publish at 10:00 UTC\n\n${broken.join("\n")}\n\nThey need to reconnect from the cabinet; we cannot fix it from our side.`
      )
    }

    return NextResponse.json({ checked: withQueue.length, broken: broken.length, details: broken })
  } catch (e) {
    const err = e as Error
    notifyOwner(`⚠️ connection-watch cron failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
