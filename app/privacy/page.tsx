import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

export const dynamic = "force-static"

// Privacy & Cookie Policy for both products: AI visibility (ItGrows for Business) and LinkedIn & X
// posts. It describes what the code stores and sends today (app/api/geo/**, app/api/track/**,
// components/Analytics.tsx, components/AdsConversion.tsx, components/consent/**, app/layout.tsx,
// app/api/user/delete, and the daily retention purge on the VM, /root/geo_check/purge.py). Consent,
// retention, transfers, the EU/UK contact and the effective date are the owner's decisions of 23 Oct 2026.
// Visible text has no brackets, and AI visibility is never called free.

export const metadata: Metadata = {
  title: "Privacy Policy & Cookie Policy — ItGrows.ai",
  description: "What data ItGrows.ai processes, why, who helps us process it, and your rights.",
  alternates: { canonical: "https://www.itgrows.ai/privacy" },
}

const CONTACT = "kiryl@itgrows.ai"

const SECTIONS = [
  { id: "who", title: "Who we are" },
  { id: "data", title: "What we process, and why" },
  { id: "cookies", title: "Cookies and similar tools" },
  { id: "processors", title: "Who helps us process data" },
  { id: "transfers", title: "International transfers" },
  { id: "retention", title: "How long we keep data" },
  { id: "rights", title: "Your rights" },
  { id: "security", title: "Security" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const n = SECTIONS.findIndex((s) => s.id === id) + 1
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-bold text-[#1b1916]">
        <span className="text-violet-600 mr-2">{n}.</span>
        {SECTIONS[n - 1].title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
}

/** One kind of data: what it is, what we use it for, and the legal basis (GDPR art. 6). */
function DataBlock({ title, what, why, basis }: { title: string; what: ReactNode; why: ReactNode; basis: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="font-bold text-[#1b1916]">{title}</h3>
      <dl className="mt-2 space-y-2 text-[15px]">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500">What</dt>
          <dd className="mt-0.5">{what}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500">Why</dt>
          <dd className="mt-0.5">{why}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500">Legal basis</dt>
          <dd className="mt-0.5">{basis}</dd>
        </div>
      </dl>
    </div>
  )
}

/** Rows of a two-column list that stacks on a phone. */
function Rows({ rows }: { rows: { name: ReactNode; text: ReactNode }[] }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white divide-y divide-black/10">
      {rows.map((r, i) => (
        <div key={i} className="p-4 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4 text-[15px]">
          <div className="font-semibold text-[#1b1916]">{r.name}</div>
          <div className="mt-1 sm:mt-0">{r.text}</div>
        </div>
      ))}
    </div>
  )
}

const Mail = () => (
  <a href={`mailto:${CONTACT}`} className="text-violet-700 underline">
    {CONTACT}
  </a>
)

/** Reopens the cookie banner (components/CookieBanner.tsx listens for this link). */
const CookieSettings = () => (
  <a href="#cookie-settings" data-cookie-settings className="text-violet-700 underline">
    Cookie settings
  </a>
)

const CONTRACT = "To provide the service you signed up for: our contract with you."
const INTEREST = "Our legitimate interests"

const COOKIES = [
  { name: "Sign-in cookie", text: "Keeps you signed in. Essential. Lasts until you sign out or it expires." },
  { name: "cookie_consent", text: "Stored in your browser. Remembers what you chose in the cookie banner. Essential." },
  {
    name: "itg_anon, itg_seen, itgrows_welcome_tracked, itg_trial_fired",
    text: "Only after you accept. Stored in your browser: itg_anon is a random id for our own analytics; the others mark the current visit and a sign-up or trial already counted, and are cleared when you close the tab.",
  },
  {
    name: "itg_gclid",
    text: "Only after you accept. A cookie that keeps the Google Ads click id for 90 days, so we can tell which sign-ups and payments came from our ads.",
  },
  {
    name: "Google Ads tag",
    text: "Advertising measurement, on every page. Before you accept, and if you decline, it uses no cookies: Google receives only measurement signals without cookies and without the ad click id, used to count conversions from our ads in aggregate. After you accept, it measures whether visitors from our ads sign up or pay, and Google sets its own cookies.",
  },
  {
    name: "Contentsquare",
    text: "Analytics, loaded only after you accept. Records how pages are used: clicks, scrolling and page movement, which can include a replay of a visit.",
  },
  { name: "Microsoft Clarity", text: "Analytics, loaded only after you accept. Heatmaps and recordings of how pages are used. Microsoft sets its own cookies." },
  { name: "Vercel Analytics", text: "Analytics, loaded only after you accept. Counts page views, referring sites and device types." },
]

const PROCESSORS = [
  { name: "Stripe", text: "Payments, subscriptions, invoices and the billing portal. Stripe handles your card; we never see the card number." },
  { name: "Resend", text: "Sends our emails: sign-in codes, reports, updates every two weeks, article notices and account emails." },
  { name: "Vercel", text: "Hosts the website and the app, and provides Vercel Analytics." },
  { name: "Google Cloud", text: "Hosts our database and the servers that run the checks and write the articles, in the United States." },
  {
    name: "Anthropic, OpenAI, Google Gemini, Perplexity",
    text: "Their APIs answer the buyer questions we use to measure AI answers. Anthropic also helps research and write articles; Google Gemini, with OpenAI as a backup, writes LinkedIn and X drafts, images and the free post preview. We send them what the task needs: questions about your business, facts from your public site, your topics and drafts, and what you type into the free post preview.",
  },
  { name: "Google Ads", text: "Advertising measurement, see Cookies." },
  { name: "Contentsquare, Microsoft Clarity", text: "Analytics of how our pages are used, see Cookies." },
  { name: "Telegram", text: "Internal notifications to our team about sign-ups, payments and messages, with the name, email and website involved." },
  { name: "LinkedIn, X", text: "When you connect them: we publish your posts through their APIs and read your posts’ statistics." },
  { name: "Google, LinkedIn sign-in", text: "If you sign in with them, they tell us your name and email address." },
  { name: "Your website platform", text: "WordPress, Shopify or Webflow, when we publish articles to your site with the access you gave us." },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">ItGrows.ai</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-[#1b1916] transition-colors">Terms</Link>
            <Link href="/" className="hover:text-[#1b1916] transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-violet-700">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">Privacy Policy &amp; Cookie Policy</h1>
        <p className="text-slate-500 text-sm mt-2">
          Effective date: 23 October 2026
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-600 to-cyan-500" />
          <div className="p-5 sm:p-6">
            <p className="font-bold">In short</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed list-disc pl-5">
              <li>We keep what we need to run your account, check your site, write your articles and posts, and bill you.</li>
              <li>Stripe handles payments. We never see your card number.</li>
              <li>
                Analytics tools and advertising cookies load only after you accept them in the cookie banner; before that, the Google Ads tag sends only signals without cookies. You can change your choice at any time in{" "}
                <CookieSettings />.
              </li>
              <li>We do not sell your personal data.</li>
              <li>
                You can ask for a copy of your data, or for it to be corrected or deleted: write to <Mail />.
              </li>
            </ul>
          </div>
        </div>

        <nav aria-label="Contents" className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Contents</p>
          <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-slate-600 hover:text-violet-700 transition-colors">
                  <span className="text-slate-400 mr-1.5">{i + 1}.</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-10 text-slate-700 leading-relaxed">
          <Section id="who">
            <p>
              ItGrows.ai is operated by <strong>Magiscan Inc.</strong>, 919 North Market Street, Wilmington, DE 19801, USA. We are the controller of
              the personal data described here. This policy covers the itgrows.ai website and both of our products: AI visibility for businesses,
              and LinkedIn &amp; X posts.
            </p>
            <p>
              If you are in the EU or UK, contact us at <Mail />.
            </p>
          </Section>

          <Section id="data">
            <div className="space-y-4">
              <DataBlock
                title="Your account"
                what="Your email address and name; how you sign in: with a code sent by email, or with Google or LinkedIn, which give us your name and email; a password hash if you set a password; your plan and its status; your Stripe customer id."
                why="To create and run your account, sign you in and know which plan you have."
                basis={CONTRACT}
              />
              <DataBlock
                title="Your website, for AI visibility"
                what="The site address you enter, and the public pages of that site we fetch, such as the home page, robots.txt and sitemaps. From them we note what the business does, its brand names, language and city, and the questions its buyers ask."
                why="To run the quick check, the detailed report and the re-check every two weeks, and to check the site the way AI crawlers see it."
                basis={`${CONTRACT} For the quick check without an account: ${INTEREST.toLowerCase()} in giving you the result you asked for.`}
              />
              <DataBlock
                title="The AI assistants’ answers"
                what="The questions we ask, the answers ChatGPT, Claude, Gemini and Perplexity give, the businesses they name and the sites they cite. These are stored per website, so every account that adds the same site sees the same measurements. Answers are about businesses but can mention people by name."
                why="To show you whether, and how, the assistants name your business, and what changed since last time."
                basis={CONTRACT}
              />
              <DataBlock
                title="The quick check and the free post preview"
                what="For the quick check: the site address you enter and your IP address. For the free post preview on the LinkedIn & X page: your IP address; what you type goes to the AI model that writes the preview and is not stored."
                why="To limit the number of quick checks and previews per visitor and to prevent abuse. IP addresses are removed after 90 days."
                basis={`${INTEREST} in keeping the quick check and the preview available and safe.`}
              />
              <DataBlock
                title="Articles and access to your site"
                what="The articles we write for you, your edits, the articles you publish early or stop, cover images, the launch checklist for your site and the steps you mark as done. To publish, we store the access you give us: a WordPress username and application password, a Shopify or Webflow token, or the settings of the blog we host for you."
                why="To write, show you and publish the articles on your plan."
                basis={CONTRACT}
              />
              <DataBlock
                title="LinkedIn & X"
                what="The access tokens you grant when you connect an account, and for X also refresh tokens; account identifiers: your LinkedIn member or organisation id and page name, your X user id, username and display name; your topics, drafts, edits, images and published posts; your posts’ statistics: impressions, likes, comments, shares."
                why="To draft posts in your voice, publish the posts in your queue, and show how they perform. When you disconnect an account, its tokens are deleted at once. You can also revoke access in LinkedIn’s or X’s own settings."
                basis={CONTRACT}
              />
              <DataBlock
                title="Payments"
                what="Stripe collects your card details; we never see or store your card number. We receive the payment status, plan, amounts and invoices. For LinkedIn & X subscriptions, if you came from our ad and accepted cookies, the Google Ads click id is saved with the subscription."
                why="To charge for the plan you chose, keep billing records and know which ads lead to paying customers."
                basis={`${CONTRACT} Keeping billing records: legal obligation. The ad click id: your consent, given in the cookie banner.`}
              />
              <DataBlock
                title="Emails"
                what="Your email address and the emails we send through Resend: sign-in codes, report-ready emails, updates every two weeks on the plan, notices that articles are ready to review, and account and trial emails for LinkedIn & X, which can include an offer."
                why="To run the service and keep you informed about your account. Every update email has an unsubscribe link; your report stays in your account."
                basis={`${CONTRACT} Trial reminders and offers: ${INTEREST.toLowerCase()}.`}
              />
              <DataBlock
                title="Messages you send us"
                what="What you type into our contact forms: name, company, email, website and your message."
                why="To answer you. Messages are stored and emailed to us."
                basis={`${INTEREST} in answering the people who write to us.`}
              />
              <DataBlock
                title="How the site is used"
                what="Our own analytics: the pages you view, the buttons and links you click, the referring site, host only and not the full address, campaign tags in the link such as utm, your browser’s user agent, and your account id when you are signed in. Only after you accept cookies: a random id kept in your browser, and the ad click id in the link, gclid or fbclid. For counting unique visitors we keep a hash of your IP address and browser that changes every day, not the IP address itself, and remove it after 90 days. Third-party analytics and advertising tools are listed under Cookies."
                why="To understand which pages work, fix what does not, and measure our advertising."
                basis={
                  <>
                    Our own analytics: {INTEREST.toLowerCase()}. Signals without cookies from the Google Ads tag before you choose or after you
                    decline: {INTEREST.toLowerCase()}, measuring our advertising in aggregate. The random id in your browser, the ad click id, and
                    third-party analytics and advertising cookies: your consent, given in the cookie banner.
                  </>
                }
              />
            </div>
            <p>We do not sell your personal data.</p>
          </Section>

          <Section id="cookies">
            <p>These are the cookies and browser storage items our site uses:</p>
            <Rows rows={COOKIES} />
            <p>
              On your first visit a banner lets you accept or decline cookies, and remembers your choice. Contentsquare, Microsoft Clarity and
              Vercel Analytics load only after you accept; if you decline, they do not run. The Google Ads tag is on every page, but until you
              accept, and if you decline, it works without cookies: Google receives only measurement signals without cookies and without the ad
              click id, used to count conversions from our ads in aggregate.
            </p>
            <p>
              You can change your choice at any time: open <CookieSettings />.
            </p>
            <p>You can also delete cookies and site data at any time in your browser settings.</p>
          </Section>

          <Section id="processors">
            <p>We share data only with the companies that help us run ItGrows, and only for that purpose:</p>
            <Rows rows={PROCESSORS} />
            <p>
              Each of them handles data under its own terms and privacy policy. We may also disclose data when the law requires it, or to protect our
              rights and our users.
            </p>
          </Section>

          <Section id="transfers">
            <p>
              Magiscan Inc. is a US company. Your data is processed in the United States: our database and servers are there, and most of the
              providers above process data there. If you are in the EU, the UK or Switzerland, your data is transferred to the United States.
            </p>
            <p>Where required, we rely on the Standard Contractual Clauses offered by our providers.</p>
          </Section>

          <Section id="retention">
            <List>
              <li>Account data: while your account exists; it is removed when you delete the account (see below). The answers we collected about a website and its quick-check results belong to the website and are kept without a time limit.</li>
              <li>
                IP addresses saved with quick checks and free post previews, and the daily visitor hash: 90 days. The result of a quick check stays
                with the website, like the AI assistants’ other answers.
              </li>
              <li>Usage analytics: 24 months.</li>
              <li>Messages you send us through our contact forms: 24 months.</li>
              <li>Billing records: as long as tax law requires.</li>
              <li>LinkedIn and X tokens: deleted as soon as you disconnect the account.</li>
              <li>
                Deleting your account from the LinkedIn &amp; X dashboard, or by writing to <Mail />, first cancels all your subscriptions, trials
                included; if one cannot be cancelled, the account is kept. Then it deletes: your account and its sign-in codes; your
                connected LinkedIn and X accounts with their tokens; your posts, drafts, topics and briefs, and their statistics; your image library;
                your connected sites with their access details; your articles; your AI visibility data: the sites you follow, your plans, launch
                steps and launch emails; and the usage analytics and messages recorded under your account, or in the same browser before you signed
                in. The AI assistants’ answers about a website are stored per website and stay with it, with no link to your account. Stripe keeps
                your invoices as billing records. To have your image files erased from our image server too, or your Reddit planner projects
                removed, write to us.
              </li>
            </List>
          </Section>

          <Section id="rights">
            <p>Under the GDPR, the UK GDPR and similar laws, you have the right to:</p>
            <List>
              <li>get a copy of the personal data we hold about you;</li>
              <li>have inaccurate data corrected;</li>
              <li>have your data deleted;</li>
              <li>restrict or object to processing, including processing based on our legitimate interests;</li>
              <li>receive your data in a structured, machine-readable format;</li>
              <li>withdraw your consent at any time, without affecting what was done before;</li>
              <li>complain to your local data protection authority.</li>
            </List>
            <p>
              To use any of these rights, write to <Mail /> from the email address on your account. We answer within one month. Some things you can do
              yourself: edit or stop articles in your cabinet, disconnect LinkedIn or X, unsubscribe from update emails, delete your account in the
              LinkedIn &amp; X dashboard, change your choice in <CookieSettings />, and clear cookies in your browser.
            </p>
          </Section>

          <Section id="security">
            <p>
              All traffic to ItGrows is encrypted with HTTPS. Your articles, connected accounts and access details are available only to your account
              and to the ItGrows team that runs it. No system is perfectly secure; if a breach affects your data, we will tell you as the law requires.
            </p>
          </Section>

          <Section id="children">
            <p>ItGrows is for people aged 18 and over. We do not knowingly collect data from children.</p>
          </Section>

          <Section id="changes">
            <p>
              We may update this policy. We will tell you about important changes by email or in your dashboard, and the date at the top will change.
            </p>
          </Section>

          <Section id="contact">
            <p>
              Privacy questions and requests: <Mail />
              <br />
              Magiscan Inc., 919 North Market Street, Wilmington, DE 19801, USA
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-black/10 px-4 sm:px-6 py-8 text-center text-slate-500 text-sm" style={{ backgroundColor: "#ebe9e5" }}>
        <p>
          © 2026 ItGrows.ai ·{" "}
          <Link href="/privacy" className="hover:text-[#1b1916]">Privacy Policy</Link> ·{" "}
          <Link href="/terms" className="hover:text-[#1b1916]">Terms of Service</Link>
        </p>
        <p className="mt-2 text-xs text-slate-400">Magiscan Inc. · 919 North Market Street, Wilmington, DE 19801, USA</p>
      </footer>
    </div>
  )
}
