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
  title: "ItGrows.ai — LinkedIn Autopilot",
  description: "AI writes and auto-publishes LinkedIn posts for you. Start your 7-day free trial — no credit card needed.",
  openGraph: {
    title: "ItGrows.ai — LinkedIn Autopilot",
    description: "AI writes and auto-publishes LinkedIn posts for you. Start your 7-day free trial — no credit card needed.",
    url: "https://www.itgrows.ai",
    siteName: "ItGrows.ai",
    images: [{ url: "https://www.itgrows.ai/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows.ai — LinkedIn Autopilot",
    description: "AI writes and auto-publishes LinkedIn posts for you. Start your 7-day free trial — no credit card needed.",
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
      </body>
    </html>
  );
}
