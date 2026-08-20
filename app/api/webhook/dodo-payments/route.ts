import { Webhooks } from "@dodopayments/nextjs"
import { withTransaction } from "@/db/transaction"
import { startups, bids, payments, categories } from "@/db"
import { db } from "@/db"
import { eq, sql } from "drizzle-orm"

/**
 * Dodo Payments Webhook (POST)
 * Route: /api/webhook/dodo-payments
 *
 * Security:
 * - Uses HMAC signature verification via DODO_PAYMENTS_WEBHOOK_SECRET
 * - Do not parse/modify the raw request body before verification (adapter handles this)
 *
 * Env required:
 *   DODO_PAYMENTS_WEBHOOK_SECRET=...
 *
 * Docs:
 * - Next.js Adapter Webhooks: https://github.com/dodopayments/dodo-adapters/blob/main/packages/nextjs/README.md
 * - Webhooks Overview: https://docs.dodopayments.com/developer-resources/webhooks
 */

function getEventType(p: any): string {
  return typeof p?.type === "string"
    ? p.type
    : typeof p?.event === "string"
      ? p.event
      : ""
}

function getMetadata(p: any): Record<string, any> {
  return (
    (p?.data?.metadata as Record<string, any> | undefined) ??
    (p?.metadata as Record<string, any> | undefined) ??
    (p?.data?.payment?.metadata as Record<string, any> | undefined) ??
    {}
  )
}

function getAmountSmallestUnit(p: any): number | null {
  const c = [
    p?.data?.amount,
    p?.data?.payment?.amount,
    p?.data?.payload?.amount,
  ]
  for (const v of c)
    if (typeof v === "number" && Number.isFinite(v)) return v as number
  return null
}

function getCurrency(p: any): string | null {
  const c = [
    p?.data?.currency,
    p?.data?.payment?.currency,
    p?.data?.payload?.currency,
  ]
  for (const v of c)
    if (typeof v === "string" && v.length >= 3) return String(v).toUpperCase()
  return null
}

function getProviderPaymentId(p: any): string | null {
  const c = [p?.data?.id, p?.data?.payment_id, p?.data?.payment?.id]
  for (const v of c) if (typeof v === "string" && v) return v as string
  return null
}

/**
 * Derive a human-readable startup name from a website URL hostname.
 * e.g. "https://myapp.com" → "myapp"
 */
function nameFromUrl(websiteUrl: string): string {
  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, "")
    const parts = hostname.split(".")
    const name = parts[0] ?? hostname
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return "Unknown"
  }
}

/**
 * Find or create a "General" catch-all category for auto-created startups.
 */
async function findOrCreateGeneralCategory(): Promise<string> {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "general"))
    .limit(1)

  if (existing[0]) return existing[0].id

  const [created] = await db
    .insert(categories)
    .values({ name: "General", slug: "general", description: "General category" })
    .returning({ id: categories.id })

  return created.id
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const type = getEventType(payload)

    // Accept only payment lifecycle events we care about
    if (type !== "payment.succeeded" && type !== "payment.failed") {
      console.log("[webhook] Ignoring event type:", type)
      return
    }

    const meta = getMetadata(payload) || {}
    const amount = getAmountSmallestUnit(payload)
    const currency = getCurrency(payload) ?? "USD"
    const providerPaymentId = getProviderPaymentId(payload)

    console.log("[webhook] Received", {
      type,
      providerPaymentId,
      amount,
      currency,
      metadata: meta,
    })

    if (type === "payment.failed") {
      // Nothing to persist yet — optionally insert failure audit table here.
      return
    }

    // payment.succeeded
    if (amount === null || amount <= 0 || !providerPaymentId) {
      console.warn("[webhook] Missing critical fields; skipping persist")
      return
    }

    const startupIdFromMeta =
      typeof meta.startup_id === "string" && meta.startup_id.trim().length > 0
        ? (meta.startup_id as string)
        : null
    const websiteUrlFromMeta =
      typeof meta.website_url === "string" && meta.website_url.trim().length > 0
        ? (meta.website_url as string)
        : null
    const userIdFromMeta =
      typeof meta.user_id === "string" && meta.user_id.trim().length > 0
        ? (meta.user_id as string)
        : "anonymous"

    try {
      await withTransaction(async (tx) => {
        // 1) Resolve startup (prefer explicit startup_id; else match by website_url)
        let startupRow: { id: string; currentBid: number } | null = null

        if (startupIdFromMeta) {
          const rows = await tx
            .select({ id: startups.id, currentBid: startups.currentBid })
            .from(startups)
            .where(eq(startups.id, startupIdFromMeta))
            .for("update")
            .limit(1)
          startupRow = rows[0] ?? null
        }

        if (!startupRow && websiteUrlFromMeta) {
          const rows = await tx
            .select({ id: startups.id, currentBid: startups.currentBid })
            .from(startups)
            .where(eq(startups.websiteUrl, websiteUrlFromMeta))
            .for("update")
            .limit(1)
          startupRow = rows[0] ?? null
        }

        // 2) If startup still not found, auto-create it from the website URL
        if (!startupRow && websiteUrlFromMeta) {
          console.log(
            "[webhook] Startup not found — auto-creating for:",
            websiteUrlFromMeta
          )

          const categoryId = await findOrCreateGeneralCategory()
          const name = nameFromUrl(websiteUrlFromMeta)
          const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          // Add timestamp suffix to guarantee uniqueness
          const slug = `${baseSlug}-${Date.now().toString(36)}`

          const [newStartup] = await tx
            .insert(startups)
            .values({
              ownerId: userIdFromMeta,
              categoryId,
              name,
              slug,
              websiteUrl: websiteUrlFromMeta,
              currentBid: 0,
              status: "active",
            })
            .returning({ id: startups.id, currentBid: startups.currentBid })

          startupRow = newStartup
        }

        if (!startupRow) {
          console.warn(
            "[webhook] Could not resolve or create startup — no website_url in metadata; skipping"
          )
          return
        }

        // 3) Insert bid (immutable), then conditionally bump leaderboard currentBid
        const [bidRow] = await tx
          .insert(bids)
          .values({
            startupId: startupRow.id,
            userId: userIdFromMeta,
            amount,
            currency,
          })
          .returning()

        if (amount > startupRow.currentBid) {
          await tx
            .update(startups)
            .set({ currentBid: amount, updatedAt: sql`now()` })
            .where(eq(startups.id, startupRow.id))
        }

        // 4) Record payment row (idempotent on providerPaymentId unique)
        await tx
          .insert(payments)
          .values({
            bidId: bidRow.id,
            provider: "dodo",
            providerPaymentId,
            amount,
            currency,
            status: "paid",
          })
          .onConflictDoNothing?.()
      })

      console.log("[webhook] Persisted payment + bid successfully", {
        providerPaymentId,
        amount,
        currency,
      })
    } catch (err) {
      console.error("[webhook] Failed to persist payment event:", err)
    }
  },
})
