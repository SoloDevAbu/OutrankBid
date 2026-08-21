import { type NextRequest } from "next/server"
import { db, startups, categories, clickEvents, platforms } from "@/db"
import { eq, and, count, desc, asc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category")

  try {
    // Build the where clause.
    // Rank must not be persisted — it is derived from the ORDER BY position.
    const whereClause = categorySlug
      ? and(
          eq(startups.status, "active"),
          eq(categories.slug, categorySlug)
        )
      : eq(startups.status, "active")

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
      .where(whereClause)
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
      // Primary sort: highest bid first.  Secondary: earliest creation for
      // tiebreaks so the order is deterministic even before any bids come in.
      .orderBy(desc(startups.currentBid), asc(startups.createdAt))

    // Rank is the 1-based position in the sorted result set — never stored.
    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      slug: row.slug,
      category: {
        name: row.categoryName,
        slug: row.categorySlug,
      },
      platform: row.platformSlug ? {
        name: row.platformName,
        slug: row.platformSlug,
        logoUrl: row.platformLogoUrl,
      } : null,
      currentBid: row.currentBid,
      // currentBid is stored in cents; expose a formatted dollar string too
      // so the client doesn't have to do the conversion itself.
      currentBidFormatted: formatCents(row.currentBid),
      clickCount: Number(row.clickCount),
      appUrl: row.appUrl,
      description: row.description,
      logoUrl: row.logoUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))

    return Response.json({ leaderboard })
  } catch (error) {
    console.error("[GET /api/leaderboard]", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert an integer cent value to a USD dollar string, e.g. 45000 → "$450.00" */
function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}
