import { Checkout } from "@dodopayments/nextjs"

/**
 * Dodo Payments Checkout (Static - GET)
 * Docs:
 * - Adapter Quick Start: https://github.com/dodopayments/dodo-adapters/blob/main/packages/nextjs/README.md
 * - BillingSDK Overview: https://docs.dodopayments.com/developer-resources/billingsdk
 *
 * Usage:
 *   /checkout?productId=<YOUR_PRODUCT_ID>&quantity=1
 *
 * Env required:
 *   DODO_PAYMENTS_API_KEY=...
 *   DODO_PAYMENTS_RETURN_URL=http://localhost:3000
 *   DODO_PAYMENTS_ENVIRONMENT=test_mode | live_mode
 *
 * Notes:
 * - All Dodo API amounts are in the currency's smallest unit (e.g., USD cents).
 * - Use test_mode in development. Live rollout requires rotating keys and webhook URLs.
 */
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL ?? "http://localhost:3000",
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as
      "test_mode" | "live_mode" | undefined) ?? "test_mode",
  type: "static",
})

export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL ?? "http://localhost:3000",
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as
      "test_mode" | "live_mode" | undefined) ?? "test_mode",
  // Use Checkout Sessions for secure, hosted checkout
  // Client should POST JSON including:
  // {
  //   "product_cart": [{ "product_id": "pdt_xxx", "quantity": 1, "amount": 24000 }],
  //   "metadata": { ... },
  //   "billing_currency": "USD"
  // }
  type: "session",
})
