import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { liveGeoSubscriptions, normaliseDomain, stripeClient } from "@/lib/geo-business"

// Cancel the AI-visibility plan for one site, from /business/dashboard/plan: the plan runs to the end
// of the paid period, then stops (cancel_at_period_end); { undo: true } keeps it. Only the signed-in
// user's own plan subscriptions for that site are touched (metadata.plan geo_business and
// metadata.domain, on their Stripe customer), never a LinkedIn/X one on the same customer. The webhook
// mirrors the end onto the follow and tells Kiryl.
//
// POST { domain, undo? } -> { cancelAt: ISO date } ({ cancelAt: null } after undo);
// GET ?domain=          -> { cancelAt: ISO date | null, periodEnd: ISO date | null }: where things
//                          stand, and the end of the paid period, for the page.
// 404 { error: "no_subscription" } when the site has no live plan subscription.

export const dynamic = "force-dynamic"

/** The end of a subscription's paid period (unix seconds). */
function periodEnd(s: Stripe.Subscription): number | null {
  const ends = (s.items?.data ?? []).map((i) => i.current_period_end).filter((t): t is number => !!t)
  return ends.length ? Math.max(...ends) : null
}

/** When a subscription set to cancel stops: its cancel_at, else the end of the paid period. */
function endsAt(s: Stripe.Subscription): number | null {
  if (s.cancel_at) return s.cancel_at
  return s.cancel_at_period_end ? periodEnd(s) : null
}

const iso = (unix: number | null) => (unix ? new Date(unix * 1000).toISOString() : null)

/** The date the plan stops, or null while any of its subscriptions runs on. */
function cancelAt(subs: Stripe.Subscription[]): string | null {
  const ends = subs.map(endsAt)
  if (!ends.length || ends.some((e) => e === null)) return null
  return iso(Math.max(...(ends as number[])))
}

/** The change that cancels at the end of the period, or undoes it; null when there is nothing to do. */
function change(s: Stripe.Subscription, undo: boolean): Stripe.SubscriptionUpdateParams | null {
  if (!undo) return s.cancel_at_period_end ? null : { cancel_at_period_end: true }
  if (s.cancel_at_period_end) return { cancel_at_period_end: false }
  return s.cancel_at ? { cancel_at: "" } : null
}

async function live(userId: string, raw: unknown) {
  const domain = normaliseDomain(raw)
  if (!domain) return { error: NextResponse.json({ error: "domain_required" }, { status: 400 }) }
  const [user] = await db.select({ customer: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1)
  const stripe = stripeClient()
  const subs = user?.customer ? await liveGeoSubscriptions(stripe, user.customer, domain) : []
  if (!subs.length) return { error: NextResponse.json({ error: "no_subscription" }, { status: 404 }) }
  return { stripe, domain, subs }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const found = await live(userId, req.nextUrl.searchParams.get("domain"))
    if ("error" in found) return found.error
    const paidTo = found.subs.map(periodEnd).filter((t): t is number => t !== null)
    return NextResponse.json({ cancelAt: cancelAt(found.subs), periodEnd: iso(paidTo.length ? Math.max(...paidTo) : null) })
  } catch (err) {
    console.error("[geo-cancel]", (err as Error).message)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { domain?: string; undo?: boolean }
  const undo = body.undo === true
  try {
    const found = await live(userId, body.domain)
    if ("error" in found) return found.error
    const { stripe, domain, subs } = found
    const updated = await Promise.all(
      subs.map((s) => {
        const params = change(s, undo)
        return params ? stripe.subscriptions.update(s.id, params) : s
      })
    )
    const at = undo ? null : cancelAt(updated)
    await db
      .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
        VALUES (${userId}, ${undo ? "geo_plan_cancel_undone" : "geo_plan_cancelled"}, '/business/dashboard/plan',
                ${JSON.stringify({ domain, cancelAt: at, subscriptions: updated.map((s) => s.id) })}::jsonb)`)
      .catch(() => {})
    return NextResponse.json({ cancelAt: at })
  } catch (err) {
    console.error("[geo-cancel]", (err as Error).message)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
}
