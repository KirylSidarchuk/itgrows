// Our articles are stored as HTML from our own generator; their markdown alternates (/…/slug.md)
// should read as markdown, not as tags. Covers exactly what the generator emits: headings,
// paragraphs, lists, links, emphasis, quotes, simple tables.

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }

function decode(s: string) {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

function inline(s: string) {
  return decode(
    s
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${text.replace(/<[^>]+>/g, "").trim()}](${href})`)
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*")
      .replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .trim()
}

function table(html: string) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) =>
    [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => inline(c[1]).replace(/\|/g, "\\|"))
  )
  if (!rows.length) return ""
  const width = Math.max(...rows.map((r) => r.length))
  const line = (r: string[]) => `| ${[...r, ...Array(width - r.length).fill("")].join(" | ")} |`
  return [line(rows[0]), `| ${Array(width).fill("---").join(" | ")} |`, ...rows.slice(1).map(line)].join("\n")
}

export function htmlToMarkdown(html: string): string {
  let s = html.replace(/\r/g, "")
  s = s.replace(/<table[\s\S]*?<\/table>/gi, (t) => `\n\n${table(t)}\n\n`)
  s = s.replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, n, t) => `\n\n${"#".repeat(Number(n))} ${inline(t)}\n\n`)
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, t) => `\n\n> ${inline(t)}\n\n`)
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, body) => {
    let i = 0
    return "\n\n" + [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => `${++i}. ${inline(li[1])}`).join("\n") + "\n\n"
  })
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, body) =>
    "\n\n" + [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => `- ${inline(li[1])}`).join("\n") + "\n\n"
  )
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `\n\n${inline(t)}\n\n`)
  s = s.replace(/<(?!\/?(?:br)\b)[^>]+>/g, "")
  return decode(s).replace(/\n{3,}/g, "\n\n").trim() + "\n"
}
