import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { connectedSites } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { canUseAppPassword } from "@/lib/wordpress-publish"

// "Check the connection" on Your website. It tests what publishing (app/api/cron/publish-scheduled)
// actually uses for the site, without sending an article, and stores the result. That result
// matters: publish-scheduled refuses every article for a plugin or webhook site whose stored check
// is not OK, so a check that tests the wrong thing stops articles that would go through.
//   our hosted blog                 the blog address answers
//   WordPress, application password the posts endpoint articles are written to accepts the login (a read)
//   WordPress, our plugin           the plugin's status endpoint accepts the site token
//   PHP / October CMS webhook       the webhook address answers (articles go there as POST)
//   any other site                  <site>/api/itgrows-publish answers, where its articles go
// A webhook takes articles only as POST, and a test POST could land on the site as a post, so the
// webhook check stops at "the server answers": MagiScan's answers every GET with 404 and takes an
// article every day. Addresses stored bare ("itgrows.ai") get https://, as publishing does.

export const dynamic = "force-dynamic"
export const maxDuration = 30

type Site = typeof connectedSites.$inferSelect
type Result = { success: boolean; message: string }

const TIMEOUT = 8000

function absolute(u: string) {
  const t = u.trim().replace(/\/+$/, "")
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

function hostOf(u: string) {
  try {
    return new URL(u).host
  } catch {
    return u
  }
}

/** The path of an address without its trailing slash; "" for the root. */
function pathOf(u: string) {
  try {
    return new URL(u).pathname.replace(/\/+$/, "")
  } catch {
    return ""
  }
}

function get(url: string, headers?: Record<string, string>) {
  return fetch(url, { method: "GET", headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) })
}

/** Why a request got no answer, in words. */
function why(e: unknown) {
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return `no answer within ${TIMEOUT / 1000} seconds`
  const cause = (e as { cause?: { code?: string } })?.cause
  const code = cause?.code ?? ""
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "the address does not resolve (DNS)"
  if (code === "ECONNREFUSED") return "the server refused the connection"
  if (code === "ECONNRESET") return "the server closed the connection"
  if (/CERT|SSL|TLS/i.test(code)) return "its HTTPS certificate is not valid"
  return e instanceof Error ? e.message : String(e)
}

/** 502/503/504 and Cloudflare's 52x: something answered, but the site behind it is down. */
const down = (status: number) => status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 530)

async function hostedBlog(site: Site): Promise<Result> {
  const publicUrl = site.blogPublicUrl?.trim() ? absolute(site.blogPublicUrl) : ""
  const blogHost = site.blogDomain?.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "") ?? ""
  const target = publicUrl || (blogHost ? `https://${blogHost}` : "")
  // An itgrows_blog site with no address of its own lives on our domain; nothing to reach.
  if (!target) return { success: true, message: "Your blog is hosted by us." }
  // Under a path of the client's own site (www.example.com/blog) the blog shows through a rule on
  // their side; the card shows that rule when the blog's name differs from the site's host.
  const underPath = !!publicUrl && pathOf(publicUrl) !== ""
  const proxied = underPath && hostOf(publicUrl).toLowerCase() !== blogHost.toLowerCase()

  let res: Response
  try {
    res = await get(target)
  } catch (e) {
    return {
      success: false,
      message: underPath
        ? `${target} does not answer: ${why(e)}.`
        : `${hostOf(target)} does not answer yet: ${why(e)}. A new DNS record can take up to 24 hours.`,
    }
  }
  if (res.ok) {
    // A site without the rule often sends /blog on to its home page, which answers 200 too.
    if (underPath) {
      const want = pathOf(target)
      const got = pathOf(res.url || target)
      if (got !== want && !got.startsWith(`${want}/`)) {
        return {
          success: false,
          message: `${target} sends visitors on to ${res.url} instead of showing your blog.${proxied ? " The proxy rule below is not in place yet." : ""}`,
        }
      }
    }
    return { success: true, message: `Your blog answers at ${target}.` }
  }
  if (res.status === 404 && proxied) {
    return { success: false, message: `Your blog does not show at ${target} yet. It shows there once your developer adds the proxy rule below.` }
  }
  return { success: false, message: `${target} answered HTTP ${res.status} instead of your blog.` }
}

