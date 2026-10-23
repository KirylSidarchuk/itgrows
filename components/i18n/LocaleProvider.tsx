"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { DEFAULT, type Locale } from "@/lib/i18n/config"
import { t, type Messages } from "@/lib/i18n/messages"

// The language of a public GEO page for its client components. Each localized page wraps its
// content once, in a server component:
//
//   <LocaleProvider locale={await getLocale()}>…</LocaleProvider>
//
// Without a provider everything below reads English.
//
// It also labels the page with its language without touching app/layout.tsx (owned elsewhere):
//   - in the HTML itself, a <div lang="de"> around the content (display: contents, so it adds no
//     box and no layout: flex and grid parents see the children as before), which screen readers,
//     browser translators and crawlers that run no JavaScript read;
//   - in the browser, <html lang> is set to the page's language and put back to English when the
//     page goes away (the root layout renders <html lang="en"> once and is not re-rendered on
//     client navigation).

const LocaleContext = createContext<Locale>(DEFAULT)

export default function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale
    return () => {
      document.documentElement.lang = DEFAULT
    }
  }, [locale])
  return (
    <LocaleContext.Provider value={locale}>
      <div lang={locale} className="contents">
        {children}
      </div>
    </LocaleContext.Provider>
  )
}

/** The page's language, in a client component. */
export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** The strings of a namespace in the page's language, in a client component: const m = useT(auditForm). */
export function useT<T>(ns: Messages<T>): T {
  return t(useContext(LocaleContext), ns)
}
