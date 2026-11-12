// Turns a title into a URL slug that keeps its words.
//
// The previous slug code dropped every non-ASCII letter, so a German title came out
// as "firmengr-ndung" or "f-r" — the keyword itself broken in the address. Umlauts
// and ß are spelled out the way German writes them without the mark (ü → ue), and
// accents in other languages fall back to the base letter (é → e).

const SPELLED_OUT: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue",
}

// Cyrillic (youmoir.com/ru/blog, 12 Nov 2026): the regex below kept only a-z, so a Russian title
// came out as "2026" plus the random tail. Spelled out in Latin letters the common way (щ → shch).
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  і: "i", ї: "yi", є: "ye", ґ: "g", ў: "u",
}

/**
 * Slug without any uniqueness suffix. Long titles are cut at a word boundary
 * so the address stays readable.
 */
export function slugBase(text: string, maxLength = 80): string {
  let slug = text
    .replace(/[äöüßÄÖÜ]/g, (c) => SPELLED_OUT[c])
    .toLowerCase()
    .replace(/[а-яёіїєґў]/g, (c) => CYRILLIC[c] ?? "")
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
