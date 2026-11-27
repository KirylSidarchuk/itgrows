import { NextResponse } from "next/server"
import { SERVER_CARD } from "@/lib/agent-card"

// The MCP Server Card at the location MCP reserves for it (<streamable-http-url>/server-card, SEP-2127).
export const dynamic = "force-static"

export function GET() {
  return NextResponse.json(SERVER_CARD, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } })
}
