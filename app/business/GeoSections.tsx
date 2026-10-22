// The three blocks that say what the plan actually runs, shared by "/" and "/business".
// They describe work we do for the client on the plan, not steps for the reader to follow: each block
// ends on "we do it", never on "how to". Built to be read in seconds; the detail sits in native
// <details>, so it stays in the server-rendered HTML for crawlers.
// Every number here comes from our own checks and code (Oct 2026), not from an industry study:
//  - 240 = 20 questions x 4 assistants x 3 asks (geo_check baseline and the paid weekly run)
//  - 11 crawlers = the bot user agents geo_onboard_check.py fetches a new client's site as
//  - 3-5 sources = client_writer.py research step; findability = geo_findability.py (Mondays)
//  - findings = the 19 Oct audit of three client sites plus our own robots.txt (fixed 21 Oct)
// What it deliberately does not say is how: which rules, which tests, which order.


// "See the plan" points at the pricing section of the page the block sits on: "/" prefixes its GEO
// section ids with "geo-" (#geo-pricing), "/business" does not (#pricing).
const pricingAnchor = (id?: string) => (id?.startsWith("geo-") ? "#geo-pricing" : "#pricing")

// Native disclosure without the browser's triangle (Safari draws it unless the marker is hidden).
const SUMMARY = "cursor-pointer list-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300"

// Line icons for the five stages, drawn inline: no icon library, no image requests.
const ICONS = {
  measure: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V6M17 16V9" />
    </>
  ),
  doors: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />
    </>
  ),
  index: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.6-4.6" />
    </>
  ),
  write: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  repeat: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v4h-4" />
    </>
  ),
} as const

const STAGES: { step: string; icon: keyof typeof ICONS; n: string; l: string; d: string }[] = [
  {
    step: "Measure",
    icon: "measure",
    n: "240",
    l: "answers read before we write a word",
    d: "Twenty questions your buyers ask, put to all four assistants three times each, because their answers change from one ask to the next. Who is named, which pages are quoted, and what kind of site each source is: a competitor, a review site, a directory and an official source each call for a different move. Some questions no article on your own site can win; we find out which before your budget goes into them.",
  },
  {
    step: "Open the doors",
    icon: "doors",
    n: "11",
    l: "crawlers your site is tested as",
    d: "Before the first article, on every domain you own: certificates, redirects, your host's firewall, robots.txt, sitemaps. Whatever stops GPTBot, ClaudeBot, PerplexityBot and the rest, we find and fix with you.",
  },
  {
    step: "Get indexed",
    icon: "index",
    n: "4",
    l: "search indexes, one per assistant",
    d: "ChatGPT searches through Bing, Claude through Brave, Gemini through Google, Perplexity through its own. A page Google has indexed can still be invisible to the other three. On blogs we host, every new page is submitted to Bing within half an hour, and every article keeps one address.",
  },
  {
    step: "Write",
    icon: "write",
    n: "3–5",
    l: "sources read and cited per article",
    d: "Research on live search, and every source is read before it is cited. An editor pass checks each claim against your product facts and the sources, then automated checks go over the rest. A topic too close to one you already have is not written. Nothing goes live without your approval.",
  },
  {
    step: "Re-measure",
    icon: "repeat",
    n: "52",
    l: "full recounts a year, against day 0",
    d: "The same questions against day 0, every week. A separate test tells us whether each assistant can find your published articles at all, so a gap in indexing is caught and fixed instead of being mistaken for weak writing. Once a month, a report in your language, read by a person before it reaches you.",
  },
]

function StageIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

/**
 * The plan as a pipeline: five stages, a big number each. Desktop: one row with a road through the
 * nodes. Phone: a vertical timeline. What runs inside each stage opens below, aligned to its column.
 */
