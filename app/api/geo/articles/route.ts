import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts, connectedSites, scheduledPosts } from "@/lib/db/schema"
import { geoRole } from "@/lib/geo-role"
import { pickPublishSite } from "@/lib/publish-post"
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm"
import { reviewState, utcToday } from "./_shared"

// The articles we plan and publish for the signed-in client, newest first, with the site each one
// goes to. Only what the "Your articles" list shows: never the article text, tokens or passwords.
// The text of one article, and what the client can do with it, is at /api/geo/articles/<id>.

export const dynamic = "force-dynamic"

interface ArticleSite {
  key: string
  name: string
  url: string
  platform: string
  /** A WordPress site whose owner approves each article: we create drafts, not live posts. */
  draft: boolean
}

interface ArticleItem {
  id: string
  scheduledDate: string
  title: string
  status: string
  publishedAt: string | null
  publishedUrl: string | null
  language: string
  /** Why a planned article was dropped, when we know: "duplicate" = same topic as one already out;
   *  "stopped" = the client stopped it. */
  note: "duplicate" | "stopped" | null
  /** Sent as a WordPress draft and not live yet, as far as we can tell. */
  awaitingApproval: boolean
  /** Written and waiting for its date: the client can open, edit, publish now or stop it. */
  review: boolean
  /** The day it goes live if nothing is done. */
  liveDate: string
  /** Stopped by the client and its date has not come yet: the stop can be taken back. */
  canUndo: boolean
  /** The client changed the title, description or text. */
  edited: boolean
  site: ArticleSite | null
}

const webUrl = (u: string | null) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : null)

