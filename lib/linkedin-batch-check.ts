// Batch-level checks on generated posts.
//
// A post can be good on its own while the batch it belongs to announces itself: fourteen posts
// that all close on a rhetorical question, or all open with the same construction, or all run to
// the same length. The defect is only visible across the set, so the test has to run across the
// set. These were developed by hand against one author's runs and are worth having for everyone.
//
// Two rules about how they are used:
//
// The numeric limits are drawn per run rather than fixed. A model told "at most four questions"
// every time produces variety with a fixed distribution, which is a fingerprint of its own — the
// constraint calcifies into the pattern it was meant to prevent.
//
// The limits are not put in the prompt. Measured on one author's account: with the numbers
// removed from the instructions the model violated them in six batches out of six, while flat
// prohibitions held with zero violations and no numbers attached. So prohibitions go in the
// prompt and quotas stay here, where the model cannot optimise against them.

export type BatchQuota = {
  maxQuestionEndings: number
  minFirstPerson: number
  maxSameConstruction: number
  maxBackReferences: number
}

export type Defect = { post: number | null; why: string }

// Drawn from the batch itself so a given set of posts always evaluates the same way, without
// needing a clock or a random seed passed around.
export function drawQuota(posts: string[]): BatchQuota {
  let h = 0
  for (const p of posts) for (let i = 0; i < p.length; i += 17) h = (h * 31 + p.charCodeAt(i)) % 100000
  const pick = (min: number, max: number, salt: number) => min + ((h + salt * 7919) % (max - min + 1))
  const n = posts.length
  return {
    maxQuestionEndings: Math.max(2, Math.round((pick(15, 40, 1) / 100) * n)),
    minFirstPerson: Math.max(2, Math.round((pick(35, 60, 2) / 100) * n)),
    maxSameConstruction: pick(2, 4, 3),
    maxBackReferences: pick(2, 3, 4),
  }
}

// Things that are wrong in a single post, whatever the rest of the batch looks like.
const BANNED: [RegExp, string][] = [
  [/\bwhat i(?:'ve| have)? (?:call|termed|named)\b/i, "claims the author coined a term"],
  [/\bi(?:'ve| have) written before about\s*['"“]/i, "attributes a coinage to the author"],
  [/\bthroughout this series\b/i, "series wrap-up"],
  [/\bwe (?:have )?(?:started|began) (?:this|by)\b/i, "series wrap-up"],
  [/\bwe have (?:explored|discussed|covered|looked at)\b/i, "opens as a recap"],
  // A specific figure the model did not get from anywhere is worse than no figure.
  [/\b\d{1,3}(?:\.\d+)?%[\s,.]/, "states a percentage the author did not supply"],
]

// Openers that read as a person until they carry half the batch.
const CONSTRUCTIONS: [string, RegExp][] = [
  ["I believe", /\bi believe\b/i],
  ["I have observed", /\bi(?:'ve| have) (?:increasingly |long )?observed\b/i],
  ["My observation is", /\bmy observation is\b/i],
  ["My thinking keeps", /\bmy thinking keeps (?:circling|coming) back\b/i],
  ["I keep returning to", /\bi keep (?:returning|coming) (?:back )?to\b/i],
  ["I have come to", /\bi(?:'ve| have) come to (?:understand|believe|see)\b/i],
  ["We often", /\bwe often\b/i],
  ["What I wish I'd known", /\bwhat i wish i(?:'d| had)? ?(?:known|understood)\b/i],
  ["The real question is", /\bthe (?:real|more important) question is\b/i],
  ["It is not about", /\bit(?:'s| is) not (?:just |simply |merely )?about\b/i],
]

const BACK_REFERENCE = /\b(i wrote|i(?:'ve| have) (?:written|discussed|explored)|as i (?:wrote|discussed|explored|noted))\b/i
const OPENS_BACKWARD = /^(i wrote|as i|building on|reflecting on|my earlier|following on)/i

export function findDefects(posts: string[], quota: BatchQuota): Defect[] {
  const out: Defect[] = []
  if (posts.length < 3) return out

  posts.forEach((p, i) => {
    for (const [rx, why] of BANNED) if (rx.test(p)) out.push({ post: i + 1, why })
  })

  const endings = posts.filter((p) => p.trim().endsWith("?")).length
  if (endings > quota.maxQuestionEndings) {
    out.push({ post: null, why: `${endings} of ${posts.length} posts end on a question; at most ${quota.maxQuestionEndings}` })
  }

  const firstPerson = posts.filter((p) => /\b(i|i've|i'd|i'm|my)\b/i.test(p)).length
  if (firstPerson < quota.minFirstPerson) {
    out.push({ post: null, why: `only ${firstPerson} of ${posts.length} posts use the first person; at least ${quota.minFirstPerson}` })
  }

  const refs = posts.map((p, i) => [p, i] as const).filter(([p]) => BACK_REFERENCE.test(p))
  if (refs.length > quota.maxBackReferences) {
    out.push({ post: null, why: `${refs.length} posts refer back; at most ${quota.maxBackReferences}` })
  }
  for (const [p, i] of refs) {
    if (OPENS_BACKWARD.test(p.trim().replace(/\s+/g, " ").slice(0, 90))) {
      out.push({ post: i + 1, why: "opens with a backward reference" })
    }
  }

  for (const [label, rx] of CONSTRUCTIONS) {
    const n = posts.filter((p) => rx.test(p)).length
    if (n > quota.maxSameConstruction) {
      out.push({ post: null, why: `"${label}" appears in ${n} posts; at most ${quota.maxSameConstruction}` })
    }
  }

  // Length should follow the thought. A set that is all one size is a house style, not a voice.
  const lengths = posts.map((p) => p.split(/\s+/).length)
  const short = lengths.filter((n) => n < 110).length
  const long = lengths.filter((n) => n > 180).length
  if (short < 1 || long < 1) {
    out.push({
      post: null,
      why: `no length variety: ${short} short, ${long} long (range ${Math.min(...lengths)}-${Math.max(...lengths)})`,
    })
  }

  return out
}
