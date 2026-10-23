import { DEFAULT, type Locale } from "./config"

// A namespace is one file under lib/i18n/messages/ holding the strings of one page or component
// in every language. English is written first and defines the shape; every other language must
// have exactly the same keys with the same kinds of values (TypeScript error otherwise):
//
//   const en = {
//     title: "Does ChatGPT recommend your business?",
//     steps: ["Reads your homepage…", "Writes five questions…"],
//     questions: (n: number) => `${n} questions`,
//   }
//   export default defineMessages(en, { de: { … }, fr: { … }, es: { … }, ru: { … } })
//
// Values may be strings, numbers, arrays, nested objects and functions (for numbers, names and
// plurals). Do not put `as const` on `en`: the other languages would then have to repeat the
// English strings literally.

export type Messages<T> = { readonly [L in Locale]: T }

export function defineMessages<T extends object>(
  en: T,
  other: { readonly [L in Exclude<Locale, typeof DEFAULT>]: NoInfer<T> },
): Messages<T> {
  return { en, ...other }
}

/** The strings of a namespace in a language. Server side: t(await getLocale(), ns). */
export function t<T>(locale: Locale, ns: Messages<T>): T {
  return ns[locale] ?? ns[DEFAULT]
}
