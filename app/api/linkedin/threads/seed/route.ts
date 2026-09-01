import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinPosts, postThreads } from "@/lib/db/schema"
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"
import { callLLM } from "@/lib/llm-client"

// Seed an author's lines of thinking from what they have already published.
//
// Runs once per account. After this a thread's state changes only when the author says it has —
// the seeding is a starting point, not a verdict, and every row it writes is marked as set by the
// system so the author's own answer can be told apart from a guess.
//
// Uses callLLM rather than the gateway directly, so it inherits the OpenAI fallback. The primary
// gateway has been returning a project-level 403 and anything calling it straight fails outright.

export const dynamic = "force-dynamic"
export const maxDuration = 300

const VALID = new Set(["question", "hypothesis", "evidence", "provisional", "challenge", "refinement"])

type Thread = { name: string; posts: number[]; state: string; position?: string }

export async function POST(req: NextRequest) {
  // Same token as the other admin surfaces. Seeding rewrites nothing an author wrote, but it does
  // read their whole corpus, so it stays behind a token rather than a session.
  const ADMIN_TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
  const secret = req.headers.get("x-admin-token") ?? new URL(req.url).searchParams.get("token")
  if (secret !== ADMIN_TOKEN && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { userId, force } = (await req.json().catch(() => ({}))) as { userId?: string; force?: boolean }
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const [account] = await db
    .select({ id: linkedinAccounts.id })
    .from(linkedinAccounts)
    .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.isActive, true)))
    .limit(1)
  if (!account) return NextResponse.json({ error: "no active account" }, { status: 404 })

  const existing = await db
    .select({ id: postThreads.id })
    .from(postThreads)
    .where(and(eq(postThreads.userId, userId), eq(postThreads.accountId, account.id)))
    .limit(1)
  if (existing.length && !force) {
    return NextResponse.json({ error: "already seeded; pass force to reseed" }, { status: 409 })
  }

  const posts = await db
    .select({ id: linkedinPosts.id, publishedAt: linkedinPosts.publishedAt, content: linkedinPosts.content })
    .from(linkedinPosts)
    .where(and(
      eq(linkedinPosts.linkedinAccountId, account.id),
      eq(linkedinPosts.status, "published"),
    ))
    .orderBy(asc(linkedinPosts.publishedAt))

  if (posts.length < 15) {
    return NextResponse.json({ error: `only ${posts.length} published posts — too few to find threads in` }, { status: 422 })
  }

  // Recent work, in excerpt. The full corpus crowded the response out and the model came back
  // with one thread; where a line of thinking stands now is visible in the recent work anyway,
  // and an excerpt is enough to tell which line a post belongs to.
  const CONSIDER = 60
  const EXCERPT = 700
  const considered = posts.slice(-CONSIDER)
  const corpus = considered
    .map((p, i) => `[${i + 1} | ${p.publishedAt?.toISOString().slice(0, 10) ?? ""}] ` +
      p.content.replace(/#[^\s#]+/g, "").replace(/\s+/g, " ").trim().slice(0, EXCERPT))
    .join("\n\n")

  const prompt = `Below are ${considered.length} LinkedIn posts by one author, numbered and in publication order.

Identify the LINES OF THINKING running through them. A line of thinking is not a topic label. Two
posts belong to the same line when the second develops, qualifies, illustrates or challenges the
first — not merely when they share vocabulary. Expect 6 to 10. Some posts belong to none, and that
is a real finding rather than an error.

For each, give:
- "name": 3-6 words, in the author's own register
- "posts": the numbers belonging to it
- "state": exactly one of question, hypothesis, evidence, provisional, challenge, refinement.
  Be strict and be pessimistic. Most lines of thinking on social media never get past
  "hypothesis"; say so when that is the case. Use "question" when something was raised and never
  returned to. Do not label something "provisional" or "refinement" unless the author visibly
  arrived somewhere and then tested it.
- "position": one sentence stating where the thinking currently stands, in the author's voice. If
  it has not arrived anywhere, say what it is circling.

Return ONLY valid JSON: {"threads": [...], "orphans": [post numbers]}

${corpus}`

  let raw = ""
  try {
    raw = await callLLM([{ role: "user", content: prompt }], { caller: "threads/seed", max_tokens: 8000, temperature: 0.3 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json({ error: "model did not return JSON" }, { status: 502 })

  let parsed: { threads?: Thread[]; orphans?: number[] }
  try {
    parsed = JSON.parse(m[0])
  } catch {
    return NextResponse.json({ error: "model returned malformed JSON" }, { status: 502 })
  }

  const threads = (parsed.threads ?? []).filter((t) => t?.name && Array.isArray(t.posts))
  if (!threads.length) return NextResponse.json({ error: "no threads found" }, { status: 422 })

  if (force) {
    await db.update(linkedinPosts).set({ threadId: null })
      .where(eq(linkedinPosts.linkedinAccountId, account.id))
    await db.delete(postThreads)
      .where(and(eq(postThreads.userId, userId), eq(postThreads.accountId, account.id)))
  }

  const written: { name: string; state: string; posts: number }[] = []
  for (const t of threads) {
    const state = VALID.has(t.state) ? t.state : "question"
    const [row] = await db.insert(postThreads).values({
      userId,
      accountId: account.id,
      name: t.name.slice(0, 120),
      state,
      position: t.position ?? null,
      stateSetBy: "system",
    }).returning({ id: postThreads.id })

    const ids = t.posts.filter((n) => n >= 1 && n <= considered.length).map((n) => considered[n - 1].id)
    if (ids.length) {
      await db.update(linkedinPosts).set({ threadId: row.id })
        .where(inArray(linkedinPosts.id, ids))
    }
    written.push({ name: t.name, state, posts: ids.length })
  }

  const unassigned = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(linkedinPosts)
    .where(and(
      eq(linkedinPosts.linkedinAccountId, account.id),
      eq(linkedinPosts.status, "published"),
      isNull(linkedinPosts.threadId),
    ))

  return NextResponse.json({
    postsRead: posts.length,
    threads: written,
    unassigned: unassigned[0]?.n ?? 0,
  })
}
