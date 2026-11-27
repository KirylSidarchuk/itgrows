import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { TOOLS, runTool, assistantOf, BASE } from "@/lib/agent-tools"
import { aaRecord } from "@/lib/agent-analytics"
import { clientIp } from "@/lib/geo-check"
import { SERVER_INFO, INSTRUCTIONS } from "@/lib/agent-card"

// The public MCP server of itgrows.ai (Agentic-Led Growth step 04, Kiryl 27 Nov 2026). Streamable HTTP, POST only,
// stateless, no auth: read-only tools plus two safe actions (lib/agent-tools.ts). Speaks both generations of the
// protocol, as read on modelcontextprotocol.io on 27 Nov 2026:
// - modern (2026-07-28): no handshake; server/discover, every request carries _meta with the protocol version;
//   results carry resultType "complete";
// - legacy (2025-11-25 and earlier, what most clients still send): initialize → notifications/initialized → tools.
// Every answer is a single application/json body (allowed by both); a POST of notifications only gets 202.
// No session ids are minted. Origin: the server is public, keeps no cookies and acts on nobody's account, so any
// origin may call it (the Origin rule exists against DNS rebinding of local servers).

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MODERN = "2026-07-28"
const LEGACY = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
const SUPPORTED = [MODERN, ...LEGACY]

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Max-Age": "86400",
}

type Msg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown>; result?: unknown; error?: unknown }

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } })
const rpcError = (id: Msg["id"], code: number, message: string, data?: unknown) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } })

function metaVersion(m: Msg): string | null {
  const meta = (m.params?._meta ?? null) as Record<string, unknown> | null
  const v = meta?.["io.modelcontextprotocol/protocolVersion"]
  return typeof v === "string" ? v : null
}

function clientName(m: Msg): string {
  const meta = (m.params?._meta ?? {}) as Record<string, unknown>
  const info = (meta["io.modelcontextprotocol/clientInfo"] ?? m.params?.clientInfo ?? {}) as Record<string, unknown>
  return String(info.name ?? "")
}

async function handle(m: Msg, req: NextRequest, modern: boolean): Promise<{ body: unknown; status?: number } | null> {
  const isRequest = m.id !== undefined && m.id !== null && typeof m.method === "string"
  if (!isRequest) return null // notifications and stray responses: nothing to answer
  const id = m.id
  const done = (result: Record<string, unknown>) => ({ body: { jsonrpc: "2.0", id, result: modern ? { resultType: "complete", ...result } : result } })

  switch (m.method) {
    case "initialize": {
      const asked = String(m.params?.protocolVersion ?? "")
      const protocolVersion = LEGACY.includes(asked) ? asked : LEGACY[0]
      return {
        body: {
          jsonrpc: "2.0",
          id,
          result: { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS },
        },
      }
    }
    case "server/discover":
      return done({
        supportedVersions: SUPPORTED,
        capabilities: { tools: {} },
        _meta: { "io.modelcontextprotocol/serverInfo": SERVER_INFO },
        instructions: INSTRUCTIONS,
        ttlMs: 3_600_000,
        cacheScope: "public",
      })
    case "ping":
      return done({})
    case "tools/list":
      return done({ tools: TOOLS, ...(modern ? { ttlMs: 3_600_000, cacheScope: "public" } : {}) })
    case "tools/call": {
      const name = String(m.params?.name ?? "")
      const args = (m.params?.arguments ?? {}) as Record<string, unknown>
      if (typeof args !== "object" || Array.isArray(args)) return { body: rpcError(id, -32602, "arguments must be an object") }
      if (!args.assistant) args.assistant = clientName(m) || req.headers.get("user-agent") || ""
      const res = await runTool(name, args, clientIp(req.headers), "mcp")
      if (!res) return { body: rpcError(id, -32602, `Unknown tool: ${name}`) }
      const assistant = assistantOf(args.assistant)
      after(() => aaRecord("itgrows.ai", "mcp", "/mcp", { tool: name, assistant, client: clientName(m).slice(0, 80), ok: !res.isError }))
      return done({ content: [{ type: "text", text: res.text }], structuredContent: res.data, isError: !!res.isError })
    }
    default:
      return { body: rpcError(id, -32601, `Method not found: ${m.method}`), status: modern ? 404 : 200 }
  }
}

export async function POST(req: NextRequest) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400)
  }
  const batch = Array.isArray(payload)
  const msgs = (batch ? payload : [payload]) as Msg[]
  if (!msgs.length || msgs.some((m) => !m || typeof m !== "object")) return json(rpcError(null, -32600, "Invalid Request"), 400)

  const header = req.headers.get("mcp-protocol-version")
  if (header && !SUPPORTED.includes(header)) {
    return json(rpcError(msgs[0]?.id, -32022, "Unsupported protocol version", { supported: SUPPORTED, requested: header }), 400)
  }
  const first = msgs[0]
  const bodyVersion = metaVersion(first)
  const modern = (header ?? bodyVersion ?? "") >= MODERN
  if (modern && bodyVersion && header && bodyVersion !== header) {
    return json(rpcError(first.id, -32020, "MCP-Protocol-Version header does not match _meta protocolVersion"), 400)
  }
  const methodHeader = req.headers.get("mcp-method")
  if (modern && !batch && methodHeader && first.method && methodHeader !== first.method) {
    return json(rpcError(first.id, -32020, "Mcp-Method header does not match the request method"), 400)
  }

  const answers = (await Promise.all(msgs.map((m) => handle(m, req, modern)))).filter((a): a is NonNullable<typeof a> => a !== null)
  if (!answers.length) return new NextResponse(null, { status: 202, headers: CORS })
  if (batch) return json(answers.map((a) => a.body))
  return json(answers[0].body, answers[0].status ?? 200)
}

// A GET is someone (or something) opening the address: a short pointer instead of a bare 405 page would mislead
// clients that probe for an SSE stream, so the status stays 405, with a body that says where things are.
export async function GET() {
  return NextResponse.json(
    {
      error: "This is an MCP endpoint (Streamable HTTP): send JSON-RPC over POST.",
      server_card: `${BASE}/mcp/server-card`,
      openapi: `${BASE}/openapi.json`,
      docs: `${BASE}/llms.txt`,
    },
    { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } }
  )
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
