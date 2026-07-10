import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import Stripe from "stripe"

// TEMP diagnostic: latest registrant(s) + their activity + ad source. Token-gated. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] =>
  Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? [])

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN)
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const n = Math.min(Number(req.nextUrl.searchParams.get("n") || 1), 5)
  try {
    const us = rows(await db.execute(sql`
      SELECT id, email, name, source, onboarding_completed, subscription_status,
             subscription_plan, company_page_plan, trial_ends_at, subscription_end_date,
             created_at, stripe_customer_id
      FROM users ORDER BY created_at DESC LIMIT ${n}`))

    const out: unknown[] = []
    for (const u of us) {
      const uid = u.id as string
      const li = rows(await db.execute(sql`
        SELECT count(*)::int AS accounts, bool_or(is_active) AS any_active,
               string_agg(coalesce(page_name, page_type), ', ') AS pages
        FROM linkedin_accounts WHERE user_id = ${uid}`))[0]
      const brief = rows(await db.execute(sql`
        SELECT niche, tone, goals, target_audience, is_auto_filled, posting_frequency
        FROM linkedin_briefs WHERE user_id = ${uid}::text ORDER BY updated_at DESC LIMIT 1`))[0] ?? null
      const posts = rows(await db.execute(sql`
        SELECT status, count(*)::int AS n FROM linkedin_posts WHERE user_id = ${uid}::text GROUP BY status`))
      const events = rows(await db.execute(sql`
        SELECT action, ref, created_at FROM usage_events WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 15`))

      let stripe_source: string | null = null
      const cust = u.stripe_customer_id as string | null
      if (cust && process.env.STRIPE_SECRET_KEY) {
        try {
          const s = new Stripe(process.env.STRIPE_SECRET_KEY)
          const subs = await s.subscriptions.list({ customer: cust, status: "all", limit: 3 })
          const withG = subs.data.find((x) => x.metadata?.gclid)
          stripe_source = withG?.metadata?.gclid ? "google_ads" : (subs.data.length ? "organic (no gclid)" : "no subscription")
        } catch { stripe_source = "stripe error" }
      }

      out.push({
        email: u.email, name: u.name, created_at: u.created_at, db_source: u.source,
        onboarding_completed: u.onboarding_completed,
        subscription: { status: u.subscription_status, plan: u.subscription_plan, company_plan: u.company_page_plan, trial_ends_at: u.trial_ends_at },
        ad_source: stripe_source,
        linkedin_connected: li,
        brief_filled: brief,
        posts_by_status: posts,
        recent_activity: events,
      })
    }
    return NextResponse.json({ count: us.length, users: out })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
