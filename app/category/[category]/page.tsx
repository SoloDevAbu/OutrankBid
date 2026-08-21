import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { eq, count, desc, asc, and } from "drizzle-orm"
import { db, startups, categories, clickEvents, platforms } from "@/db"
import {
  LeaderboardView,
  type LeaderboardEntry,
  type Stats,
} from "@/components/leaderboard-view"

// ---------------------------------------------------------------------------
// ISR — category leaderboard updates frequently
// ---------------------------------------------------------------------------

export const revalidate = 60

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

async function getAllCategories() {
  return db
    .select({ slug: categories.slug, name: categories.name, id: categories.id })
    .from(categories)
    .orderBy(categories.name)
}

async function getCategoryMeta(slug: string) {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

async function getCategoryLeaderboard(categorySlug: string): Promise<LeaderboardEntry[]> {
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
    .where(
      and(
        eq(startups.status, "active"),
        eq(categories.slug, categorySlug)
      )
    )
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

async function getCategoryStats(categorySlug: string): Promise<Stats> {
  const [activeResult, clickResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(startups)
      .innerJoin(categories, eq(startups.categoryId, categories.id))
      .where(and(eq(startups.status, "active"), eq(categories.slug, categorySlug))),
    db
      .select({ count: count() })
      .from(clickEvents)
      .innerJoin(startups, eq(clickEvents.startupId, startups.id))
      .innerJoin(categories, eq(startups.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug)),
  ])
  return {
    activeCount: Number(activeResult[0]?.count ?? 0),
    totalClicks: Number(clickResult[0]?.count ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const cats = await getAllCategories()
  return cats.map((c) => ({ category: c.slug }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const cat = await getCategoryMeta(category)
  if (!cat) return {}

  const title = `Top ${cat.name} Startups — Live Leaderboard | OutrankBid`
  const description =
    cat.description ??
    `See which ${cat.name} startups are trending right now, ranked by community bids on OutrankBid.`

  return {
    title,
    description,
    alternates: { canonical: `https://outrankbid.com/category/${category}` },
    openGraph: {
      title,
      description,
      url: `https://outrankbid.com/category/${category}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const [cat, leaderboard, allCategories, stats] = await Promise.all([
    getCategoryMeta(category),
    getCategoryLeaderboard(category),
    getAllCategories(),
    getCategoryStats(category),
  ])

  if (!cat) notFound()

  const top3 = leaderboard.slice(0, 3)

  // JSON-LD: ItemList for this category
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${cat.name} Startups on OutrankBid`,
    description: `${cat.name} startups ranked by real-time bids`,
    itemListElement: top3.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://outrankbid.com/startup/${s.slug}`,
      name: s.name,
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
      {/* JSON-LD */}
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-16 md:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            <li>
              <Link href="/" className="transition-colors hover:text-black">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-black">{cat.name}</li>
          </ol>
        </nav>

        {/* Category header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-black">
            Top {cat.name} Startups
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {cat.description ??
              `${cat.name} startups ranked live by community bids. The higher the bid, the higher the rank.`}
          </p>
        </div>

        {/* Other category quick links */}
        {allCategories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-full border border-black/20 bg-white px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground transition-colors hover:bg-muted"
            >
              ALL
            </Link>
            {allCategories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  c.slug === category
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Server-rendered initial data → client component for live polling */}
        <LeaderboardView
          initialData={leaderboard}
          initialCategories={allCategories}
          initialStats={stats}
          activeCategory={category}
          categoryPage={true}
        />
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
