import { NextRequest, NextResponse, after } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { sendOwner } from "@/lib/telegram"
import { RECHECK_MINUTES, domainOf, lastAutoCheck, owns, readItems, rows, runCheck } from "../_shared"

// "Done" on a "you" item of "Your website": the owner of a paid (or client) site says they did it.
// The item becomes "check" (we verify), Kiryl is told in Telegram, and what a check can confirm
// (the firewall, the DNS record, the menu link, the developer fixes: launch.py RECHECKABLE) is
// checked again straight away; launch.py turns it to fixed when it passes, and back to the client
// ("Needs you", Kiryl told) when a check 30 minutes or more after the Done still fails (a new DNS
// record or a cached homepage can take that long to show). The rest (access, Search Console) we
// confirm by hand (launch.py set); the daily ../remind lists to Kiryl those waiting over a day.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const VERIFIABLE = new Set(["firewall", "dns", "menu_link", "certificates", "redirects", "sitemap"])

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { site, key } = (await req.json().catch(() => ({}))) as { site?: string; key?: string }
  const domain = domainOf(String(site ?? ""))
  if (!domain || !key) return NextResponse.json({ error: "site_and_key_required" }, { status: 400 })
  if (!(await owns(userId, domain))) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const [marked] = rows(
    await db.execute(sql`
      UPDATE geo_launch g SET status = 'check', updated_at = now()
      FROM geo_sites s
      WHERE s.id = g.site_id AND s.domain = ${domain} AND g.key = ${String(key)}
        AND g.who = 'you' AND g.status IN ('you', 'issue', 'handed', 'todo')
      RETURNING coalesce(g.ask->'en'->>'title', g.key) AS title`)
  )
  if (!marked) {
    const [now] = rows(
      await db.execute(sql`
        SELECT g.status FROM geo_launch g JOIN geo_sites s ON s.id = g.site_id
        WHERE s.domain = ${domain} AND g.key = ${String(key)} AND g.who = 'you'`)
    )
    if (!now) return NextResponse.json({ error: "not_found" }, { status: 404 })
    return NextResponse.json({ domain, key, status: String(now.status) })
  }

  const [u] = rows(await db.execute(sql`SELECT email FROM users WHERE id::text = ${userId} LIMIT 1`))
  const verifiable = VERIFIABLE.has(String(key))
  void sendOwner(
    `✅ ${String(u?.email ?? session.user?.email ?? userId)} отметил: ${String(marked.title)} (${domain})` +
      (verifiable ? "" : `\nПроверить вручную: launch.py set ${domain} ${String(key)} fixed`),
  )

  if (verifiable) {
    after(async () => {
      const items = await readItems(domain).catch(() => null)
      if (items && Date.now() - lastAutoCheck(items) < RECHECK_MINUTES * 60_000) return
      await runCheck(domain)
    })
  }
  return NextResponse.json({ domain, key, status: "check" })
}
