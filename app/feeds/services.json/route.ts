import { NextResponse } from "next/server"
import { serviceFeed } from "@/lib/agent-feed"

// The services feed as one JSON document (lib/agent-feed.ts). /feeds/services.jsonl is the same, one item a line.
export const dynamic = "force-static"

export function GET() {
  return NextResponse.json(
    { seller: "ItGrows", updated: new Date().toISOString().slice(0, 10), items: serviceFeed() },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } }
  )
}
