// The name a page puts forward as "the business named instead of you" has to read as a business like
// theirs. On real checks (2-4 Nov 2026) the first name was "Gas Safe Register", "Forestry Commission" or
// "Anbernic RG34XX SP": a regulator, a public body or a product model. So those are passed over for the
// next name, or the page goes without one. The result screen's headline (app/business/AiAnswers.tsx) and
// the cabinet's forecast (app/business/dashboard/visibility/charts.tsx) pick it the same way.
const PUBLIC_BODY = /\b(register|commission|council|association|society|authority|institute|federation|foundation|ministry|department|government|nhs|regulator|charity)\b/i
const MODEL_NUMBER = /\b(?=[a-z0-9]*[a-z])(?=[a-z0-9]*\d[a-z0-9]*\d)[a-z0-9]{3,}\b/i
// The assistants themselves, named when the questions are about AI (itgrows.ai's own report: "ChatGPT" 17
// times): a tool the answer points to, not a rival to overtake. The whole name must be one ("Google Gemini",
// "Microsoft Copilot"), so "Gemini Plumbing" or "Claude's Bakery" stay rivals.
const ASSISTANT =
  /^(?:(?:openai|google|microsoft|anthropic)\s+)?(?:chatgpt|gpt-?\d[\w.]*|claude|gemini|perplexity(?:\s+ai)?|copilot|bard|google|openai|anthropic|microsoft)(?:\s+(?:ai|search|pro|plus))?$/i

/** Whether a name reads as a business, not a register, a public body or a product model. */
export const readsAsBusiness = (name: string) => !PUBLIC_BODY.test(name) && !MODEL_NUMBER.test(name)

// Text folded roughly the way the check service compares names (geo_check core._norm): no accents, one kind of
// apostrophe, "&" as "and", lower case, and any run of spaces, hyphens, dashes, slashes, dots or brackets as one
// space ("Shiva.com", "J.B. Plumbing", "Optioryx (Flux)"). at[i] is the index in the original of the character the
// i-th folded one came from, so a match can be cut out of the original. (6 Nov 2026: the quote had "L’Île-Bizard"
// with a curly apostrophe, the name a straight one, and the bold was lost.)
function fold(s: string) {
  let text = ""
  const at: number[] = []
  const space = (i: number) => {
    if (text && !text.endsWith(" ")) {
      text += " "
      at.push(i)
    }
  }
  for (let i = 0; i < s.length; ) {
    const ch = String.fromCodePoint(s.codePointAt(i)!)
    if (/[\s\-\u2010-\u2015\u2212/.()]/u.test(ch)) space(i)
    else if (ch === "&") {
      space(i)
      text += "and"
      at.push(i, i, i)
      space(i)
    } else if (!/[\u00ad\u200b-\u200d\u2060\ufeff]/u.test(ch)) {
      const f = ch.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[\u2018\u2019\u02bc`\u00b4]/g, "'")
      text += f
      for (let k = 0; k < f.length; k++) at.push(i)
    }
    i += ch.length
  }
  return { text, at }
}

/** Where `name` is in `text`, as [start, end) in `text`, matched as above and as whole words. A name written with a
 *  capital is not matched in lower case ("Family Dental Care" the business, not "family dental care" in a piece of
 *  advice), as on the VM (core.quote_naming). */
export function findName(text: string, name: string): [number, number] | null {
  const n = fold(name).text.trim()
  if (!n) return null
  const t = fold(text)
  const word = /[\p{L}\p{N}]/u
  const capital = /^\p{Lu}/u.test(name.trim())
  for (let k = t.text.indexOf(n); k >= 0; k = t.text.indexOf(n, k + 1)) {
    if (word.test(t.text[k - 1] ?? "") || word.test(t.text[k + n.length] ?? "")) continue
    const start = t.at[k]
    if (capital && !/^\p{Lu}/u.test(text.slice(start))) continue
    const last = t.at[k + n.length - 1]
    return [start, last + String.fromCodePoint(text.codePointAt(last)!).length]
  }
  return null
}

/** The first name that reads as a business, or "". */
export const headlineName = (names: { name: string }[]) => names.find((n) => readsAsBusiness(n.name))?.name ?? ""

/** The business named most instead of you, as the forecast races it: the first name that reads as a business
 *  and is not one of the assistants (the list comes sorted by count, most first). */
export function rivalOf<T extends { name: string; count: number }>(names: T[]): T | null {
  return names.find((n) => n.count > 0 && readsAsBusiness(n.name) && !ASSISTANT.test(n.name.trim())) ?? null
}
