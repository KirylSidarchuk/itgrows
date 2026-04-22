import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react"
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

export const metadata: Metadata = {
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
  },
  title: "ItGrows.ai — AI Content Automation",
  description: "AI creates SEO articles, social posts, and images — then auto-publishes them and runs your Google Ads.",
  openGraph: {
    title: "ItGrows.ai — AI Content Automation",
    description: "Automatically publish SEO articles to your blog",
    url: "https://itgrows.ai",
    siteName: "ItGrows.ai",
    images: [{ url: "https://itgrows.ai/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows.ai",
    description: "Automatically publish SEO articles to your blog",
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
      </body>
    </html>
  );
}
