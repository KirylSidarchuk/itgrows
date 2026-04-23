import { NextRequest, NextResponse } from "next/server"
import { generateForUser } from "@/lib/linkedin-generate"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId } = await req.json() as { userId?: string }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    console.log(`[generate-initial-posts] Generating posts for new trial user ${userId}`)
    const result = await generateForUser(userId)

    if (!result.success) {
      console.error(`[generate-initial-posts] Failed for user ${userId}: ${result.error}`)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[generate-initial-posts] error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
