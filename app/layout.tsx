import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Startup Rank",
  description:
    "The internet's live leaderboard where startups compete for the top spot.",
  openGraph: {
    title: "Startup Rank",
    description:
      "The internet's live leaderboard where startups compete for the top spot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Rank",
    description:
      "The internet's live leaderboard where startups compete for the top spot.",
  },
}

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
        <Script
          data-website-id="dfid_OuELlIdHbyzXkCEpVa04o"
          data-domain="outrankbid.vercel.app"
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
