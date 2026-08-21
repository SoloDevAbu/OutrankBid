import { NextRequest, NextResponse } from "next/server"
import { db, startups, clickEvents } from "@/db"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const slug = body?.slug

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    // Look up startup by slug
    const [startup] = await db
      .select({ id: startups.id })
      .from(startups)
      .where(eq(startups.slug, slug))
      .limit(1)

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    const userAgent = request.headers.get("user-agent") || null
    const referrer = request.headers.get("referer") || null

    // Record the click event
    await db.insert(clickEvents).values({
      startupId: startup.id,
      userAgent,
      referrer,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/click]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
