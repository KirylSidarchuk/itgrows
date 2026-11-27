import { NextResponse } from "next/server"
import { TOOLS, BASE } from "@/lib/agent-tools"
import { noteAgentSurface } from "@/lib/agent-analytics"

// OpenAPI 3.1 for the agent API (/api/agent/<tool>), written from the same tool list as the MCP server, so the
// two never disagree. Agents that do not speak MCP read this.
// Per request (not prerendered), so a crawler reading it is counted (lib/agent-analytics.ts noteAgentSurface).
export const dynamic = "force-dynamic"

const result = {
  type: "object",
  properties: { text: { type: "string", description: "The answer in prose, ready to show the user" }, data: { type: "object" }, error: { type: "boolean" } },
  required: ["text", "data"],
}

export function GET(req: Request) {
  noteAgentSurface(req.headers, "/openapi.json")
  const paths: Record<string, unknown> = {}
  for (const t of TOOLS) {
    const schema = t.inputSchema as { properties?: Record<string, { type?: string; description?: string }>; required?: string[] }
    const op = (method: "get" | "post") => ({
      operationId: method === "get" ? t.name : `${t.name}_post`,
      summary: t.title,
      description: t.description,
      ...(method === "get"
        ? {
            parameters: Object.entries(schema.properties ?? {}).map(([name, p]) => ({
              name,
              in: "query",
              required: (schema.required ?? []).includes(name),
              description: p.description,
              schema: { type: p.type ?? "string" },
            })),
          }
        : { requestBody: { required: !!schema.required?.length, content: { "application/json": { schema: t.inputSchema } } } }),
      responses: { "200": { description: "Result", content: { "application/json": { schema: result } } }, "400": { description: "Bad input or the tool failed", content: { "application/json": { schema: result } } } },
    })
    paths[`/api/agent/${t.name}`] = t.annotations.readOnlyHint ? { get: op("get"), post: op("post") } : { post: op("post") }
  }
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "ItGrows agent API",
      version: "1.0.0",
      description:
        "Check whether AI assistants (ChatGPT, Claude, Gemini, Perplexity) recommend a business, get ItGrows prices and payment links, see a sample report, request a call. The same tools are available over MCP at " +
        `${BASE}/mcp. No key needed.`,
      contact: { name: "ItGrows", email: "ceo@itgrows.ai", url: BASE },
    },
    servers: [{ url: BASE }],
    paths,
    externalDocs: { description: "What ItGrows is, for assistants", url: `${BASE}/llms.txt` },
  }
  return NextResponse.json(doc, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } })
}
