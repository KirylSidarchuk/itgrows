import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { callLLM } from "@/lib/llm-client"

// The onboarding email, sent automatically when someone requests access.
//
// It exists to remove the call. Everything a first conversation would establish — what the site
// is about, what it should be known for, what is technically missing — is either already in the
// audit or can be read off the site itself. What is left is one question the site cannot answer
// and one action for the customer, which is the whole message.
//
// The split matters: every factual claim about their site comes from the audit, computed. Only
// the topic list comes from a model, and it is presented as a draft to correct. A model is never
// allowed to assert anything about what we deliver or what results to expect.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const OWNER = "kiryl.sidarchuk@gmail.com"

interface Audit {
  site: string
  unreachable?: boolean
  robots?: { bots: { bot: string; verdict: string }[] }
  liveFetch?: { bot: string; blocked: boolean }[]
  surface?: { urlCount: number; isFloor: boolean }
  llmsTxt?: boolean
  structuredData?: { count: number }
  serverRenderedWords?: number
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))

/** Read enough of the site to propose topics that sound like the person who wrote it. */
async function readSite(origin: string): Promise<string> {
  const grab = async (u: string) => {
    try {
      const r = await fetch(u, {
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ItGrows/1.0)" },
      })
      return r.ok ? (await r.text()).slice(0, 120_000) : ""
    } catch {
      return ""
    }
  }

  const home = await grab(origin)
  const sitemap = await grab(`${origin}/sitemap.xml`)
  // Slugs are the cheapest, densest signal of what a site actually covers — far better than
  // marketing copy on the homepage.
  const slugs = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => m[1])
    .slice(0, 120)
    .map((u) => u.replace(origin, ""))
    .join("\n")

  const text = home
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000)

  return `HOMEPAGE TEXT:\n${text}\n\nEXISTING URLS:\n${slugs}`
}

async function proposeTopics(site: string, about: string, context: string) {
  const prompt = `You are preparing a proposal for ${site}.

Below is their homepage text and their existing article URLs. They said they want to be known for: "${about || "not stated"}".

${context}

Return JSON only:
{
  "language": "the ISO code of the language THEY publish in, read from the content — en, de, fr, etc.",
  "audience": "one short sentence: who reads this site",
  "territory": "one short sentence: the specific subject they own, narrower than a category",
  "topics": ["10 article titles"]
}

Rules for the topics:
- Write them IN THE LANGUAGE THEY PUBLISH IN, not in English, unless they publish in English.
- Fill gaps in what they already cover. Do not restate an article they clearly already have.
- Each title should be a question a buyer would actually type, or a claim a buyer would actually search for.
- Be specific to their jurisdiction, niche and audience. No generic marketing topics.
- No titles about AI, SEO or content marketing unless that is genuinely their subject.`

  const raw = await callLLM([{ role: "user", content: prompt }], {
    caller: "business-onboard",
    max_tokens: 1600,
    temperature: 0.6,
  })

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("no JSON in topic proposal")
  return JSON.parse(match[0]) as {
    language?: string
    audience?: string
    territory?: string
    topics?: string[]
  }
}

function findings(a: Audit): string[] {
  const out: string[] = []
  const blocked = [
    ...(a.robots?.bots ?? []).filter((b) => b.verdict === "blocked").map((b) => b.bot),
    ...(a.liveFetch ?? []).filter((b) => b.blocked).map((b) => b.bot),
  ]

  if (blocked.length) {
    out.push(`<strong style="color:#b91c1c">Your site is turning away ${esc(blocked.join(", "))}.</strong> Nothing else matters until that changes, and it is usually one setting.`)
  } else {
    out.push(`GPTBot, ClaudeBot and PerplexityBot are all allowed in, and your server answers them properly. Plenty of sites block them at the CDN without knowing — yours does not.`)
  }

  const n = a.surface?.urlCount ?? 0
  if (n > 0) {
    out.push(`You have ${a.surface?.isFloor ? "at least " : ""}<strong>${n.toLocaleString()}</strong> pages an engine can find from your sitemap.`)
  } else {
    out.push(`We could not find a sitemap, so the engines have to discover your pages by following links.`)
  }

  const words = a.serverRenderedWords ?? 0
  if (words > 0 && words < 200) {
    out.push(`<strong style="color:#b91c1c">Only ${words} words arrive in the raw HTML.</strong> The crawlers are poor at running JavaScript, so most of your writing is invisible to them.`)
  } else if (words >= 200) {
    out.push(`About ${words.toLocaleString()} words arrive without JavaScript, which is what the crawlers need.`)
  }

  if (!a.structuredData?.count) {
    out.push(`<strong>No structured data.</strong> An assistant reading a page has to guess what is the article, what is the author and what is navigation.`)
  }
  if (!a.llmsTxt) {
    out.push(`<strong>No llms.txt</strong> — the one file that tells an assistant what the whole site is, in a single fetch.`)
  }
  return out
}

