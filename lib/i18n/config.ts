// Languages of the public AI-visibility (GEO) site. English stays at today's addresses; the
// other four live under a prefix (/de, /fr, /es, /ru) that middleware.ts rewrites to the same
// page with the language in a request header. Edge-safe: no Node or Next imports here, so the
// middleware, server components and client components all read the same lists.

export const LOCALES = ["en", "de", "fr", "es", "ru"] as const
export type Locale = (typeof LOCALES)[number]

/** The language of the unprefixed addresses, of bots and of anything we cannot tell. */
export const DEFAULT = "en" satisfies Locale
/** The languages that have their own address prefix. */
export const PREFIXED = ["de", "fr", "es", "ru"] as const satisfies readonly Exclude<Locale, typeof DEFAULT>[]
export type PrefixedLocale = (typeof PREFIXED)[number]

/** The visitor's choice, set by middleware on a prefixed visit and by the language switcher. */
export const LOCALE_COOKIE = "NEXT_LOCALE"
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
/** The language middleware decided for this request; getLocale() in lib/i18n/server.ts reads it. */
export const LOCALE_HEADER = "x-itg-locale"

export const SITE_URL = "https://www.itgrows.ai"

// The public GEO pages that exist in every language. Only these get a prefix: the LinkedIn/X
// product (/personal, /company, /cabinet, /reddit), the blogs and the cabinets stay English and
// unprefixed. middleware.ts lists the same paths in its matcher (the matcher must be literal);
// scripts/i18n-check.ts fails if the two drift apart.
export const PUBLIC_GEO_PATHS = [
  "/",
  "/business/ai-visibility-checker",
  "/business/ai-crawler-checker",
  "/business/sample-report",
  "/about",
  "/login",
  "/signup",
] as const
export type PublicGeoPath = (typeof PUBLIC_GEO_PATHS)[number]

/** The localized pages that belong in the sitemap (sample report is noindex; sign-in pages are private). */
export const INDEXED_GEO_PATHS = [
  "/",
  "/business/ai-visibility-checker",
  "/business/ai-crawler-checker",
  "/about",
] as const satisfies readonly PublicGeoPath[]

/** Prefixed addresses that only move: /de/business goes to /de, as /business goes to "/". */
export const PATH_ALIASES: Readonly<Record<string, PublicGeoPath>> = { "/business": "/" }

/** Each language named in itself, for the switcher. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ru: "Русский",
}

/** BCP 47 tags for Intl (numbers, dates, plurals). */
export const INTL_LOCALE: Readonly<Record<Locale, string>> = {
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ru: "ru-RU",
}

/** Open Graph og:locale values. */
export const OG_LOCALE: Readonly<Record<Locale, string>> = {
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  ru: "ru_RU",
}

const LOCALE_SET: ReadonlySet<string> = new Set(LOCALES)
const PUBLIC_SET: ReadonlySet<string> = new Set(PUBLIC_GEO_PATHS)
const PREFIX_RE = new RegExp(`^/(${PREFIXED.join("|")})(?=/|$)(.*)$`)

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_SET.has(value)
}

export function isPrefixedLocale(value: unknown): value is PrefixedLocale {
  return isLocale(value) && value !== DEFAULT
}

/** Exact match on a pathname without query or hash; a trailing slash is ignored. */
export function isPublicGeoPath(pathname: string): pathname is PublicGeoPath {
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  return PUBLIC_SET.has(p)
}

/** "/de/about" -> { locale: "de", path: "/about" }; "/de" -> { "de", "/" }; "/about" -> { null, "/about" }. */
export function splitLocale(pathname: string): { locale: PrefixedLocale | null; path: string } {
  const m = PREFIX_RE.exec(pathname)
  if (!m) return { locale: null, path: pathname }
  return { locale: m[1] as PrefixedLocale, path: m[2] || "/" }
}

/**
 * The supported language a visitor prefers most, from an Accept-Language header, or null.
 * Ordered by q (ties keep header order); "de-CH" counts as "de", "es-419" as "es"; "*" and q=0
 * are ignored. "pl, de;q=0.8, en;q=0.6" gives "de"; "en-US, de;q=0.9" gives "en".
 */
export function preferredLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null
  const ranked = acceptLanguage
    .split(",")
    .map((part, i) => {
      const [tag = "", ...params] = part.trim().split(";")
      let q = 1
      for (const p of params) {
        const m = /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(p)
        if (m) q = Number(m[1])
      }
      return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0, i }
    })
    .filter((x) => x.lang && x.lang !== "*" && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  for (const { lang } of ranked) if (isLocale(lang)) return lang
  return null
}

// Crawlers, AI assistants' fetchers, link previews, monitors and HTTP libraries. A match never
// gets the language redirect and always sees English on the unprefixed addresses. Tokens are
// chosen not to catch in-app browsers of real people (LinkedInApp, Pinterest/, Slack/, Discord/).
const BOT_UA = new RegExp(
  [
    "bot\\b", "crawl", "spider", "slurp", "scrap", "fetcher", "preview", "headless", "lighthouse",
    "pagespeed", "gtmetrix", "pingdom", "uptime", "monitor", "validator", "curl", "wget", "python",
    "httpx", "aiohttp", "axios", "node-fetch", "undici", "go-http-client", "java/", "okhttp",
    "libwww", "perl", "guzzle", "postman", "insomnia", "feedfetcher", "feedburner", "feedly",
    "facebookexternalhit", "meta-external", "whatsapp", "skypeuripreview", "vkshare", "ia_archiver",
    "archive\\.org", "gptbot", "chatgpt-user", "oai-searchbot", "openai", "claude-web", "claude-user",
    "anthropic", "perplexity-user", "cohere", "bytespider", "amazonbot", "applebot", "ccbot",
    "google-extended", "google-inspectiontool", "googleother", "storebot", "mediapartners", "adsbot",
    "apis-google", "duckassist", "diffbot", "vercel", "screenshot", "puppeteer", "playwright",
    "phantomjs", "selenium", "embedly", "outbrain", "bitly", "httrack", "cloudflare", "datadog",
    "newrelic", "statuscake", "site24x7",
  ].join("|"),
  "i",
)

/** True for crawlers, assistants' fetchers, previews, monitors, scripts, and an empty user agent. */
export function isBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim()
  return ua === "" || BOT_UA.test(ua)
}
