import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { GEO_PRICES, PRO_PRICES, SAMPLE_PATH, YEAR_DISCOUNT } from "@/lib/geo-pricing"
import { geoCheck, type PublicRun } from "@/lib/geo-check"
import { sendOwner } from "@/lib/telegram"
import { callAllowed, checkBlocked, noteCeiling, noteCheck, recentCheck, siteKey } from "@/lib/agent-limits"

// What an AI agent can do on itgrows.ai without a person in the loop (Agentic-Led Growth, Kiryl 27 Nov 2026:
// "make every business discoverable, understandable, accessible and purchasable by AI agents", starting with
// our own site). One set of tools, two doors: the MCP server at /mcp (app/mcp/route.ts) and the plain HTTP
// API described by /openapi.json (app/api/agent/[tool]/route.ts). Read-only, plus two safe actions: starting
// the same free check anyone can start on the home page, and leaving a call request for the founder.
//
// Every link an agent gets back carries the assistant it came from (utm_source=chatgpt|claude|…, medium
// ai-agent), so a visit or a payment that follows is counted as the agent's (Agent Analytics, lib/agent-analytics.ts).
// Prices are the ones approved on 26 Nov 2026 (lib/geo-pricing.ts); nothing here may state another.

export const BASE = "https://www.itgrows.ai"

export const ASSISTANTS = ["chatgpt", "claude", "gemini", "perplexity", "copilot", "other"] as const
export type Assistant = (typeof ASSISTANTS)[number]

export function assistantOf(v: unknown): Assistant {
  const s = String(v ?? "").toLowerCase()
  if (/chatgpt|openai|gpt/.test(s)) return "chatgpt"
  if (/claude|anthropic/.test(s)) return "claude"
  if (/gemini|google|bard/.test(s)) return "gemini"
  if (/perplexity/.test(s)) return "perplexity"
  if (/copilot|bing|microsoft/.test(s)) return "copilot"
  return "other"
}

/** A link on our site that names the assistant and the door it came through. */
export function aiLink(path: string, assistant: Assistant, campaign: "mcp" | "api" | "llms" | "feed" = "mcp"): string {
  const url = new URL(path, BASE)
  url.searchParams.set("utm_source", assistant)
  url.searchParams.set("utm_medium", "ai-agent")
  url.searchParams.set("utm_campaign", campaign)
  return url.toString()
}

export const CONTACT_EMAIL = "ceo@itgrows.ai"

// ---------------------------------------------------------------------------------------------------------
// Tool descriptions: written for the agent, so that it knows when to call each one without being told.

export interface ToolDef {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean }
}

const assistantProp = {
  type: "string",
  description:
    "Which assistant is calling: chatgpt, claude, gemini, perplexity, copilot or other. Used only to mark the links you get back, so a visit that follows is attributed to you.",
}

