import { NextRequest, NextResponse } from "next/server"
import { GEO_PRICES } from "@/lib/geo-pricing"
import { geoLineItems, normaliseDomain, stripeClient } from "@/lib/geo-business"
import { sendOwner } from "@/lib/telegram"

// Fixed payment links for the AI-visibility plan, to send in reply to START or an invoice request
// (Venture OS: itgrows START → invoice path). Same public price as everywhere (lib/geo-pricing.ts):
//   /pay/998  — first month $499 + one-time setup $499, then $499 a month;
//   /pay/1497 — 3 months $1,497, no setup.
// Optional ?email= prefills Stripe, ?site= goes to metadata. Not tied to a site account: metadata
// plan "geo_direct" keeps the webhook from treating it as a cabinet checkout; it only pings Telegram,
// and the plan is switched on by hand (activate_client.py) after the money arrives.

export const dynamic = "force-dynamic"

const PLANS = {
  "998": { interval: "month", setup: true },
  "1497": { interval: "quarter", setup: false },
} as const

export async function GET(req: NextRequest, ctx: { params: Promise<{ plan: string }> }) {
  const { plan } = await ctx.params
  const p = PLANS[plan as keyof typeof PLANS]
  if (!p) return NextResponse.redirect(new URL("/business", req.url), 302)
  const q = req.nextUrl.searchParams
  const email = (q.get("email") ?? "").trim()
  const site = normaliseDomain(q.get("site")) ?? ""
  const stripe = stripeClient()
  const meta = { plan: "geo_direct", link: plan, interval: p.interval, setup: p.setup ? "1" : "0", domain: site }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: await geoLineItems(stripe, GEO_PRICES, p.interval, p.setup),
    ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? { customer_email: email } : {}),
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    allow_promotion_codes: true,
    success_url: "https://www.itgrows.ai/business?paid=1",
    cancel_url: "https://www.itgrows.ai/business",
    metadata: meta,
    subscription_data: { metadata: meta, description: `AI visibility${site ? ` for ${site}` : ""}` },
  })
  void sendOwner(`🛒 Открыта оплата GEO по ссылке /pay/${plan}${site ? ` — ${site}` : ""}${email ? ` — ${email}` : ""}`)
  return NextResponse.redirect(session.url!, 303)
}
