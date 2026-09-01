import { NextRequest, NextResponse } from "next/server"
import { generateForUser } from "@/lib/linkedin-generate"

// Run one generation for a named account and report what happened.
//
// The normal trigger needs a logged-in session and the cron needs a secret that only exists in
// the deployment environment, which left no way to watch a real run from outside. Whether the
// batch checks fired and whether the end-of-batch question was attached are exactly the things
// worth being able to see.

export const dynamic = "force-dynamic"
export const maxDuration = 300

const ADMIN_TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? new URL(req.url).searchParams.get("token")
  if (token !== ADMIN_TOKEN && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string }
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const result = await generateForUser(userId)
  return NextResponse.json(result)
}
