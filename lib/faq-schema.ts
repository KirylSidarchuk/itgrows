/** FAQ markup that has to survive leaving our own site.
 *
 * The schema used to be emitted by the blog page component, which only runs for articles we host.
 * A customer publishing to their own WordPress got none of it. Extracting here means the markup
 * can travel inside the article HTML instead, and the heading can be written in the reader's
 * language without the extractor losing sight of it.
 */

const FAQ_HEADINGS: Record<string, string> = {
  en: "Frequently Asked Questions",
  de: "Häufig gestellte Fragen",
  ru: "Частые вопросы",
  uk: "Часті запитання",
  fr: "Questions fréquentes",
  es: "Preguntas frecuentes",
  it: "Domande frequenti",
  nl: "Veelgestelde vragen",
  pt: "Perguntas frequentes",
  pl: "Najczęstsze pytania",
}

export function faqHeadingFor(language?: string): string {
  return FAQ_HEADINGS[(language ?? "en").toLowerCase()] ?? FAQ_HEADINGS.en
}

export interface FaqItem { question: string; answer: string }

/** Pull up to five question/answer pairs out of a finished article. */
export function extractFaq(content: string, language?: string): FaqItem[] {
  const localised = faqHeadingFor(language).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const headingRe = new RegExp(
    `<h2[^>]*>[^<]*(?:frequently asked questions|faq|${localised})[^<]*</h2>([\\s\\S]*)`,
    "i",
  )
  const section = content.match(headingRe)
  if (!section) return []

  const items: FaqItem[] = []
  const patterns = [
    /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
    /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(section[1])) !== null && items.length < 5) {
      const question = m[1].replace(/<[^>]+>/g, "").trim()
      const answer = m[2].replace(/<[^>]+>/g, "").trim()
      // A genuine pair ends in a question mark; this also skips the closing call to action.
      if (question.endsWith("?") && answer) items.push({ question, answer })
    }
    if (items.length > 0) break
  }
  return items
}

/** The JSON-LD block, ready to append to the article HTML. Empty when there is nothing to say. */
export function faqJsonLd(items: FaqItem[]): string {
  if (items.length === 0) return ""
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }
  return `\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`
}
