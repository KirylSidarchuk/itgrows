import Link from "next/link"

export const metadata = {
  title: "Terms of Service — ItGrows.ai",
  description: "Terms of Service for ItGrows.ai",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-[#1b1916] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-[#1b1916]">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">1. About ItGrows.ai</h2>
            <p>
              ItGrows.ai is an AI-powered LinkedIn automation platform that writes and auto-publishes LinkedIn posts on your behalf. By accessing or using ItGrows.ai, you agree to be bound by these Terms of Service.
            </p>
            <p className="mt-3">
              These terms apply to all users, including free trial users and paid subscribers.
            </p>
            <p className="mt-3">
              ItGrows.ai is operated by <strong>Magiscan Inc.</strong>, 919 North Market Street, Wilmington, DE 19801, USA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">2. Account Registration</h2>
            <p>
              You must register an account to use ItGrows.ai. You agree to provide accurate information and keep your account credentials secure. You are responsible for all activity that occurs under your account.
            </p>
            <p className="mt-3">
              You must be at least 18 years old to use the service. By registering, you confirm this.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">3. Subscription and Payment</h2>
            <p>ItGrows.ai offers the following paid plans:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li><strong>Monthly Plan — $99/month:</strong> Full access billed monthly. Cancel anytime.</li>
              <li><strong>Annual Plan — $999/year:</strong> Full access billed annually (~$83/month). Saves ~16% vs monthly.</li>
            </ul>
            <p className="mt-3">
              New users receive 15 free article generations (trial). A paid subscription is required to continue after the trial limit.
            </p>
            <p className="mt-3">
              All payments are processed via Stripe. Subscriptions renew automatically unless cancelled before the renewal date. By subscribing, you authorize us to charge your payment method on a recurring basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">4. Refund Policy</h2>
            <p>
              We offer a <strong>7-day refund policy</strong> for new subscriptions. If you are not satisfied within the first 7 days of your first paid subscription, contact us at <a href="mailto:kiryl@itgrows.ai" className="text-violet-600 underline">kiryl@itgrows.ai</a> for a full refund.
            </p>
            <p className="mt-3">
              Refunds are not available for renewals, partial months, or if the account has been used to publish a significant volume of content. Annual plan refunds after 7 days are prorated at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">5. Acceptable Use</h2>
            <p>You agree not to use ItGrows.ai to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Generate or publish illegal, fraudulent, defamatory, or harmful content.</li>
              <li>Violate intellectual property rights of others.</li>
              <li>Send spam or use the service for mass unsolicited communications.</li>
              <li>Attempt to reverse-engineer, scrape, or disrupt the platform.</li>
              <li>Circumvent access controls or usage limits.</li>
              <li>Use the service for any unlawful purpose under applicable laws.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">6. Content Ownership</h2>
            <p>
              Content generated by ItGrows.ai on your behalf belongs to you, subject to these terms. You are responsible for ensuring published content complies with applicable laws and does not infringe third-party rights.
            </p>
            <p className="mt-3">
              By using the service, you grant ItGrows.ai a limited license to process and publish your content as directed by you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">7. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted availability. Scheduled maintenance, third-party outages, or other factors may temporarily affect the service. We are not liable for losses resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">8. Limitation of Liability</h2>
            <p>
              ItGrows.ai is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee that AI-generated content will achieve specific SEO rankings, traffic, or business results.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by law, ItGrows.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunity, arising from your use of the service.
            </p>
            <p className="mt-3">
              Our total liability to you for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">9. Termination</h2>
            <p>
              You may cancel your account at any time from the billing settings. Upon cancellation, your subscription remains active until the end of the current billing period. We reserve the right to terminate accounts for violations of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. We will notify you of material changes via email or dashboard notice. Continued use of the service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of Delaware, USA. Disputes shall be resolved through binding arbitration or the courts of competent jurisdiction in Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">12. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at:{" "}
              <a href="mailto:kiryl@itgrows.ai" className="text-violet-600 underline">kiryl@itgrows.ai</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm mt-16" style={{ backgroundColor: "#ebe9e5" }}>
        <p>
          © 2026 ItGrows.ai. All rights reserved. ·{" "}
          <Link href="/privacy" className="hover:text-[#1b1916]">Privacy Policy</Link> ·{" "}
          <Link href="/terms" className="hover:text-[#1b1916]">Terms of Service</Link>
        </p>
        <p className="mt-2 text-xs text-slate-400">Magiscan Inc. · 919 North Market Street, Wilmington, DE 19801, USA</p>
      </footer>
    </div>
  )
}
