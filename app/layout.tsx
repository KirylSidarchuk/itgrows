import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import CookieBanner from "@/components/CookieBanner"
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
  title: "ItGrows.ai — AI Drafts Your LinkedIn & X Posts",
  description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your free trial — no card required.",
  openGraph: {
    title: "ItGrows.ai — AI Drafts Your LinkedIn & X Posts",
    description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your free trial — no card required.",
    url: "https://www.itgrows.ai",
    siteName: "ItGrows.ai",
    images: [{ url: "https://www.itgrows.ai/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows.ai — AI Drafts Your LinkedIn & X Posts",
    description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your free trial — no card required.",
    images: ["https://itgrows.ai/og-image.png"],
  },
};

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
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <Analytics />
        <CookieBanner />
        <Script src="https://t.contentsquare.net/uxa/973805ba839a0.js" strategy="afterInteractive" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17930749593"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-17930749593');
  gtag('config', 'AW-18160234884');
`}</Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18160234884"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
