"use client"

import { useEffect, useRef, type MouseEvent } from "react"
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

// The usual language menu in the header of "/" and of the tools (ToolShell): a globe with the current
// language (EN ▾) that opens the list of languages by their own names, the current one ticked. The
// list is plain links to the same page in each language, in the HTML even while closed, so crawlers
// and visitors without JavaScript reach every version; a click also stores the choice in the
// NEXT_LOCALE cookie (English included, so the unprefixed addresses stop showing the old choice) and
// reloads, which updates <html lang>. Plain <a>, not next/link: a prefetch of another language must
// not happen. On a page that exists only in English (not in PUBLIC_GEO_PATHS) it renders nothing.

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
      <details ref={menu} className="group relative">
        <summary
          aria-label={m.current(LOCALE_NAMES[locale])}
          className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5 rounded-lg border border-black/10 bg-white/70 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1b1916] hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z" />
          </svg>
          {locale.toUpperCase()}
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180" fill="currentColor" aria-hidden>
            <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
          </svg>
        </summary>
        <nav
          aria-label={m.label}
          className="absolute right-0 mt-2 min-w-44 rounded-xl border border-black/10 bg-white shadow-lg p-1.5 z-50 flex flex-col"
        >
          {LOCALES.map((l) => (
            <a
              key={l}
              {...linkProps(l)}
              className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm hover:bg-[#f3f2f1] focus-visible:outline-none focus-visible:bg-[#f3f2f1] ${
                l === locale ? "font-semibold text-violet-700" : "text-[#1b1916]"
              }`}
            >
              {LOCALE_NAMES[l]}
              {l === locale && (
                <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden>
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l3.3 3.3 7.3-7.3a1 1 0 0 1 1.4 0z" />
                </svg>
              )}
            </a>
          ))}
        </nav>
      </details>
    </div>
  )
}
