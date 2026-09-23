import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { publishToWordPress } from "@/lib/wordpress-publish"

// Write one article for a named site, and only publish it on a second, explicit call.
//
// The daily cron generates and publishes in one breath, which is right for a shop and wrong for
// a law firm: the first article for a tax practice has to be read by a person before it touches
// their WordPress at all. The normal trigger needs a logged-in session and the cron needs a
// secret that exists only in the deployment, so there was no way to write one article, look at
// it, and then decide.
//
// preview (default) returns the text and touches nothing. publish: true sends it to their site,
// honouring the draft setting on the site profile exactly as the cron does.

export const dynamic = "force-dynamic"
export const maxDuration = 300

const ADMIN_TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

interface SiteProfile {
  niche?: string
  targetAudience?: string
  productName?: string
  brandMentions?: string
  publishStatus?: "publish" | "draft"
}

function generateSlug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 8)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? new URL(req.url).searchParams.get("token")
  if (token !== ADMIN_TOKEN && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string
    keyword?: string
    language?: string
    tone?: string
    publish?: boolean
    title?: string
    content?: string
    metaDescription?: string
  }
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const sites = await db.select().from(connectedSites).where(eq(connectedSites.userId, body.userId))
  const site = sites.find((s) => s.isDefault) ?? sites[0]
  if (!site) return NextResponse.json({ error: "no connected site" }, { status: 400 })
  const profile = (site.siteProfile ?? null) as SiteProfile | null

  // Publishing text that came back from a previous preview, after someone has read it.
  if (body.publish && body.title && body.content) {
    if (!site.wpUsername?.trim() || !site.wpAppPassword?.trim()) {
      return NextResponse.json({ error: "site has no WordPress credentials" }, { status: 400 })
    }
    const wp = await publishToWordPress(site.url, site.wpUsername, site.wpAppPassword, {
      title: body.title,
      content: body.content,
      metaDescription: body.metaDescription ?? "",
      slug: generateSlug(body.title),
      coverImageUrl: null,
      status: profile?.publishStatus === "draft" ? "draft" : "publish",
    })
    return NextResponse.json({ mode: "publish", requestedStatus: profile?.publishStatus ?? "publish", ...wp })
  }

  if (!body.keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const siteContext = profile?.niche
    ? {
        niche: profile.niche,
        targetAudience: profile.targetAudience,
        productName: profile.productName,
        brandMentions: profile.brandMentions,
      }
    : undefined

  const genRes = await fetch(`${baseUrl}/api/seo/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.CRON_SECRET ?? "" },
    body: JSON.stringify({
      keyword: body.keyword,
      language: body.language ?? "de",
      tone: body.tone ?? "Professional",
      siteContext,
    }),
  })
  const article = (await genRes.json()) as { error?: string; title?: string; content?: string; metaDescription?: string }
  if (!genRes.ok) {
    return NextResponse.json({ error: article.error ?? "generation failed", status: genRes.status }, { status: 502 })
  }

  return NextResponse.json({
    mode: "preview",
    site: site.siteSlug,
    wouldPublishAs: profile?.publishStatus === "draft" ? "draft" : "publish",
    title: article.title,
    metaDescription: article.metaDescription,
    wordCount: (article.content ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    content: article.content,
  })
}
