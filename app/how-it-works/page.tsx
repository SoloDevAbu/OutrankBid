import React from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
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
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-black md:text-5xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            The simple, no-nonsense leaderboard where startups battle for the top spot.
          </p>
        </div>

        <Separator className="mb-12" />

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                1
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Submit Your Startup</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Add your startup to the arena. Provide your website URL, a catchy description, and select the category that best fits your product. It&apos;s your ticket to getting noticed.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                2
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Place Your Bid</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                This isn&apos;t a democratic vote; it&apos;s a bidding war. Place a bid to claim your spot on the leaderboard. The higher your bid, the higher you rank. It&apos;s pure, unadulterated visibility.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                3
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Outrank & Dominate</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Watch as traffic flows to the top spots. Someone outbid you? Bid higher to reclaim your throne. The leaderboard is dynamic, fiercely competitive, and entirely in your control.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-black text-black">Ready to claim your spot?</h3>
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
