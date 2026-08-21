import { NextResponse } from "next/server"
import { db } from "@/db"
import { startups } from "@/db/schema"
import { eq } from "drizzle-orm"

function normalizeUrlOrigin(raw: string): string | null {
  let input = raw?.trim?.() ?? ""
  if (!input) return null
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`
  try {
    const u = new URL(input)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.origin
  } catch {
    return null
  }
}

/**
 * POST /api/check-url
 *
 * Checks whether a startup with the given websiteUrl already exists in the DB.
 *
 * Request body:  { "websiteUrl": "https://example.com" }
 *
 * Response (exists):
 *   { "exists": true, "startupId": "uuid", "currentBidDollars": 50, "name": "Example" }
 *
 * Response (not exists):
 *   { "exists": false }
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body !== "object" || !body || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object" },
      { status: 400 }
    )
  }

  const { websiteUrl } = body as { websiteUrl?: string }

  const origin = normalizeUrlOrigin(websiteUrl ?? "")
  if (!origin) {
    return NextResponse.json(
      { error: "`websiteUrl` must be a valid http/https URL" },
      { status: 422 }
    )
  }

  try {
    const rows = await db
      .select({
        id: startups.id,
        name: startups.name,
        currentBid: startups.currentBid,
      })
      .from(startups)
      .where(eq(startups.websiteUrl, origin))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ exists: false })
    }

    const row = rows[0]
    return NextResponse.json({
      exists: true,
      startupId: row.id,
      name: row.name,
      // currentBid is stored in cents; convert to dollars for the client
      currentBidDollars: Math.round(row.currentBid / 100),
    })
  } catch (err: any) {
    console.error("[/api/check-url] error", err)
    return NextResponse.json(
      { error: "Database error", message: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
