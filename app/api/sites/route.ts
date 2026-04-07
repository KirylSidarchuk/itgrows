import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sites = await db.select().from(connectedSites).where(eq(connectedSites.userId, session.user.id))
  return NextResponse.json({ sites })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, url, platform, siteToken, siteSlug, wpUsername, wpAppPassword, shopifyToken, shopifyBlogId, webflowToken, webflowCollectionId, isDefault, blogDomain } = body

  // If setting as default, unset others
  if (isDefault) {
    await db.update(connectedSites)
      .set({ isDefault: false })
      .where(eq(connectedSites.userId, session.user.id))
  }

  const [site] = await db.insert(connectedSites).values({
    userId: session.user.id,
    name,
    url,
    platform,
    siteToken: siteToken || crypto.randomUUID(),
    siteSlug: siteSlug || null,
    wpUsername: wpUsername || null,
    wpAppPassword: wpAppPassword || null,
    shopifyToken: shopifyToken || null,
    shopifyBlogId: shopifyBlogId || null,
    webflowToken: webflowToken || null,
    webflowCollectionId: webflowCollectionId || null,
    isDefault: !!isDefault,
    blogDomain: blogDomain || null,
  }).returning()

  // Non-blocking background site analysis
  fetch(`${process.env.NEXTAUTH_URL || 'https://itgrows.ai'}/api/sites/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteUrl: body.url, siteId: site.id }),
  }).catch(() => {}) // fire and forget

  return NextResponse.json({ site })
}
