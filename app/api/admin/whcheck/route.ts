import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP: list webhook endpoints + enabled events. Token-gated. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    const eps = await s.webhookEndpoints.list({ limit: 10 })
    const out = eps.data.map((e) => ({
      url: e.url,
      status: e.status,
      has_sub_updated: e.enabled_events.includes("customer.subscription.updated") || e.enabled_events.includes("*"),
      has_sub_deleted: e.enabled_events.includes("customer.subscription.deleted") || e.enabled_events.includes("*"),
      enabled_events: e.enabled_events,
    }))
    return NextResponse.json({ endpoints: out })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
