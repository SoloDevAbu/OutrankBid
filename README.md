# OutrankBid + BillingSDK Pricing Integration

This project now includes a BillingSDK-powered pricing page wired to Dodo Payments using the official Next.js adapter.

What's included:

- A responsive pricing table UI (ShadCN-styled)
- Dodo Payments Checkout route (GET /checkout)
- Customer Portal route (GET /customer-portal)
- Webhook endpoint with signature verification (POST /api/webhook/dodo-payments)
- Example plans configuration with placeholder product IDs

References (official docs):

- Next.js Adapter Quick Start: https://github.com/dodopayments/dodo-adapters/blob/main/packages/nextjs/README.md
- BillingSDK Quick Start (CLI + Components): https://billingsdk.com/docs/quick-start
- BillingSDK Overview: https://docs.dodopayments.com/developer-resources/billingsdk
- Next.js Minimal Boilerplate (env patterns): https://docs.dodopayments.com/developer-resources/nextjs-boilerplate

Important notes:

- Always use Dodo Payments test mode when developing.
- All API amounts are in the currency's smallest unit (e.g., 5000 USD = $50.00).
- Never commit real API keys. Use environment variables.

---

## Files added/updated

- Pricing UI
  - components/billingsdk/pricing-table-one.tsx
  - app/pricing/page.tsx

- Dodo Payments routes (Next.js App Router)
  - app/checkout/route.ts
  - app/customer-portal/route.ts
  - app/api/webhook/dodo-payments/route.ts

- Plans configuration (replace with real Product IDs from Dodo)
  - lib/products.ts

- Navigation
  - app/page.tsx (header now links to /pricing)

---

## Installation

Dependencies are already added:

- @dodopayments/nextjs (Next.js adapter)
- shadcn/ui primitives are in components/ui

If you need to reinstall:

```bash
pnpm add @dodopayments/nextjs
```

---

## Environment Variables

Populate the following in .env (test keys while developing):

```env
DODO_PAYMENTS_API_KEY=your_test_api_key
DODO_PAYMENTS_WEBHOOK_SECRET=your_test_webhook_secret
DODO_PAYMENTS_RETURN_URL=http://localhost:3000
DODO_PAYMENTS_ENVIRONMENT=test_mode
```

Notes:

- The adapter reads these at runtime. For production, rotate and switch DODO_PAYMENTS_ENVIRONMENT=live_mode.
- If you previously used DODO_API_KEY, migrate to DODO_PAYMENTS_API_KEY for adapter-based routes.

---

## Configure Plans

Edit lib/products.ts:

- Replace product_id with actual Product IDs from your Dodo Payments dashboard.
- Keep price in smallest unit (e.g., 900 = $9.00 USD).

Example (already present in file):

```ts
export const plans = [
  {
    product_id: "pdt_basic_replace_me",
    name: "Starter",
    description: "For early-stage projects getting started.",
    price: 900, // $9.00
    currency: "USD",
    billing_interval: "month",
    features: ["Up to 1 project", "Basic analytics", "Community support"],
  },
  // ...
]
```

---

## Run locally

```bash
pnpm dev
```

Navigate to:

- Pricing page: http://localhost:3000/pricing
- Subscribe button → redirects to: /checkout?productId=... (handles static checkout link via adapter)

---

## Routes and Usage

1. Checkout (GET)

- Path: /checkout
- Query: productId=YOUR_PRODUCT_ID&quantity=1
- Handler: app/checkout/route.ts (uses @dodopayments/nextjs Checkout)

2. Customer Portal (GET)

- Path: /customer-portal?customer_id=cus_123
- Optional: &send_email=true
- Handler: app/customer-portal/route.ts

3. Webhook (POST)

- Path: /api/webhook/dodo-payments
- Handler: app/api/webhook/dodo-payments/route.ts
- Configure this URL in Dodo Payments dashboard webhooks
- Uses signature verification via DODO_PAYMENTS_WEBHOOK_SECRET

Security notes:

- Do not modify raw request body before webhook verification (adapter handles this safely).
- Store secrets in environment variables only.

---

## Sandbox Testing

1. Ensure test mode

- Set DODO_PAYMENTS_ENVIRONMENT=test_mode
- Use test API keys and webhook secret

2. Pricing → Checkout

- Visit /pricing
- Click “Subscribe” on a plan (after setting a real product_id)
- You will be redirected to a Dodo Payments-hosted checkout link

3. Customer portal

- Visit /customer-portal?customer_id=cus_test_123 (use a valid test customer ID)
- Optional: &send_email=true to email the link

4. Webhook testing

- Expose your dev server (e.g., ngrok)
  - http://localhost:3000 → https://your-ngrok-id.ngrok.io
- Configure webhook URL:
  - https://your-ngrok-id.ngrok.io/api/webhook/dodo-payments
- Trigger a test event from Dodo dashboard and verify logs in server console

---

## Production Rollout Checklist

- Switch to live mode:
  - DODO_PAYMENTS_ENVIRONMENT=live_mode
- Rotate credentials:
  - DODO_PAYMENTS_API_KEY (live)
  - DODO_PAYMENTS_WEBHOOK_SECRET (live)
- Use your real domain in DODO_PAYMENTS_RETURN_URL
- Confirm webhook URL is publicly reachable and correct
- Replace all placeholder product_id values in lib/products.ts
- Add robust logging and idempotent DB writes in webhook handler
- Ensure error handling on Checkout/Portal routes (adapter handlers already include validation)

---

## Troubleshooting

- 400 on Checkout:
  - Ensure you pass a valid productId in the query string
  - Ensure DODO_PAYMENTS_API_KEY is set

- Webhook signature errors:
  - Confirm DODO_PAYMENTS_WEBHOOK_SECRET matches the dashboard's value
  - Ensure your public webhook URL is correct and stable

- Currency/amount mismatches:
  - Prices are in smallest unit (e.g., cents for USD). Divide by 100 only for UI display.

---

## Attributions and Docs

- Next.js adapter: https://github.com/dodopayments/dodo-adapters/blob/main/packages/nextjs/README.md
- BillingSDK Quick Start: https://billingsdk.com/docs/quick-start
- BillingSDK Overview: https://docs.dodopayments.com/developer-resources/billingsdk
- Minimal Next.js boilerplate setup: https://docs.dodopayments.com/developer-resources/nextjs-boilerplate
