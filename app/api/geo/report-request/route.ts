import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { clientIp, geoCheck, type PublicRun } from "@/lib/geo-check"
import { normaliseDomain } from "@/lib/geo-business"
import { drawPriceVariant } from "@/lib/geo-pricing"
import { sendOwner } from "@/lib/telegram"
import { visitSource } from "@/lib/visit-source"

// The email on the result of the quick check (02.11): the visitor gives an address, an account is opened
// for it (users.source = 'site_email', no password: /login signs it in by a code sent to that address) and
// the day-0 report is queued for the site; /api/geo/notify emails it when it is ready, or at once when a
// report for the site already exists.
//
// The address is not confirmed first, because the point is one step. So what a stranger could do with it is
// held down: only a site with an instant check in the last two days; MAX_TRIES_PER_IP tries a day from one
// connection and MAX_EMAILS_PER_SITE new addresses a day for one site, so this cannot mail a list; the same
// one-report-per-connection rule as /api/geo/follow (the VM refuses a second site, "report_ip_used"), and
// the VM's own limit on free reports a day. An email that already has an account gets nothing and is sent to
// sign in, so nobody can attach a site to someone else's account.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_TRIES_PER_IP = 3
const MAX_EMAILS_PER_SITE = 5

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/

export async function POST(req: NextRequest) {
  let email = ""
  let site = ""
  let hp = ""
  try {
    const b = (await req.json()) as { email?: unknown; site?: unknown; hp?: unknown }
    email = String(b.email ?? "").trim().toLowerCase()
    site = String(b.site ?? "").trim()
    hp = String(b.hp ?? "")
  } catch {}
  if (hp) return NextResponse.json({ error: "unavailable" }, { status: 400 })
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ error: "invalid_email" }, { status: 400 })
  const domain = normaliseDomain(site)
  if (!domain) return NextResponse.json({ error: "invalid_url" }, { status: 400 })
  // A report for a request with no address would be the costly kind our own accounts get (service.py baseline).
  const ip = clientIp(req.headers)
  if (!ip) return NextResponse.json({ error: "unavailable" }, { status: 400 })
  const ipKey = createHash("sha256").update(`report-request|${process.env.IMAGE_STORE_TOKEN ?? ""}|${ip}`).digest("hex").slice(0, 32)

  const [seen] = rows(
    await db.execute(sql`
      SELECT
        EXISTS (SELECT 1 FROM geo_runs r JOIN geo_sites s ON s.id = r.site_id
                WHERE s.domain = ${domain} AND r.kind = 'teaser' AND r.status = 'done' AND r.created_at > now() - interval '2 days') AS checked,
        (SELECT count(*)::int FROM analytics_events WHERE event = 'geo_email_try' AND created_at > now() - interval '1 day' AND props->>'ip' = ${ipKey}) AS tries,
        (SELECT count(*)::int FROM analytics_events WHERE event = 'signup' AND created_at > now() - interval '1 day'
           AND props->>'via' = 'email_report' AND props->>'domain' = ${domain}) AS emails`)
  )
  if (!seen?.checked) return NextResponse.json({ error: "not_checked" }, { status: 400 })
  if (Number(seen.tries) >= MAX_TRIES_PER_IP || Number(seen.emails) >= MAX_EMAILS_PER_SITE) {
    return NextResponse.json({ error: "report_ip_used" }, { status: 429 })
  }
  await db
    .execute(sql`INSERT INTO analytics_events (event, path, props) VALUES ('geo_email_try', '/business', ${JSON.stringify({ ip: ipKey, domain })}::jsonb)`)
    .catch(() => {})

  const [made] = await db
    .insert(users)
    .values({ email, name: email.split("@")[0], plan: "starter", source: "site_email", geoPriceVariant: drawPriceVariant() })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })
  if (!made) return NextResponse.json({ error: "exists" }, { status: 409 })
  const undo = () => db.delete(users).where(eq(users.id, made.id)).catch(() => {})

  let r
  try {
    r = await geoCheck<PublicRun>("/baseline", { domain, user_id: made.id, ip }, 55_000)
  } catch {
    // The answer was lost; the VM may still have done it. A follow on the account means it did.
    const [followed] = rows(await db.execute(sql`SELECT 1 AS ok FROM geo_follows WHERE user_id = ${made.id} LIMIT 1`).catch(() => []))
    if (!followed) {
      await undo()
      return NextResponse.json({ error: "unavailable" }, { status: 502 })
    }
    void sendOwner(`🟣 Отчёт по почте: ${email} → ${domain} (сервис не ответил вовремя, отчёт поставлен)\n📍 ${await visitSource(req.headers)}`)
    return NextResponse.json({ status: "queued", id: made.id, domain })
  }
  if (r.status !== 200 && r.status !== 202) {
    await undo()
    return NextResponse.json({ error: r.data.error ?? "unavailable" }, { status: r.status >= 400 ? r.status : 502 })
  }

  const gclid = req.cookies.get("itg_gclid")?.value ?? null
  await db
    .execute(
      sql`INSERT INTO analytics_events (user_id, event, path, props)
          VALUES (${made.id}, 'signup', '/business', ${JSON.stringify({ via: "email_report", gclid, domain: r.data.domain })}::jsonb),
                 (${made.id}, 'geo_follow', '/business', ${JSON.stringify({ domain: r.data.domain, run: r.data.run_id, status: r.data.status })}::jsonb)`
    )
    .catch(() => {})
  void sendOwner(`🟣 Отчёт по почте: ${email} → ${r.data.domain}\n📍 ${await visitSource(req.headers)}`)

  // A report for this site from the last week is reused. Its email went out before this follow, so this
  // account's goes now; if that fails, Kiryl is told and the visitor can still sign in and see it.
  if (r.data.status === "done" && r.data.run_id) {
    try {
      const sent = await fetch(`${req.nextUrl.origin}/api/geo/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.IMAGE_STORE_TOKEN ?? ""}` },
        body: JSON.stringify({ run_id: r.data.run_id, user_id: made.id }),
      })
      if (!sent.ok) throw new Error(`notify ${sent.status}`)
    } catch {
      void sendOwner(`⚠️ Отчёт по почте: ${email} ждёт письмо по готовому отчёту ${r.data.domain}, оно не ушло. Напиши сам.`)
    }
  }
  return NextResponse.json({ status: "queued", id: made.id, domain: r.data.domain })
}
