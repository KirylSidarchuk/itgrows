import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { notifyOwner } from "@/lib/geo-business"

// "Write to us" from the GEO cabinet. Stored in analytics_events first (event 'geo_contact'), then
// emailed with the user's address as reply-to and pinged to Telegram. The page is told the truth:
// if the email does not go out, it gets an error, not a thank-you. 5 messages per user per 24 hours.

export const dynamic = "force-dynamic"

const DAILY_LIMIT = 5
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
// Postgres jsonb rejects \u0000 and unpaired surrogates (a 5000-char cut can split an emoji). Such a
// message used to fail the insert silently, skip the rate limit and still go out; clean it first.
const clean = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, (m) => (m.length === 2 ? m : "\uFFFD"))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  const message = clean(String(body.message ?? "").slice(0, 5000)).trim()
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 })

  // The address always comes from the account, never from the request.
  let email = session.user?.email ?? ""
  if (!email) {
    const u = rows(await db.execute(sql`SELECT email FROM users WHERE id = ${userId}::uuid`))[0]
    email = String(u?.email ?? "")
  }
  if (!email) return NextResponse.json({ error: "no_email" }, { status: 400 })

  // A site is only accepted if this user follows it; anything else is dropped, not echoed.
  const wanted = String(body.site ?? "").trim().toLowerCase().slice(0, 300)
  let site = ""
  if (wanted) {
    const hit = rows(
      await db.execute(sql`
        SELECT s.domain FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
        WHERE f.user_id = ${userId} AND lower(s.domain) = ${wanted} LIMIT 1`)
    )[0]
    site = hit ? String(hit.domain) : ""
  }

  // Count and store under a per-user lock, so parallel requests cannot all pass the limit. No stored
  // row means nothing is sent: the limit is counted from these rows.
  let stored: { limited: boolean; eventId: string | null }
  try {
    stored = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`geo_contact:${userId}`}))`)
      const sent = rows(
        await tx.execute(sql`
          SELECT count(*)::int AS n FROM analytics_events
          WHERE user_id = ${userId}::uuid AND event = 'geo_contact' AND created_at > now() - interval '24 hours'`)
      )[0]
      if (Number(sent?.n ?? 0) >= DAILY_LIMIT) return { limited: true, eventId: null }
      const row = rows(
        await tx.execute(sql`
          INSERT INTO analytics_events (user_id, event, path, props)
          VALUES (${userId}::uuid, 'geo_contact', '/business/dashboard/support',
                  ${JSON.stringify({ email, site: site || null, message })}::jsonb)
          RETURNING id`)
      )[0]
      return { limited: false, eventId: row?.id ? String(row.id) : null }
    })
  } catch (err) {
    console.error("[business/contact] store failed:", err)
    return NextResponse.json({ error: "store_failed" }, { status: 500 })
  }
  if (stored.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  const eventId = stored.eventId
  if (!eventId) return NextResponse.json({ error: "store_failed" }, { status: 500 })

  let emailed = false
  let emailError = ""
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to: "kiryl.sidarchuk@gmail.com",
      replyTo: email,
      subject: `GEO cabinet: message from ${email}`,
      html: `<p><strong>From:</strong> ${esc(email)}</p>
<p><strong>Site:</strong> ${site ? esc(site) : "—"}</p>
<p><strong>User id:</strong> ${esc(userId)}</p>
<hr>
<p>${esc(message).replace(/\n/g, "<br>")}</p>`,
      text: `From: ${email}\nSite: ${site || "-"}\nUser id: ${userId}\n\n${message}`,
    })
    if (error) emailError = `${error.name}: ${error.message}`
    else emailed = true
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
  }
  if (!emailed) console.error("[business/contact] email failed:", emailError)

  // Telegram text is capped at 4096 characters; the full message is in the email and the event.
  const tgBody = message.length > 3500 ? `${message.slice(0, 3500)}…` : message
  // notifyOwner has no timeout; a hanging Telegram call must not hold the reply after the email went out.
  await Promise.race([
    notifyOwner(
      `GEO cabinet message${emailed ? "" : " (EMAIL FAILED)"}\nFrom: ${email}${site ? `\nSite: ${site}` : ""}\n\n${tgBody}`
    ),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])

  await db
    .execute(sql`
      UPDATE analytics_events
      SET props = props || ${JSON.stringify({ emailed, emailError: emailError || null })}::jsonb
      WHERE id = ${eventId}::uuid`)
    .catch(() => {})

  if (!emailed) return NextResponse.json({ error: "send_failed" }, { status: 502 })
  return NextResponse.json({ ok: true })
}
