import { NextResponse } from "next/server"
import { SERVER_CARD } from "@/lib/agent-card"
import { noteAgentSurface } from "@/lib/agent-analytics"

// The MCP Server Card at the location MCP reserves for it (<streamable-http-url>/server-card, SEP-2127).
// Per request (not prerendered), so a crawler reading it is counted (lib/agent-analytics.ts noteAgentSurface).
export const dynamic = "force-dynamic"

export function GET(req: Request) {
  noteAgentSurface(req.headers, "/mcp/server-card")
  return NextResponse.json(SERVER_CARD, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600", "CDN-Cache-Control": "no-store" } })
}
