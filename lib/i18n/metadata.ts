import type { Metadata, MetadataRoute } from "next"
import { OG_GEO } from "@/lib/entity"
import { LOCALES, OG_LOCALE, type Locale, type PublicGeoPath } from "./config"
import { absoluteUrl, hreflangAlternates } from "./paths"

type Extra = Omit<Metadata, "title" | "description" | "alternates">

/**
 * Metadata of a public GEO page in one language: the canonical is this language's own address,
 * alternates.languages lists all five plus x-default (English), and Open Graph gets the same url
 * and og:locale. Open Graph and the Twitter card default to the same title and description and to
 * the GEO share image (OG_GEO); pass openGraph / twitter to override any of their fields (their
 * title and description are then yours to translate too). Anything else (robots…) is passed
 * through. Without this, the root layout's English Twitter card would show on every language.
 *
 *   export async function generateMetadata(): Promise<Metadata> {
 *     const locale = await getLocale()
 *     const m = t(locale, aboutMessages)
 *     return localizedMetadata(locale, "/about", { title: m.metaTitle, description: m.metaDescription })
 *   }
 */
export function localizedMetadata(
  locale: Locale,
  path: PublicGeoPath,
  { title, description, openGraph, twitter, ...extra }: { title: string; description: string } & Extra,
): Metadata {
  const url = absoluteUrl(locale, path)
  const og = openGraph ?? {}
  return {
    ...extra,
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates(path) },
    twitter: { card: "summary_large_image", title, description, images: [OG_GEO.url], ...twitter } as Metadata["twitter"],
    openGraph: {
      type: "website",
      siteName: "ItGrows.ai",
      title,
      description,
      images: [OG_GEO],
      ...og,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    } as Metadata["openGraph"],
  }
}

type SitemapEntry = MetadataRoute.Sitemap[number]

/** Sitemap entries of one public GEO page: one per language, each listing all five plus x-default. */
export function localizedSitemapEntries(
  path: PublicGeoPath,
  entry: Omit<SitemapEntry, "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages = hreflangAlternates(path)
  return LOCALES.map((l) => ({ ...entry, url: absoluteUrl(l, path), alternates: { languages } }))
}
