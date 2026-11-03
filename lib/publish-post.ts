import { db } from "@/lib/db"
import { scheduledPosts, connectedSites, blogPosts, users } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { draftReadyEmail } from "@/lib/email-templates"
import { eq, and, sql } from "drizzle-orm"
import { publishToWordPress, canUseAppPassword } from "@/lib/wordpress-publish"
import { slugBase } from "@/lib/slug"
import { storeAndRecordImage } from "@/lib/image-store"
import { extractFaq, faqJsonLd } from "@/lib/faq-schema"
import { sendOwner } from "@/lib/telegram"

// Publishing one scheduled article: the body of the nightly cron (app/api/cron/publish-scheduled),
// moved here unchanged so "Publish now" in the client's "Your articles" goes through exactly the same
// path for every platform. The one addition: a row is claimed (scheduled -> generating) only if it is
// still "scheduled", and the claimed row is the one published, so a client's last edit, Stop or
// "Publish now" racing the cron can never publish twice or publish the text from before the edit.

export type ScheduledPost = typeof scheduledPosts.$inferSelect
type Site = typeof connectedSites.$inferSelect
type SiteProfile = { niche?: string; targetAudience?: string; productName?: string; brandMentions?: string; publishStatus?: "publish" | "draft"; language?: string; titleInContent?: boolean }

export interface PublishContext {
  baseUrl: string
  /** CRON_SECRET: the article generator and the batch scheduler accept our internal calls with it. */
  cronSecret: string
  // Site data per userId, so a run with many posts of one user queries it once.
  siteCache: Record<string, Site | null>
  siteProfileCache: Record<string, SiteProfile | null>
}

export function publishContext(cronSecret: string): PublishContext {
  return {
    baseUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    cronSecret,
    siteCache: {},
    siteProfileCache: {},
  }
}

export interface ProcessedPost {
  id: string
  keyword: string
  status: string
  error?: string
}

export type PublishOutcome =
  /** The row was no longer "scheduled" when we came to it: someone else has it. Nothing was done. */
  | { claimed: false }
  | {
      claimed: true
      processed: ProcessedPost
      /** The failures the cron reports in Telegram. */
      error: { id: string; keyword: string; error: string } | null
      /** Counts toward "schedule the next batch when none is left", as the cron always counted. */
      counted: boolean
    }

// Since 26 Oct 2026 (Kiryl) no article is written through a paid API: they are written in a Claude
// session and stored on the row ready to publish (/root/blog_engine/session_stock.py save, which
// marks them preparedBy "vm-writer" like the VM writer did). A due post without one is not generated
// here any more. It waits: it stays "scheduled" with this note, the next run publishes it once the
// article is stored, and Kiryl gets one Telegram line per post (the note is the flag that keeps later
// runs quiet). The client's "Your articles" shows it as queued, as before.
export const WAITING_FOR_ARTICLE = "waiting for the article"

// Accounts whose due posts may still go through the old generator (/api/seo/generate): SEO-autopilot
// users outside the GEO plan, if Kiryl decides to keep them on it. On 26 Oct 2026 every post due in
// the next 30 days belonged to a GEO client (MagiScan, FreightSizer, firma-ausland), so nobody does.
const GENERATE_FOR_USERS: ReadonlySet<string> = new Set<string>([])

/** The site every article of a user is published to, the one rule for the nightly publisher, "Publish
 *  now" and the "Your articles" pages: the user's default site, else the oldest connected one. */
export function pickPublishSite<T extends Pick<Site, "id" | "isDefault" | "createdAt">>(sites: readonly T[]): T | null {
  const oldestFirst = [...sites].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
  return oldestFirst.find((s) => s.isDefault) ?? oldestFirst[0] ?? null
}

/** The site this user's articles are published to (pickPublishSite over their connected sites). */
export async function publishSiteFor(userId: string): Promise<Site | null> {
  const sites = await db.select().from(connectedSites).where(eq(connectedSites.userId, userId))
  return pickPublishSite(sites)
}

function generateSlug(t: string): string {
  return slugBase(t) + "-" + Math.random().toString(36).slice(2, 8)
}

// Where an article on a blog we serve can be read: the public blog address when the blog sits
// under a path of the client's own domain (www.itgrows.ai/blog), otherwise the blog's own host.
// Null when neither is set. Stored as published_url so the client's cabinet can link to it.
function blogArticleUrl(s: Site, slug: string): string | null {
  let publicBase = s.blogPublicUrl?.trim().replace(/\/+$/, "") ?? ""
  if (publicBase && !/^https?:\/\//i.test(publicBase)) publicBase = "https://" + publicBase
  if (publicBase) return `${publicBase}/${slug}`
  const host = s.blogDomain?.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "")
  return host ? `https://${host}/${slug}` : null
}

