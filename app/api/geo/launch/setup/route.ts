import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { geoPlanPaidBefore, normaliseDomain, stripeClient } from "@/lib/geo-business"
import { follows } from "../_shared"

// Whether a site's one-time setup (its launch) is paid already, decided as /api/geo/checkout decides
// whether to charge it (lib/geo-business.ts geoPlanPaidBefore: a paid plan for the site before, by
// anyone, in our records or in Stripe). For the plan page, so the price it shows is the one checkout
// charges. Any follower of the site may ask; the user's Stripe customer is read, never created.

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const domain = normaliseDomain(req.nextUrl.searchParams.get("site"))
  if (!domain) return NextResponse.json({ error: "site_required" }, { status: 400 })
  if (!(await follows(userId, domain))) return NextResponse.json({ error: "not_found" }, { status: 404 })
  const [u] = await db.select({ customer: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1)
  try {
    const setupPaid = await geoPlanPaidBefore(stripeClient(), userId, u?.customer ?? null, domain)
    return NextResponse.json({ domain, setupPaid })
  } catch (err) {
    console.error("[geo/launch/setup]", domain, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }
}
