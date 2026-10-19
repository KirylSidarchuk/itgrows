// Turns a title into a URL slug that keeps its words.
//
// The previous slug code dropped every non-ASCII letter, so a German title came out
// as "firmengr-ndung" or "f-r" — the keyword itself broken in the address. Umlauts
// and ß are spelled out the way German writes them without the mark (ü → ue), and
// accents in other languages fall back to the base letter (é → e).

const SPELLED_OUT: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue",
}

/**
 * Slug without any uniqueness suffix. Long titles are cut at a word boundary
 * so the address stays readable.
 */
export function slugBase(text: string, maxLength = 80): string {
  let slug = text
    .replace(/[äöüßÄÖÜ]/g, (c) => SPELLED_OUT[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength)
    const lastBreak = slug.lastIndexOf("-")
    if (lastBreak > maxLength * 0.6) slug = slug.slice(0, lastBreak)
    slug = slug.replace(/-+$/g, "")
  }
  return slug
}
