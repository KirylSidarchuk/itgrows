import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledPosts } from "@/lib/db/schema"
import { sendOwner } from "@/lib/telegram"
import { and, eq, sql } from "drizzle-orm"
import {
  bodyOf,
  cleanArticleHtml,
  cleanLine,
  isDraftSite,
  ownArticle,
  preparedData,
  publishSiteFor,
  reviewState,
  textOf,
  withTitle,
  type PublishSite,
} from "../_shared"

// One article of the signed-in client. GET: the article as it will go out (cover, title, search
// description, text) and what can be done with it. PATCH: save the client's edit of the title,
// description and text while the article waits for its date. Only the row's owner reaches either;
// any other account gets "not found".

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }
type Row = typeof scheduledPosts.$inferSelect

const MAX_HTML = 300_000
const MIN_TEXT = 200

const webUrl = (u: unknown) => (typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u.trim() : null)

function articleView(row: Row, site: PublishSite | null) {
  const data = (row.articleData ?? {}) as { title?: unknown; content?: unknown; metaDescription?: unknown; coverImageUrl?: unknown; editedAt?: unknown }
  const draftSite = isDraftSite(site)
  const prepared = preparedData(row.articleData) !== null
  const state = reviewState(row, prepared, draftSite)
  const content = typeof data.content === "string" ? data.content : ""
  return {
    id: row.id,
    title: (typeof data.title === "string" && data.title.trim()) || row.keyword,
    metaDescription: typeof data.metaDescription === "string" ? data.metaDescription : "",
    // Null until the article is written: a planned topic has only its keyword.
    body: content ? cleanArticleHtml(bodyOf(content).body) : null,
    coverImageUrl: webUrl(data.coverImageUrl) ?? webUrl(row.coverImageUrl),
    scheduledDate: row.scheduledDate,
    status: row.status,
    language: row.language,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    publishedUrl: webUrl(row.publishedUrl),
    edited: typeof data.editedAt === "string",
    site: site ? { name: site.name, url: site.url, draft: draftSite } : null,
    ...state,
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const own = await ownArticle(id)
    if ("status" in own) return NextResponse.json({ error: own.status === 401 ? "unauthorized" : "not_found" }, { status: own.status })
    const site = await publishSiteFor(own.userId)
    return NextResponse.json({ article: articleView(own.row, site) })
  } catch (e) {
    console.error("[geo/articles/id] GET", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  let input: { title?: unknown; metaDescription?: unknown; content?: unknown }
  try {
    input = (await req.json()) as typeof input
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  try {
    const own = await ownArticle(id)
    if ("status" in own) return NextResponse.json({ error: own.status === 401 ? "unauthorized" : "not_found" }, { status: own.status })
    const { userId, row } = own
    const site = await publishSiteFor(userId)
    const prepared = preparedData(row.articleData)
    if (isDraftSite(site)) return NextResponse.json({ error: "draft_site" }, { status: 409 })
    if (row.status !== "scheduled" || !prepared) return NextResponse.json({ error: "not_editable" }, { status: 409 })

    const title = cleanLine(input.title, 200)
    const metaDescription = cleanLine(input.metaDescription, 320)
    if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 })
    if (typeof input.content !== "string" || input.content.length > MAX_HTML) {
      return NextResponse.json({ error: "text_invalid" }, { status: 400 })
    }
    const body = cleanArticleHtml(input.content)
    if (textOf(body).length < MIN_TEXT) return NextResponse.json({ error: "text_too_short" }, { status: 400 })

    const before = bodyOf(prepared.content!)
    const unchanged =
      title === prepared.title &&
      metaDescription === (prepared.metaDescription ?? "") &&
      body === cleanArticleHtml(before.body)
    if (!unchanged) {
      const patch = {
        title,
        metaDescription,
        content: withTitle(body, title, before.hasH1),
        editedAt: new Date().toISOString(),
      }
      // Merged into article_data, so everything else on it (sources, cover, the review notice) stays.
      // Only while it still waits: an article the publisher has picked up is not changed under it.
      const saved = await db
        .update(scheduledPosts)
        .set({ articleData: sql`coalesce(${scheduledPosts.articleData}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb` })
        .where(and(
          eq(scheduledPosts.id, row.id),
          eq(scheduledPosts.userId, userId),
          eq(scheduledPosts.status, "scheduled"),
          sql`${scheduledPosts.articleData}->>'preparedBy' = 'vm-writer'`,
        ))
        .returning({ id: scheduledPosts.id })
      if (saved.length === 0) return NextResponse.json({ error: "not_editable" }, { status: 409 })
      if (!prepared.editedAt) {
        await sendOwner(`✏️ Клиент правит статью перед выходом: ${site?.name ?? "?"} · «${title}» (выйдет ${row.scheduledDate})`)
      }
    }

    const [fresh] = await db
      .select()
      .from(scheduledPosts)
      .where(and(eq(scheduledPosts.id, row.id), eq(scheduledPosts.userId, userId)))
      .limit(1)
    return NextResponse.json({ ok: true, article: articleView(fresh ?? row, site) })
  } catch (e) {
    console.error("[geo/articles/id] PATCH", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
