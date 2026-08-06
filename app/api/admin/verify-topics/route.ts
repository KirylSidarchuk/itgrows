import { NextRequest, NextResponse } from "next/server"
import { buildLinkedInPrompt } from "@/lib/linkedin-generate"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP verification: (1) the prompt really carries a topic plan, (2) an end-to-end LLM run
// returns posts that follow it. Token-gated. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const out: Row = {}
  try {
    const topics = "Why transformation programmes stall in year two\nWhat operations leaders get wrong about AI pilots\nHiring for change capability, not just experience"

    // 1) prompt contains the plan?
    const withTopics = buildLinkedInPrompt(
      { niche: "Enterprise Transformation", tone: "professional", goals: "thought leadership", targetAudience: "senior leaders", topics },
      3, false)
    const without = buildLinkedInPrompt(
      { niche: "Enterprise Transformation", tone: "professional", goals: "thought leadership", targetAudience: "senior leaders" },
      3, false)
    out.prompt_has_plan = withTopics.includes("TOPIC PLAN")
    out.prompt_without_plan_clean = !without.includes("TOPIC PLAN")
    out.plan_excerpt = withTopics.slice(withTopics.indexOf("TOPIC PLAN") - 20, withTopics.indexOf("TOPIC PLAN") + 320)

    // 2) round-trip through the DB column
    if (p.get("dbtest") === "yes") {
      const u = rows(await db.execute(sql`SELECT id FROM users WHERE lower(email)='kiryl.sidarchuk@gmail.com'`))[0]
      if (u) {
        const uid = u.id as string
        await db.execute(sql`UPDATE linkedin_briefs SET topics = ${topics} WHERE user_id = ${uid}`)
        const back = rows(await db.execute(sql`SELECT topics FROM linkedin_briefs WHERE user_id = ${uid}`))
        out.db_roundtrip = back.map((r) => (r.topics as string | null)?.split("\n").length ?? 0)
        await db.execute(sql`UPDATE linkedin_briefs SET topics = NULL WHERE user_id = ${uid}`)
        out.db_cleaned = true
      }
    }

    // 3) live LLM check — do the generated posts follow the plan?
    if (p.get("llm") === "yes") {
      const key = process.env.LLM_API_KEY ?? "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
      const r = await fetch("http://34.60.133.229:4000/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "gemini-2.5-flash-lite", messages: [{ role: "user", content: withTopics }] }),
      })
      const j = await r.json() as { choices?: { message?: { content?: string } }[] }
      const text = j.choices?.[0]?.message?.content ?? ""
      const lower = text.toLowerCase()
      out.llm_ok = !!text
      out.topic_hits = {
        year_two: lower.includes("year two") || lower.includes("second year"),
        ai_pilots: lower.includes("ai pilot") || lower.includes("pilots"),
        hiring_change: lower.includes("change capability") || lower.includes("hiring"),
      }
      out.sample = text.slice(0, 700)
    }
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, partial: out }, { status: 500 })
  }
}