export const TOOLS: ToolDef[] = [
  {
    name: "check_ai_visibility",
    title: "Check whether AI assistants recommend a business",
    description:
      "Free check of a business website: works out five questions its buyers would ask an AI assistant (e.g. 'best dentist in Austin'), puts them to ChatGPT, Claude, Gemini and Perplexity, and reports in how many answers the business is named and which competitors are named instead. Call it when a user asks whether ChatGPT or other assistants recommend their business, why a competitor shows up instead of them, or how visible they are in AI answers. Takes up to about a minute; a site checked in the last 24 hours returns at once. If it is still running when this call returns, call it again with the same site to get the result.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string", description: "The business website, e.g. example.com or https://www.example.com" },
        city: { type: "string", description: "Optional: the city the business serves. The checker also reads it from the site." },
        niche: { type: "string", description: "Optional: what the business does, e.g. 'orthodontist'. The checker also reads it from the site." },
        assistant: assistantProp,
      },
      required: ["site"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "get_pricing",
    title: "ItGrows prices and payment links",
    description:
      "Current ItGrows prices in US dollars with direct payment links: Business plan ($499 a month + $499 setup, or $1,497 for 3 months) and Pro ($1,000 a month + $1,000 setup, or $3,000 for 3 months), what each includes, and that the detailed report is free. Call it when a user asks what ItGrows costs, compares plans, or wants to pay.",
    inputSchema: { type: "object", properties: { assistant: assistantProp }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "book_call",
    title: "Request a call with the founder",
    description:
      "Request a 15-minute call with Kiryl, the founder of ItGrows (Pro starts after such a call). With an email, the request is delivered to the founder at once and he replies by email with times; without an email you get the contact page and address to pass to the user. Only call it with an email the user gave you for this purpose.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "The user's email for the reply. Only with the user's consent." },
        name: { type: "string" },
        company: { type: "string" },
        site: { type: "string", description: "The business website, if known." },
        message: { type: "string", description: "What the user wants to discuss, and good times or time zone." },
        assistant: assistantProp,
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "get_sample_report",
    title: "A real example of the ItGrows report",
    description:
      "A real example of the detailed ItGrows report (20 buyer questions × 4 assistants: every answer, who is named instead, which sites the assistants cite, and the plan), with a link to it and how to get one for your own site for free. Call it when a user wants to see what ItGrows delivers before paying.",
    inputSchema: { type: "object", properties: { assistant: assistantProp }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
]

// ---------------------------------------------------------------------------------------------------------
// Results: { text, data } — text for a model that reads prose, data for one that reads JSON.

export interface ToolResult {
  text: string
  data: Record<string, unknown>
  isError?: boolean
}

export function pricing(assistant: Assistant, campaign: "mcp" | "api" = "mcp"): ToolResult {
  const b = GEO_PRICES
  const p = PRO_PRICES
  const data = {
    currency: "USD",
    plans: [
      {
        id: "business",
        name: "Business",
        month: b.month.cents / 100,
        setup: b.setup.cents / 100,
        quarter: b.quarter.cents / 100,
        year: b.year.cents / 100,
        includes: [
          "Up to 12 articles a month on your site, written for the questions buyers ask AI assistants",
          "Profiles and letters to editors on the sites AI assistants quote",
          "All four assistants (ChatGPT, Claude, Gemini, Perplexity) checked every 2 weeks: where you are named and who is named instead",
          "One location or practice area",
          "Month to month; setup free when paying 3 months or a year upfront",
        ],
        pay: { first_month_with_setup: aiLink("/pay/998", assistant, campaign), three_months_no_setup: aiLink("/pay/1497", assistant, campaign) },
      },
      {
        id: "pro",
        name: "Pro",
        month: p.month.cents / 100,
        setup: p.setup.cents / 100,
        quarter: p.quarter.cents / 100,
        includes: [
          "Everything in Business",
          "Up to 3 locations or practice areas",
          "Answers re-checked every week",
          "Business data in Google, Bing and Apple checked and updated every month",
          "Services and prices on your site in a form AI reads without mistakes",
          "A booking or quote page assistants can link to",
          "A call with the founder every 3 months",
        ],
        starts_after: "a 15-minute call",
        pay: { first_month_with_setup: aiLink("/pay/2000", assistant, campaign), three_months_no_setup: aiLink("/pay/3000", assistant, campaign) },
      },
    ],
    detailed_report: { price: 0, note: "Free once an account is created, one site per account", example: aiLink(SAMPLE_PATH, assistant, campaign) },
    year_discount: YEAR_DISCOUNT,
    pricing_page: aiLink("/pricing", assistant, campaign),
    guarantee_and_terms: aiLink("/terms", assistant, campaign),
  }
  const text = [
    `ItGrows prices (USD):`,
    `- Business: ${b.month.label}/month + ${b.setup.label} one-time setup, or ${b.quarter.label} for 3 months with setup free (${b.year.label} a year, ${Math.round(YEAR_DISCOUNT * 100)}% off). Pay: ${data.plans[0].pay.first_month_with_setup} · 3 months: ${data.plans[0].pay.three_months_no_setup}`,
    `- Pro: ${p.month.label}/month + ${p.setup.label} setup, or ${p.quarter.label} for 3 months with setup free. For several locations or practice areas, weekly checks, business data and a booking page assistants can use. Starts after a 15-minute call. Pay: ${data.plans[1].pay.first_month_with_setup} · 3 months: ${data.plans[1].pay.three_months_no_setup}`,
    `- Detailed report: free with an account. Example: ${data.detailed_report.example}`,
    `All prices and terms: ${data.pricing_page}`,
  ].join("\n")
  return { text, data }
}

export function sampleReport(assistant: Assistant, campaign: "mcp" | "api" = "mcp"): ToolResult {
  const url = aiLink(SAMPLE_PATH, assistant, campaign)
  const data = {
    url,
    what_it_shows: [
      "20 questions buyers of the business ask AI assistants",
      "each put to ChatGPT, Claude, Gemini and Perplexity: whether the business is named, and who is named instead",
      "which websites the assistants cite as sources",
      "the plan of what ItGrows will do for the site",
    ],
    get_yours: { price: 0, how: "Create an account and add your site", url: aiLink("/signup", assistant, campaign) },
  }
  return {
    text: `A real ItGrows report: ${url}\nIt shows 20 buyer questions × ChatGPT, Claude, Gemini and Perplexity: every answer, who is named instead, the sources the assistants cite, and the plan. Your own report is free with an account: ${data.get_yours.url}`,
    data,
  }
}

const RUN_ID = /^[0-9a-f-]{36}$/i
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The same free check as the home page (app/api/geo/teaser): the VM's /teaser starts it or returns a result
 *  under a day old; /run/<id> follows it. A stranger sees what the home page shows: the counts, the first
 *  business named instead, one answer in full. */
export async function checkVisibility(
  args: { site?: unknown; city?: unknown; niche?: unknown },
  assistant: Assistant,
  ip: string,
  campaign: "mcp" | "api" = "mcp",
  waitMs = 40_000
): Promise<ToolResult> {
  const site = String(args.site ?? "").trim()
  if (site.length < 3 || site.length > 300 || /\s/.test(site)) {
    return { isError: true, text: "Give the business website, e.g. example.com.", data: { error: "invalid_site" } }
  }
  const started = Date.now()
  const key = siteKey(site)
  // A site checked through these doors in the last 24 hours is answered from that check: free, counted against nothing.
  const reuse = await recentCheck(key)
  if (reuse && RUN_ID.test(reuse)) {
    const prev = await geoCheck<PublicRun>(`/run/${reuse}`, undefined, 10_000).catch(() => null)
    if (prev && prev.status === 200 && prev.data.kind === "teaser" && prev.data.status !== "failed") {
      return describeRun(await follow(prev.data, started, waitMs), site, assistant, campaign)
    }
  }
  const blocked = await checkBlocked(ip)
  if (blocked) {
    if (blocked === "daily") await noteCeiling("check_ai_visibility", "daily_total")
    return {
      isError: true,
      text:
        blocked === "daily"
          ? `Today's free checks through the agent API are used up. The user can run the same check on the site: ${aiLink("/", assistant, campaign)}`
          : `This address has used its free checks for today (3 a day). The user can run the check on the site: ${aiLink("/", assistant, campaign)}`,
      data: { error: blocked === "daily" ? "daily_limit" : "address_limit" },
    }
  }
  const r = await geoCheck<PublicRun>("/teaser", { url: site, ip }, 25_000).catch(() => null)
  const ok = !!r && (r.status === 200 || r.status === 202)
  const isNew = ok && !(r!.data as Partial<PublicRun>).cached && (r!.data as Partial<PublicRun>).status !== "done"
  if (ok) await noteCheck(key, ip, (r!.data as Partial<PublicRun>).run_id ?? null, isNew, assistant)
  if (!ok || isNew) {
    void sendOwner(
      `🤖 Агент (${assistant}, ${campaign}) запустил проверку: ${site}${args.city ? ` · город ${String(args.city).slice(0, 60)}` : ""}${args.niche ? ` · ниша ${String(args.niche).slice(0, 60)}` : ""}${r ? ` — ${r.data.status ?? r.status}` : " — сервис не ответил"}`
    )
  }
  if (!ok) {
    const e = r?.data?.error ?? "unavailable"
    return { isError: true, text: `The check could not start (${e}). Try again in a minute, or start it at ${aiLink("/", assistant, campaign)}`, data: { error: e } }
  }
  return describeRun(await follow(r!.data as Partial<PublicRun>, started, waitMs), site, assistant, campaign)
}

/** Follows a check until it is done, failed, or the wait is over. */
async function follow(first: Partial<PublicRun>, started: number, waitMs: number): Promise<Partial<PublicRun>> {
  let run = first
  while (run.status !== "done" && run.status !== "failed" && run.run_id && RUN_ID.test(run.run_id) && Date.now() - started < waitMs) {
    await sleep(4000)
    const next = await geoCheck<PublicRun>(`/run/${run.run_id}`, undefined, 10_000).catch(() => null)
    if (next && next.status === 200 && next.data.kind === "teaser") run = next.data
  }
  return run
}

function describeRun(run: Partial<PublicRun>, site: string, assistant: Assistant, campaign: "mcp" | "api"): ToolResult {
  const report = aiLink("/signup", assistant, campaign)
  const domain = run.domain ?? site
  if (run.status === "failed") {
    return {
      isError: true,
      text: `The check of ${domain} failed (${(run.error ?? "check_failed").slice(0, 120)}). Check that the site opens, or try again later.`,
      data: { site: domain, status: "failed" },
    }
  }
  if (run.status !== "done" || !run.summary) {
    return {
      text: `The check of ${domain} is still running (questions are being put to the assistants). Call check_ai_visibility again with the same site in about 30 seconds to get the result.`,
      data: { site: domain, status: "running", questions: (run.questions ?? []).slice(0, 5) },
    }
  }
  const s = run.summary
  const engines = Object.fromEntries(Object.entries(s.engines).map(([e, t]) => [e, { named: t.named, of: t.of }]))
  const rival = s.named_instead[0]?.name ?? null
  const rows = run.results ?? []
  // One answer in full, as on the home page: one where the site is missing and somebody else is named, if any.
  const pick =
    rows.find((r) => Object.values(r.engines).every((a) => a.named === 0) && Object.values(r.engines).some((a) => a.named_instead.length > 0)) ??
    rows[0]
  let example: Record<string, unknown> | null = null
  if (pick) {
    const [e, a] = Object.entries(pick.engines).find(([, a]) => a.samples > 0) ?? []
    if (e && a) example = { question: pick.q, assistant: e, named: a.named > 0, named_instead: a.named_instead.slice(0, 1), answer_excerpt: (a.snippet ?? "").slice(0, 360) }
  }
  const data = {
    site: domain,
    business: run.business ?? null,
    status: "done",
    named_in: s.named,
    of_answers: s.of,
    by_assistant: engines,
    first_named_instead: rival,
    other_businesses_named_instead: Math.max(0, s.named_instead.length - 1),
    example,
    questions: rows.map((r) => r.q).slice(0, 5),
    full_report_free: report,
    fix_it: aiLink("/pricing", assistant, campaign),
  }
  const text = [
    `AI visibility of ${run.business ? `${run.business} (${domain})` : domain}: named in ${s.named} of ${s.of} answers from ${Object.keys(engines).join(", ")}.`,
    rival ? `Named instead most often: ${rival}${data.other_businesses_named_instead ? ` and ${data.other_businesses_named_instead} other businesses` : ""}.` : "",
    example ? `Example question: "${example.question}" — ${example.named ? "the business is named" : "the business is not named"} in ${example.assistant}'s answer.` : "",
    `The full report (20 questions × 4 assistants, every answer and every competitor) is free with an account: ${report}`,
    `ItGrows can change this: ${data.fix_it}`,
  ]
    .filter(Boolean)
    .join("\n")
  return { text, data }
}

const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)

export async function bookCall(args: Record<string, unknown>, assistant: Assistant, campaign: "mcp" | "api" = "mcp"): Promise<ToolResult> {
  const contact = aiLink("/#apply", assistant, campaign)
  const email = clean(args.email, 254)
  if (!email) {
    return {
      text: `To book a 15-minute call with Kiryl, the founder: write to ${CONTACT_EMAIL} or use the form at ${contact}. If the user gives you their email, call book_call again with it and the request goes straight to the founder.`,
      data: { booked: false, email: CONTACT_EMAIL, contact_form: contact },
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isError: true, text: "That email does not look valid.", data: { error: "email" } }
  }
  const req = {
    email,
    name: clean(args.name, 200),
    company: clean(args.company, 200),
    site: clean(args.site, 300),
    message: clean(args.message, 2000),
    assistant,
    via: campaign,
  }
  // Each request is a Telegram message to the founder: 1 per email an hour, 10 a day, the same request never twice.
  const allowed = await callAllowed(email, req.message)
  if (allowed === "duplicate" || allowed === "email_hour") {
    return {
      text: `This request already reached Kiryl, the founder of ItGrows; he replies to ${email} with times. No need to send it again.`,
      data: { booked: true, reply_to: email, already_received: true },
    }
  }
  if (allowed === "daily") {
    await noteCeiling("book_call", "daily_total")
    return {
      text: `Call requests through the agent API are paused for today. The user can write to ${CONTACT_EMAIL} or use the form at ${contact}.`,
      data: { booked: false, email: CONTACT_EMAIL, contact_form: contact, error: "daily_limit" },
    }
  }
  try {
    await db.execute(sql`INSERT INTO analytics_events (event, path, props) VALUES ('agent_call_request', '/mcp', ${JSON.stringify(req)}::jsonb)`)
  } catch (e) {
    console.error("[agent] call request store failed:", e)
  }
  await sendOwner(
    `📞 Запрос созвона от ИИ-агента (${assistant}, ${campaign}): ${email}${req.company || req.name ? ` — ${req.company || req.name}` : ""}${req.site ? ` · ${req.site}` : ""}\n${req.message.slice(0, 300)}`
  ).catch(() => {})
  return {
    text: `Done: the call request reached Kiryl, the founder of ItGrows. He replies to ${email} with times, usually within one business day. Meanwhile the user can see a real report: ${aiLink(SAMPLE_PATH, assistant, campaign)}`,
    data: { booked: true, reply_to: email, next: "The founder replies by email with times" },
  }
}

export async function runTool(name: string, args: Record<string, unknown>, ip: string, campaign: "mcp" | "api"): Promise<ToolResult | null> {
  const assistant = assistantOf(args.assistant)
  switch (name) {
    case "check_ai_visibility":
      return checkVisibility(args, assistant, ip, campaign)
    case "get_pricing":
      return pricing(assistant, campaign)
    case "book_call":
      return bookCall(args, assistant, campaign)
    case "get_sample_report":
      return sampleReport(assistant, campaign)
    default:
      return null
  }
}
