import { useSyncExternalStore } from "react"
import { DEFAULT, LOCALES, type Locale } from "./config"

// The page's language for what the root layout puts outside the pages' LocaleProvider (the cookie
// banner, the exit-intent wheel): <html lang>, which the layout sets for each request and
// LocaleProvider updates on client navigation. English on the server. Client components only.

function pageLocale(): Locale {
  const lang = document.documentElement.lang.slice(0, 2).toLowerCase()
  return (LOCALES as readonly string[]).includes(lang) ? (lang as Locale) : DEFAULT
}

function subscribeLang(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
  return () => observer.disconnect()
}

const serverLocale = (): Locale => DEFAULT

/** The language of the page now (<html lang>), following its changes. */
export function usePageLocale(): Locale {
  return useSyncExternalStore(subscribeLang, pageLocale, serverLocale)
}