// WordPress gives a draft the plain "?p=123" address; a post gets its own address once it is live.
const draftPostId = (u: string | null) => (u ? (/[?&]p=(\d+)(?:&|#|$)/.exec(u)?.[1] ?? null) : null)

// Drafts checked per page load. Each approved one is saved below, so the list only shrinks.
const MAX_DRAFT_CHECKS = 10

/**
 * Whether a draft we sent has since been approved: WordPress shows a post to anyone only once it is
 * published, so its public API answers with the live address then and refuses before. Null when it
 * is still a draft, was removed, or the site did not answer in time.
 */
async function liveLink(siteUrl: string, postId: string): Promise<string | null> {
  let base = siteUrl.trim().replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(base)) base = "https://" + base
  try {
    const r = await fetch(`${base}/wp-json/wp/v2/posts/${postId}?_fields=link,status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return null
    const j = (await r.json()) as { link?: unknown; status?: unknown }
    return j.status === "publish" ? webUrl(typeof j.link === "string" ? j.link : null) : null
  } catch {
    return null
  }
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const sites = await db
      .select({
        id: connectedSites.id,
        name: connectedSites.name,
        url: connectedSites.url,
        platform: connectedSites.platform,
        isDefault: connectedSites.isDefault,
        createdAt: connectedSites.createdAt,
        publishStatus: sql<string | null>`${connectedSites.siteProfile}->>'publishStatus'`,
      })
      .from(connectedSites)
      .where(eq(connectedSites.userId, userId))
      .orderBy(asc(connectedSites.createdAt))

    const siteInfo = new Map<string, ArticleSite>(
      sites.map((s) => [
        s.id,
        {
          key: s.id,
          name: s.name,
          url: s.url,
          platform: s.platform,
          // The publisher makes drafts on both WordPress paths (application password and plugin).
          draft: s.platform === "wordpress" && s.publishStatus === "draft",
        },
      ])
    )
    // The site the publishing cron sends every article to.
    const fallback = pickPublishSite(sites)
    const defaultSite = fallback ? siteInfo.get(fallback.id) ?? null : null

    const posts = await db
      .select({
        id: scheduledPosts.id,
        scheduledDate: scheduledPosts.scheduledDate,
        keyword: scheduledPosts.keyword,
        title: sql<string | null>`${scheduledPosts.articleData}->>'title'`,
        status: scheduledPosts.status,
        publishedAt: scheduledPosts.publishedAt,
        publishedUrl: scheduledPosts.publishedUrl,
        publishError: scheduledPosts.publishError,
        language: scheduledPosts.language,
        skippedAsDuplicate: sql<boolean>`(${scheduledPosts.status} = 'skipped' AND coalesce(${scheduledPosts.publishError}, '') LIKE 'duplicate topic%')`,
        // A finished article from the writer on the VM (what lib/publish-post.ts publishes as is).
        prepared: sql<boolean>`(${scheduledPosts.articleData}->>'preparedBy' = 'vm-writer'
          AND coalesce(${scheduledPosts.articleData}->>'title', '') <> ''
          AND coalesce(${scheduledPosts.articleData}->>'content', '') <> '')`,
        edited: sql<boolean>`(${scheduledPosts.articleData}->>'editedAt' IS NOT NULL)`,
        // The only site reference a row can carry: the copy it left on a blog we serve.
        siteId: blogPosts.siteId,
      })
      .from(scheduledPosts)
      .leftJoin(blogPosts, and(eq(blogPosts.slug, scheduledPosts.blogPostSlug), eq(blogPosts.userId, scheduledPosts.userId)))
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledDate), desc(scheduledPosts.createdAt))

    const today = utcToday()
    const articles: ArticleItem[] = posts.map((p) => {
      const site = (p.siteId ? siteInfo.get(p.siteId) : undefined) ?? defaultSite
      const publishedUrl = webUrl(p.publishedUrl)
      const state = reviewState(p, Boolean(p.prepared), Boolean(site?.draft), today)
      return {
        id: p.id,
        scheduledDate: p.scheduledDate,
        title: p.title?.trim() || p.keyword,
        status: p.status,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        publishedUrl,
        language: p.language,
        note: p.skippedAsDuplicate ? "duplicate" : state.stopped ? "stopped" : null,
        // A draft site's article is waiting until it has a live address of its own.
        awaitingApproval: p.status === "published" && Boolean(site?.draft) && (!publishedUrl || draftPostId(publishedUrl) !== null),
        review: state.review,
        liveDate: state.liveDate,
        canUndo: state.canUndo,
        edited: Boolean(p.edited),
        site,
      }
    })

    // Drafts approved since we sent them: ask the site, and keep the live address once it has one.
    const toCheck = articles
      .filter((a) => a.awaitingApproval && a.site && draftPostId(a.publishedUrl))
      .slice(0, MAX_DRAFT_CHECKS)
    await Promise.all(
      toCheck.map(async (a) => {
        const link = await liveLink(a.site!.url, draftPostId(a.publishedUrl)!)
        if (!link) return
        a.publishedUrl = link
        a.awaitingApproval = false
        await db
          .update(scheduledPosts)
          .set({ publishedUrl: link })
          .where(and(eq(scheduledPosts.id, a.id), eq(scheduledPosts.userId, userId)))
          .catch((e) => console.warn("[geo/articles] saving live link failed:", e instanceof Error ? e.message : e))
      })
    )

    // Articles a writer put on the user's blog without the queue. Since 15 Oct 2026 our own blogs are
    // written that way (own_geo_writer straight into blog_posts), so they never had a queue row and the
    // list missed them. Pages merged into newer ones (redirect_to) are left out; an article the queue
    // already lists (same title) is not repeated.
    const listed = new Set(articles.map((a) => a.title.trim().toLowerCase()))
    const direct = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, siteSlug: blogPosts.siteSlug, siteId: blogPosts.siteId,
                publishedAt: blogPosts.publishedAt, blogDomain: connectedSites.blogDomain })
      .from(blogPosts)
      .leftJoin(connectedSites, and(eq(connectedSites.id, blogPosts.siteId), eq(connectedSites.userId, userId)))
      .where(and(eq(blogPosts.userId, userId), isNull(blogPosts.redirectTo), gte(blogPosts.publishedAt, new Date("2026-10-15T00:00:00Z"))))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(200)
    for (const b of direct) {
      if (listed.has(b.title.trim().toLowerCase())) continue
      const url =
        b.siteSlug === "itgrows-business" ? `https://www.itgrows.ai/business/blog/${b.slug}`
        : b.siteSlug === "itgrows" ? `https://www.itgrows.ai/blog/${b.slug}`
        : b.blogDomain ? `https://${b.blogDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${b.slug}`
        : null
      const day = b.publishedAt.toISOString().slice(0, 10)
      articles.push({
        id: `blog:${b.slug}`,
        scheduledDate: day,
        title: b.title,
        status: "published",
        publishedAt: b.publishedAt.toISOString(),
        publishedUrl: url,
        language: "en",
        note: null,
        awaitingApproval: false,
        review: false,
        liveDate: day,
        canUndo: false,
        edited: false,
        site: (b.siteId ? siteInfo.get(b.siteId) : undefined) ?? defaultSite,
      })
    }
    articles.sort((x, y) => (y.publishedAt ?? y.scheduledDate).localeCompare(x.publishedAt ?? x.scheduledDate))

    // Only a GEO client (geo_clients or a paid followed site) gets the client copy. Having queue or
    // blog rows proves nothing: LinkedIn/X blog users have them too.
    const client = (await geoRole(userId)).client

    return NextResponse.json({ articles, client })
  } catch (e) {
    console.error("[geo/articles]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
