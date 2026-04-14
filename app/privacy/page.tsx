import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — ItGrows.ai",
  description: "Privacy Policy for ItGrows.ai",
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2 text-[#1b1916]">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">1. Introduction</h2>
            <p>
              ItGrows.ai (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data.
            </p>
            <p className="mt-3">
              By using ItGrows.ai, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">2. Data We Collect</h2>
            <p className="mb-3">We collect the following types of information when you use our service:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Email address</strong> — used for account creation, authentication, and service communications.</li>
              <li><strong>Website URL</strong> — used to analyze your site niche and generate relevant content.</li>
              <li><strong>Generated articles</strong> — content we create on your behalf is stored to enable publishing and scheduling.</li>
              <li><strong>Usage data</strong> — anonymized logs about how you interact with the platform (pages visited, features used).</li>
              <li><strong>Billing information</strong> — handled exclusively by Stripe; we do not store your payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide and improve the ItGrows.ai service.</li>
              <li>To generate SEO articles, social posts, and other content tailored to your website.</li>
              <li>To send transactional emails (account verification, billing receipts).</li>
              <li>To communicate important service updates.</li>
              <li>To detect and prevent abuse or unauthorized access.</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">4. Payments via Stripe</h2>
            <p>
              All payment processing is handled by <strong>Stripe, Inc.</strong>, a PCI-DSS compliant payment provider. When you subscribe, you are redirected to Stripe&apos;s secure checkout. We receive confirmation of payment status but never store your full card number, CVV, or banking credentials.
            </p>
            <p className="mt-3">
              Stripe&apos;s privacy policy is available at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">stripe.com/privacy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">5. Data Storage and Security</h2>
            <p>
              Your data is stored on servers located in the <strong>European Union</strong>. We use industry-standard encryption (TLS/HTTPS) for data in transit and encrypted storage for sensitive fields at rest.
            </p>
            <p className="mt-3">
              We retain your data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days, except where retention is required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">6. Third-Party Services</h2>
            <p>We may share data with the following third-party services strictly to operate our platform:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Google</strong> — AI content generation via API</li>
            </ul>
            <p className="mt-3">Each third party operates under its own privacy policy and data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">7. Your Rights</h2>
            <p>Under GDPR and applicable privacy laws, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability (receive your data in a structured format).</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <strong>kiryl@itgrows.ai</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">8. Cookies</h2>
            <p>
              We use essential cookies to maintain your login session. We do not use advertising or tracking cookies. By using ItGrows.ai, you consent to the use of these essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a banner in the dashboard. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1b1916] mb-3">10. Contact</h2>
            <p>
              For any privacy-related questions or requests, contact us at:{" "}
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
      </footer>
    </div>
  )
}
