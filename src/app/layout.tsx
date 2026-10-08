import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";

import { AuthenticatedHeader } from "@/components/authenticated-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shohay — Every gift, accounted for",
    template: "%s | Shohay",
  },
  description:
    "A transparent charity record for Bangladesh. Give privately, verify publicly, and follow every taka to its destination.",
  applicationName: "Shohay",
  openGraph: { type: "website", siteName: "Shohay", locale: "en_BD" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#174335",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">Skip to content</a>
        <Suspense fallback={<div className="h-[72px] border-b border-ink/8 bg-cream" />}><AuthenticatedHeader /></Suspense>
        <main id="main" className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
