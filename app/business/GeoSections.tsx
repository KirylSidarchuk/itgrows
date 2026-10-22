// The three blocks that say what $499 a month actually runs, shared by "/" and "/business".
// Every number here comes from our own checks and code (Oct 2026), not from an industry study:
//  - 240 = 20 questions x 4 assistants x 3 asks (geo_check baseline and the paid weekly run)
//  - 11 crawlers = the bot user agents geo_onboard_check.py fetches a new client's site as
//  - 3-5 sources = client_writer.py research step; findability = geo_findability.py (Mondays)
//  - findings = the 19 Oct audit of three client sites plus our own robots.txt (fixed 21 Oct)
// What it deliberately does not say is how: which rules, which tests, which order.

const LAYERS = [
  {
    n: "240",
    l: "answers read before a word is written",
    d: "Twenty questions your buyers ask, put to ChatGPT, Claude, Gemini and Perplexity three times each, because their answers change from one ask to the next. For every answer: who is named, which pages are quoted, and what kind of site each source is.",
  },
  {
    n: "11",
    l: "crawlers your site is tested as",
    d: "Before the first article: the certificate on every domain you own, every redirect hop, what your host's firewall says to GPTBot, ClaudeBot, PerplexityBot and the rest, robots.txt rules that block more than intended, and whether your sitemaps lead to the pages that matter.",
  },
  {
    n: "4",
    l: "search indexes, one per assistant",
    d: "ChatGPT searches through Bing, Claude through Brave, Gemini through Google, Perplexity through its own. A page Google has indexed can still be invisible to the other three. On blogs we host, every new page is submitted to Bing within half an hour; every week we test whether each assistant can actually find it. Every article keeps one address.",
  },
  {
    n: "Every",
    l: "site quoted instead of you, classified",
    d: "A competitor, a review site, a directory and an official source each call for a different move, and for some questions no article on your own site can win. We find out which before your budget goes into them.",
  },
  {
    n: "3–5",
    l: "sources opened and cited in every article",
    d: "Research on live search, and every source is read before it is cited. An editor pass checks each claim against your product facts and the sources, then automated checks go over links, title, product mentions and FAQ. A topic too close to one you already have is not written. Nothing goes live without your approval.",
  },
  {
    n: "52",
    l: "times a year, the whole count again",
    d: "The same questions against day 0. A separate test tells us whether each assistant can find your published articles at all, so a gap in indexing is caught and fixed instead of being mistaken for weak writing. Once a month, a report in your language, read by a person before it reaches you.",
  },
]

export function WorkSystem({ id = "how" }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-violet-600 text-center mb-3">What $499 a month runs</p>
        <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-center">An article is the last step, not the product</h2>
        <p className="text-slate-600 text-center mb-10 text-sm sm:text-base max-w-2xl mx-auto">
          Most of the work happens where nobody looks: in what the assistants answer today, in whether they can read your site at all, and in four different search indexes. So it runs every week, not once.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LAYERS.map((s) => (
            <div key={s.l} className="bg-white border border-black/10 rounded-2xl p-6">
              <div className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">{s.n}</div>
              <h3 className="font-bold text-base mt-1 mb-2 leading-snug">{s.l}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm sm:text-base font-semibold mt-8 max-w-2xl mx-auto">
          None of this shows in an article. All of it decides whether an assistant ever reads one.
        </p>
      </div>
    </section>
  )
}

const FOUND = [
  { n: "1 of 18", d: "articles ChatGPT could find when asked for their exact titles. Google had indexed nearly every article on one of those sites." },
  { n: "128 MB", d: "the size of one blog's index page, because the images were embedded in it. Google reads the first 15 MB of a page; the links to the articles sat below that line." },
  { n: "0", d: "new articles in Google after three weeks. robots.txt pointed crawlers only to the sitemap of the old pages, and nothing on the site linked to the new ones." },
  { n: "2", d: "addresses for every article, each claiming to be the original. A search engine has to pick one, and the article competes with itself." },
  { n: "1 line", d: "in robots.txt, written to hide a single page, that hid every page whose address began with the same letter." },
]

export function FoundOnSites({ id }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#1b1916" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-center">Publishing is not the same as being found</h2>
        <p className="text-slate-400 text-center mt-3 mb-10 text-sm sm:text-base max-w-2xl mx-auto">
          What our own weekly checks found in October 2026, on client sites and on itgrows.ai itself.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FOUND.map((f) => (
            <div key={f.n} className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-white">{f.n}</div>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{f.d}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-violet-400/40 bg-violet-500/10 p-6 flex items-center">
            <p className="text-sm sm:text-base text-white font-semibold leading-relaxed">
              Every one of these sites was publishing. None of these problems shows in an article. They were found because every week we check what the assistants can actually find.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const VERSUS = [
  { k: "Before writing", a: "A keyword list", b: "240 answers from four assistants: who is named, and who is quoted" },
  { k: "Can assistants reach your site?", a: "Not their job", b: "Tested as 11 crawlers; blockers found and fixed with you before the first article" },
  { k: "Is each page in the index each assistant searches?", a: "Publish and hope", b: "New pages submitted to Bing on publication (blogs we host); findability tested every week" },
  { k: "Duplicate addresses, sitemaps that miss new pages", a: "Not checked", b: "Found and fixed" },
  { k: "Questions no own-site article can win", a: "Written anyway", b: "Found before your budget goes into them" },
  { k: "Facts and sources", a: "Up to the writer", b: "3–5 sources per article, each read; editor pass and automated checks" },
  { k: "Proof", a: "Articles delivered, traffic", b: "The same questions against day 0, every week, across four assistants" },
  { k: "What you pay for", a: "Words", b: "Being findable, readable and quotable, and an honest count of whether you are named" },
]

export function VersusArticles({ id }: { id?: string }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20" style={{ backgroundColor: "#ebe9e5" }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center">Why this is not paying for articles</h2>
        <p className="text-slate-600 text-center mt-3 mb-10 text-sm sm:text-base max-w-2xl mx-auto">
          An article service sells words. If the assistants cannot find your site, every one of those words is invisible to them.
        </p>
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1.1fr_1fr_1.3fr] text-[11px] uppercase tracking-wide font-bold text-slate-500 border-b border-black/10">
            <div className="hidden sm:block px-4 py-3" />
            <div className="px-4 py-3">Article-only service</div>
            <div className="px-4 py-3 text-violet-700">ItGrows</div>
          </div>
          {VERSUS.map((r) => (
            <div key={r.k} className="border-b border-black/5 last:border-0 sm:grid sm:grid-cols-[1.1fr_1fr_1.3fr]">
              <div className="px-4 pt-3 sm:py-3 text-sm font-semibold">{r.k}</div>
              <div className="grid grid-cols-2 sm:contents">
                <div className="px-4 py-3 text-sm text-slate-500">{r.a}</div>
                <div className="px-4 py-3 text-sm text-[#1b1916] bg-violet-50/60">{r.b}</div>
              </div>
            </div>
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
  "Site and index setup: tested as 11 crawlers, blockers fixed — free when you start",
  "Day 0: 240 answers from ChatGPT, Claude, Gemini and Perplexity",
  "Every week: the same count against day 0, whether the assistants can find your articles, and who is quoted instead",
  "Up to 12 researched articles a month on your own domain, 3–5 sources each",
  "Blog hosting with the machine-readable layer built in — one DNS record",
  "Approval queue, full veto",
  "A monthly report in your language, read by a person first",
  "A human who knows your account",
]
