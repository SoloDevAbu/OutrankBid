import { startups, bids } from "@/db"
import { withTransaction } from "@/db/transaction"
import { eq, sql } from "drizzle-orm"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err(400, "Request body must be valid JSON.")
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return err(400, "Request body must be a JSON object.")
  }

  const raw = body as Record<string, unknown>

  const startupId = typeof raw.startupId === "string" ? raw.startupId.trim() : ""
  const userId    = typeof raw.userId    === "string" ? raw.userId.trim()    : ""
  const amount    = typeof raw.amount    === "number" ? raw.amount           : null
  const currency  = typeof raw.currency  === "string" ? raw.currency.trim().toUpperCase() : "USD"

  const issues: string[] = []
  if (!startupId) issues.push("`startupId` is required.")
  if (!userId)    issues.push("`userId` is required.")
  if (amount === null || !Number.isInteger(amount) || amount <= 0)
    issues.push("`amount` must be a positive integer (cents).")
  if (issues.length > 0) return err(422, "Validation failed.", issues)

  try {
    const result = await withTransaction(async (tx) => {
      const rows = await tx
        .select({
          id:         startups.id,
          status:     startups.status,
          currentBid: startups.currentBid,
        })
        .from(startups)
        .where(eq(startups.id, startupId))
        .for("update")
        .limit(1)

      if (rows.length === 0) {
        return { kind: "not_found" } as const
      }

      const startup = rows[0]

      if (startup.status !== "active") {
        return { kind: "not_active", status: startup.status } as const
      }

      if (amount! <= startup.currentBid) {
        return {
          kind: "bid_too_low",
          currentBid: startup.currentBid,
        } as const
      }

      const [bid] = await tx
        .insert(bids)
        .values({
          startupId,
          userId,
          amount: amount!,
          currency,
        })
        .returning()

      await tx
        .update(startups)
        .set({
          currentBid: amount!,
          updatedAt: sql`now()`,
        })
        .where(eq(startups.id, startupId))

      return { kind: "ok", bid, currentBid: amount! } as const
    })

    if (result.kind === "not_found") {
      return err(404, `Startup "${startupId}" not found.`)
    }
    if (result.kind === "not_active") {
      return err(409, `Startup is not accepting bids (status: ${result.status}).`)
    }
    if (result.kind === "bid_too_low") {
      return err(409, "Bid must be strictly greater than the current bid.", [
        `Current bid is ${formatCents(result.currentBid)} (${result.currentBid} cents). Your bid must exceed this.`,
      ])
    }

    return Response.json(
      {
        bid: {
          id:         result.bid.id,
          startupId:  result.bid.startupId,
          userId:     result.bid.userId,
          amount:     result.bid.amount,
          amountFormatted: formatCents(result.bid.amount),
          currency:   result.bid.currency,
          createdAt:  result.bid.createdAt,
        },
        currentBid:          result.currentBid,
        currentBidFormatted: formatCents(result.currentBid),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/bids]", error)
    return err(500, "Internal server error.")
  }
}

function err(status: number, message: string, issues?: string[]): Response {
  return Response.json(
    { error: message, ...(issues?.length ? { issues } : {}) },
    { status }
  )
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}
