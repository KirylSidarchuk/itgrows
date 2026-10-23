import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { vmAuthorized } from "@/lib/geo-check"
import { sendOwner } from "@/lib/telegram"
import { domainOf, rows } from "../_shared"
import { CLAIM_MINUTES, REMIND_AFTER_DAYS, ensureMailTable, sendFirstLaunchMail, sendLaunchReminder } from "../_mail"

// "What we need from you to start" (../_mail.ts).
//   Daily cron (vercel.json, CRON_SECRET): every first email that has not gone out (the payment still
//   pending, the VM slow, a run that died: its claim has run out) is tried again, for 30 days;
//   reminders go 3 and 7 days after a first email that really went out, while a "you" item is still
//   open, two at most. And Kiryl gets in Telegram the items a client marked Done that are still
//   waiting for us ("check", no check can confirm them: access, Search Console) after a day.
//   The VM (its API token; /root/geo_check/activate_client.py, a client activated by invoice):
//   POST {email, domain} sends the first email for that site and client, once.

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}

async function run(req: NextRequest) {
  const header = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && header === `Bearer ${cronSecret}`) return daily()
  if (!vmAuthorized(header)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { email, domain: site } = (await req.json().catch(() => ({}))) as { email?: string; domain?: string }
  const domain = domainOf(String(site ?? ""))
  if (!email || !domain) return NextResponse.json({ error: "email_and_domain_required" }, { status: 400 })
  const [u] = rows(await db.execute(sql`SELECT id::text AS id FROM users WHERE lower(email) = lower(${email}) LIMIT 1`))
  if (!u?.id) return NextResponse.json({ error: "no_user" }, { status: 404 })
  const result = await sendFirstLaunchMail(String(u.id), domain)
  return NextResponse.json({ domain, result })
}

async function daily() {
  await ensureMailTable()
  const out: string[] = []
  const pending = rows(
    await db.execute(sql`
      SELECT domain, user_id FROM geo_launch_mail
      WHERE first_sent_at IS NULL AND created_at > now() - interval '30 days'
        AND (claimed_at IS NULL OR claimed_at < now() - make_interval(mins => ${CLAIM_MINUTES}::int))`)
  )
  for (const r of pending) {
    const result = await sendFirstLaunchMail(String(r.user_id), String(r.domain)).catch((e) => `failed: ${e instanceof Error ? e.message : e}`)
    out.push(`${r.domain} first: ${result}`)
  }
  const due = rows(
    await db.execute(sql`
      SELECT domain, user_id, reminders FROM geo_launch_mail
      WHERE first_sent_at IS NOT NULL AND reminders < ${REMIND_AFTER_DAYS.length}::int
        AND first_sent_at > now() - interval '30 days'
        AND first_sent_at <= now() - make_interval(days => (CASE reminders WHEN 0 THEN ${REMIND_AFTER_DAYS[0]}::int ELSE ${REMIND_AFTER_DAYS[1]}::int END))
        AND (claimed_at IS NULL OR claimed_at < now() - make_interval(mins => ${CLAIM_MINUTES}::int))`)
  )
  for (const r of due) {
    const n = Number(r.reminders) + 1
    const result = await sendLaunchReminder(String(r.user_id), String(r.domain), n).catch((e) => `failed: ${e instanceof Error ? e.message : e}`)
    out.push(`${r.domain} reminder ${n}: ${result}`)
  }
  const waiting = await checksWaiting().catch((e) => {
    console.error("[geo/launch/remind] checks", e instanceof Error ? e.message : e)
    return -1
  })
  return NextResponse.json({ checked: pending.length + due.length, results: out, checksWaiting: waiting })
}

/** "check" items (the client said Done) on sites on the plan, waiting for us for over a day: one
 *  message to Kiryl with each and how to close it. */
async function checksWaiting(): Promise<number> {
  const list = rows(
    await db.execute(sql`
      SELECT s.domain, g.key, coalesce(g.ask->'en'->>'title', g.key) AS title, g.updated_at
      FROM geo_launch g JOIN geo_sites s ON s.id = g.site_id
      WHERE g.status = 'check' AND g.updated_at < now() - interval '24 hours'
        AND (EXISTS (SELECT 1 FROM geo_follows f WHERE f.site_id = s.id AND f.plan = 'paid')
             OR EXISTS (SELECT 1 FROM geo_client_sites c WHERE c.domain = s.domain))
      ORDER BY g.updated_at`)
  )
  if (!list.length) return 0
  const day = (v: unknown) => new Date(String(v)).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
  await sendOwner(
    `🔎 Клиент нажал «Готово», ждёт нашей проверки больше суток (${list.length}):\n` +
      list.map((r) => `• ${r.domain}: ${r.title} — с ${day(r.updated_at)}\n  launch.py set ${r.domain} ${r.key} fixed`).join("\n"),
  )
  return list.length
}
