import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { eq, count, desc, asc } from "drizzle-orm"
import { db, startups, categories, clickEvents, platforms } from "@/db"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// ISR — revalidate every 5 minutes (bids/ranks change, but not per-request)
// ---------------------------------------------------------------------------

export const revalidate = 300

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

async function getAllStartupSlugs() {
  return db
    .select({ slug: startups.slug })
    .from(startups)
    .where(eq(startups.status, "active"))
}

async function getStartupBySlug(slug: string) {
  const rows = await db
    .select({
      id: startups.id,
      name: startups.name,
      slug: startups.slug,
      description: startups.description,
      logoUrl: startups.logoUrl,
      appUrl: startups.appUrl,
      currentBid: startups.currentBid,
      categoryName: categories.name,
      categorySlug: categories.slug,
      platformName: platforms.name,
      platformSlug: platforms.slug,
      platformLogoUrl: platforms.logoUrl,
      createdAt: startups.createdAt,
      updatedAt: startups.updatedAt,
      clickCount: count(clickEvents.id),
    })
    .from(startups)
    .innerJoin(categories, eq(startups.categoryId, categories.id))
    .leftJoin(platforms, eq(startups.platformId, platforms.id))
    .leftJoin(clickEvents, eq(clickEvents.startupId, startups.id))
    .where(eq(startups.slug, slug))
    .groupBy(
      startups.id,
      startups.name,
      startups.slug,
      startups.description,
      startups.logoUrl,
      startups.appUrl,
      startups.currentBid,
      startups.createdAt,
      startups.updatedAt,
      categories.name,
      categories.slug,
      platforms.name,
      platforms.slug,
      platforms.logoUrl
    )
    .limit(1)

  return rows[0] ?? null
}

/** Compute the rank of a startup by counting how many active startups have a higher bid */
async function getStartupRank(startupId: string, currentBid: number): Promise<number> {
  const higher = await db
    .select({ count: count() })
    .from(startups)
    .where(eq(startups.status, "active"))

  // Rank = position in descending bid order (1-based)
  const allRows = await db
    .select({ id: startups.id, currentBid: startups.currentBid, createdAt: startups.createdAt })
    .from(startups)
    .where(eq(startups.status, "active"))
    .orderBy(desc(startups.currentBid), asc(startups.createdAt))

  const idx = allRows.findIndex((r) => r.id === startupId)
  return idx === -1 ? 0 : idx + 1
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const slugs = await getAllStartupSlugs()
  return slugs.map((s) => ({ slug: s.slug }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const startup = await getStartupBySlug(slug)
  if (!startup) return {}

  const title = `${startup.name} — ${startup.categoryName} Startup | OutrankBid`
  const description =
    startup.description ??
    `${startup.name} is listed on OutrankBid — the real-time startup leaderboard ranked by community bids.`

  return {
    title,
    description,
    alternates: { canonical: `https://outrankbid.com/startup/${slug}` },
    openGraph: {
      title: `${startup.name} on OutrankBid`,
      description,
      url: `https://outrankbid.com/startup/${slug}`,
      type: "website",
      ...(startup.logoUrl
        ? { images: [{ url: startup.logoUrl, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${startup.name} on OutrankBid`,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const startup = await getStartupBySlug(slug)
  if (!startup) notFound()

  const rank = await getStartupRank(startup.id, startup.currentBid)

  // JSON-LD: SoftwareApplication (or Organization fallback)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: startup.name,
    applicationCategory: startup.categoryName,
    url: startup.appUrl,
    ...(startup.logoUrl ? { image: startup.logoUrl } : {}),
    description:
      startup.description ??
      `${startup.name} — ranked #${rank} in ${startup.categoryName} on OutrankBid.`,
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-20 md:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            <li>
              <Link href="/" className="transition-colors hover:text-black">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link
                href={`/category/${startup.categorySlug}`}
                className="transition-colors hover:text-black"
              >
                {startup.categoryName}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-black">{startup.name}</li>
          </ol>
        </nav>

        {/* Startup card */}
        <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
          {/* Logo + name + rank */}
          <div className="flex items-start gap-6">
            {startup.logoUrl ? (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-black/10">
                <Image
                  src={startup.logoUrl}
                  alt={`${startup.name} logo`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  priority
                />
              </div>
            ) : (
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarFallback className="rounded-xl text-2xl font-black">
                  {startup.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-black">
                  {startup.name}
                </h1>
                {rank > 0 && (
                  <span className="text-3xl font-black italic text-muted-foreground">
                    #{rank}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/category/${startup.categorySlug}`}>
                  <Badge
                    variant="secondary"
                    className="bg-muted px-2 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:bg-muted/80"
                  >
                    {startup.categoryName}
                  </Badge>
                </Link>
                {startup.platformSlug && startup.platformName && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-muted px-2 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
                  >
                    {startup.platformLogoUrl && (
                      <img
                        src={startup.platformLogoUrl}
                        alt={startup.platformName}
                        className="h-3 w-3 object-contain opacity-70"
                      />
                    )}
                    {startup.platformName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/10 pt-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                Current Bid
              </span>
              <span className="text-2xl font-black text-orange-500">
                {formatCents(startup.currentBid)}
              </span>
              <span className="text-[8px] text-muted-foreground">Paid placement</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                Leaderboard Rank
              </span>
              <span className="text-2xl font-black italic text-black">
                {rank > 0 ? `#${rank}` : "—"}
              </span>
              <span className="text-[8px] text-muted-foreground">in {startup.categoryName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                Total Clicks
              </span>
              <span className="text-2xl font-black text-black">
                {startup.clickCount.toLocaleString()}
              </span>
              <span className="text-[8px] text-muted-foreground">via OutrankBid</span>
            </div>
          </div>

          {/* Description */}
          {startup.description && (
            <div className="mt-6 border-t border-black/10 pt-6">
              <h2 className="mb-2 text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                About
              </h2>
              <p className="text-sm leading-relaxed text-black">
                {startup.description}
              </p>
            </div>
          )}

          {/* CTA — sponsored external link */}
          <div className="mt-8 flex flex-col items-start gap-3 border-t border-black/10 pt-6">
            <a
              href={startup.appUrl}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-black px-8 text-sm font-bold text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Visit {startup.name} ↗
            </a>
            <p className="text-[9px] text-muted-foreground">
              Sponsored — paid leaderboard placement via OutrankBid
            </p>
          </div>
        </div>

        {/* Back to category */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/category/${startup.categorySlug}`}
            className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-black"
          >
            ← All {startup.categoryName} Startups
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/"
            className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-black"
          >
            Full Leaderboard
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
