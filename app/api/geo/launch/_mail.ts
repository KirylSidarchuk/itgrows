import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { launchNeedsEmail, launchNeedsSubject } from "@/lib/email-templates"
import { sendOwner } from "@/lib/telegram"
import { domainOf, openYou, owns, readItems, rows } from "./_shared"

// The email "What we need from you to start": the client's "you" items with their clicks, a link to
// "Your website", "Reply when it's done". In the site's language (German for a German site or a .de
// domain, else English). Sent once per site and buyer, when the site becomes paid (the Stripe webhook)
// or is activated by invoice (/root/geo_check/activate_client.py through ./remind), then reminded
// after 3 and 7 days while a "you" item is still open (the daily ./remind). geo_launch_mail keeps
// what went out; launch.py creates the table the same way.
//
// Never lost, never twice: an email on its way holds the row (claimed_at) for CLAIM_MINUTES; the
// first email counts as sent (first_sent_at) only once Resend has accepted it, and a reminder only
// once one went out, so a run that dies or fails leaves the row for the daily ./remind to try again,
// and no "Reminder" goes to someone who never had the first email. No check of the site is run on
// the way (the webhook cannot wait for one): the items are the stored ones, and a site never checked
// gets the list every site gets (launch.py, generic).

const OWNER = "kiryl.sidarchuk@gmail.com"
const SETTINGS_URL = "https://www.itgrows.ai/business/dashboard/settings"
/** Days after the first email for reminder 1 and 2. */
export const REMIND_AFTER_DAYS = [3, 7]
/** How long an email on its way holds the row; a run that died is tried again after it. */
export const CLAIM_MINUTES = 10

