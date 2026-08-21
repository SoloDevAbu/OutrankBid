import { Geist, JetBrains_Mono } from "next/font/google"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// ---------------------------------------------------------------------------
// Root metadata — all pages inherit these as defaults
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL("https://outrankbid.com"),
  title: {
    default: "OutrankBid — Live Startup Leaderboard",
    template: "%s | OutrankBid",
  },
  description:
    "Discover trending startups ranked by real-time community bids. See who's rising, filter by category, and find your next favorite tool.",
  openGraph: {
    siteName: "OutrankBid",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@AbuBakkar2502",
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ---------------------------------------------------------------------------
// Organization JSON-LD — site-wide identity signal
// ---------------------------------------------------------------------------

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OutrankBid",
  url: "https://outrankbid.com",
  description:
    "OutrankBid is the real-time startup leaderboard where startups compete for visibility through community bids.",
  sameAs: [
    "https://x.com/AbuBakkar2502",
    "https://www.linkedin.com/in/abu-bakkar-siddique-546112205",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
    >
      <head>
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Script
          data-website-id="dfid_OuELlIdHbyzXkCEpVa04o"
          data-domain="outrankbid.com"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
