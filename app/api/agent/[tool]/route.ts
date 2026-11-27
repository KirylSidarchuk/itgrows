import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { TOOLS, runTool, assistantOf } from "@/lib/agent-tools"
import { aaRecord } from "@/lib/agent-analytics"
import { clientIp } from "@/lib/geo-check"
import { ipHash, overMinuteLimit } from "@/lib/agent-limits"

// The same tools as the MCP server (/mcp), as plain HTTP for agents that read /openapi.json instead:
// GET with query parameters or POST with a JSON body, /api/agent/<tool name>. Answers { text, data }.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
// Writing tools only by POST: a link someone follows must not send a call request.
const POST_ONLY = new Set(["book_call"])

async function serve(req: NextRequest, tool: string, args: Record<string, unknown>) {
  // At most 30 requests a minute from one address, together with /mcp (lib/agent-limits.ts).
  if (await overMinuteLimit(clientIp(req.headers), `/api/agent/${tool.slice(0, 40)}`)) {
    return NextResponse.json({ error: "rate limited, retry later" }, { status: 429, headers: { ...CORS, "Retry-After": "60" } })
  }
  if (!TOOLS.some((t) => t.name === tool)) return NextResponse.json({ error: "unknown_tool", tools: TOOLS.map((t) => t.name) }, { status: 404, headers: CORS })
  if (!args.assistant) args.assistant = req.headers.get("user-agent") ?? ""
  const res = await runTool(tool, args, clientIp(req.headers), "api")
  if (!res) return NextResponse.json({ error: "unknown_tool" }, { status: 404, headers: CORS })
  after(() => aaRecord("itgrows.ai", "mcp", `/api/agent/${tool}`, { tool, assistant: assistantOf(args.assistant), via: "api", ok: !res.isError, ip: ipHash(clientIp(req.headers)) }))
  return NextResponse.json({ text: res.text, data: res.data, ...(res.isError ? { error: true } : {}) }, { status: res.isError ? 400 : 200, headers: { ...CORS, "Cache-Control": "no-store" } })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ tool: string }> }) {
  const { tool } = await ctx.params
  if (POST_ONLY.has(tool)) return NextResponse.json({ error: "use_post" }, { status: 405, headers: { ...CORS, Allow: "POST" } })
  return serve(req, tool, Object.fromEntries(req.nextUrl.searchParams.entries()))
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tool: string }> }) {
  const { tool } = await ctx.params
  let body: unknown = {}
  try {
    body = await req.json()
  } catch {}
  const args = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  return serve(req, tool, args)
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
