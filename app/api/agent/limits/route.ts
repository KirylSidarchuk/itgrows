import { NextRequest, NextResponse } from "next/server"
import { aaAuthorized } from "@/lib/agent-analytics"
import { limitsReport } from "@/lib/agent-limits"

// The last 24 hours of the agent limits (lib/agent-limits.ts), for the operator's daily check: a daily ceiling reached
// becomes one vos owner-add (routine itgrows:agent-limits-daily), never a Telegram message per hit. Key: the VM token or
// the Agent Analytics ingest key.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!aaAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json(await limitsReport(), { headers: { "Cache-Control": "no-store" } })
}
