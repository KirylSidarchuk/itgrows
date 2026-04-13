import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

async function saveCheckResult(siteId: string, userId: string, ok: boolean) {
  try {
    await db
      .update(connectedSites)
      .set({ lastCheckedAt: new Date(), lastCheckOk: ok })
      .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, userId)))
  } catch {
    // non-critical — ignore DB errors
  }
}

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
  const userId = session.user.id

  let result: { success: boolean; message: string }

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

        result = { success: ok, message }
        break
      }

      case "shopify": {
        if (!shopifyToken) {
          result = { success: false, message: "No Shopify token configured" }
          break
        }
        const shopDomain = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        const res = await fetch(`https://${shopDomain}/admin/api/2024-01/blogs.json`, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": shopifyToken,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        })
        result = res.ok
          ? { success: true, message: "Shopify API token is valid" }
          : { success: false, message: `Shopify API returned HTTP ${res.status}` }
        break
      }

      case "webflow": {
        if (!webflowToken) {
          result = { success: false, message: "No Webflow token configured" }
          break
        }
        const res = await fetch("https://api.webflow.com/v2/sites", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${webflowToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        })
        result = res.ok
          ? { success: true, message: "Webflow API token is valid" }
          : { success: false, message: `Webflow API returned HTTP ${res.status}` }
        break
      }

      case "php":
      case "october":
      case "octobercms": {
        const target = webhookUrl || url
        if (!target) {
          result = { success: false, message: "No webhook URL or site URL configured" }
          break
        }
        const separator = target.includes("?") ? "&" : "?"
        const res = await fetch(`${target}${separator}test=1`, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        result = res.ok
          ? { success: true, message: "Webhook endpoint is reachable" }
          : { success: false, message: `Webhook returned HTTP ${res.status}` }
        break
      }

      case "custom":
      case "nextjs":
      case "next.js": {
        const target = url
        if (!target) {
          result = { success: false, message: "No site URL configured" }
          break
        }
        const res = await fetch(target, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        result = (res.ok || res.status < 500)
          ? { success: true, message: "Site is reachable" }
          : { success: false, message: `Site returned HTTP ${res.status}` }
        break
      }

      case "itgrows_blog":
        return NextResponse.json({ success: true, message: "ItGrows Blog is always connected" })

      default: {
        const target = url
        if (!target) {
          result = { success: false, message: "No site URL configured" }
          break
        }
        const res = await fetch(target, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        })
        result = (res.ok || res.status < 500)
          ? { success: true, message: "Site is reachable" }
          : { success: false, message: `Site returned HTTP ${res.status}` }
        break
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result = { success: false, message: `Connection failed: ${msg}` }
  }

  // Save check result to DB in background (non-blocking)
  saveCheckResult(siteId, userId, result.success).catch(() => {})

  return NextResponse.json(result)
}
