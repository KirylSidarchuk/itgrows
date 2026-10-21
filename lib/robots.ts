// robots.txt as crawlers read it (RFC 9309): groups of user-agents with allow/disallow rules; a
// URL is decided by the longest matching rule, allow winning a tie; "*" matches any run of
// characters and a trailing "$" anchors the end. Rules are prefixes — which is exactly how a rule
// meant for one page ("/b") ends up closing every path that starts with the same letters
// ("/blog", "/business"). Checking a site's own sitemap URLs against its rules is how that shows.

export interface Rule {
  allow: boolean
  path: string
}
export interface Group {
  agents: string[]
  rules: Rule[]
}

export function parseRobots(text: string): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim()
    const m = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i)
    if (!m) continue
    const field = m[1].toLowerCase()
    const value = m[2].trim()
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else if (current) {
      lastWasAgent = false
      if (value) current.rules.push({ allow: field === "allow", path: value })
    }
  }
  return groups
}

export function sitemapsIn(text: string): string[] {
  return [...text.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1])
}

/** The rules that apply to a crawler: every group naming it, or else the "*" groups. */
export function rulesFor(groups: Group[], bot: string): Rule[] | null {
  const token = bot.toLowerCase()
  const named = groups.filter((g) => g.agents.includes(token))
  const chosen = named.length ? named : groups.filter((g) => g.agents.includes("*"))
  return chosen.length ? chosen.flatMap((g) => g.rules) : null
}

function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$")
  const body = anchored ? pattern.slice(0, -1) : pattern
  const re = new RegExp("^" + body.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : ""))
  return re.test(path)
}

/** Whether a path (with its query) may be fetched, and the rule that decided it. */
export function verdict(rules: Rule[] | null, pathWithQuery: string): { allowed: boolean; rule: Rule | null } {
  if (!rules || pathWithQuery === "/robots.txt") return { allowed: true, rule: null }
  let best: Rule | null = null
  for (const r of rules) {
    if (!matches(r.path, pathWithQuery)) continue
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow && !best.allow)) best = r
  }
  return { allowed: !best || best.allow, rule: best }
}
