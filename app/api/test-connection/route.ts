import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { siteId } = body

  if (!siteId) {
    return NextResponse.json({ success: false, message: "siteId is required" }, { status: 400 })
  }

  const [site] = await db
    .select()
    .from(connectedSites)
    .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, session.user.id)))
    .limit(1)

  if (!site) {
    return NextResponse.json({ success: false, message: "Site not found" }, { status: 404 })
  }

  const { platform, url, webhookUrl, siteToken, blogDomain, wpUsername, wpAppPassword, shopifyToken, webflowToken } = site

  try {
    switch (platform) {
      case "wordpress": {
        // Try the itgrows plugin status endpoint first, then fall back to basic WP REST API
        const baseUrl = url.replace(/\/$/, "")
        let ok = false
        let message = ""

        try {
          const res = await fetch(`${baseUrl}/wp-json/itgrows/v1/status`, {
            method: "GET",
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok) {
            ok = true
            message = "WordPress plugin is reachable and responding"
          } else {
            message = `WordPress plugin returned HTTP ${res.status}`
          }
        } catch {
          // Fall back: check basic WP REST API
          try {
            const creds = wpUsername && wpAppPassword
              ? Buffer.from(`${wpUsername}:${wpAppPassword}`).toString("base64")
              : null
            const headers: Record<string, string> = {}
            if (creds) headers["Authorization"] = `Basic ${creds}`

            const res2 = await fetch(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
              method: "GET",
              headers,
              signal: AbortSignal.timeout(8000),
            })
            if (res2.ok) {
              ok = true
              message = "WordPress REST API is reachable"
            } else {
              message = `WordPress REST API returned HTTP ${res2.status}`
            }
          } catch (e2) {
            message = `Cannot reach WordPress site: ${e2 instanceof Error ? e2.message : String(e2)}`
          }
        }

        return NextResponse.json({ success: ok, message })
      }

      case "shopify": {
        if (!shopifyToken) {
          return NextResponse.json({ success: false, message: "No Shopify token configured" })
        }
        // Extract shop domain from url
        const shopDomain = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        const res = await fetch(`https://${shopDomain}/admin/api/2024-01/blogs.json`, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": shopifyToken,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          return NextResponse.json({ success: true, message: "Shopify API token is valid" })
        }
        return NextResponse.json({ success: false, message: `Shopify API returned HTTP ${res.status}` })
      }

      case "webflow": {
        if (!webflowToken) {
          return NextResponse.json({ success: false, message: "No Webflow token configured" })
        }
        const res = await fetch("https://api.webflow.com/v2/sites", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${webflowToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          return NextResponse.json({ success: true, message: "Webflow API token is valid" })
        }
        return NextResponse.json({ success: false, message: `Webflow API returned HTTP ${res.status}` })
      }

      case "php":
      case "october":
      case "octobercms": {
        const target = webhookUrl || url
        if (!target) {
          return NextResponse.json({ success: false, message: "No webhook URL or site URL configured" })
        }
        const separator = target.includes("?") ? "&" : "?"
        const res = await fetch(`${target}${separator}test=1`, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          return NextResponse.json({ success: true, message: "Webhook endpoint is reachable" })
        }
        return NextResponse.json({ success: false, message: `Webhook returned HTTP ${res.status}` })
      }

      case "custom":
      case "nextjs":
      case "next.js": {
        const target = url
        if (!target) {
          return NextResponse.json({ success: false, message: "No site URL configured" })
        }
        const res = await fetch(target, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok || res.status < 500) {
          return NextResponse.json({ success: true, message: "Site is reachable" })
        }
        return NextResponse.json({ success: false, message: `Site returned HTTP ${res.status}` })
      }

      case "itgrows_blog": {
        // Check that the itgrows subdomain is reachable
        const subdomain = blogDomain || siteToken
        const target = blogDomain
          ? `https://${blogDomain}`
          : `https://${subdomain}.blogs.itgrows.ai`
        try {
          const res = await fetch(target, {
            method: "GET",
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok || res.status < 500) {
            return NextResponse.json({ success: true, message: "ItGrows blog is reachable" })
          }
          return NextResponse.json({ success: false, message: `Blog returned HTTP ${res.status}` })
        } catch (e) {
          return NextResponse.json({
            success: false,
            message: `Cannot reach blog: ${e instanceof Error ? e.message : String(e)}`,
          })
        }
      }

      default: {
        // Generic: just try to fetch the site URL
        const target = url
        if (!target) {
          return NextResponse.json({ success: false, message: "No site URL configured" })
        }
        const res = await fetch(target, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok || res.status < 500) {
          return NextResponse.json({ success: true, message: "Site is reachable" })
        }
        return NextResponse.json({ success: false, message: `Site returned HTTP ${res.status}` })
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, message: `Connection failed: ${msg}` })
  }
}
