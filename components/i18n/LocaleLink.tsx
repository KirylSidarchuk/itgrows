"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import type { Locale } from "@/lib/i18n/config"
import { localePath } from "@/lib/i18n/paths"
import { useLocale } from "./LocaleProvider"

type Props = ComponentProps<typeof Link> & {
  /** Link to this language instead of the page's own. */
  locale?: Locale
}

/**
 * next/link that keeps the visitor in their language: a public GEO page gets the page's prefix
 * (/business/ai-crawler-checker -> /de/business/ai-crawler-checker), everything else (anchors,
 * external links, /personal, /business/blog/…) is left as it is. Usable from server components.
 */
export default function LocaleLink({ href, locale, ...rest }: Props) {
  const current = useLocale()
  const l = locale ?? current
  const to =
    typeof href === "string"
      ? localePath(l, href)
      : { ...href, pathname: typeof href.pathname === "string" ? localePath(l, href.pathname) : href.pathname }
  return <Link href={to} {...rest} />
}
