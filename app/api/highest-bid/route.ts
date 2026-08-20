import { db, startups } from "@/db"
import { max } from "drizzle-orm"

export async function GET() {
  try {
    const [row] = await db
      .select({ maxBid: max(startups.currentBid) })
      .from(startups)

    const highestBidCents = row?.maxBid ?? 0
    const suggestedDollars = Math.floor(highestBidCents / 100) + 1

    return Response.json({ highestBidCents, suggestedDollars })
  } catch (error) {
    console.error("[GET /api/highest-bid]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
