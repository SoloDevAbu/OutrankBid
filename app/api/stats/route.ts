import { db, startups, clickEvents } from "@/db"
import { eq, count } from "drizzle-orm"

export async function GET() {
  try {
    const [activeRow] = await db
      .select({ activeCount: count(startups.id) })
      .from(startups)
      .where(eq(startups.status, "active"))

    const [clickRow] = await db
      .select({ totalClicks: count(clickEvents.id) })
      .from(clickEvents)

    return Response.json({
      activeCount: activeRow?.activeCount ?? 0,
      totalClicks: clickRow?.totalClicks ?? 0,
    })
  } catch (error) {
    console.error("[GET /api/stats]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
