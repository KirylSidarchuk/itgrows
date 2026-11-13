// Markdown for the agents that ask for it (Kiryl, 13 Nov 2026).
//
// Every article has a plain markdown copy at "<its address>.md" (app/blog-md, app/business-blog-md and
// the rewrites in next.config.ts), and the page links it in <head> and in a Link header. Indexing
// crawlers follow that link. Coding agents instead send "Accept: text/markdown" to the page's own
// address (Claude Code made 47 of the 92 Claude-User visits from 27 Oct to 13 Nov). middleware.ts
// answers those with the markdown copy and marks the request with MD_NEGOTIATED_HEADER, so the copy's
// route keeps that answer out of shared caches and says "Vary: Accept". Browsers never list
// text/markdown, so they get the page exactly as before. The home page ("/") answers the same way, with
// the text of llms.txt (app/home-md, lib/llms-text.ts).

// Request header middleware.ts sets when it rewrites an article to its markdown copy, or "/" to app/home-md.
export const MD_NEGOTIATED_HEADER = "x-itg-md"

type Range = { type: string; q: number }

function ranges(accept: string): Range[] {
  return accept.split(",").map((part) => {
    const [range, ...params] = part.split(";")
    let q = 1
    for (const p of params) {
      const [key, value] = p.split("=")
      if (key?.trim().toLowerCase() !== "q") continue
      const n = Number(value?.trim())
      q = Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0
    }
    return { type: range.trim().toLowerCase(), q }
  })
}

// True when Accept names text/markdown and ranks it no lower than text/html. text/html weighs what
// its most specific range says (RFC 9110, 12.5.1): text/html itself, else text/*, else the any-type
// range. Markdown counts only when named: a wildcard alone means the page.
export function wantsMarkdown(accept: string | null | undefined): boolean {
  if (!accept || !accept.toLowerCase().includes("text/markdown")) return false
  const list = ranges(accept)
  const best = (type: string): number | null => {
    const qs = list.filter((r) => r.type === type).map((r) => r.q)
    return qs.length ? Math.max(...qs) : null
  }
  const md = best("text/markdown") ?? 0
  const html = best("text/html") ?? best("text/*") ?? best("*/*") ?? 0
  return md > 0 && md >= html
}
