import { NextResponse } from "next/server"
import { serviceFeed } from "@/lib/agent-feed"
import { noteAgentSurface } from "@/lib/agent-analytics"

// The services feed as one JSON document (lib/agent-feed.ts). /feeds/services.jsonl is the same, one item a line.
// Per request (not prerendered), so a crawler reading it is counted (lib/agent-analytics.ts noteAgentSurface).
export const dynamic = "force-dynamic"

export function GET(req: Request) {
  noteAgentSurface(req.headers, "/feeds/services.json")
  return NextResponse.json(
    { seller: "ItGrows", updated: new Date().toISOString().slice(0, 10), items: serviceFeed() },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } }
  )
}
