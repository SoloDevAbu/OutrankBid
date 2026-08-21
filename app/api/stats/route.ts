import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const key = process.env.DATAFAST_API_KEY || ""
    
    // Fetch realtime active visitors
    const rtRes = await fetch("https://datafa.st/api/v1/analytics/realtime", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    })
    
    let activeCount = 0
    if (rtRes.ok) {
      const rtData = await rtRes.json()
      activeCount = rtData?.data?.[0]?.visitors || 0
    }

    // Fetch total pageviews (e.g. from beginning of 2024 to today)
    const today = new Date().toISOString().split("T")[0]
    const ovRes = await fetch(
      `https://datafa.st/api/v1/analytics/overview?startAt=2024-01-01&endAt=${today}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    )
    
    let totalClicks = 0
    if (ovRes.ok) {
      const ovData = await ovRes.json()
      totalClicks = ovData?.data?.[0]?.pageviews || 0
    }

    return NextResponse.json({
      activeCount,
      totalClicks,
    })
  } catch (error) {
    console.error("[GET /api/stats]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
