import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { GEO_PRICES } from "@/lib/geo-pricing"

export const dynamic = "force-static"

// Terms of Service for both products: AI visibility (ItGrows for Business) and LinkedIn & X posts.
// Prices come from lib/geo-pricing.ts so this page never disagrees with the checkout. Refunds and taxes
// are the owner's decisions of 23 Oct 2026. Since 27 Oct 2026 (the effective date) the detailed report
// is free once an account is created, one per account and per connection; the quick check and the
// LinkedIn & X trial are free too.

export const metadata: Metadata = {
  title: "Terms of Service — ItGrows.ai",
  description: "The terms for using ItGrows.ai: AI visibility for businesses, and LinkedIn and X posts.",
  alternates: { canonical: "https://www.itgrows.ai/terms" },
}

const P = GEO_PRICES
const CONTACT = "kiryl@itgrows.ai"

const SECTIONS = [
  { id: "about", title: "Who we are" },
  { id: "account", title: "Your account" },
  { id: "visibility", title: "AI visibility: what you get" },
  { id: "plan", title: "AI visibility: the plan, renewal and cancelling" },
  { id: "articles", title: "AI visibility: articles on your site" },
  { id: "no-guarantee", title: "No guarantee of AI answers" },
  { id: "client", title: "AI visibility: what we need from you" },
  { id: "social", title: "LinkedIn & X posts" },
  { id: "payments", title: "Payments" },
  { id: "refunds", title: "Refunds" },
  { id: "use", title: "Acceptable use" },
  { id: "content", title: "Your content and ours" },
  { id: "third-parties", title: "Other companies’ services" },
  { id: "availability", title: "Availability and changes to the service" },
  { id: "termination", title: "Suspension and closing your account" },
  { id: "liability", title: "Disclaimers and limitation of liability" },
  { id: "changes", title: "Changes to these terms" },
  { id: "law", title: "Governing law" },
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

const Mail = () => (
  <a href={`mailto:${CONTACT}`} className="text-violet-700 underline">
    {CONTACT}
  </a>
)

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav className="border-b border-black/10 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">ItGrows.ai</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-[#1b1916] transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-[#1b1916] transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-violet-700">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mt-2">
          Effective date: 27 October 2026
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-600 to-cyan-500" />
          <div className="p-5 sm:p-6">
            <p className="font-bold">In short</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed list-disc pl-5">
              <li>ItGrows has two products: AI visibility for businesses, and LinkedIn &amp; X posts for founders and companies.</li>
              <li>
                AI visibility: a quick check, a detailed report that is free once you create an account, and a plan at {P.month.label} a month plus a
                one-time {P.setup.label} setup (no setup fee when you pay for 3 months or a year). Cancel any time; the plan runs to the end of
                the paid period.
              </li>
              <li>You see every article 2 days before it goes live, and can edit or stop it.</li>
              <li>Nobody can guarantee that an AI assistant will name a business. We promise the work and an honest count.</li>
              <li>LinkedIn &amp; X: posts wait in your queue, where you can edit or delete them; a 14-day free trial needs no card.</li>
              <li>Payments go through Stripe. We never see your card number. Prices are in US dollars and exclude taxes; any tax is shown at checkout.</li>
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
          <Section id="about">
            <p>
              ItGrows.ai (“ItGrows”, “we”, “us”) is operated by <strong>Magiscan Inc.</strong>, 919 North Market Street, Wilmington, DE 19801, USA.
            </p>
            <p>We offer two products:</p>
            <List>
              <li>
                <strong>AI visibility</strong> (ItGrows for Business). We check whether ChatGPT, Claude, Gemini and Perplexity name a business when its
                buyers ask them, get the business’s website ready for AI crawlers and search indexes, write and publish articles on the business’s own
                domain, and measure again every two weeks.
              </li>
              <li>
                <strong>LinkedIn &amp; X posts.</strong> We draft posts in your voice for LinkedIn (personal profiles and Company Pages) and X, and publish
                them to the accounts you connect.
              </li>
            </List>
            <p>
              These terms apply to everyone who uses the site: the quick check, the LinkedIn &amp; X free trial and paid plans. By using ItGrows you
              agree to them. If
              you use ItGrows for a company, you confirm that you are allowed to accept these terms for it.
            </p>
          </Section>

          <Section id="account">
            <p>
              Most of the service needs an account. You can sign in with a code sent to your email, or with Google or LinkedIn. Give us accurate
              details and keep access to your email and sign-in accounts secure: you are responsible for what happens under your account.
            </p>
            <p>You must be at least 18 years old to use ItGrows.</p>
          </Section>

          <Section id="visibility">
            <p>
              <strong>The quick check</strong> runs without an account. It takes about 30 seconds: we read the public pages of the site you enter, work
              out five questions a buyer of that business would ask, and put them to ChatGPT and Perplexity with live web search. Two of the answers
              are shown in full right away; the other answers open once you create an account. The number of quick checks per visitor per day is limited.
            </p>
            <p>
              <strong>The detailed report</strong> asks 20 buyer questions to ChatGPT, Claude, Gemini and Perplexity, three times each, and shows
              every answer, who is named instead of you, which sites the assistants cite, and our plan for the site. It is <strong>free</strong>: when
              you create an account we build the whole report for one site. There is one free report per account and per internet connection; for
              another site, write to us and we run it for you. The plan includes the full report for its site.
            </p>
            <p>
              Every result is a sample of what the assistants said at that moment. They can answer the same question differently the next time.
            </p>
          </Section>

          <Section id="plan">
            <p>The plan is bought for one site. You choose how to pay:</p>
            <List>
              <li>
                <strong>Month to month:</strong> {P.month.label} a month, plus a one-time {P.setup.label} setup charged with the first payment.
              </li>
              <li>
                <strong>3 months upfront:</strong> {P.quarter.label} every 3 months, no setup fee.
              </li>
              <li>
                <strong>A year upfront:</strong> {P.year.label} a year ({P.year.perMonth} a month), no setup fee.
              </li>
            </List>
            <p>
              The setup gets your site ready: it is tested the way AI crawlers see it, what blocks them is fixed with you, Bing and Google are set up,
              and you get a launch report on the “Your website” page. What the plan includes after that is listed on our pricing page when you buy it;
              today that is the day-0 report, a re-check against day 0 every two weeks, up to 12 researched articles a month on your own domain, and a monthly
              report. The plan has no trial period.
            </p>
            <p>
              <strong>Renewal.</strong> The plan renews automatically at the end of each paid period (every month, every 3 months or every year, as
              you chose), at the same price, until you cancel. The setup is not charged again on renewal.
            </p>
            <p>
              <strong>Cancelling.</strong> You can cancel any time on the Plan page of your cabinet. The cancellation takes effect at the end of the
              period you have paid for: until then the plan keeps running, and you can take the cancellation back. Nothing is charged after that.
            </p>
          </Section>

          <Section id="articles">
            <p>
              On the plan we write articles that answer your buyers’ questions and publish them on your own domain: on your site through the access you
              give us (for example WordPress, Shopify or Webflow), or on a blog we host for you on your domain.
            </p>
            <List>
              <li>Each article is ready 2 days before its publishing date. You see it in “Your articles” in your cabinet, and we email you when new articles are ready.</li>
              <li>Until it goes live you can read it, edit it, publish it at once, or stop it. A stopped article can be taken back until its date.</li>
              <li>If you do nothing, the article is published on its date.</li>
              <li>If your WordPress site is set to receive drafts, you approve each article in WordPress instead.</li>
            </List>
          </Section>

          <Section id="no-guarantee">
            <p>
              ChatGPT, Claude, Gemini, Perplexity and the search engines they use are run by other companies, and they alone decide what their answers
              say. <strong>We do not guarantee that any AI assistant will name, recommend, cite or link to your business</strong>, and we do not
              guarantee any ranking, traffic, leads or sales.
            </p>
            <p>What we do promise is the work described in your plan, and an honest count of what the assistants said, every two weeks.</p>
          </Section>

          <Section id="client">
            <List>
              <li>Only add sites and accounts that you own or are allowed to manage, and only give us access that you are allowed to give.</li>
              <li>Give us accurate facts about your business, products and prices, and tell us when they change.</li>
              <li>
                Review your articles. You decide what is published on your site and you are responsible for it, including the articles you let go live.
              </li>
              <li>
                Keep the access you gave us working (for example the CMS credentials or the DNS record for a hosted blog), and do the steps only you can
                do, such as confirming ownership of your site in Google Search Console or Bing Webmaster Tools.
              </li>
              <li>Your site, its hosting and the changes you or your developers make to it remain your responsibility.</li>
            </List>
          </Section>

          <Section id="social">
            <p>
              You connect your LinkedIn and X accounts through their official sign-in (OAuth). We draft posts in your voice and put them in your
              queue, each with its publishing time. Until then you can edit, reschedule or delete any of them. Posts you leave in the queue are
              published to your account at their scheduled time.
            </p>
            <p>Plans (billed monthly; annual billing is available at a discount):</p>
            <List>
              <li><strong>Personal — $49/month:</strong> one account (LinkedIn or X).</li>
              <li><strong>Duo — $99/month:</strong> any two accounts.</li>
              <li><strong>All-in — $199/month:</strong> LinkedIn personal + a LinkedIn Company Page + X personal + X company.</li>
              <li><strong>Company Pages — $99 / $149 / $299/month:</strong> one, two or unlimited companies (LinkedIn Company Page + X).</li>
            </List>
            <p>
              <strong>Free trial.</strong> Every plan starts with a 14-day free trial, and no card is needed to start it. If you do not add a card,
              the trial ends after 14 days, your access pauses and you are never charged. If you add a card, the paid plan starts when the trial ends.
            </p>
            <p>
              <strong>Renewal and cancelling.</strong> Paid plans renew automatically every month or every year until you cancel. You can cancel any
              time from the billing settings in your dashboard; your plan stays active until the end of the period you have paid for.
            </p>
            <p>
              You must follow LinkedIn’s and X’s own rules. They can limit or withdraw access to their platforms, and when they do, publishing stops
              until access is restored.
            </p>
          </Section>

          <Section id="payments">
            <p>
              All payments are processed by Stripe. Prices are in US dollars and exclude applicable taxes, such as VAT or sales tax. Any tax charged
              is shown at checkout. By buying a plan you authorise us to charge your payment method at each renewal until you cancel.
            </p>
            <p>
              Cards and invoices for the AI visibility plan are in Stripe’s billing portal, opened from your cabinet. If a payment fails, Stripe tries again; if it keeps failing, the plan may stop.
            </p>
          </Section>

          <Section id="refunds">
            <List>
              <li>
                <strong>The setup ({P.setup.label}):</strong> not refundable once the setup work has started.
              </li>
              <li>
                <strong>The AI visibility plan:</strong> payments are not refunded for a period that has started. Cancelling takes effect at the end
                of the period you have paid for.
              </li>
              <li>
                <strong>LinkedIn &amp; X plans:</strong> if you are not satisfied within the first 7 days of your first paid subscription, write to{" "}
                <Mail /> for a full refund. Renewals are not refunded.
              </li>
            </List>
            <p>Cancelling stops the next renewal. To ask about a payment, write to <Mail />.</p>
          </Section>

          <Section id="use">
            <p>You agree not to use ItGrows to:</p>
            <List>
              <li>publish illegal, fraudulent, defamatory, misleading or harmful content;</li>
              <li>infringe anyone’s intellectual property or other rights;</li>
              <li>send spam or mass unsolicited messages;</li>
              <li>reverse-engineer, scrape, overload or disrupt the service, or use the quick check against sites to harm them;</li>
              <li>get around usage limits or access controls;</li>
              <li>do anything else that is unlawful.</li>
            </List>
            <p>We may suspend or close accounts that break these rules.</p>
          </Section>

          <Section id="content">
            <p>
              The posts and articles we write for you, and the facts and texts you give us, belong to you. You give us the right to store, process and
              publish them as needed to provide the service you asked for.
            </p>
            <p>
              Our reports are for use in your business. The ItGrows software, site and report formats belong to us. Content written with AI can
              contain mistakes: we check it, and you review it before it goes out.
            </p>
          </Section>

          <Section id="third-parties">
            <p>
              ItGrows works with services run by other companies: the AI assistants, Google and Bing, LinkedIn, X, your website platform and Stripe.
              Their own terms apply to your use of them, and changes they make can affect what we can do. We are not responsible for their services.
            </p>
          </Section>

          <Section id="availability">
            <p>
              We work to keep ItGrows running, but we do not guarantee that it will always be available or free of errors. Maintenance and outages at
              our providers can interrupt it. We may change, add or remove features. Tools marked beta, such as the Reddit planner, may change or stop
              at any time.
            </p>
          </Section>

          <Section id="termination">
            <p>
              We may suspend or close an account that breaks these terms. You can stop using ItGrows at any time. You can delete your account from the
              settings of the LinkedIn &amp; X dashboard, or by writing to <Mail />. Deleting your account cancels all your subscriptions at once,
              trials included, and deletes your data as the{" "}
              <Link href="/privacy#retention" className="text-violet-700 underline">
                Privacy Policy
              </Link>{" "}
              describes.
            </p>
          </Section>

          <Section id="liability">
            <p>
              ItGrows is provided “as is”, without warranties of any kind, express or implied. We do not guarantee that content will achieve any
              particular engagement, growth or business result.
            </p>
            <p>
              To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential or punitive damages,
              including loss of profits, data or business opportunity, arising from your use of the service. Our total liability for any claim is
              limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.
            </p>
          </Section>

          <Section id="changes">
            <p>
              We may update these terms. We will tell you about important changes by email or in your dashboard. If you keep using ItGrows after a
              change, you accept the updated terms.
            </p>
          </Section>

          <Section id="law">
            <p>
              These terms are governed by the laws of the State of Delaware, USA. Disputes shall be resolved through binding arbitration or the courts
              of competent jurisdiction in Delaware.
            </p>
          </Section>

          <Section id="contact">
            <p>
              Questions about these terms: <Mail />
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
