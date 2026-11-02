import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { clientIp, geoCheck, type PublicRun } from "@/lib/geo-check"
import { normaliseDomain } from "@/lib/geo-business"
import { drawPriceVariant } from "@/lib/geo-pricing"
import { sendOwner } from "@/lib/telegram"
import { visitSource } from "@/lib/visit-source"

// The email on the result of the quick check (02.11): the visitor gives an address, a free account is
// opened for it (users.source = 'site_email', no password: /login signs it in by a code sent to that
// address) and the day-0 report is queued for the site; /api/geo/notify emails it when it is ready.
// The same one-per-connection limit as /api/geo/follow: the address goes to the VM, which refuses a
// second site from it ("report_ip_used"). An email that already has an account gets nothing here and is
// sent to sign in, so nobody can attach a site to someone else's account. Only a site with an instant
// check in the last two days is taken: nothing else on the site asks for a report by a bare address.

export const dynamic = "force-dynamic"
export const maxDuration = 60

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

  const [checked] = rows(
    await db.execute(sql`
      SELECT 1 AS ok FROM geo_runs r JOIN geo_sites s ON s.id = r.site_id
      WHERE s.domain = ${domain} AND r.kind = 'teaser' AND r.status = 'done' AND r.created_at > now() - interval '2 days'
      LIMIT 1`)
  )
  if (!checked) return NextResponse.json({ error: "not_checked" }, { status: 400 })

  const [made] = await db
    .insert(users)
    .values({ email, name: email.split("@")[0], plan: "starter", source: "site_email", geoPriceVariant: drawPriceVariant() })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })
  if (!made) return NextResponse.json({ error: "exists" }, { status: 409 })
  const undo = () => db.delete(users).where(eq(users.id, made.id)).catch(() => {})

  const ip = clientIp(req.headers)
  let r
  try {
    r = await geoCheck<PublicRun>("/baseline", { domain, user_id: made.id, ...(ip ? { ip } : {}) }, 55_000)
  } catch {
    await undo()
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
  if (r.status !== 200 && r.status !== 202) {
    await undo()
    if (r.data.error === "report_ip_used") void sendOwner(`🔁 Отчёт по почте: ${email} — с этого адреса бесплатный отчёт уже был (${domain}), показали «напишите нам»`)
    return NextResponse.json({ error: r.data.error ?? "unavailable" }, { status: r.status >= 400 ? r.status : 502 })
  }

  await db
    .execute(
      sql`INSERT INTO analytics_events (user_id, event, path, props)
          VALUES (${made.id}, 'signup', '/business', ${JSON.stringify({ via: "email_report", gclid: null })}::jsonb),
                 (${made.id}, 'geo_follow', '/business', ${JSON.stringify({ domain: r.data.domain, run: r.data.run_id, status: r.data.status })}::jsonb)`
    )
    .catch(() => {})
  void sendOwner(`🟣 Отчёт по почте: ${email} → ${r.data.domain}\n📍 ${await visitSource(req.headers)}`)
  // A report for this site finished in the last week is reused, and its email has gone: the page says to sign in.
  const ready = r.data.status === "done"
  return NextResponse.json({ status: ready ? "ready" : "queued", id: made.id, domain: r.data.domain })
}
