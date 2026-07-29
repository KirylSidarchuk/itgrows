import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: weekly audit — past_due detail, webhook events, publishing health. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  const out: Row = {}
  try {
    // webhook: is invoice.paid subscribed now?
    const eps = await s.webhookEndpoints.list({ limit: 10 })
    const itg = eps.data.find((e) => e.url.includes("itgrows.ai/api/stripe/webhook"))
    out.webhook_events = itg?.enabled_events ?? []
    out.has_invoice_paid = !!itg?.enabled_events.includes("invoice.paid")

    // eamcguire past_due detail
    const custs = await s.customers.list({ email: "eamcguire67.em@gmail.com", limit: 3 })
    const detail: Row[] = []
    for (const c of custs.data) {
      const subs = await s.subscriptions.list({ customer: c.id, status: "all", limit: 5 })
      for (const x of subs.data) {
        const latestInvId = (x as unknown as { latest_invoice?: string }).latest_invoice
        let inv: Row | null = null
        if (latestInvId) {
          try {
            const i = await s.invoices.retrieve(latestInvId)
            inv = {
              status: i.status,
              attempt_count: (i as unknown as { attempt_count?: number }).attempt_count,
              next_attempt: (i as unknown as { next_payment_attempt?: number }).next_payment_attempt
                ? new Date((i as unknown as { next_payment_attempt: number }).next_payment_attempt * 1000).toISOString().slice(0, 16) : null,
              amount_due: i.amount_due,
            }
          } catch {}
        }
        detail.push({
          status: x.status,
          cancel_at_period_end: x.cancel_at_period_end,
          current_period_end: (x as unknown as { current_period_end?: number }).current_period_end
            ? new Date((x as unknown as { current_period_end: number }).current_period_end * 1000).toISOString().slice(0, 16) : null,
          latest_invoice: inv,
        })
      }
    }
    out.eamcguire = detail

    // publishing health for active/past_due/trialing users
    const users = rows(await db.execute(sql`
      SELECT id, email, subscription_status AS status, subscription_plan AS plan
      FROM users WHERE subscription_status IN ('active','trialing','past_due','unpaid')
      ORDER BY email`))
    for (const u of users) {
      const uid = u.id as string; delete u.id
      const pub = rows(await db.execute(sql`
        SELECT to_char(max(published_at),'YYYY-MM-DD HH24:MI') AS last_published, count(*)::int AS total
        FROM linkedin_posts WHERE user_id = ${uid} AND status='published'`))[0]
      u.last_published = pub?.last_published; u.published_total = pub?.total
    }
    out.publishing = users.filter((u) => !(u.email as string).includes("kiryl"))

    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, partial: out }, { status: 500 })
  }
}