// A receiver's answer is only kept when it is a web address (relative paths resolve against the
// site), so nothing else ever ends up behind the cabinet's "Open" link.
function receivedUrl(u: unknown, siteUrl: string): string | null {
  if (typeof u !== "string" || !u.trim()) return null
  const v = u.trim()
  if (!/^https?:\/\//i.test(v) && !v.startsWith("/")) return null
  try {
    const parsed = new URL(v, siteUrl + "/")
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null
  } catch {
    return null
  }
}

/** "Draft ready" to the one person who has to approve it. When the email does not go out the draft sits
 *  in WordPress with nobody told, so Kiryl hears it once, with the link he can pass on, and the row keeps a
 *  note. The account's name goes in the greeting only when it is a person's: an account named after the
 *  site reads "Guten Tag Firma Ausland" otherwise. */
async function sendDraftNotice(post: ScheduledPost, site: Site, language: string | undefined, title: string, editUrl: string): Promise<void> {
  // The draft is in WordPress by now. Nothing here may fail the row: the cron would send it a second time.
  let error: unknown
  let to = "адрес не прочитан"
  try {
    const [owner] = await db.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, post.userId)).limit(1)
    if (!owner?.email) return
    to = owner.email
    const name = owner.name?.trim() ?? ""
    const sent = await sendEmail({
      to: owner.email,
      subject: (language ?? "").toLowerCase().startsWith("de")
        ? `Entwurf zur Freigabe: ${title}`
        : `Draft ready for your approval: ${title}`,
      html: draftReadyEmail(name.toLowerCase() === site.name.trim().toLowerCase() ? null : name || null, title, editUrl, language),
    })
    if (sent.ok) return
    error = sent.error ?? "unknown"
    await db.update(scheduledPosts)
      .set({ publishError: `draft notice not sent: ${error}`.slice(0, 500) })
      .where(eq(scheduledPosts.id, post.id))
  } catch (err) {
    error ??= (err instanceof Error ? err.message : String(err)).split("\n")[0]
  }
  console.error(`[SEO Autopilot] draft notice not sent for post ${post.id}: ${error}`)
  await sendOwner(
    `⚠️ Письмо «черновик готов» не ушло: ${to}, «${title}».\n${error}\nЧерновик в WordPress лежит: ${editUrl}`,
  )
}

/** The "Last check" on "Your website": the receiver just took the article. That is out now, so a failed
 *  write of this line is a warning, never a failed row: the cron would publish it a second time. */
async function saveLastCheck(siteId: string): Promise<void> {
  await db.update(connectedSites).set({ lastCheckedAt: new Date(), lastCheckOk: true }).where(eq(connectedSites.id, siteId))
    .catch((e) => console.warn("[SEO Autopilot] last check not saved:", e))
}

