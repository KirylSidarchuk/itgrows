import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { blogPosts, connectedSites, scheduledPosts } from "@/lib/db/schema"
import { geoRole } from "@/lib/geo-role"
import { and, asc, desc, eq, sql } from "drizzle-orm"

// The articles we plan and publish for the signed-in client, newest first, with the site each one
// goes to. Only what the "Your articles" page shows: never the article text, tokens or passwords.

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
  /** Why a planned article was dropped, when we know: "duplicate" = same topic as one already out. */
  note: "duplicate" | null
  /** Sent as a WordPress draft and not live yet, as far as we can tell. */
  awaitingApproval: boolean
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
        hasWpPassword: sql<boolean>`(coalesce(${connectedSites.wpUsername}, '') <> '' AND coalesce(${connectedSites.wpAppPassword}, '') <> '')`,
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
          // Drafts are made only on the application-password path, as the publishing cron does.
          draft: s.platform === "wordpress" && Boolean(s.hasWpPassword) && s.publishStatus === "draft",
        },
      ])
    )
    // The site the publishing cron sends every article to.
    const fallback = sites.find((s) => s.isDefault) ?? sites[0]
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
        language: scheduledPosts.language,
        skippedAsDuplicate: sql<boolean>`(${scheduledPosts.status} = 'skipped' AND coalesce(${scheduledPosts.publishError}, '') LIKE 'duplicate topic%')`,
        // The only site reference a row can carry: the copy it left on a blog we serve.
        siteId: blogPosts.siteId,
      })
      .from(scheduledPosts)
      .leftJoin(blogPosts, and(eq(blogPosts.slug, scheduledPosts.blogPostSlug), eq(blogPosts.userId, scheduledPosts.userId)))
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledDate), desc(scheduledPosts.createdAt))

    const articles: ArticleItem[] = posts.map((p) => {
      const site = (p.siteId ? siteInfo.get(p.siteId) : undefined) ?? defaultSite
      const publishedUrl = webUrl(p.publishedUrl)
      return {
        id: p.id,
        scheduledDate: p.scheduledDate,
        title: p.title?.trim() || p.keyword,
        status: p.status,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        publishedUrl,
        language: p.language,
        note: p.skippedAsDuplicate ? "duplicate" : null,
        // A draft site's article is waiting until it has a live address of its own.
        awaitingApproval: p.status === "published" && Boolean(site?.draft) && (!publishedUrl || draftPostId(publishedUrl) !== null),
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

    // Someone without a site we publish to and no paid plan has no articles coming: the page says so
    // instead of promising any.
    const client = articles.length > 0 || (await geoRole(userId)).client

    return NextResponse.json({ articles, client })
  } catch (e) {
    console.error("[geo/articles]", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
