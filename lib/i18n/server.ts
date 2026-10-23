import { cookies, headers } from "next/headers"
import { DEFAULT, LOCALE_COOKIE, LOCALE_HEADER, isLocale, type Locale } from "./config"
import { t, type Messages } from "./messages"

// Server components only (reads the request). Calling either function makes the route dynamic,
// which a localized page must be anyway: /de/about and /about are the same route, told apart
// only by the header middleware.ts sets.

/**
 * The language of this request as middleware.ts decided it: the prefix (/de/…), else the
 * NEXT_LOCALE cookie, else English. Pages outside the middleware's paths always get "en".
 */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER)
  return isLocale(value) ? value : DEFAULT
}

/**
 * The visitor's chosen language from the NEXT_LOCALE cookie alone, for pages that have no
 * prefix and no middleware locale (the GEO cabinet /business/dashboard, when it is translated).
 */
export async function getCookieLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT
}

/** Shorthand: the strings of a namespace in this request's language. */
export async function getT<T>(ns: Messages<T>): Promise<T> {
  return t(await getLocale(), ns)
}
