import { NextRequest, NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin-auth"
import { generateForUser } from "@/lib/linkedin-generate"

// Run one generation for a named account and report what happened.
//
// The normal trigger needs a logged-in session, which left no way to watch a real run from
// outside. Whether the batch checks fired and whether the end-of-batch question was attached are
// exactly the things worth being able to see.
//
// Every call spends money (text + image generation + an email), so it answers only to a key from
// the deployment environment, sent in a header (see lib/admin-auth). Never in the query string.

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string }
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const result = await generateForUser(userId)
  return NextResponse.json(result)
}