async function wordpressLogin(site: Site, base: string): Promise<Result> {
  const user = site.wpUsername!.trim()
  const auth = Buffer.from(`${user}:${site.wpAppPassword!.trim()}`).toString("base64")
  const headers = { Authorization: `Basic ${auth}` }
  const draft = (site.siteProfile as { publishStatus?: string } | null)?.publishStatus === "draft"

  // The endpoint articles are written to, read rather than written: WordPress lists drafts only
  // to a login that may edit posts, so a 200 means the username and application password work.
  let res: Response
  try {
    res = await get(`${base}/wp-json/wp/v2/posts?status=draft&per_page=1&context=edit&_fields=id`, headers)
  } catch (e) {
    return { success: false, message: `Cannot reach your WordPress at ${hostOf(base)}: ${why(e)}.` }
  }
  if (res.ok) {
    // A site that publishes live needs a login that may publish, not only write drafts.
    if (!draft) {
      const me = await get(`${base}/wp-json/wp/v2/users/me?context=edit&_fields=capabilities`, headers).catch(() => null)
      const caps = me?.ok ? ((await me.json().catch(() => null)) as { capabilities?: Record<string, boolean> } | null)?.capabilities : null
      if (caps && caps.publish_posts === false) {
        return { success: false, message: `The WordPress user ${user} may write drafts but not publish them. Give it the Author or Editor role.` }
      }
    }
    return {
      success: true,
      message: draft
        ? `WordPress accepts our login as ${user}. Articles arrive there as drafts for your approval.`
        : `WordPress accepts our login as ${user}. Articles are published through it.`,
    }
  }
  if (res.status === 401 || res.status === 403) {
    return { success: false, message: `WordPress did not accept the username ${user} with its application password. A new application password from your WordPress profile fixes it.` }
  }
  if (res.status === 400) {
    // What WordPress answers when it saw no valid login (firma-ausland.de answers a wrong username
    // this way too), or the user may not edit posts, or the host dropped the Authorization header.
    return {
      success: false,
      message: `WordPress did not accept our login as ${user}. The application password may have been revoked, the user may not be allowed to write posts, or your host drops the login header.`,
    }
  }
  if (res.status === 404) {
    return { success: false, message: `WordPress's REST API does not answer at ${base}/wp-json, which publishing uses.` }
  }
  return { success: false, message: down(res.status) ? `Your WordPress is down (HTTP ${res.status}).` : `WordPress answered HTTP ${res.status}.` }
}

async function wordpressPlugin(site: Site, base: string): Promise<Result> {
  if (!site.siteToken) return { success: false, message: "No site token is stored for this site." }
  let res: Response
  try {
    res = await get(`${base}/wp-json/itgrows/v1/status?token=${encodeURIComponent(site.siteToken)}`)
  } catch (e) {
    return { success: false, message: `Cannot reach your WordPress at ${hostOf(base)}: ${why(e)}.` }
  }
  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
    return data.ok === true
      ? { success: true, message: "The ItGrows plugin answers and the site token matches." }
      : { success: false, message: "Something answered at the plugin's address, but not the ItGrows plugin." }
  }
  if (res.status === 404) return { success: false, message: "The ItGrows plugin is not active on your WordPress. Install and activate it (see below)." }
  if (res.status === 401) return { success: false, message: "The site token in WP Admin → Settings → ItGrows.ai is not the one below." }
  if (res.status === 400) return { success: false, message: "The ItGrows plugin is installed but has no site token yet. Paste the one below in WP Admin → Settings → ItGrows.ai." }
  return { success: false, message: down(res.status) ? `Your WordPress is down (HTTP ${res.status}).` : `The plugin answered HTTP ${res.status}.` }
}

async function webhook(site: Site, base: string): Promise<Result> {
  const php = site.platform === "php" || site.platform === "octobercms" || site.platform === "october"
  const target = php ? (site.webhookUrl?.trim() ? absolute(site.webhookUrl) : `${base}/itgrows-webhook.php`) : `${base}/api/itgrows-publish`
  let res: Response
  try {
    res = await get(`${target}${target.includes("?") ? "&" : "?"}test=1`)
  } catch (e) {
    return { success: false, message: `Cannot reach your webhook at ${target}: ${why(e)}.` }
  }
  if (down(res.status)) return { success: false, message: `${hostOf(target)} answered HTTP ${res.status}: the server behind it is down.` }
  return {
    success: true,
    message: res.ok
      ? "Your webhook answered the test."
      : "Your webhook's server answers. Articles go to it with your site token, which it checks itself.",
  }
}

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
  const userId = session.user.id

  const body = (await req.json().catch(() => ({}))) as { siteId?: string }
  const { siteId } = body
  if (!siteId) {
    return NextResponse.json({ success: false, message: "siteId is required" }, { status: 400 })
  }

  const [site] = await db
    .select()
    .from(connectedSites)
    .where(and(eq(connectedSites.id, siteId), eq(connectedSites.userId, userId)))
    .limit(1)

  if (!site) {
    return NextResponse.json({ success: false, message: "Site not found" }, { status: 404 })
  }

  // The same branches, in the same order, as publish-scheduled.
  const hosted = site.platform === "itgrows_blog" || (site.platform === "custom" && !!site.blogDomain)
  const base = absolute(site.url)

  let result: Result
  try {
    if (hosted) result = await hostedBlog(site)
    else if (canUseAppPassword(site)) result = await wordpressLogin(site, base)
    else if (site.platform === "wordpress") result = await wordpressPlugin(site, base)
    else result = await webhook(site, base)
  } catch (err) {
    result = { success: false, message: `The check failed: ${why(err)}` }
  }

  await saveCheckResult(site.id, userId, result.success)

  return NextResponse.json(result)
}
