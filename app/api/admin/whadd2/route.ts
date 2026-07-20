import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// TEMP: add invoice.paid to the ItGrows webhook endpoint's enabled events. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const s = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    const eps = await s.webhookEndpoints.list({ limit: 10 })
    const ep = eps.data.find((e) => e.url.includes("itgrows.ai/api/stripe/webhook"))
    if (!ep) return NextResponse.json({ error: "itgrows endpoint not found" }, { status: 404 })
    const events = new Set(ep.enabled_events)
    const before = [...events]
    events.add("invoice.paid")
    const updated = await s.webhookEndpoints.update(ep.id, { enabled_events: [...events] })
    return NextResponse.json({ endpoint: ep.url, before, after: updated.enabled_events })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
