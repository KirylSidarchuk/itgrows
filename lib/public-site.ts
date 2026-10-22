import type { connectedSites } from "@/lib/db/schema"

type SiteRow = typeof connectedSites.$inferSelect

// What a browser may see of a connected site. Passwords and third-party API tokens stay on the
// server: the pages only need to know that one is set. The site token is our own key for the
// WordPress plugin and the webhook, which the owner copies into their site, so it stays — except
// for Shopify and Webflow, where the old wizard stored the platform's API token in that field.
export function publicSite(site: SiteRow) {
  const { wpAppPassword, shopifyToken, webflowToken, siteToken, ...rest } = site
  const foreignToken = site.platform === "shopify" || site.platform === "webflow"
  return {
    ...rest,
    siteToken: foreignToken ? null : siteToken,
    hasWpAppPassword: Boolean(wpAppPassword),
    hasShopifyToken: Boolean(shopifyToken),
    hasWebflowToken: Boolean(webflowToken),
  }
}
