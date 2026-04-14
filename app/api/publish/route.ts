import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites, blogPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

interface PublishRequest {
  siteUrl: string
  siteToken: string
  platform: "wordpress" | "shopify" | "webflow" | "custom" | "octobercms" | "php" | "itgrows_blog" | "nextjs" | "next.js"
  title: string
  content: string
  metaDescription?: string
  siteId?: string
  siteSlug?: string
  keywords?: string[]
  keyword?: string
  coverImageUrl?: string | null
  webhookUrl?: string
}

interface PublishResult {
  success: boolean
  url?: string
  post_id?: number
  error?: string
}

// POST { siteUrl, siteToken, platform, title, content, metaDescription }
// Publishes an article to a connected site using the siteToken
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: PublishRequest
  try {
    body = (await req.json()) as PublishRequest
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { siteUrl, siteToken, platform, title, content, metaDescription, siteId, siteSlug, keywords, keyword, coverImageUrl, webhookUrl } = body

  if (!siteUrl || !siteToken || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Check that the site integration is verified before allowing publish
  // Skip check for itgrows_blog (always connected) and custom/CNAME sites (DNS may not yet propagate)
  if (siteId && platform !== "itgrows_blog" && platform !== "custom") {
    const [site] = await db
      .select({ lastCheckOk: connectedSites.lastCheckOk, platform: connectedSites.platform })
      .from(connectedSites)
      .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
      .limit(1)

    if (site && site.lastCheckOk !== true) {
      return NextResponse.json(
        { success: false, error: "Complete site integration first. Go to Settings and click Test to verify the connection." },
        { status: 422 }
      )
    }
  }

  // Helper: generate a URL-friendly slug from the article title
  function generateSlug(t: string): string {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  let normalUrl = siteUrl.trim()
  if (!normalUrl.startsWith("http://") && !normalUrl.startsWith("https://")) {
    normalUrl = "https://" + normalUrl
  }
  // Remove trailing slash
  normalUrl = normalUrl.replace(/\/$/, "")

  const payload = {
    token: siteToken,
    title,
    content,
    metaDescription: metaDescription ?? "",
    keywords: keywords ?? [],
    coverImageUrl: coverImageUrl ?? null,
  }

  // ── itgrows_blog: publish directly to internal blog_posts table ──────────────
  if (platform === "itgrows_blog") {
    try {
      const slug =
        title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() +
        "-" +
        Date.now().toString(36)
      await db.insert(blogPosts).values({
        userId: session.user.id,
        slug,
        title,
        content,
        metaDescription: metaDescription ?? "",
        keywords: keywords ?? [],
        siteId: siteId ?? null,
        siteSlug: siteSlug ?? null,
        coverImageUrl: coverImageUrl ?? null,
      })
      return NextResponse.json({ success: true, url: `/blog/${slug}` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save article"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }

  // ── custom (CNAME) with blogDomain: publish to blog_posts table ──────────────
  // For CNAME sites, blogs.itgrows.ai serves posts from blog_posts by site_slug.
  // We detect this case by looking up the site's blogDomain from the DB.
  if (platform === "custom" && siteId) {
    const [site] = await db
      .select({ blogDomain: connectedSites.blogDomain, siteSlug: connectedSites.siteSlug })
      .from(connectedSites)
      .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
      .limit(1)

    if (site?.blogDomain) {
      try {
        const slug =
          title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() +
          "-" +
          Date.now().toString(36)
        await db.insert(blogPosts).values({
          userId: session.user.id,
          slug,
          title,
          content,
          metaDescription: metaDescription ?? "",
          keywords: keywords ?? [],
          siteId: siteId,
          siteSlug: site.siteSlug ?? null,
          coverImageUrl: coverImageUrl ?? null,
        })
        return NextResponse.json({ success: true, url: `https://${site.blogDomain}/${slug}` })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save article"
        return NextResponse.json({ success: false, error: message }, { status: 500 })
      }
    }
  }

  // ── Shopify: publish via Shopify Admin API ────────────────────────────────────
  if (platform === "shopify") {
    try {
      // Fetch shopify credentials from DB
      let shopifyAccessToken = siteToken
      let shopifyBlogId = ""
      if (siteId) {
        const [site] = await db
          .select({ shopifyToken: connectedSites.shopifyToken, shopifyBlogId: connectedSites.shopifyBlogId })
          .from(connectedSites)
          .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
          .limit(1)
        if (site?.shopifyToken) shopifyAccessToken = site.shopifyToken
        if (site?.shopifyBlogId) shopifyBlogId = site.shopifyBlogId
      }
      if (!shopifyBlogId) {
        return NextResponse.json({ success: false, error: "Shopify Blog ID not configured" }, { status: 422 })
      }
      const shopDomain = normalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
      const endpoint = `https://${shopDomain}/admin/api/2024-01/blogs/${shopifyBlogId}/articles.json`
      const body = {
        article: {
          title,
          body_html: content,
          summary_html: metaDescription ?? "",
          published: true,
          tags: keywords?.join(", ") ?? "",
        },
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyAccessToken,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        return NextResponse.json({ success: false, error: `Shopify API error ${res.status}: ${errText}` }, { status: 502 })
      }
      const data = await res.json() as { article: { id: number; url?: string; handle?: string } }
      const articleUrl = data.article.url ?? `${normalUrl}/blogs/news/${data.article.handle ?? data.article.id}`
      return NextResponse.json({ success: true, url: articleUrl })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Shopify publish failed"
      return NextResponse.json({ success: false, error: message }, { status: 502 })
    }
  }

  // ── Webflow: publish via Webflow CMS API ──────────────────────────────────────
  if (platform === "webflow") {
    try {
      let webflowApiToken = siteToken
      let webflowCollectionId = ""
      if (siteId) {
        const [site] = await db
          .select({ webflowToken: connectedSites.webflowToken, webflowCollectionId: connectedSites.webflowCollectionId })
          .from(connectedSites)
          .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
          .limit(1)
        if (site?.webflowToken) webflowApiToken = site.webflowToken
        if (site?.webflowCollectionId) webflowCollectionId = site.webflowCollectionId
      }
      if (!webflowCollectionId) {
        return NextResponse.json({ success: false, error: "Webflow Collection ID not configured" }, { status: 422 })
      }
      const body = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: title,
          slug: generateSlug(title),
          "post-body": content,
          "post-summary": metaDescription ?? "",
        },
      }
      const res = await fetch(`https://api.webflow.com/v2/collections/${webflowCollectionId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webflowApiToken}`,
          accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        return NextResponse.json({ success: false, error: `Webflow API error ${res.status}: ${errText}` }, { status: 502 })
      }
      const data = await res.json() as { id: string }
      return NextResponse.json({ success: true, url: `${normalUrl}` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webflow publish failed"
      return NextResponse.json({ success: false, error: message }, { status: 502 })
    }
  }

  // Choose endpoint based on platform
  let endpoint: string
  if (platform === "wordpress") {
    endpoint = `${normalUrl}/wp-json/itgrows/v1/publish`
  } else if (platform === "octobercms" || platform === "php") {
    // Use the custom webhook URL if provided, otherwise fall back to a default path
    endpoint = webhookUrl?.trim() || `${normalUrl}/itgrows-webhook.php`
  } else {
    endpoint = `${normalUrl}/api/itgrows-publish`
  }

  // For octobercms/php, include the slug in the payload
  const finalPayload =
    platform === "octobercms" || platform === "php"
      ? { ...payload, slug: generateSlug(title) }
      : payload

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      return NextResponse.json(
        { success: false, error: `Remote returned ${res.status}: ${errText}` },
        { status: 502 }
      )
    }

    const data = (await res.json()) as PublishResult

    // For custom platforms with a siteSlug or blogDomain, mirror the article into blog_posts
    // so it can be served via CNAME (e.g. blog.magiscan.app → blogs.itgrows.ai).
    if (platform === "custom" && (siteSlug || siteId)) {
      try {
        // Resolve siteSlug from DB if not provided directly
        let resolvedSlug = siteSlug ?? null
        let resolvedBlogDomain: string | null = null
        if (siteId && !resolvedSlug) {
          const [site] = await db
            .select({ siteSlug: connectedSites.siteSlug, blogDomain: connectedSites.blogDomain })
            .from(connectedSites)
            .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
            .limit(1)
          if (site) {
            resolvedSlug = site.siteSlug
            resolvedBlogDomain = site.blogDomain
          }
        }
        if (resolvedSlug || resolvedBlogDomain) {
          const slug =
            title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() +
            "-" +
            Date.now().toString(36)
          await db.insert(blogPosts).values({
            userId: session.user.id,
            slug,
            title,
            content,
            metaDescription: metaDescription ?? "",
            keywords: keywords ?? [],
            siteId: siteId ?? null,
            siteSlug: resolvedSlug ?? null,
            coverImageUrl: coverImageUrl ?? null,
          })
        }
      } catch {
        // Non-fatal — don't fail the publish if mirroring fails
      }
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