/** Publishes one scheduled post to the user's site. Never throws: a failure is saved on the row. */
export async function publishScheduledPost(duePost: ScheduledPost, ctx: PublishContext): Promise<PublishOutcome> {
  let post = duePost
  try {
    // Validate keyword before processing
    const kw = (post.keyword ?? "").trim()
    if (!kw || kw.includes("[")) {
      await db
        .update(scheduledPosts)
        .set({ status: "failed", publishError: "invalid_keyword: keyword is empty or contains placeholder" })
        .where(eq(scheduledPosts.id, post.id))
      return {
        claimed: true,
        error: { id: post.id, keyword: post.keyword, error: "invalid_keyword" },
        processed: { id: post.id, keyword: post.keyword, status: "failed", error: "invalid_keyword" },
        counted: false,
      }
    }

    // Mark as generating, only if it is still waiting: the row as it is now (with the client's last
    // edit) is the one published.
    const [claimed] = await db
      .update(scheduledPosts)
      .set({ status: "generating" })
      .where(and(eq(scheduledPosts.id, post.id), eq(scheduledPosts.status, "scheduled")))
      .returning()
    if (!claimed) return { claimed: false }
    post = claimed

    // Fetch site data for this user (cached)
    if (!(post.userId in ctx.siteCache)) {
      const defaultSite = await publishSiteFor(post.userId)
      ctx.siteCache[post.userId] = defaultSite
      const rawProfile = defaultSite?.siteProfile as SiteProfile | null | undefined
      ctx.siteProfileCache[post.userId] = rawProfile ?? null
    }

    const site = ctx.siteCache[post.userId]
    const siteProfile = ctx.siteProfileCache[post.userId]
    const siteContext = siteProfile?.niche
      ? { niche: siteProfile.niche, targetAudience: siteProfile.targetAudience, productName: siteProfile.productName, brandMentions: siteProfile.brandMentions }
      : undefined

    // Skip if site integration has not been verified
    // itgrows_blog = internal blog (no verification needed)
    // custom = CNAME blog served by blogs.itgrows.ai (no external endpoint to verify)
    const isHostedBlog = !site || site.platform === "itgrows_blog" || (site.platform === "custom" && !!site.blogDomain)
    // An application password is authenticated by WordPress on every publish, so the plugin
    // ping this gate was built for says nothing about it. Requiring it here failed a customer
    // whose credentials worked, every night, in silence.
    if (site && !isHostedBlog && !canUseAppPassword(site) && site.lastCheckOk !== true) {
      await db.update(scheduledPosts)
        .set({ status: "failed", publishError: "Site integration not verified. Please complete setup in Settings." })
        .where(eq(scheduledPosts.id, post.id))
      return {
        claimed: true,
        error: { id: post.id, keyword: post.keyword, error: "Site integration not verified" },
        processed: { id: post.id, keyword: post.keyword, status: "failed", error: "Site integration not verified" },
        counted: false,
      }
    }

    type Article = {
      keyword: string
      title: string
      content: string
      metaDescription: string
      keywords: string[]
      coverImageUrl?: string
    }

    // An article written ahead of time (blog_engine/client_writer.py, or since 26 Oct 2026 a Claude
    // session through blog_engine/session_stock.py: sources checked, editor-reviewed) is published as
    // it is — with the client's edits, if they made any in "Your articles". Without one the post
    // waits for it (WAITING_FOR_ARTICLE); only GENERATE_FOR_USERS still get the old generator.
    // rewriteOf / targetSlug: set by the VM writer when the article replaces one already published
    // (our blog_posts slug, and the file name the client's receiver has it under).
    const prepared = post.articleData as (Partial<Article> & { preparedBy?: string; rewriteOf?: string; targetSlug?: string }) | null
    // A rewrite on a webhook site (MagiScan) keeps the page's address: the receiver updates that page
    // in place, keeping its publish date, and our row for it is updated instead of a new one added.
    // Older MagiScan pages have a different name on their side than our slug, hence two slugs.
    // A rewrite that can't be done that way fails here, before anything is generated or sent:
    // published as a new article it would be a second copy of the page there and a second row here.
    let rewrite: { rowSlug: string; pageSlug: string; pageUrl: string | null } | null = null
    if (prepared?.rewriteOf) {
      const rowSlug = prepared.rewriteOf
      const pageSlug = prepared.targetSlug ?? ""
      const fail = (why: string) => new Error(`Rewrite of ${rowSlug} not published: ${why}`)
      if (prepared.preparedBy !== "vm-writer" || !prepared.title || !prepared.content) throw fail("no prepared article")
      if (!site || (site.platform !== "octobercms" && site.platform !== "php")) throw fail("only a webhook site updates a page in place")
      if (!/^[a-z0-9-]+$/.test(pageSlug)) throw fail("missing or invalid targetSlug")
      const [row] = await db.select({ id: blogPosts.id }).from(blogPosts)
        .where(and(eq(blogPosts.slug, rowSlug), eq(blogPosts.siteId, site.id)))
        .limit(1)
      if (!row) throw fail("no such article of this site")
      // Only once their receiver updates pages in place: it is what writes blog-sitemap.xml, from the
      // pages it lists and without redirected ones. Before that, a rewrite would be a second card
      // with today's date.
      let siteBase = site.url.trim().replace(/\/+$/, "")
      if (!/^https?:\/\//i.test(siteBase)) siteBase = "https://" + siteBase
      const listed = await fetch(`${siteBase}/blog-sitemap.xml`, { signal: AbortSignal.timeout(15000) })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => "")
      if (!listed.includes(`/${pageSlug}.html</loc>`)) throw fail(`${pageSlug} is not in ${siteBase}/blog-sitemap.xml`)
      // Its address as their sitemap gives it: what the row keeps even if the receiver names none below.
      const pageUrl = new RegExp(`<loc>\\s*(https?://[^<\\s]*/${pageSlug}\\.html)</loc>`).exec(listed)?.[1] ?? null
      rewrite = { rowSlug, pageSlug, pageUrl }
    }
    let article: Article
    if (prepared?.preparedBy === "vm-writer" && prepared.title && prepared.content) {
      article = {
        keyword: post.keyword,
        title: prepared.title,
        content: prepared.content,
        metaDescription: prepared.metaDescription ?? "",
        keywords: prepared.keywords ?? [],
        coverImageUrl: prepared.coverImageUrl ?? undefined,
      }
    } else if (!GENERATE_FOR_USERS.has(post.userId)) {
      // No article yet and no generator for this account: back to "scheduled", nothing else changed,
      // until the session stores the article. Only the run that claimed the row gets here, so the
      // note seen on the claimed row decides alone whether this is the first time (one line per post).
      await db
        .update(scheduledPosts)
        .set({ status: "scheduled", publishError: WAITING_FOR_ARTICLE })
        .where(and(eq(scheduledPosts.id, post.id), eq(scheduledPosts.status, "generating")))
      if (post.publishError !== WAITING_FOR_ARTICLE) {
        await sendOwner(
          `📝 Статьи нет, публикация ждёт: ${site?.name ?? site?.siteSlug ?? "сайт не найден"} · ${post.scheduledDate} · «${post.keyword}». ` +
            "Напиши её в сессии (session_stock.py todo), следующий запуск опубликует.",
        )
      }
      return {
        claimed: true,
        error: null,
        processed: { id: post.id, keyword: post.keyword, status: "waiting", error: WAITING_FOR_ARTICLE },
        counted: false,
      }
    } else {
      // Generate article (internal call — pass secret to bypass user session check)
      const genRes = await fetch(`${ctx.baseUrl}/api/seo/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": ctx.cronSecret,
        },
        body: JSON.stringify({ keyword: post.keyword, language: post.language, tone: post.tone, siteContext }),
      })

      if (!genRes.ok) {
        const err = (await genRes.json()) as { error?: string }
        throw new Error(err.error ?? "Failed to generate article")
      }

      article = (await genRes.json()) as Article
    }

    // A generated cover arrives as a base64 data URL. Store it once as a file, so the blog
    // mirror, the client's own site and this row all carry a link instead of a megabyte each.
    if (article.coverImageUrl?.startsWith("data:")) {
      const storedCover = await storeAndRecordImage(article.coverImageUrl, {
        filename: slugBase(article.title),
        userId: post.userId,
        kind: "generated",
      })
      if (storedCover) article.coverImageUrl = storedCover
    }

    // One address for every copy of the article. Two separate random tails used to give the
    // client's page and our mirror different URLs, which search engines saw as duplicates.
    // A rewrite keeps the address of the page it replaces (above).
    const sharedSlug = rewrite?.pageSlug ?? generateSlug(article.title)

    // Publish to connected site
    // itgrows_blog = ItGrows.ai own blog → write to blog_posts table
    // custom with blogDomain = CNAME-hosted blog → write to blog_posts table (served by blog-service)
    // wordpress/shopify/webflow/octobercms/php → call external API endpoint
    const isBlogPostsPlatform = !site || site.platform === "itgrows_blog" || (site.platform === "custom" && !!site.blogDomain)

    // The live address of this article, saved with the row below. Null when a branch can't know it.
    let liveUrl: string | null = null
    // A draft on our plugin's path: where its "draft ready" email links to, sent once the row is written.
    let draftNotice: string | null = null
    // A publish that reached the site with something still to put right: the note the row keeps.
    let publishNote: string | null = null

    if (site && isBlogPostsPlatform) {
      // Save directly to blog_posts so blog-service can serve it via CNAME
      const slug = sharedSlug
      await db.insert(blogPosts).values({
        userId: post.userId,
        siteSlug: site.siteSlug ?? null,
        siteId: site.id,
        slug,
        title: article.title,
        content: article.content,
        metaDescription: article.metaDescription ?? "",
        keywords: article.keywords ?? [],
        coverImageUrl: article.coverImageUrl ?? null,
      })
      const blogDomainHost = site.blogDomain ?? site.siteSlug
      if (blogDomainHost) {
        console.log(`[SEO Autopilot] Published to hosted blog: https://${blogDomainHost}/${slug}`)
      }
      liveUrl = blogArticleUrl(site, slug)
    } else if (site && !isBlogPostsPlatform) {
      let normalUrl = site.url.trim().replace(/\/$/, "")
      if (!normalUrl.startsWith("http")) normalUrl = "https://" + normalUrl

      // An application password means nothing has to be installed on their site. Checked
      // before the endpoint choice below, which sends WordPress to our plugin.
      if (site.platform === "wordpress" && site.wpUsername?.trim() && site.wpAppPassword?.trim()) {
        // A site whose owner reads before anything goes live is marked on the site profile.
        // Absent — which is every site but one — this is "publish", exactly as before.
        const wantsDraft = siteProfile?.publishStatus === "draft"
        const wp = await publishToWordPress(site.url, site.wpUsername, site.wpAppPassword, {
          title: article.title,
          content: article.content,
          metaDescription: article.metaDescription,
          // WordPress keeps slugs unique itself, so no random tail in the address.
          slug: slugBase(article.title),
          coverImageUrl: article.coverImageUrl ?? null,
          status: wantsDraft ? "draft" : "publish",
          language: post.language ?? undefined,
          titleInContent: siteProfile?.titleInContent === true,
        })
        if (wp.success) {
          console.log(`[SEO Autopilot] ${wantsDraft ? "Drafted" : "Published"} to WordPress via app password: ${wp.url} (cover ${wp.cover})`)
          // A draft nobody is told about is the same as nothing published, so the one person
          // who has to approve it gets a link straight into their editor. Only for draft
          // sites, so no other customer's inbox changes.
          // The row is written first: the notice leaves its note on it, if it has to.
        } else {
          console.error(`[SEO Autopilot] WordPress app-password publish failed: ${wp.error}`)
        }
        // Separate branches rather than a ternary: a union of two object shapes is not
        // assignable to drizzle's set(). The link WordPress gave the post (for a draft site, its
        // preview address) goes to published_url. publishToWordPress falls back to the site's
        // root when WordPress returns no link; that is not the article, so it is not stored.
        const attempts = (post.publishAttempts ?? 0) + 1
        if (wp.success) {
          const wpLink = wp.url && wp.url !== normalUrl ? receivedUrl(wp.url, normalUrl) : null
          await db.update(scheduledPosts)
            .set({ status: "published", publishedAt: new Date(), publishError: null, publishedUrl: wpLink, publishAttempts: attempts })
            .where(eq(scheduledPosts.id, post.id))
          if (wantsDraft && wp.postId) {
            await sendDraftNotice(post, site, siteProfile?.language, article.title, `${normalUrl}/wp-admin/post.php?post=${wp.postId}&action=edit`)
          }
          // WordPress just took our login: the "Last check" on "Your website" says so.
          await saveLastCheck(site.id)
        } else {
          await db.update(scheduledPosts)
            .set({ status: "failed", publishError: (wp.error ?? "").slice(0, 500), publishAttempts: attempts })
            .where(eq(scheduledPosts.id, post.id))
        }
        // The cron retries a failed row while it has attempts left (publish-scheduled/route.ts) and
        // reports each failure, with this count, in Telegram. A row out of attempts waits for us.
        const failure = wp.success ? null : `попытка ${attempts} из 3${attempts >= 3 ? ", больше не повторяем" : ""}: ${wp.error ?? "WordPress publish failed"}`
        return {
          claimed: true,
          error: failure ? { id: post.id, keyword: post.keyword, error: failure } : null,
          processed: { id: post.id, keyword: post.keyword,
                       status: wp.success ? "published" : "failed",
                       ...(failure ? { error: failure } : {}) },
          counted: false,
        }
      }

      let endpoint: string
      if (site.platform === "wordpress") {
        endpoint = `${normalUrl}/wp-json/itgrows/v1/publish`
      } else if (site.platform === "octobercms" || site.platform === "php") {
        endpoint = site.webhookUrl?.trim() || `${normalUrl}/itgrows-webhook.php`
      } else {
        endpoint = `${normalUrl}/api/itgrows-publish`
      }

      // Webhook sites render the title themselves (MagiScan's template has its own <h1>), so the
      // article's leading <h1> is dropped, as the WordPress path already does.
      const wpPayload = site.platform === "octobercms" || site.platform === "php"
        ? { token: site.siteToken, title: article.title, content: article.content.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "") + faqJsonLd(extractFaq(article.content, post.language ?? undefined)), metaDescription: article.metaDescription, slug: sharedSlug, keywords: article.keywords ?? [], coverImageUrl: article.coverImageUrl ?? null }
        : site.platform === "wordpress"
          // Our WordPress plugin: the theme prints the title, so the article's own <h1> is dropped;
          // draft sites get a draft; the cover is a URL the plugin downloads (plugin 2.1+).
          ? { token: site.siteToken, title: article.title, content: article.content.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, ""), metaDescription: article.metaDescription, keywords: article.keywords ?? [], coverImageUrl: article.coverImageUrl ?? null, slug: slugBase(article.title), status: siteProfile?.publishStatus === "draft" ? "draft" : "publish" }
          : { token: site.siteToken, title: article.title, content: article.content, metaDescription: article.metaDescription, keywords: article.keywords ?? [], coverImageUrl: article.coverImageUrl ?? null }

      let publishedUrl: string | null = null
      let externalPublishError: string | null = null
      // What our WordPress plugin answered: post_id for the editor link, post_status should it say.
      let pluginAnswer: { post_id?: unknown; post_status?: unknown } | null = null
      try {
        const wpRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(wpPayload),
          signal: AbortSignal.timeout(20000),
        })
        if (wpRes.ok) {
          const wpData = (await wpRes.json()) as { url?: string; post_id?: unknown; post_status?: unknown }
          publishedUrl = wpData.url ?? null
          if (site.platform === "wordpress") pluginAnswer = wpData
        } else {
          const errText = await wpRes.text().catch(() => "")
          externalPublishError = `Remote returned ${wpRes.status}: ${errText}`.slice(0, 500)
        }
      } catch (fetchErr) {
        externalPublishError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      }

      if (externalPublishError) {
        // Special case: article was written to the server but the blog index (blog.html) update failed.
        // The article IS published and accessible via its direct URL, so it counts as published: a
        // retry would write a second page under a new random slug. But the receiver stops there, before
        // the sitemap, and only a card already in the list is replaced later, so a new article stays off
        // both for good. Kiryl hears it once, with the slug, and the row keeps the note (never shown to
        // a client) until the card and the sitemap are put right by hand.
        const isPartialSuccess = externalPublishError.includes("Article written but blog.html update failed")
        if (isPartialSuccess) {
          console.warn(`[SEO Autopilot] Partial success for post ${post.id}: article written, blog.html not updated`)
          publishNote = `blog.html not updated, card and sitemap to fix: ${sharedSlug}: ${externalPublishError}`.slice(0, 500)
          await sendOwner(
            `⚠️ ${site.name}: статья вышла, но blog.html не обновился, поэтому ${rewrite ? "карточка и карта сайта могли остаться старыми" : "её нет ни в списке, ни в карте сайта"}.\n` +
              `«${article.title}»\nslug: ${sharedSlug}\nЗапись: scheduled_posts ${post.id}. Повторять нельзя${rewrite ? "" : ": новая статья получит новый адрес"}; поправить карточку и карту сайта.\n` +
              externalPublishError.slice(0, 200),
          )
          // Fall through to the published update below
        } else {
          // A prepared article keeps its preparedBy mark (and the client's edits): the retry then
          // publishes this same article instead of the old generator writing a new one.
          await db
            .update(scheduledPosts)
            .set({
              status: "failed",
              publishError: externalPublishError,
              publishAttempts: (post.publishAttempts ?? 0) + 1,
              articleData: prepared?.preparedBy === "vm-writer" ? { ...prepared, ...article } : article,
              ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
            })
            .where(eq(scheduledPosts.id, post.id))

          console.error(`[SEO Autopilot] External publish failed for post ${post.id}: ${externalPublishError}`)
          return {
            claimed: true,
            error: { id: post.id, keyword: post.keyword, error: externalPublishError },
            processed: { id: post.id, keyword: post.keyword, status: "failed", error: externalPublishError },
            counted: false,
          }
        }
      }

      if (publishedUrl) {
        console.log(`[SEO Autopilot] Published: ${publishedUrl}`)
      }

      // Also insert into blog_posts so the /blog/ listing (blog-service) can serve this article.
      // Uses ON CONFLICT DO NOTHING in case the slug already exists (e.g. from a partial retry).
      let mirrored = false
      if (rewrite) {
        // Same row, new text; updated_at is what makes IndexNow send the page again. Outside the
        // try below: a rewrite whose row is not updated is a failed publish, not a warning.
        const updated = await db.update(blogPosts)
          .set({
            title: article.title,
            content: article.content,
            metaDescription: article.metaDescription ?? "",
            keywords: article.keywords ?? [],
            ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
            updatedAt: new Date(),
          })
          .where(and(eq(blogPosts.slug, rewrite.rowSlug), eq(blogPosts.siteId, site.id)))
          .returning({ id: blogPosts.id })
        if (!updated.length) throw new Error(`Rewrite of ${rewrite.rowSlug}: the page was updated on the site, but its blog_posts row was not found`)
        mirrored = true
        console.log(`[SEO Autopilot] Rewrote ${rewrite.rowSlug} in place (${site.siteSlug}/${rewrite.pageSlug})`)
      } else {
        try {
          const blogSlug = sharedSlug
          await db.insert(blogPosts).values({
            userId: post.userId,
            siteSlug: site.siteSlug ?? null,
            siteId: site.id,
            slug: blogSlug,
            title: article.title,
            content: article.content,
            metaDescription: article.metaDescription ?? "",
            keyword: post.keyword,
            keywords: article.keywords ?? [],
            coverImageUrl: article.coverImageUrl ?? null,
            publishedAt: new Date(),
          }).onConflictDoNothing()
          mirrored = true
          console.log(`[SEO Autopilot] Mirrored to blog_posts: ${blogSlug}`)
        } catch (blogInsertErr) {
          // Non-fatal: the article is already on the external site; just log the error.
          console.error(`[SEO Autopilot] Failed to mirror to blog_posts: ${blogInsertErr instanceof Error ? blogInsertErr.message : String(blogInsertErr)}`)
        }
      }

      // What the receiver answered with, if it named an address. Otherwise, for webhook sites
      // (the only ones sent a slug), the site's blog address and that slug, once the copy there
      // exists. The other receivers pick their own slug, so their address can't be built.
      const isWebhookSite = site.platform === "octobercms" || site.platform === "php"
      liveUrl = receivedUrl(publishedUrl, normalUrl)
        ?? rewrite?.pageUrl
        ?? (isWebhookSite && mirrored ? blogArticleUrl(site, sharedSlug) : null)

      // Our WordPress plugin on a site whose owner approves every article: the owner gets the same
      // "draft ready" email as on the application-password path above, with a link into the editor
      // (or to their list of drafts when the plugin named no post). A plugin older than 2.1 ignores
      // the requested status and publishes at once. None of ours reports the status it gave the post
      // (post_status is read in case one does), but WordPress gives a draft only its plain "?p=<id>"
      // address, so any other address back means the post is live. That is not undone here: the row
      // keeps a note, Kiryl is told in Telegram, and the owner gets no "not visible yet" email.
      if (site.platform === "wordpress" && siteProfile?.publishStatus === "draft" && pluginAnswer) {
        const reported = typeof pluginAnswer.post_status === "string" ? pluginAnswer.post_status : null
        const draftAddress = (u: string | null) => {
          if (!u) return true // nothing to judge by: taken as the draft that was asked for
          try {
            const parsed = new URL(u, normalUrl + "/")
            return parsed.searchParams.has("p") || parsed.searchParams.has("page_id") || parsed.pathname.replace(/\/+$/, "") === ""
          } catch {
            return true
          }
        }
        const wentLive = reported ? reported === "publish" : !draftAddress(liveUrl)
        if (wentLive) {
          const why = reported ? `the plugin reports post_status "${reported}"` : "the plugin returned a live address"
          publishNote = `Draft requested, but the post went live (${why}): ${liveUrl ?? publishedUrl ?? "no address"}. Plugin older than 2.1?`.slice(0, 500)
          await sendOwner(
            `⚠️ ${normalUrl}: просили черновик, а статья сразу вышла в открытый доступ ` +
              `(${reported ? `плагин ответил post_status "${reported}"` : "плагин вернул живой адрес"}): ` +
              `${liveUrl ?? publishedUrl ?? "адреса нет"}\n«${article.title}»\nСкорее всего, плагин у клиента старше 2.1. Снимать с публикации сами не стали.`,
          )
        } else {
          const postId = Number(pluginAnswer.post_id)
          // On the host WordPress itself calls home (the plugin's permalink is built on it): its login
          // cookie is set there only, so an editor link on the other host (www or not) ends at a login.
          let wpBase = normalUrl
          try {
            if (liveUrl) wpBase = new URL(liveUrl).origin
          } catch {}
          draftNotice = Number.isInteger(postId) && postId > 0
            ? `${wpBase}/wp-admin/post.php?post=${postId}&action=edit`
            : `${wpBase}/wp-admin/edit.php?post_status=draft&post_type=post`
        }
      }
      // Their server took the article: the "Last check" on "Your website" says so. A webhook site's
      // missing list card is the note below, not a broken connection.
      await saveLastCheck(site.id)
    }

    // Save articleData and mark as published
    await db
      .update(scheduledPosts)
      .set({
        status: "published",
        articleData: prepared?.preparedBy === "vm-writer" ? { ...prepared, ...article } : article,
        publishedAt: new Date(),
        publishedUrl: liveUrl,
        publishAttempts: (post.publishAttempts ?? 0) + 1,
        ...(publishNote ? { publishError: publishNote } : {}),
        ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
      })
      .where(eq(scheduledPosts.id, post.id))

    if (draftNotice && site) await sendDraftNotice(post, site, siteProfile?.language, article.title, draftNotice)

    return {
      claimed: true,
      error: null,
      processed: { id: post.id, keyword: post.keyword, status: "published" },
      counted: true,
    }
  } catch (err) {
    // Mark as failed and save error message
    const errMsg = err instanceof Error ? err.message : String(err)
    await db
      .update(scheduledPosts)
      .set({ status: "failed", publishError: errMsg })
      .where(eq(scheduledPosts.id, post.id))

    return {
      claimed: true,
      error: { id: post.id, keyword: post.keyword, error: errMsg },
      processed: { id: post.id, keyword: post.keyword, status: "failed", error: errMsg },
      counted: false,
    }
  }
}

