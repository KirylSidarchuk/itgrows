import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react"
import CookieBanner from "@/components/CookieBanner"
import VisitBeacon from "@/components/VisitBeacon"
import AdsConversion from "@/components/AdsConversion"
import ProductAnalytics from "@/components/Analytics"
import ConsentedTrackers from "@/components/consent/ConsentedTrackers"
import ExitWheel from "@/components/geo/ExitWheel"
import { exitWheelOn } from "@/lib/geo-promo"
import { getLocale } from "@/lib/i18n/server"
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
  // The fallback for pages without their own description: what ItGrows is, GEO only (lib/entity.ts).
  description: "ItGrows is an AI visibility (GEO) service for businesses.",
  openGraph: {
    title: "ItGrows.ai",
    description: "ItGrows is an AI visibility (GEO) service for businesses.",
    // No url here: every page inherited "https://www.itgrows.ai" as its og:url (/blog, /privacy,
    // /terms). A page states its own address, or none.
    siteName: "ItGrows.ai",
    images: [{ url: "https://www.itgrows.ai/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows.ai",
    description: "ItGrows is an AI visibility (GEO) service for businesses.",
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

// <html lang> is the language middleware.ts decided for this request (lib/i18n): "de" on /de/…,
// the NEXT_LOCALE cookie on the unprefixed GEO pages, "de" on the German guides (/business/blog/<slug>,
// lib/geo-guides.ts), "en" everywhere else (pages outside the middleware's paths never get the
// header). Before 26 Oct 2026 it was "en" on every page, /de, /fr, /es and /ru included, against their
// Content-Language and og:locale. Reading the request makes a route render per request; /personal,
// /company, /privacy and /terms read nothing of it, so they say dynamic = "force-static": they stay
// prerendered, and there the header is empty, so "en".
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLocale()
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script id="google-tag-consent" dangerouslySetInnerHTML={{ __html: GOOGLE_TAG_INIT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
          {/* The launch-rewards wheel when a signed-out visitor on a computer moves to leave a public GEO
              page (components/geo/ExitWheel.tsx; off with PROMO_WHEEL.exitIntent or .enabled false in
              lib/geo-promo.ts). Nothing of it is in the server HTML; its dialog loads only when it may open. */}
          {exitWheelOn() && <ExitWheel />}
        </SessionProvider>
        <VisitBeacon />
        <AdsConversion />
        <ProductAnalytics />
        <CookieBanner />
        <ConsentedTrackers />
      </body>
    </html>
  );
}
