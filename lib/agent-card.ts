// Who the itgrows.ai MCP server is, in one place: the MCP handshake (app/mcp/route.ts), the Server Card at
// /mcp/server-card (MCP extension SEP-2127, schema v1, read 27 Nov 2026) and its copy at
// /.well-known/mcp.json (public/.well-known/mcp.json — keep the two the same; scripts write it from here).

export const MCP_URL = "https://www.itgrows.ai/mcp"
export const SERVER_VERSION = "1.0.0"

export const SERVER_INFO = {
  name: "ai.itgrows/visibility",
  title: "ItGrows — AI visibility",
  version: SERVER_VERSION,
  description: "Check whether ChatGPT, Claude, Gemini and Perplexity recommend a business; ItGrows prices, sample report, call with the founder.",
  websiteUrl: "https://www.itgrows.ai",
  icons: [{ src: "https://www.itgrows.ai/apple-touch-icon.png", mimeType: "image/png", sizes: ["180x180"] }],
}

export const INSTRUCTIONS =
  "ItGrows makes businesses visible in AI assistants' answers (ChatGPT, Claude, Gemini, Perplexity). " +
  "Use check_ai_visibility when a user asks whether AI assistants recommend their business or why a competitor is named instead; " +
  "get_pricing for prices and payment links; get_sample_report to show what the work delivers; book_call to request a call with the founder " +
  "(only with an email the user gave for that). Pass `assistant` (chatgpt, claude, gemini, perplexity, copilot) so links are attributed to you."

export const SERVER_CARD = {
  $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  name: SERVER_INFO.name,
  version: SERVER_VERSION,
  description: "Does ChatGPT, Claude, Gemini, Perplexity recommend a business? Free check, prices, booking.",
  title: SERVER_INFO.title,
  websiteUrl: SERVER_INFO.websiteUrl,
  icons: SERVER_INFO.icons,
  remotes: [{ type: "streamable-http", url: MCP_URL }],
}
