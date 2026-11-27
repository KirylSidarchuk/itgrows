import { serviceFeed } from "@/lib/agent-feed"
import { noteAgentSurface } from "@/lib/agent-analytics"

// The services feed in the JSONL form of the OpenAI commerce feed: one item a line (lib/agent-feed.ts).
// Per request (not prerendered), so a crawler reading it is counted (lib/agent-analytics.ts noteAgentSurface).
export const dynamic = "force-dynamic"

export function GET(req: Request) {
  noteAgentSurface(req.headers, "/feeds/services.jsonl")
  return new Response(serviceFeed().map((i) => JSON.stringify(i)).join("\n") + "\n", {
    headers: { "Content-Type": "application/jsonl; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600", "CDN-Cache-Control": "no-store" },
  })
}
