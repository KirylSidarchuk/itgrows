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

// Google tag, Basic Consent Mode: nothing is requested from Google before "Accept".
// This runs first in <head> and only defines a local gtag() that queues calls in window.dataLayer.
//   - accepted earlier: gtag.js and the config load right away, on this page load;
//   - "Accept" now: components/consent/consent.ts calls itgGoogleTag.load(), and the calls queued
//     so far (a conversion, say) go out with it;
//   - "Decline" (now or earlier): the queue is emptied and gtag() drops every call from then on.
// gtag() exists in every state, so conversion calls never throw.
// Contentsquare, Clarity and Vercel Analytics are not here: components/consent/ConsentedTrackers.tsx
// loads them after "Accept".
const GOOGLE_TAG_INIT = `
(function () {
  var w = window, ID = 'AW-18160234884', state = 'queue';
  var dl = w.dataLayer = w.dataLayer || [];
  function queue() { dl.push(arguments); }
  function drop() {}
  w.gtag = queue;
  function load() {
    if (state === 'loaded') return;
    var waiting = state === 'queue' ? dl.splice(0, dl.length) : [];
    state = 'loaded';
    w.gtag = queue;
    queue('consent', 'default', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    queue('js', new Date());
    queue('config', ID);
    for (var i = 0; i < waiting.length; i++) dl.push(waiting[i]);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    (document.head || document.documentElement).appendChild(s);
  }
  function discard() {
    if (state === 'loaded') {
      queue('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
      return;
    }
    state = 'dropped';
    dl.splice(0, dl.length);
    w.gtag = drop;
  }
  w.itgGoogleTag = { load: load, discard: discard };
  var choice = null;
  try { choice = localStorage.getItem('cookie_consent'); } catch (e) {}
  if (choice === 'accepted') load();
  else if (choice === 'declined') discard();
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
