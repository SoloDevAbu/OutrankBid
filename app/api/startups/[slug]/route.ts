import { type NextRequest } from "next/server"
import { db, startups, categories, clickEvents } from "@/db"
import { eq, count } from "drizzle-orm"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // params is a Promise in Next.js 16 — must be awaited.
  const { slug } = await params

  try {
    const rows = await db
      .select({
        id: startups.id,
        name: startups.name,
        slug: startups.slug,
        categoryName: categories.name,
        categorySlug: categories.slug,
        currentBid: startups.currentBid,
        websiteUrl: startups.websiteUrl,
        description: startups.description,
        logoUrl: startups.logoUrl,
        status: startups.status,
        createdAt: startups.createdAt,
        updatedAt: startups.updatedAt,
        clickCount: count(clickEvents.id),
      })
      .from(startups)
      .innerJoin(categories, eq(startups.categoryId, categories.id))
      .leftJoin(clickEvents, eq(clickEvents.startupId, startups.id))
      .where(eq(startups.slug, slug))
      .groupBy(
        startups.id,
        startups.name,
        startups.slug,
        startups.currentBid,
        startups.websiteUrl,
        startups.description,
        startups.logoUrl,
        startups.status,
        startups.createdAt,
        startups.updatedAt,
        categories.name,
        categories.slug
      )
      .limit(1)

    if (rows.length === 0) {
      return Response.json({ error: "Startup not found" }, { status: 404 })
    }

    const row = rows[0]

    return Response.json({
      startup: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: {
          name: row.categoryName,
          slug: row.categorySlug,
        },
        currentBid: row.currentBid,
        currentBidFormatted: formatCents(row.currentBid),
        clickCount: Number(row.clickCount),
        websiteUrl: row.websiteUrl,
        description: row.description,
        logoUrl: row.logoUrl,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    })
  } catch (error) {
    console.error(`[GET /api/startups/${slug}]`, error)
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