export async function POST(req: NextRequest) {
  // Internal only: called from the lead route after a request is stored.
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { email?: string; name?: string; website?: string; about?: string; audit?: Audit }
  const email = (body.email ?? "").trim()
  const website = (body.website ?? "").trim()
  const audit = body.audit ?? ({ site: website } as Audit)

  if (!email.includes("@") || !website) {
    return NextResponse.json({ error: "email and website required" }, { status: 400 })
  }

  let origin = website
  if (!/^https?:\/\//i.test(origin)) origin = "https://" + origin
  origin = origin.replace(/\/+$/, "")

  let proposal
  try {
    const context = await readSite(origin)
    proposal = await proposeTopics(audit.site || website, body.about ?? "", context)
  } catch (err) {
    // Without topics there is no proposal worth sending — better that a human writes than that
    // a stranger gets a half-finished email with our name on it.
    console.error("[onboard] topic proposal failed:", err)
    await db.execute(sql`
      INSERT INTO analytics_events (event, path, props)
      VALUES ('onboard_failed', '/business', ${JSON.stringify({ email, website, error: String(err).slice(0, 300) })}::jsonb)`).catch(() => {})
    return NextResponse.json({ ok: false, reason: "proposal-failed" })
  }

  const topics = (proposal.topics ?? []).slice(0, 10)
  const first = (body.name ?? "").trim().split(/\s+/)[0] || "there"

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1b1916;max-width:640px">
<p>Hi ${esc(first)},</p>

<p>Thanks for the request. I looked at ${esc(audit.site || website)} before writing, so this is specific rather than generic.</p>

<p><strong>What the check found</strong></p>
<ul>${findings(audit).map((f) => `<li style="margin-bottom:6px">${f}</li>`).join("")}</ul>

<p>The structured data and the llms.txt are both part of the setup we do at no extra cost in your first month.</p>

<p><strong>What we would write for you</strong></p>
<p style="color:#555">${esc(proposal.territory ?? "")}${proposal.audience ? " — for " + esc(proposal.audience) : ""}</p>
<ol>${topics.map((t) => `<li style="margin-bottom:5px">${esc(t)}</li>`).join("")}</ol>

<p style="background:#f5f3ff;border-left:3px solid #7c3aed;padding:12px 14px;margin:20px 0">
<strong>This list is a draft, and the fastest thing you can do is correct it.</strong>
Reply with "go" if it is close, or tell me what to cut, add or narrow. That is the whole
briefing — no call needed.
</p>

<p>Once you reply I will send the one technical step for your site, which takes about half an hour
of whoever maintains it, and then articles start.</p>

<p>— Kiryl<br><span style="color:#888">ItGrows</span></p>
</div>`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: "Kiryl at ItGrows <noreply@itgrows.ai>",
      to: email,
      cc: OWNER,
      replyTo: OWNER,
      subject: `${audit.site || website} — what we found, and what we'd write`,
      html,
    })
  } catch (err) {
    console.error("[onboard] send failed:", err)
    return NextResponse.json({ ok: false, reason: "send-failed" })
  }

  await db.execute(sql`
    INSERT INTO analytics_events (event, path, props)
    VALUES ('onboard_sent', '/business', ${JSON.stringify({
      email,
      website,
      language: proposal.language,
      topics: topics.length,
    })}::jsonb)`).catch(() => {})

  return NextResponse.json({ ok: true, topics: topics.length, language: proposal.language })
}
