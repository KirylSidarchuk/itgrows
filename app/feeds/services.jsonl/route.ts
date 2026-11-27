import { serviceFeed } from "@/lib/agent-feed"

// The services feed in the JSONL form of the OpenAI commerce feed: one item a line (lib/agent-feed.ts).
export const dynamic = "force-static"

export function GET() {
  return new Response(serviceFeed().map((i) => JSON.stringify(i)).join("\n") + "\n", {
    headers: { "Content-Type": "application/jsonl; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  })
}