let tableReady: Promise<unknown> | null = null
export function ensureMailTable() {
  tableReady ??= (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS geo_launch_mail (
        domain text NOT NULL,
        user_id text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        first_sent_at timestamptz,
        reminders integer NOT NULL DEFAULT 0,
        last_sent_at timestamptz,
        claimed_at timestamptz,
        PRIMARY KEY (domain, user_id))`)
    // Added only when missing: ALTER TABLE locks the table even when it has nothing to do.
    const have = rows(
      await db.execute(sql`SELECT 1 FROM information_schema.columns
        WHERE table_name = 'geo_launch_mail' AND column_name = 'claimed_at'`),
    )
    if (!have.length) await db.execute(sql`ALTER TABLE geo_launch_mail ADD COLUMN IF NOT EXISTS claimed_at timestamptz`)
  })().catch((e) => {
    tableReady = null
    throw e
  })
  return tableReady
}

async function recipient(userId: string, domain: string) {
  const [u] = rows(
    await db.execute(sql`
      SELECT u.email, u.name,
             (SELECT s.profile->>'language' FROM geo_sites s WHERE s.domain = ${domain} LIMIT 1) AS site_language,
             (SELECT c.site_profile->>'language' FROM connected_sites c
              WHERE c.user_id = u.id
                AND split_part(regexp_replace(lower(c.url), '^https?://(www[.])?', ''), '/', 1) = ${domain}
                AND coalesce(c.site_profile->>'language', '') <> ''
              LIMIT 1) AS profile_language
      FROM users u WHERE u.id::text = ${userId} LIMIT 1`)
  )
  if (!u?.email) return null
  const language = [u.profile_language, u.site_language].map((l) => String(l ?? "").toLowerCase())
  const de = language.some((l) => l.startsWith("de")) || domain.endsWith(".de")
  return { email: String(u.email), name: u.name ? String(u.name) : null, language: de ? "de" : "en" }
}

/** Sends the email (first or reminder n) if anything is open; returns what happened. The caller has
 *  claimed the row, so two runs never send the same email twice. The stored items only: never a
 *  check of the site (most of a minute) on the way. */
async function deliver(userId: string, domain: string, reminder: number): Promise<{ sent: boolean; result: string }> {
  const items = await readItems(domain).catch(() => null)
  if (!items) return { sent: false, result: "items_unavailable" }
  // A "you" item still open; one marked Done that a check still finds failing is open again
  // (launch.py turns it back from "check").
  const open = openYou(items)
  // A reminder is about what they have to do; "if you use it" alone is no reason to write again.
  if (!open.length || (reminder > 0 && !open.some((i) => !i.optional))) return { sent: false, result: "nothing_open" }
  const to = await recipient(userId, domain)
  if (!to) return { sent: false, result: "no_email" }
  const de = to.language === "de"
  const list = open.map((i) => (de && i.de ? { title: i.de.title, steps: i.de.steps } : { title: i.title, steps: i.steps ?? [] }))
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "ItGrows.ai <noreply@itgrows.ai>",
    to: to.email,
    replyTo: OWNER,
    subject: launchNeedsSubject(to.language, reminder > 0),
    html: launchNeedsEmail(to.name, domain, list, SETTINGS_URL, to.language, reminder > 0),
  })
  if (error) {
    console.error("[geo/launch/mail]", domain, error.message)
    return { sent: false, result: "send_failed" }
  }
  const generic = open.some((i) => i.generic) ? ", общий список (сайт ещё не проверяли)" : ""
  void sendOwner(
    `📨 Клиенту ушло письмо «что нужно от вас»${reminder ? ` (напоминание ${reminder})` : ""}: ${to.email} (${domain}), ${de ? "DE" : "EN"}${generic}\n` +
      list.map((i) => `• ${i.title}`).join("\n"),
  )
  return { sent: true, result: reminder ? `reminder_${reminder}` : "sent" }
}

/** Takes the row for one email unless another run holds it (for CLAIM_MINUTES). */
const claimFree = () => sql`(claimed_at IS NULL OR claimed_at < now() - make_interval(mins => ${CLAIM_MINUTES}::int))`

/** The first email for a site and its buyer: once, whoever calls (the webhook, the VM, a retry). */
export async function sendFirstLaunchMail(userId: string, site: string): Promise<string> {
  const domain = domainOf(site)
  if (!userId || !domain) return "bad_request"
  await ensureMailTable()
  await db.execute(sql`INSERT INTO geo_launch_mail (domain, user_id) VALUES (${domain}, ${userId}) ON CONFLICT DO NOTHING`)
  if (!(await owns(userId, domain))) return "not_on_plan" // e.g. a payment still pending: ./remind tries again
  const claimed = rows(
    await db.execute(sql`
      UPDATE geo_launch_mail SET claimed_at = now()
      WHERE domain = ${domain} AND user_id = ${userId} AND first_sent_at IS NULL AND ${claimFree()}
      RETURNING 1`)
  )
  if (!claimed.length) {
    const [row] = rows(
      await db.execute(sql`SELECT first_sent_at FROM geo_launch_mail WHERE domain = ${domain} AND user_id = ${userId}`),
    )
    return row?.first_sent_at ? "already_sent" : "in_progress"
  }
  const r = await deliver(userId, domain, 0).catch((e) => {
    console.error("[geo/launch/mail]", domain, e instanceof Error ? e.message : e)
    return { sent: false, result: "failed" }
  })
  // Sent: it counts from now (the reminders are due from here). Not sent: the row is free again, and
  // the daily ./remind tries again.
  await db.execute(
    r.sent
      ? sql`UPDATE geo_launch_mail SET first_sent_at = now(), last_sent_at = now(), claimed_at = NULL
            WHERE domain = ${domain} AND user_id = ${userId}`
      : sql`UPDATE geo_launch_mail SET claimed_at = NULL WHERE domain = ${domain} AND user_id = ${userId}`,
  )
  return r.result
}

/** Reminder n (1 or 2) for a site whose first email went out; claimed so it goes once. */
export async function sendLaunchReminder(userId: string, domain: string, n: number): Promise<string> {
  const days = REMIND_AFTER_DAYS[n - 1]
  if (!days) return "no_more"
  if (!(await owns(userId, domain))) return "not_on_plan"
  await ensureMailTable()
  const claimed = rows(
    await db.execute(sql`
      UPDATE geo_launch_mail SET claimed_at = now()
      WHERE domain = ${domain} AND user_id = ${userId} AND reminders = ${n - 1}::int
        AND first_sent_at IS NOT NULL AND first_sent_at <= now() - make_interval(days => ${days}::int)
        AND (last_sent_at IS NULL OR last_sent_at <= now() - interval '2 days') AND ${claimFree()}
      RETURNING 1`)
  )
  if (!claimed.length) return "not_due"
  const r = await deliver(userId, domain, n).catch(() => ({ sent: false, result: "failed" }))
  await db.execute(
    r.sent
      ? sql`UPDATE geo_launch_mail SET reminders = ${n}::int, last_sent_at = now(), claimed_at = NULL
            WHERE domain = ${domain} AND user_id = ${userId}`
      : sql`UPDATE geo_launch_mail SET claimed_at = NULL WHERE domain = ${domain} AND user_id = ${userId}`,
  )
  return r.result
}
