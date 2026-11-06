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

/** The first name that reads as a business, or "". */
export const headlineName = (names: { name: string }[]) => names.find((n) => !PUBLIC_BODY.test(n.name) && !MODEL_NUMBER.test(n.name))?.name ?? ""

/** The business named most instead of you, as the forecast races it: the first name that reads as a business
 *  and is not one of the assistants (the list comes sorted by count, most first). */
export function rivalOf<T extends { name: string; count: number }>(names: T[]): T | null {
  return names.find((n) => n.count > 0 && !PUBLIC_BODY.test(n.name) && !MODEL_NUMBER.test(n.name) && !ASSISTANT.test(n.name.trim())) ?? null
}
