export interface ConnectedSite {
  id: string
  name: string
  url: string
  platform: "wordpress" | "shopify" | "webflow" | "custom" | "itgrows_blog"
  siteToken: string // unique UUID for this site
  isDefault: boolean
  connectedAt: string
}

const STORAGE_KEY = "itgrows_connected_sites"

export function generateSiteToken(): string {
  return "igt_" + crypto.randomUUID().replace(/-/g, "")
}

export function getConnectedSites(): ConnectedSite[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ConnectedSite[]
  } catch {
    return []
  }
}

export function saveConnectedSites(sites: ConnectedSite[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
  } catch {
    // ignore
  }
}

export function getDefaultSite(): ConnectedSite | null {
  const sites = getConnectedSites()
  return sites.find((s) => s.isDefault) ?? sites[0] ?? null
}

export function platformLabel(platform: ConnectedSite["platform"]): string {
  const labels: Record<ConnectedSite["platform"], string> = {
    wordpress: "WordPress",
    shopify: "Shopify",
    webflow: "Webflow",
    custom: "Custom Website",
    itgrows_blog: "itgrows.ai Blog",
  }
  return labels[platform]
}
