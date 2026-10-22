import { db } from "@/lib/db"
import { scheduledPosts, connectedSites, blogPosts, users } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { draftReadyEmail } from "@/lib/email-templates"
import { eq, and } from "drizzle-orm"
import { publishToWordPress, canUseAppPassword } from "@/lib/wordpress-publish"
import { slugBase } from "@/lib/slug"
import { storeAndRecordImage } from "@/lib/image-store"
import { extractFaq, faqJsonLd } from "@/lib/faq-schema"

// Publishing one scheduled article: the body of the nightly cron (app/api/cron/publish-scheduled),
// moved here unchanged so "Publish now" in the client's "Your articles" goes through exactly the same
// path for every platform. The one addition: a row is claimed (scheduled -> generating) only if it is
// still "scheduled", and the claimed row is the one published, so a client's last edit, Stop or
// "Publish now" racing the cron can never publish twice or publish the text from before the edit.

export type ScheduledPost = typeof scheduledPosts.$inferSelect
type Site = typeof connectedSites.$inferSelect
type SiteProfile = { niche?: string; targetAudience?: string; productName?: string; brandMentions?: string; publishStatus?: "publish" | "draft"; language?: string }

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
      /** The failures the cron reports in Telegram (a WordPress application-password failure never was). */
      error: { id: string; keyword: string; error: string } | null
      /** Counts toward "schedule the next batch when none is left", as the cron always counted. */
      counted: boolean
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
      const userSites = await db
        .select()
        .from(connectedSites)
        .where(eq(connectedSites.userId, post.userId))
      const defaultSite = userSites.find((s) => s.isDefault) ?? userSites[0] ?? null
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

    // An article written ahead of time by the writer on the VM (blog_engine/client_writer.py:
    // sources checked, editor-reviewed) is published as it is — with the client's edits, if they
    // made any in "Your articles". Anything else is generated here, exactly as before — the VM
    // writer failing must never stop a client's schedule.
    const prepared = post.articleData as (Partial<Article> & { preparedBy?: string }) | null
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
    const sharedSlug = generateSlug(article.title)

    // Publish to connected site
    // itgrows_blog = ItGrows.ai own blog → write to blog_posts table
    // custom with blogDomain = CNAME-hosted blog → write to blog_posts table (served by blog-service)
    // wordpress/shopify/webflow/octobercms/php → call external API endpoint
    const isBlogPostsPlatform = !site || site.platform === "itgrows_blog" || (site.platform === "custom" && !!site.blogDomain)

    // The live address of this article, saved with the row below. Null when a branch can't know it.
    let liveUrl: string | null = null

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
        })
        if (wp.success) {
          console.log(`[SEO Autopilot] ${wantsDraft ? "Drafted" : "Published"} to WordPress via app password: ${wp.url} (cover ${wp.cover})`)
          // A draft nobody is told about is the same as nothing published, so the one person
          // who has to approve it gets a link straight into their editor. Only for draft
          // sites, so no other customer's inbox changes.
          if (wantsDraft && wp.postId) {
            const [owner] = await db.select({ email: users.email, name: users.name })
              .from(users).where(eq(users.id, post.userId)).limit(1)
            if (owner?.email) {
              const editUrl = `${normalUrl}/wp-admin/post.php?post=${wp.postId}&action=edit`
              await sendEmail({
                to: owner.email,
                subject: (siteProfile?.language ?? "").toLowerCase().startsWith("de")
                  ? `Entwurf zur Freigabe: ${article.title}`
                  : `Draft ready for your approval: ${article.title}`,
                html: draftReadyEmail(owner.name ?? "there", article.title, editUrl, siteProfile?.language),
              }).catch((e) => console.warn("[SEO Autopilot] draft notice failed:", e))
            }
          }
        } else {
          console.error(`[SEO Autopilot] WordPress app-password publish failed: ${wp.error}`)
        }
        // Separate branches rather than a ternary: a union of two object shapes is not
        // assignable to drizzle's set(). The link WordPress gave the post (for a draft site, its
        // preview address) goes to published_url. publishToWordPress falls back to the site's
        // root when WordPress returns no link; that is not the article, so it is not stored.
        if (wp.success) {
          const wpLink = wp.url && wp.url !== normalUrl ? receivedUrl(wp.url, normalUrl) : null
          await db.update(scheduledPosts)
            .set({ status: "published", publishedAt: new Date(), publishError: null, publishedUrl: wpLink })
            .where(eq(scheduledPosts.id, post.id))
        } else {
          await db.update(scheduledPosts)
            .set({ status: "failed", publishError: (wp.error ?? "").slice(0, 500) })
            .where(eq(scheduledPosts.id, post.id))
        }
        return {
          claimed: true,
          error: null,
          processed: { id: post.id, keyword: post.keyword,
                       status: wp.success ? "published" : "failed",
                       ...(wp.success ? {} : { error: wp.error }) },
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
      try {
        const wpRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(wpPayload),
          signal: AbortSignal.timeout(20000),
        })
        if (wpRes.ok) {
          const wpData = (await wpRes.json()) as { url?: string }
          publishedUrl = wpData.url ?? null
        } else {
          const errText = await wpRes.text().catch(() => "")
          externalPublishError = `Remote returned ${wpRes.status}: ${errText}`.slice(0, 500)
        }
      } catch (fetchErr) {
        externalPublishError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      }

      if (externalPublishError) {
        // Special case: article was written to the server but the blog index (blog.html) update failed
        // due to a file permission issue. The article IS published and accessible via its direct URL.
        // Treat this as a partial success — mark as published so we don't keep regenerating.
        const isPartialSuccess = externalPublishError.includes("Article written but blog.html update failed")
        if (isPartialSuccess) {
          console.warn(`[SEO Autopilot] Partial success for post ${post.id}: article written, blog.html permission denied`)
          // Fall through to the published update below (externalPublishError is cleared)
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

      // What the receiver answered with, if it named an address. Otherwise, for webhook sites
      // (the only ones sent a slug), the site's blog address and that slug, once the copy there
      // exists. The other receivers pick their own slug, so their address can't be built.
      const isWebhookSite = site.platform === "octobercms" || site.platform === "php"
      liveUrl = receivedUrl(publishedUrl, normalUrl)
        ?? (isWebhookSite && mirrored ? blogArticleUrl(site, sharedSlug) : null)
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
        ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
      })
      .where(eq(scheduledPosts.id, post.id))

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

/** When a user has no scheduled post left after a publish, asks the batch scheduler for the next
 *  batch (it has its own guard against scheduling twice). Never throws. */
export async function scheduleNextBatchIfEmpty(userId: string, ctx: PublishContext): Promise<void> {
  try {
    const remainingScheduled = await db
      .select({ id: scheduledPosts.id })
      .from(scheduledPosts)
      .where(and(eq(scheduledPosts.userId, userId), eq(scheduledPosts.status, "scheduled")))

    // If no scheduled posts remain → auto-schedule next batch
    if (remainingScheduled.length === 0) {
      // Find user's default connected site
      const sites = await db
        .select()
        .from(connectedSites)
        .where(eq(connectedSites.userId, userId))

      const defaultSite = sites.find((s) => s.isDefault) ?? sites[0]
      if (defaultSite) {
        // Call batch scheduling endpoint (it has its own guard against duplicate scheduling)
        await fetch(`${ctx.baseUrl}/api/schedule/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cron-secret": ctx.cronSecret },
          body: JSON.stringify({ siteUrl: defaultSite.url }),
        })
      }
    }
  } catch {
    // Non-fatal: don't block the response if auto-reschedule fails
  }
}
