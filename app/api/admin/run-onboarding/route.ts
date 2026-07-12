import { NextRequest, NextResponse } from "next/server"
import { GET as onboardingNudge } from "@/app/api/cron/onboarding-nudge/route"

// TEMP ops trigger: fire the real onboarding-nudge cron on demand (token-gated),
// authenticating with the runtime CRON_SECRET so no logic is duplicated. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: "no CRON_SECRET at runtime" }, { status: 500 })
  const proxied = new NextRequest("https://www.itgrows.ai/api/cron/onboarding-nudge", {
    headers: { authorization: `Bearer ${secret}` },
  })
  return onboardingNudge(proxied)
}
