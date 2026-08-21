import React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { Separator } from "@/components/ui/separator"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "How OutrankBid Works — Bidding, Ranking & Fulfillment Explained",
  description:
    "Learn how startup bids translate into leaderboard rank, how payments are processed, and how rankings update in real time. Full FAQ.",
  alternates: { canonical: "https://outrankbid.com/how-it-works" },
  openGraph: {
    title: "How OutrankBid Works — Bidding, Ranking & Fulfillment Explained",
    description:
      "Learn how startup bids translate into leaderboard rank, how payments are processed, and how rankings update in real time.",
    url: "https://outrankbid.com/how-it-works",
    type: "website",
  },
}

// ---------------------------------------------------------------------------
// FAQ data — drives both the UI and the JSON-LD
// ---------------------------------------------------------------------------

const faqs = [
  {
    question: "How does startup ranking work on OutrankBid?",
    answer:
      "Every startup on OutrankBid has a current bid amount — the highest confirmed bid placed on that startup. The leaderboard is sorted by this bid amount in descending order: the startup with the highest bid sits at #1. Rank is computed live from the bids ledger, not stored separately, so it updates the moment a new bid is confirmed. Ties are broken by submission date (earlier submissions rank higher).",
  },
  {
    question: "What happens when I place a bid?",
    answer:
      "When you place a bid you are taken through a secure checkout powered by Dodo Payments. Once your payment is confirmed via a verified webhook from Dodo, your bid is recorded in our bids ledger and your startup's position on the leaderboard updates automatically. No manual review required — fulfillment is automated end-to-end. You will see your new rank within seconds of payment confirmation.",
  },
  {
    question: "How often does the leaderboard update?",
    answer:
      "The leaderboard polls for fresh data every 30 seconds automatically — you will see rankings shift in real time without refreshing the page. Individual startup pages and category pages are also cached with short revalidation windows (60–300 seconds) to reflect bid changes quickly while keeping the site fast.",
  },
  {
    question: "Is placement paid or organic?",
    answer:
      "Placement is entirely bid-driven — it is a paid placement product. There is no algorithmic editorial curation or organic ranking. The startup with the highest active bid holds the top position. All outbound links from OutrankBid to listed startups are marked as sponsored placements in accordance with Google's link guidelines (rel=\"sponsored nofollow\"). This is transparent by design: you are paying for leaderboard visibility, not trying to manufacture organic signals.",
  },
  {
    question: "How do I track my clicks and ROI?",
    answer:
      "Every time a visitor clicks through to your startup from OutrankBid, a click event is recorded against your listing. Your startup detail page shows your total click count from OutrankBid traffic. Use this alongside your own analytics (UTM parameters on your app URL are a good idea) to measure downstream conversions and calculate ROI on your bid.",
  },
]

// ---------------------------------------------------------------------------
// FAQPage JSON-LD
// ---------------------------------------------------------------------------

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-black">
          OutrankBid
        </Link>
        <Link
          href="/how-it-works"
          className="hidden text-[10px] font-bold tracking-widest text-black uppercase md:block"
        >
          How it works
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-12 pb-24 md:px-6">
        {/* Page heading */}
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-black md:text-5xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            The simple, no-nonsense leaderboard where startups battle for the top
            spot through transparent, bid-based ranking.
          </p>
        </div>

        <Separator className="mb-12" />

        {/* Steps */}
        <div className="mb-16 space-y-12">
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                1
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Submit Your Startup</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Add your startup to the arena. Provide your website URL, a catchy
                description, and select the category that best fits your product.
                It&apos;s your ticket to getting noticed.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                2
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Place Your Bid</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                This isn&apos;t a democratic vote; it&apos;s a bidding war. Place a bid to
                claim your spot on the leaderboard. The higher your bid, the higher
                you rank. It&apos;s pure, unadulterated visibility.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                3
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Outrank &amp; Dominate</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Watch as traffic flows to the top spots. Someone outbid you? Bid
                higher to reclaim your throne. The leaderboard is dynamic, fiercely
                competitive, and entirely in your control.
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* FAQ section */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-black tracking-tight text-black">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-black/10 pb-8 last:border-0">
                <h3 className="mb-3 text-lg font-bold text-black">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal linking */}
        <div className="mb-16 rounded-xl border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-black">Explore the Leaderboard</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Browse startups by category to find tools relevant to your space, or
            jump straight to the full leaderboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md bg-black px-6 text-sm font-bold text-white transition-colors hover:bg-black/90"
            >
              Full Leaderboard
            </Link>
            <Link
              href="/category/ai"
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/20 bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-muted"
            >
              AI Startups
            </Link>
            <Link
              href="/category/dev-tools"
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/20 bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-muted"
            >
              Dev Tools
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-black text-black">Ready to claim your spot?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Head back to the leaderboard and start bidding.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-bold text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            Back to Leaderboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between border-t border-black/10 bg-[#f5f5f5] px-6 py-8 md:flex-row">
        <div className="mb-4 text-base font-bold tracking-tight text-black md:mb-0">
          OutrankBid
        </div>
        <div className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
          BUILT BY @ABUBAKKAR2502
        </div>
      </footer>
    </div>
  )
}
