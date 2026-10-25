import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react"
import CookieBanner from "@/components/CookieBanner"
import VisitBeacon from "@/components/VisitBeacon"
import AdsConversion from "@/components/AdsConversion"
import ProductAnalytics from "@/components/Analytics"
import ConsentedTrackers from "@/components/consent/ConsentedTrackers"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
}

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  title: "ItGrows.ai",
  description: "AI visibility for companies, and LinkedIn and X posts for founders.",
  openGraph: {
    title: "ItGrows.ai",
    description: "AI visibility for companies, and LinkedIn and X posts for founders.",
    url: "https://www.itgrows.ai",
    siteName: "ItGrows.ai",
    images: [{ url: "https://www.itgrows.ai/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows.ai",
    description: "AI visibility for companies, and LinkedIn and X posts for founders.",
    images: ["https://itgrows.ai/og-image.png"],
  },
};

// Google tag, Advanced Consent Mode (Kiryl, 25.10.2026): gtag.js loads on every page with every
// consent type "denied" by default, so before a choice, and after "Decline", Google gets only cookieless
// pings with the ad click id redacted (ads_data_redaction) and models the conversions; url_passthrough
// carries the click id in the link instead of a cookie. "Accept" (now or earlier) switches consent to
// "granted". gtag() exists from the first line, so conversion calls never throw.
// Contentsquare, Clarity, Vercel Analytics, the itg_gclid cookie and the itg_anon id are not here:
// components/consent/** still loads or stores them only after "Accept".
const GOOGLE_TAG_INIT = `
(function () {
  var w = window, ID = 'AW-18160234884';
  var dl = w.dataLayer = w.dataLayer || [];
  function gtag() { dl.push(arguments); }
  w.gtag = gtag;
  function consent(on) {
    var v = on ? 'granted' : 'denied';
    return { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v };
  }
  var choice = null;
  try { choice = localStorage.getItem('cookie_consent'); } catch (e) {}
  gtag('consent', 'default', consent(choice === 'accepted'));
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
  gtag('js', new Date());
  gtag('config', ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  (document.head || document.documentElement).appendChild(s);
  w.itgGoogleTag = {
    load: function () { gtag('consent', 'update', consent(true)); },
    discard: function () { gtag('consent', 'update', consent(false)); }
  };
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script id="google-tag-consent" dangerouslySetInnerHTML={{ __html: GOOGLE_TAG_INIT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <VisitBeacon />
        <AdsConversion />
        <ProductAnalytics />
        <CookieBanner />
        <ConsentedTrackers />
      </body>
    </html>
  );
}
