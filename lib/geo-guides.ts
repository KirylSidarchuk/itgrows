// The AI-visibility guides (/business/blog) that other pages link to on purpose, in one place: the
// main guides of each language (home "Guides", the /blog block, the top of llms.txt), the reading
// paths at the foot of each guide, and the English <-> German pairs (hreflang in the article
// metadata and in the sitemap). No database here, so any page, route or the sitemap can import it.
//
// Keys and slugs are those of /root/blog_engine/own_geo_plan.json (the knowledge-base plan),
// checked against the live articles on 26 Oct 2026; "old-*" are the three earlier industry
// articles that are not in the plan. A slug that is redirected or missing is simply skipped by the
// pages, so a merged article never leaves a dead link.

export type GuideLang = "en" | "de"

/** Plan key -> slug. */
export const GUIDE_SLUGS = {
  pillar: "how-to-get-your-business-recommended-by-chatgpt",
  "what-is-geo": "what-is-generative-engine-optimization",
  "why-not": "why-doesnt-chatgpt-mention-my-company",
  "geo-vs-seo": "geo-vs-seo",
  "own-case": "we-measured-our-own-ai-visibility",
  traffic: "does-ai-search-send-traffic-to-websites",
  pay: "can-you-pay-to-be-recommended-by-chatgpt",
  "how-chatgpt-chooses": "how-does-chatgpt-decide-which-businesses-to-recommend",
  bing: "does-chatgpt-search-use-bing",
  claude: "how-to-get-cited-by-claude",
  perplexity: "how-to-get-mentioned-by-perplexity",
  gemini: "how-to-show-up-in-gemini-and-ai-overviews",
  "how-long": "how-long-does-it-take-to-appear-in-chatgpt-answers",
  blocking: "is-your-website-blocking-ai-crawlers",
  "user-agents": "ai-crawler-user-agents",
  "allow-gptbot": "how-to-allow-gptbot-in-robots-txt",
  cloudflare: "gptbot-blocked-by-cloudflare",
  logs: "how-to-see-ai-crawlers-in-server-logs",
  discovery: "how-ai-crawlers-find-your-website",
  "block-or-not": "should-you-block-ai-crawlers",
  js: "does-chatgpt-read-javascript-websites",
  schema: "schema-markup-for-ai-search",
  "llms-txt": "what-is-llms-txt",
  check: "how-to-check-if-chatgpt-recommends-your-business",
  measure: "how-to-measure-ai-visibility",
  cost: "how-much-does-generative-engine-optimization-cost",
  agency: "geo-agency-how-to-choose",
  "agency-or-tool": "geo-agency-or-geo-tool",
  tools: "geo-tools-compared",
  local: "how-local-businesses-get-recommended-by-chatgpt",
  apps: "how-apps-get-recommended-by-chatgpt",
  b2b: "ai-visibility-for-b2b-companies",
  law: "how-law-firms-appear-in-ai-answers",
  "old-saas": "how-a-saas-company-becomes-visible-to-ai-assistants-mvb1etnl",
  "old-consultants": "how-consultants-get-cited-by-chatgpt-mvfbq6ll",
  "old-professional-services": "generative-engine-optimization-for-professional-services-firms-mvi6lhw7",
  "de-pillar": "wie-kommt-mein-unternehmen-in-chatgpt-antworten",
  "de-why-not": "warum-empfiehlt-chatgpt-meine-konkurrenz",
  "de-geo-seo": "geo-vs-seo-unterschied",
  "de-dauer": "wie-lange-bis-chatgpt-mein-unternehmen-nennt",
  "de-bing": "bing-webmaster-tools-indexnow-chatgpt",
  "de-crawler": "blockiert-meine-website-ki-crawler",
  "de-llms": "llms-txt-hilft-das",
  "de-check": "pruefen-ob-chatgpt-mein-unternehmen-kennt",
  "de-cost": "was-kostet-generative-engine-optimization",
  "de-agency": "geo-agentur-auswaehlen",
  "de-arzt": "wie-arztpraxen-von-chatgpt-empfohlen-werden",
  "de-kanzlei": "kanzleien-steuerberater-in-ki-antworten",
} as const

export type GuideKey = keyof typeof GUIDE_SLUGS

/** German guides of own_geo_plan.json that are not live yet (26 Oct 2026); the writer publishes them
 *  under these slugs. Listed so they are German at the edge from their first day. */
const PLANNED_GERMAN_GUIDES = [
  "was-ist-answer-engine-optimization",
  "zitieren-ki-assistenten-ki-texte",
  "chatgpt-trainingsdaten-und-websuche",
] as const

/** Slugs of the German guides (plan keys de-*, live or planned). middleware.ts serves these as German,
 *  so app/layout.tsx renders <html lang="de">; it has no database, so a German guide missing here
 *  gets <html lang="en"> (the article's own wrapper and meta still say de): add new German plan keys. */
export const GERMAN_GUIDE_SLUGS: ReadonlySet<string> = new Set([
  ...Object.entries(GUIDE_SLUGS)
    .filter(([key]) => key.startsWith("de-"))
    .map(([, slug]) => slug),
  ...PLANNED_GERMAN_GUIDES,
])

const slugs = (keys: readonly GuideKey[]) => keys.map((k) => GUIDE_SLUGS[k])

