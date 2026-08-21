import React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { eq, count, desc, asc } from "drizzle-orm"
import { db, startups, categories, clickEvents, platforms } from "@/db"
import { HomeHeroCta } from "@/components/home-hero-cta"
import {
  LeaderboardView,
  type LeaderboardEntry,
  type Category,
  type Stats,
} from "@/components/leaderboard-view"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "OutrankBid — Live Startup Leaderboard",
  description:
    "The real-time leaderboard where startups compete for visibility. Filter by category, see live bid rankings, and discover what's trending now.",
  alternates: { canonical: "https://outrankbid.com" },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      id: startups.id,
      name: startups.name,
      slug: startups.slug,
      categoryName: categories.name,
      categorySlug: categories.slug,
      platformName: platforms.name,
      platformSlug: platforms.slug,
      platformLogoUrl: platforms.logoUrl,
      currentBid: startups.currentBid,
      appUrl: startups.appUrl,
      description: startups.description,
      logoUrl: startups.logoUrl,
      createdAt: startups.createdAt,
      updatedAt: startups.updatedAt,
      clickCount: count(clickEvents.id),
    })
    .from(startups)
    .innerJoin(categories, eq(startups.categoryId, categories.id))
    .leftJoin(platforms, eq(startups.platformId, platforms.id))
    .leftJoin(clickEvents, eq(clickEvents.startupId, startups.id))
    .where(eq(startups.status, "active"))
    .groupBy(
      startups.id,
      startups.name,
      startups.slug,
      startups.currentBid,
      startups.appUrl,
      startups.description,
      startups.logoUrl,
      startups.createdAt,
      startups.updatedAt,
      categories.name,
      categories.slug,
      platforms.name,
      platforms.slug,
      platforms.logoUrl
    )
    .orderBy(desc(startups.currentBid), asc(startups.createdAt))

  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    slug: row.slug,
    category: { name: row.categoryName, slug: row.categorySlug },
    platform: row.platformSlug
      ? {
          name: row.platformName!,
          slug: row.platformSlug,
          logoUrl: row.platformLogoUrl,
        }
      : null,
    currentBid: row.currentBid,
    currentBidFormatted: formatCents(row.currentBid),
    clickCount: Number(row.clickCount),
    appUrl: row.appUrl,
    description: row.description,
    logoUrl: row.logoUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

async function getCategories(): Promise<Category[]> {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(categories.name)
  return rows
}

async function getStats(): Promise<Stats> {
  const [activeResult, clickResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(startups)
      .where(eq(startups.status, "active")),
    db.select({ count: count() }).from(clickEvents),
  ])
  return {
    activeCount: Number(activeResult[0]?.count ?? 0),
    totalClicks: Number(clickResult[0]?.count ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Page() {
  const [leaderboard, cats, stats] = await Promise.all([
    getLeaderboard(),
    getCategories(),
    getStats(),
  ])

  // JSON-LD: ItemList schema for the top leaderboard entries
  const top3 = leaderboard.slice(0, 3)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "OutrankBid Startup Leaderboard",
    description:
      "Top startups ranked by real-time community bids on OutrankBid",
    itemListElement: top3.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://outrankbid.com/startup/${s.slug}`,
      name: s.name,
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-black">
          OutrankBid
        </Link>
        <Link
          href="/how-it-works"
          className="hidden text-[10px] font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-black md:block"
        >
          How it works
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 md:px-6">
        {/* LeaderboardView handles stats pill, two-col hero+mini-board, filters, full list */}
        <LeaderboardView
          initialData={leaderboard}
          initialCategories={cats}
          initialStats={stats}
          activeCategory={null}
          categoryPage={false}
          heroSlot={<HomeHeroCta />}
        />
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between border-t border-black/10 bg-[#f5f5f5] px-6 py-8 md:flex-row">
        <div className="mb-4 text-base font-bold tracking-tight text-black md:mb-0">
          OutrankBid
        </div>
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/AbuBakkar2502"
              className="text-black transition-colors hover:text-black/80"
              rel="noopener noreferrer"
              target="_blank"
              aria-label="Follow on X (Twitter)"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/abu-bakkar-siddique-546112205"
              className="text-black transition-colors hover:text-black/80"
              rel="noopener noreferrer"
              target="_blank"
              aria-label="Connect on LinkedIn"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <div className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
            BUILT BY @ABUBAKKAR2502
          </div>
        </div>
      </footer>
    </div>
  )
}
