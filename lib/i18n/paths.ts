import { DEFAULT, LOCALES, SITE_URL, isPublicGeoPath, splitLocale, type Locale } from "./config"

/**
 * The address of `href` in `locale`. Only the public GEO pages get a prefix; everything else is
 * returned as it is (anchors "#apply", external and mailto: links, /personal, /business/blog/…,
 * /api/…). Query and hash are kept. A prefix already on the path is replaced, so this also turns
 * a German address into its French or English one.
 *
 *   localePath("de", "/")                       -> "/de"
 *   localePath("de", "/#geo-check")             -> "/de#geo-check"
 *   localePath("fr", "/signup?from=ai-check")   -> "/fr/signup?from=ai-check"
 *   localePath("en", "/ru/about")               -> "/about"
 *   localePath("de", "/business/blog/x")        -> "/business/blog/x"
 */
export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href
  const cut = href.search(/[?#]/)
  const pathname = cut === -1 ? href : href.slice(0, cut)
  const tail = cut === -1 ? "" : href.slice(cut)
  const { path } = splitLocale(pathname)
  if (!isPublicGeoPath(path)) return path + tail
  const bare = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
  if (locale === DEFAULT) return bare + tail
  return `/${locale}${bare === "/" ? "" : bare}${tail}`
}

/** Absolute URL of a page in a language: absoluteUrl("de", "/about") -> "https://www.itgrows.ai/de/about". */
export function absoluteUrl(locale: Locale, path: string): string {
  return SITE_URL + localePath(locale, path)
}

/** hreflang map for a public GEO page: all five languages plus x-default (the English address). */
export function hreflangAlternates(path: string): Record<Locale | "x-default", string> {
  const out = Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(l, path)])) as Record<Locale | "x-default", string>
  out["x-default"] = absoluteUrl(DEFAULT, path)
  return out
}
