import { Webhooks } from "@dodopayments/nextjs"
import { withTransaction, type Tx } from "@/db/transaction"
import { startups, bids, payments, categories } from "@/db"
import { eq, sql } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Dodo Payments Webhook (POST)
 * Route: /api/webhook/dodo-payments
 *
 * Security:
 * - Uses HMAC signature verification via DODO_PAYMENTS_WEBHOOK_SECRET
 * - Adapter consumes the raw body; do not parse/modify request body
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
  let meta = (
    (p?.data?.metadata as Record<string, any> | undefined) ??
    (p?.metadata as Record<string, any> | undefined) ??
    (p?.data?.payment?.metadata as Record<string, any> | undefined) ??
    {}
  )
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta)
    } catch {
      meta = {}
    }
  }
  return meta as Record<string, any>
}

function getAmountSmallestUnit(p: any): number | null {
  // Prefer total_amount; accept amount; accept numeric strings too (adapter may serialize as string)
  const c = [
    p?.data?.total_amount,
    p?.data?.amount,
    p?.data?.payment?.total_amount,
    p?.data?.payment?.amount,
    p?.data?.payload?.amount,
  ]
  for (const v of c) {
    if (typeof v === "number" && Number.isFinite(v)) return v as number
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v)
  }
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
  // Prefer payment_id when present; fall back to id/provider_payment_id
  const c = [
    p?.data?.payment_id,
    p?.data?.payment?.payment_id,
    p?.data?.id,
    p?.data?.payment?.id,
    p?.data?.provider_payment_id,
  ]
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
 * Runs inside the same transaction to avoid mixed clients.
 */
async function findOrCreateGeneralCategory(tx: Tx): Promise<string> {
  const existing = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "general"))
    .limit(1)

  if (existing[0]) return existing[0].id

  await tx
    .insert(categories)
    .values({
      name: "General",
      slug: "general",
      description: "General category",
    })
    .onConflictDoNothing?.()

  const [row] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "general"))
    .limit(1)

  return row.id
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    try {
      const type = getEventType(payload)
      const d: any = (payload as any)?.data ?? {}
      
      console.log("[webhook] Received", {
        type,
        providerPaymentId: d.payment_id ?? d.id ?? null,
        hasMeta: Boolean(d.metadata),
      })

      if (type === "payment.failed") {
        console.log("[webhook] payment.failed", {
          id: d.payment_id ?? d.id ?? null,
          reason: d.failure_reason ?? d.message ?? null,
        })
        return
      }

      if (type === "payment.succeeded") {
        const meta = getMetadata(payload) || {}
        const amount = getAmountSmallestUnit(payload)
        const currency = getCurrency(payload) ?? "USD"
        const providerPaymentId = getProviderPaymentId(payload)

        console.log("[webhook] processing payment.succeeded", {
          providerPaymentId,
          amount,
          currency,
          metadata: meta,
        })

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

        await withTransaction(async (tx) => {
          // 0) Idempotency guard
          const existingPayment = await tx
            .select({ id: payments.id })
            .from(payments)
            .where(eq(payments.providerPaymentId, providerPaymentId))
            .limit(1)
          if (existingPayment[0]) {
            console.log("[webhook] Already processed:", providerPaymentId)
            return
          }

          // 1) Resolve startup
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

          // 2) Auto-create startup
          if (!startupRow && websiteUrlFromMeta) {
            console.log("[webhook] Auto-creating startup for:", websiteUrlFromMeta)
            const categoryId = await findOrCreateGeneralCategory(tx)
            const name = nameFromUrl(websiteUrlFromMeta)
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
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
            console.warn("[webhook] Could not resolve startup; skipping")
            return
          }

          // 3) Insert bid
          const [bidRow] = await tx
            .insert(bids)
            .values({
              startupId: startupRow.id,
              userId: userIdFromMeta,
              amount,
              currency,
            })
            .returning()

          if (meta.is_top_up === "true") {
            await tx
              .update(startups)
              .set({
                currentBid: startupRow.currentBid + amount,
                updatedAt: sql`now()`,
              })
              .where(eq(startups.id, startupRow.id))
          } else if (amount > startupRow.currentBid) {
            await tx
              .update(startups)
              .set({ currentBid: amount, updatedAt: sql`now()` })
              .where(eq(startups.id, startupRow.id))
          }

          // 4) Record payment row
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
        console.log("[webhook] Persisted payment successfully", { providerPaymentId })
      }
    } catch (err) {
      console.error("[webhook] Error in payload processing:", err)
      throw err // Allow Dodo to retry
    }
  },
})