const dbRows = (r: unknown): Record<string, unknown>[] =>
  Array.isArray(r) ? (r as Record<string, unknown>[]) : ((r as { rows?: Record<string, unknown>[] }).rows ?? [])

/** A client of the AI-visibility service: set up by hand (geo_clients) or paying for a followed site. Their
 *  topics come from the plan or from us, never from the batch scheduler (app/api/schedule/batch, which
 *  asks this too). Throws when it can't tell: the callers then leave the queue alone. */
export async function isGeoQueueClient(userId: string): Promise<boolean> {
  const [r] = dbRows(
    await db.execute(sql`
      SELECT (EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId})
              OR EXISTS (SELECT 1 FROM geo_follows f WHERE f.user_id = ${userId} AND f.plan = 'paid')) AS client`)
  )
  return Boolean(r?.client)
}

/** A GEO client's last scheduled post has gone out: one line to Kiryl and nothing else. Reached only after
 *  a publish, and the cron gets here once all the run's rows are done, so it is said once per queue.
 *  Returns false when the queue still holds something. */
export async function warnGeoQueueEmpty(userId: string, siteName: string | null): Promise<boolean> {
  const left = await db
    .select({ id: scheduledPosts.id })
    .from(scheduledPosts)
    // A failed row the cron will retry is still in the queue: said now, it would be said again when it goes out.
    .where(and(eq(scheduledPosts.userId, userId), sql`(${scheduledPosts.status} IN ('scheduled', 'generating')
      OR (${scheduledPosts.status} = 'failed' AND coalesce(${scheduledPosts.publishAttempts}, 0) < 3))`))
    .limit(1)
  if (left.length) return false
  await sendOwner(`📭 Очередь статей кончилась: ${siteName ?? userId}. Новых тем система сама не ставит; выбрать и поставить следующие в сессии.`)
  return true
}

/** After a publish. A GEO client's queue is never refilled here: Kiryl hears that it ended (warnGeoQueueEmpty).
 *  Anyone else with no scheduled post left gets the next batch from the batch scheduler (it has its own
 *  guard against scheduling twice), as before. Never throws. */
export async function scheduleNextBatchIfEmpty(userId: string, ctx: PublishContext): Promise<void> {
  try {
    const defaultSite = await publishSiteFor(userId)
    if (await isGeoQueueClient(userId)) {
      await warnGeoQueueEmpty(userId, defaultSite?.name ?? null)
      return
    }
    const remainingScheduled = await db
      .select({ id: scheduledPosts.id })
      .from(scheduledPosts)
      .where(and(eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "scheduled")))

    // If no scheduled posts remain → auto-schedule next batch
    if (remainingScheduled.length === 0 && defaultSite) {
      // Call batch scheduling endpoint (it has its own guard against duplicate scheduling)
      await fetch(`${ctx.baseUrl}/api/schedule/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": ctx.cronSecret },
        body: JSON.stringify({ siteUrl: defaultSite.url }),
      })
    }
  } catch {
    // Non-fatal: don't block the response if auto-reschedule fails
  }
}
