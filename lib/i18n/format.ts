import { INTL_LOCALE, type Locale } from "./config"

// Numbers, dates and plurals per language, for use inside message functions and components.
// Same output on the server and in the browser, so no hydration mismatch.

/** 1918 -> "1,918" (en), "1.918" (de), "1 918" (fr, ru). */
export function formatNumber(locale: Locale, n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(n)
}

/** A price in US dollars, from cents, the way the language writes it: "$4,788" (en), "4.788 $" (de),
 *  "4 788 $US" (fr), "4788 US$" (es), "4 788 $" (ru). Cents only when there are any. */
export function formatUsd(locale: Locale, cents: number): string {
  const digits = cents % 100 ? 2 : 0
  return formatNumber(locale, cents / 100, { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** A date in the language's own order and month names. Default: "21 October 2026" style. */
export function formatDate(
  locale: Locale,
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: "UTC", ...options }).format(new Date(date))
}

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

/**
 * The plural form of a language for n. Russian needs one/few/many ("1 вопрос", "3 вопроса",
 * "5 вопросов"); English, German and Spanish one/other; French one (0 and 1)/many/other.
 *
 *   questions: (n: number) => plural("ru", n, { one: `${n} вопрос`, few: `${n} вопроса`, many: `${n} вопросов`, other: `${n} вопроса` })
 */
export function plural(locale: Locale, n: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(INTL_LOCALE[locale]).select(n)
  return forms[rule] ?? forms.other
}
