import { geoPriceLabels, type GeoPriceLabels, type GeoPrices } from "@/lib/geo-pricing"

// Our articles carry the plan's price in their text, in the wording of the writer's facts of 30 Oct 2026
// (VM /root/blog_engine own_geo_facts.json), in English and in German. The stored text stays at $499, and
// so do the markdown alternates (/business/blog/<slug>.md) and whatever an AI crawler reads; for everyone
// else the page swaps exactly these phrases for the visitor's price as it renders. A sentence in other
// words stays untouched, and so does any other company's price, however close: each rule needs a phrase
// only our own prices make ("$499 a month plus a one-time $499 setup", "$1,497 for 3 months").

const NB = "[ \\u00a0]"

type Rule = [RegExp, (l: GeoPriceLabels, m: RegExpExecArray) => string]

const EN_RULES: Rule[] = [
  [/\$499 a month((?:, month to month,)?) plus a one-time \$499 setup/g, (l, m) => `${l.month} a month${m[1]} plus a one-time ${l.setup} setup`],
  [/\$499 plus a one-time \$499 setup/g, (l) => `${l.month} plus a one-time ${l.setup} setup`],
  [/\$499 a month plus \$499 setup/g, (l) => `${l.month} a month plus ${l.setup} setup`],
  [/\$499 a month \+ \$499 setup/g, (l) => `${l.month} a month + ${l.setup} setup`],
  [/\$1,497 for 3 months/g, (l) => `${l.quarter} for 3 months`],
  [
    /\$4,788 (for a year|a year)(?: \(\$399 a month((?:, 20% off)?)\))?/g,
    (l, m) => `${l.year} ${m[1]}${m[0].includes("(") ? ` (${l.yearPerMonth} a month${m[2] ?? ""})` : ""}`,
  ],
]

const DE_RULES: Rule[] = [
  [new RegExp(`499${NB}\\$ pro Monat plus einmalig 499${NB}\\$ für die Einrichtung`, "g"), (l) => `${l.month} pro Monat plus einmalig ${l.setup} für die Einrichtung`],
  [new RegExp(`499${NB}\\$ pro Monat plus 499${NB}\\$ Einrichtung`, "g"), (l) => `${l.month} pro Monat plus ${l.setup} Einrichtung`],
  [new RegExp(`1\\.497${NB}\\$ für 3 Monate`, "g"), (l) => `${l.quarter} für 3 Monate`],
  [
    new RegExp(`4\\.788${NB}\\$ für ein Jahr(?: \\(399${NB}\\$ pro Monat(, 20${NB}% Rabatt)?\\))?`, "g"),
    (l, m) => `${l.year} für ein Jahr${m[0].includes("(") ? ` (${l.yearPerMonth} pro Monat${m[1] ?? ""})` : ""}`,
  ],
]

function apply(text: string, rules: Rule[], labels: GeoPriceLabels): string {
  let out = text
  for (const [re, make] of rules) out = out.replace(re, (...args) => make(labels, args.slice(0, -2) as unknown as RegExpExecArray))
  return out
}

/** The article's text (HTML or a meta description) with our own price sentences at these prices. */
export function priceArticleText(text: string, prices: GeoPrices): string {
  if (prices.month.lookupKey) return text // The one price: what is stored.
  return apply(apply(text, EN_RULES, geoPriceLabels("en", prices)), DE_RULES, geoPriceLabels("de", prices))
}
