import { CustomerPortal } from "@dodopayments/nextjs"

/**
 * Dodo Payments Customer Portal (GET)
 * Docs:
 * - Adapter Quick Start: https://github.com/dodopayments/dodo-adapters/blob/main/packages/nextjs/README.md
 *
 * Usage:
 *   /customer-portal?customer_id=cus_123
 *   Optional: &send_email=true to email the portal link to the customer
 *
 * Env required:
 *   DODO_PAYMENTS_API_KEY=...
 *   DODO_PAYMENTS_ENVIRONMENT=test_mode | live_mode
 */
export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as
      "test_mode" | "live_mode" | undefined) ?? "test_mode",
})
