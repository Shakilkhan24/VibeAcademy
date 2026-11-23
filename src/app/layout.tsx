import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/ibm-plex-sans/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SeniorSeat: decide like a senior", template: "%s | SeniorSeat" },
  description:
    "Every prompt hides engineering decisions. SeniorSeat shows vibe coders which ones they left to the AI, and how to make them.",
  openGraph: { siteName: "SeniorSeat", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0f2d4e", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-pencil focus:px-3 focus:py-2 focus:text-pencil-ink">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="grow">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