export function WorkSystem({ id = "how" }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-600 text-center mb-3">
          What we run for you · $499 a month
        </p>
        <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">An article is the last step, not the product</h2>
        <p className="text-slate-600 text-center mb-10 sm:mb-14 text-sm sm:text-base">Five stages. We do the work, every week; you approve what goes live.</p>

        <div className="relative">
          {/* The road: vertical on the phone, through the node centres on desktop */}
          <div aria-hidden className="lg:hidden absolute left-[27px] top-7 bottom-7 w-0.5 rounded-full bg-gradient-to-b from-violet-300 via-violet-500 to-cyan-400" />
          <div aria-hidden className="hidden lg:block absolute top-[27px] left-[10%] right-[10%] h-0.5 rounded-full bg-gradient-to-r from-violet-300 via-violet-500 to-cyan-400" />
          <ol className="relative grid gap-5 lg:grid-cols-5 lg:gap-6">
            {STAGES.map((s, i) => (
              <li key={s.step} className="relative flex lg:flex-col lg:items-center gap-4 lg:gap-0 lg:text-center">
                <div className="relative z-10 w-14 h-14 shrink-0 rounded-full bg-white border-2 border-violet-200 text-violet-600 flex items-center justify-center shadow-sm lg:mb-4">
                  <StageIcon name={s.icon} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
                    {String(i + 1).padStart(2, "0")} · {s.step}
                  </p>
                  <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter leading-none mt-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                    {s.n}
                  </p>
                  <p className="text-sm font-semibold leading-snug mt-1.5">{s.l}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <details className="group mt-10 border-t border-black/10">
          <summary className={`${SUMMARY} flex items-center justify-center gap-2 py-4 text-sm font-semibold text-violet-700`}>
            What runs inside each stage
            <span className="text-lg leading-none transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="grid gap-4 lg:grid-cols-5 lg:gap-6 pb-2">
            {STAGES.map((s) => (
              <div key={s.step} className="border-l-2 border-violet-200 pl-4 lg:border-l-0 lg:pl-0 lg:border-t-2 lg:pt-3">
                <p className="text-xs font-bold text-[#1b1916]">{s.step}</p>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </details>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <p className="text-sm sm:text-base font-semibold max-w-xl">
            None of this shows in an article. All of it decides whether an assistant ever reads one.
          </p>
          <a href={pricingAnchor(id)} className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20">
            See the plan →
          </a>
        </div>
      </div>
    </section>
  )
}

const FOUND = [
  { n: "1 of 18", h: "articles ChatGPT found by their exact title", d: "Yet Google had indexed nearly every article on one site." },
  { n: "128 MB", h: "one blog index page, images embedded", d: "Google reads the first 15 MB. Links sat below." },
  { n: "0", h: "new articles in Google after three weeks", d: "Crawlers were led only to old pages." },
  { n: "2", h: "addresses per article, each posing as original", d: "It competes with itself." },
  { n: "1 line", h: "in robots.txt, meant to hide one page", d: "It hid every address starting with that letter." },
]

/**
 * An evidence wall on dark. Desktop: the first finding spans two columns, four tiles follow, the
 * closing line runs full width under them. Phone: one column of tiles.
 */
export function FoundOnSites({ id }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-center">Publishing is not the same as being found</h2>
        <p className="text-slate-400 text-center mt-3 mb-10 text-sm sm:text-base">
          Our own weekly checks, October 2026: client sites and itgrows.ai itself.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FOUND.map((f, i) => (
            <div
              key={f.n}
              className={`rounded-2xl border p-5 sm:p-6 ${
                i === 0 ? "sm:col-span-2 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 border-violet-400/30" : "bg-white/[0.06] border-white/10"
              }`}
            >
              <p
                className={`font-extrabold tracking-tighter leading-none ${
                  i === 0
                    ? "text-5xl sm:text-7xl bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent"
                    : "text-4xl sm:text-5xl text-white"
                }`}
              >
                {f.n}
              </p>
              <p className={`font-bold text-white leading-snug mt-3 ${i === 0 ? "text-lg sm:text-2xl" : "text-base"}`}>{f.h}</p>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl border border-violet-400/40 bg-violet-500/10 px-5 py-4 text-center text-sm sm:text-base text-white font-semibold leading-relaxed">
          Every one of these sites was publishing. On the plan, the same weekly checks run on yours.
        </p>
      </div>
    </section>
  )
}

const VERSUS = [
  { a: "A keyword list", b: "240 answers read first", k: "Before writing", d: "Who ChatGPT, Claude, Gemini and Perplexity name today, and who they quote." },
  { a: "Crawlers not checked", b: "Tested as 11 crawlers", k: "Can assistants reach your site?", d: "Blockers are found and fixed with you before the first article." },
  {
    a: "Publish and hope",
    b: "Findability tested weekly",
    k: "Is each page in the index each assistant searches?",
    d: "New pages are submitted to Bing on publication (blogs we host), and every week we test whether each assistant can find them.",
  },
  { a: "Duplicates not checked", b: "Duplicates found, fixed", k: "Duplicate addresses, sitemaps that miss new pages", d: "We find them on your site and fix them." },
  { a: "Unwinnable topics written", b: "Spotted before you spend", k: "Questions no own-site article can win", d: "Found before your budget goes into them." },
  { a: "Facts up to the writer", b: "3–5 sources, each read", k: "Facts and sources", d: "Every source read before it is cited; an editor pass and automated checks on every article." },
  { a: "Proof: articles, traffic", b: "Proof: count vs day 0", k: "Proof", d: "The same questions against day 0, every week, across four assistants." },
  { a: "You pay for words", b: "You pay to be findable", k: "What you pay for", d: "Being findable, readable and quotable, and an honest count of whether you are named." },
]

function Mark({ yes }: { yes?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-px w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
        yes ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
      }`}
    >
      {yes ? "✓" : "✕"}
    </span>
  )
}

/**
 * Row pairs: ✕ what an article-only service does, ✓ what the plan does, 2–5 words each. Tapping a
 * row opens the detail under it. Same two columns on desktop and phone; the phrases are short enough.
 */
export function VersusArticles({ id }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center mb-10">Why this is not paying for articles</h2>
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="flex text-[11px] uppercase tracking-wide font-bold border-b border-black/10">
            <div className="flex-1 basis-0 px-3 sm:px-5 py-3 text-slate-500">Article-only service</div>
            <div className="flex-1 basis-0 px-3 sm:px-5 py-3 text-violet-700 bg-violet-50/70">ItGrows plan</div>
            <div className="w-9 sm:w-11 shrink-0 bg-violet-50/70" />
          </div>
          {VERSUS.map((r) => (
            <details key={r.k} className="group border-b border-black/5 last:border-0">
              <summary className={`${SUMMARY} flex items-stretch text-sm`}>
                <span className="flex-1 basis-0 px-3 sm:px-5 py-3 flex gap-2 sm:gap-2.5 text-slate-500">
                  <Mark />
                  <span>{r.a}</span>
                </span>
                <span className="flex-1 basis-0 px-3 sm:px-5 py-3 flex gap-2 sm:gap-2.5 font-semibold text-[#1b1916] bg-violet-50/70">
                  <Mark yes />
                  <span>{r.b}</span>
                </span>
                <span className="w-9 sm:w-11 shrink-0 bg-violet-50/70 flex items-center justify-center text-violet-600 text-lg leading-none" aria-hidden>
                  <span className="transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="px-3 sm:px-5 py-3 text-sm text-slate-600 leading-relaxed bg-violet-50/40 border-t border-black/5">
                <b className="text-[#1b1916]">{r.k}.</b> {r.d}
              </p>
            </details>
          ))}
        </div>
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-5">
          Some agencies do more than write. Ask them for last week&apos;s count against day 0.
        </p>
      </div>
    </section>
  )
}

export const GEO_INCLUDED = [
  "Site and index setup: tested as 11 crawlers, blockers fixed",
  "Day 0: 240 answers from ChatGPT, Claude, Gemini and Perplexity",
  "Every week: the same count against day 0, whether the assistants can find your articles, and who is quoted instead",
  "Up to 12 researched articles a month on your own domain, 3–5 sources each",
  "Blog hosting with the machine-readable layer built in — one DNS record",
  "Approval queue, full veto",
  "A monthly report in your language, read by a person first",
  "A human who knows your account",
]
