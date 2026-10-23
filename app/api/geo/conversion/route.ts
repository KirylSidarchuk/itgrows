import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GEO_PLAN, GEO_RESEARCH, stripeClient } from "@/lib/geo-business"

// What a finished GEO checkout was worth, for the Google Ads conversion sent from the page Stripe
// returns to (components/GeoPurchaseConversion.tsx). That page only knows the Checkout Session id
// (?cs=, from {CHECKOUT_SESSION_ID} in the success_url of /api/geo/research-checkout and
// /api/geo/checkout); this asks Stripe, so only a completed payment by this signed-in user counts,
// with the amount and currency actually charged (Stripe may present another currency than USD).

export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE })

  const cs = req.nextUrl.searchParams.get("cs") ?? ""
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(cs)) {
    return NextResponse.json({ error: "bad_session" }, { status: 400, headers: NO_STORE })
  }

  let checkout
  try {
    checkout = await stripeClient().checkout.sessions.retrieve(cs)
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE })
  }
  if (checkout.metadata?.userId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE })
  }

  const kind = checkout.metadata?.plan === GEO_RESEARCH ? "report" : checkout.metadata?.plan === GEO_PLAN ? "plan" : null
  if (!kind) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE })

  const paid = checkout.status === "complete" && checkout.payment_status !== "unpaid"
  if (!paid) return NextResponse.json({ ready: false }, { headers: NO_STORE })

  return NextResponse.json(
    {
      ready: true,
      kind,
      id: checkout.id,
      value: (checkout.amount_total ?? 0) / 100,
      currency: (checkout.currency ?? "usd").toUpperCase(),
    },
    { headers: NO_STORE }
  )
}
