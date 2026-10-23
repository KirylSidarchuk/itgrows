"use client"

import { Fragment, useEffect, useRef, type MouseEvent } from "react"
import { usePathname } from "next/navigation"
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  isPublicGeoPath,
  splitLocale,
  type Locale,
} from "@/lib/i18n/config"
import { localePath } from "@/lib/i18n/paths"
import messages from "@/lib/i18n/messages/languageSwitcher"
import { useLocale, useT } from "./LocaleProvider"

// EN · DE · FR · ES · RU in the header of "/" and of the tools (ToolShell). Plain links to the same
// page in each language, so crawlers and visitors without JavaScript reach every version; a click
// also stores the choice in the NEXT_LOCALE cookie (English included, so the unprefixed addresses
// stop showing the old choice) and reloads, which updates <html lang>. Plain <a>, not next/link:
// a prefetch of another language must not happen. Below the sm breakpoint it folds into a menu.
// On a page that exists only in English (not in PUBLIC_GEO_PATHS) it renders nothing.

function remember(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  } catch {
    /* cookies blocked: the prefixed address still shows the language */
  }
}

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale()
  const m = useT(messages)
  const pathname = usePathname() ?? "/"
  // usePathname may report the address (/de/about) or the rewritten page (/about): strip either way.
  const { path } = splitLocale(pathname)
  const localized = isPublicGeoPath(path)
  const base = path
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const close = (e: Event) => {
      const d = menu.current
      if (!d?.open) return
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !d.contains(e.target as Node)) d.open = false
    }
    document.addEventListener("click", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("click", close)
      document.removeEventListener("keydown", close)
    }
  }, [])

  if (!localized) return null

  const choose = (l: Locale) => (e: MouseEvent<HTMLAnchorElement>) => {
    remember(l)
    // New tab, middle click and the like: the cookie is set, the browser does the rest.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    window.location.assign(localePath(l, base) + window.location.search + window.location.hash)
  }

  const linkProps = (l: Locale) => ({
    href: localePath(l, base),
    hrefLang: l,
    lang: l,
    title: LOCALE_NAMES[l],
    "aria-current": l === locale ? ("true" as const) : undefined,
    onClick: choose(l),
  })

  return (
    <div className={className}>
      <nav aria-label={m.label} className="hidden sm:flex items-center text-xs font-semibold tracking-wide">
        {LOCALES.map((l, i) => (
          <Fragment key={l}>
            {i > 0 && <span aria-hidden className="px-1 text-slate-300">·</span>}
            <a
              {...linkProps(l)}
              className={`rounded px-0.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                l === locale ? "text-violet-700" : "text-slate-500 hover:text-[#1b1916]"
              }`}
            >
              {l.toUpperCase()}
              <span className="sr-only"> {LOCALE_NAMES[l]}</span>
            </a>
          </Fragment>
        ))}
      </nav>

      <details ref={menu} className="relative sm:hidden">
        <summary
          aria-label={m.current(LOCALE_NAMES[locale])}
          className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#1b1916]"
        >
          {locale.toUpperCase()} <span aria-hidden>▾</span>
        </summary>
        <nav
          aria-label={m.label}
          className="absolute right-0 mt-2 min-w-40 rounded-xl border border-black/10 bg-white shadow-lg p-1.5 z-50 flex flex-col"
        >
          {LOCALES.map((l) => (
            <a
              key={l}
              {...linkProps(l)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[#f3f2f1] ${
                l === locale ? "font-semibold text-violet-700" : "text-[#1b1916]"
              }`}
            >
              <span className="w-6 text-xs font-bold text-slate-400" aria-hidden>
                {l.toUpperCase()}
              </span>
              {LOCALE_NAMES[l]}
            </a>
          ))}
        </nav>
      </details>
    </div>
  )
}