/** The main guides of each language, in this order (home "Guides", the /blog block, llms.txt). */
export const MAIN_GUIDES: Record<GuideLang, readonly string[]> = {
  en: slugs(["pillar", "what-is-geo", "why-not", "check", "cost", "agency"]),
  de: slugs(["de-pillar", "de-why-not", "de-check", "de-cost", "de-agency", "de-geo-seo"]),
}

/** Every guide's "Keep reading" starts with these two (the article itself excepted). There is no
 *  German "what is GEO" article; "GEO und SEO" is the German page that explains what GEO is. */
const PILLAR: Record<GuideLang, string> = { en: GUIDE_SLUGS.pillar, de: GUIDE_SLUGS["de-pillar"] }
const DEFINITION: Record<GuideLang, string> = { en: GUIDE_SLUGS["what-is-geo"], de: GUIDE_SLUGS["de-geo-seo"] }

/** Topics, each in reading order. A guide's "Keep reading" adds the next two of its own topic
 *  (wrapping around), so every guide of a topic gets links from the two before it. */
const TOPICS: Record<GuideLang, readonly (readonly string[])[]> = {
  en: [
    // Getting named: what it is, why not, what to expect
    slugs(["pillar", "what-is-geo", "why-not", "geo-vs-seo", "own-case", "traffic", "pay"]),
    // The assistants and the indexes they search
    slugs(["how-chatgpt-chooses", "bing", "claude", "perplexity", "gemini", "how-long"]),
    // Crawlers and the site itself
    slugs(["blocking", "user-agents", "allow-gptbot", "cloudflare", "logs", "discovery", "block-or-not", "js", "schema", "llms-txt"]),
    // Measuring, prices, agencies and tools
    slugs(["check", "measure", "cost", "agency", "agency-or-tool", "tools"]),
    // Industries
    slugs(["local", "apps", "b2b", "law", "old-saas", "old-consultants", "old-professional-services"]),
  ],
  de: [
    slugs(["de-pillar", "de-geo-seo", "de-why-not", "de-dauer"]),
    slugs(["de-bing", "de-crawler", "de-llms"]),
    slugs(["de-check", "de-cost", "de-agency"]),
    slugs(["de-arzt", "de-kanzlei"]),
  ],
}

/** English <-> German versions of the same guide (plan keys X <-> de-*). law <-> de-kanzlei: the
 *  German one also covers tax advisers' firms; same question and same 23 September test. */
export const GUIDE_PAIRS: readonly (readonly [en: string, de: string])[] = (
  [
    ["pillar", "de-pillar"],
    ["why-not", "de-why-not"],
    ["cost", "de-cost"],
    ["agency", "de-agency"],
    ["geo-vs-seo", "de-geo-seo"],
    ["check", "de-check"],
    ["bing", "de-bing"],
    ["blocking", "de-crawler"],
    ["law", "de-kanzlei"],
    ["how-long", "de-dauer"],
    ["llms-txt", "de-llms"],
  ] as const satisfies readonly (readonly [GuideKey, GuideKey])[]
).map(([en, de]) => [GUIDE_SLUGS[en], GUIDE_SLUGS[de]] as const)

const GUIDE_BASE = "https://www.itgrows.ai/business/blog/"

/** hreflang alternates of a guide that exists in both languages (x-default: the English one), or
 *  undefined. The same map is returned for either side of the pair. */
export function guideAlternates(slug: string): Record<"en" | "de" | "x-default", string> | undefined {
  const pair = GUIDE_PAIRS.find(([en, de]) => en === slug || de === slug)
  if (!pair) return undefined
  return { en: GUIDE_BASE + pair[0], de: GUIDE_BASE + pair[1], "x-default": GUIDE_BASE + pair[0] }
}

/** The guide to link from a page in `locale`: the German version on German pages when there is
 *  one, the English guide otherwise (French, Spanish and Russian guides do not exist yet). */
export function guideFor(locale: string, enSlug: string): string {
  if (locale !== "de") return enSlug
  return GUIDE_PAIRS.find(([en]) => en === enSlug)?.[1] ?? enSlug
}

/** "Keep reading" candidates for a guide, best first, never the guide itself: the main guide, the
 *  definition, then the next guides of its topic. The page takes the first live ones and fills up
 *  with the newest guides of the language if fewer than it shows. */
export function keepReadingCandidates(slug: string, lang: GuideLang): string[] {
  const out = [PILLAR[lang], DEFINITION[lang]]
  const topic = TOPICS[lang].find((t) => t.includes(slug))
  if (topic) {
    const i = topic.indexOf(slug)
    for (let k = 1; k < topic.length; k++) out.push(topic[(i + k) % topic.length])
  }
  return [...new Set(out)].filter((s) => s !== slug)
}

/** Guides in llms.txt order: the main English ones, the other English ones, the main German ones,
 *  the other German ones. Within "other", the order given (newest first) is kept. */
export function llmsOrder<T extends { slug: string; lang: string | null }>(rows: readonly T[]): T[] {
  const langOf = (r: T): GuideLang => (r.lang === "de" ? "de" : "en")
  const rank = (r: T) => {
    const lang = langOf(r)
    const main = MAIN_GUIDES[lang].indexOf(r.slug)
    return (lang === "de" ? 2000 : 0) + (main === -1 ? 1000 : main)
  }
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i)
    .map((x) => x.r)
}
