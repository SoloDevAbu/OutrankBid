import { NextResponse } from "next/server"

type CreateCheckoutBody = {
  amountCents: number
  websiteUrl: string
  currency?: string // default: USD
  startupId?: string
  userId?: string
  description?: string
  categorySlug?: string
  isTopUp?: boolean // if true, amount is added on top of existing currentBid
}

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

  const {
    amountCents,
    websiteUrl,
    currency: rawCurrency,
    startupId,
    userId,
    description,
    categorySlug,
    isTopUp,
  } = body as CreateCheckoutBody

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json(
      { error: "`amountCents` must be a positive integer (smallest unit)" },
      { status: 422 }
    )
  }

  const origin = normalizeUrlOrigin(websiteUrl)
  if (!origin) {
    return NextResponse.json(
      {
        error:
          "`websiteUrl` must be a valid URL (http/https). Examples: example.com or https://example.com",
      },
      { status: 422 }
    )
  }

  const currency = (rawCurrency ?? "USD").toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json(
      {
        error:
          "`currency` must be a 3-letter ISO code (e.g., USD, EUR, INR, GBP)",
      },
      { status: 422 }
    )
  }

  const productId = process.env.DODO_PWYW_PRODUCT_ID
  if (!productId) {
    return NextResponse.json(
      {
        error: "Server not configured",
        missing: ["DODO_PWYW_PRODUCT_ID"],
        note: "Create a one-time product in Dodo Payments with Pay What You Want enabled and set DODO_PWYW_PRODUCT_ID in .env",
      },
      { status: 500 }
    )
  }

  // Build request body for Checkout Sessions via our /checkout (POST) handler (type: 'session').
  const checkoutBody = {
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        // Dynamic pricing in smallest unit (e.g., cents for USD) — requires PWYW product
        amount: amountCents,
      },
    ],
    // Force currency if you want to avoid adaptive currency behavior
    billing_currency: currency,
    // Where Dodo redirects after payment completion
    return_url:
      process.env.DODO_PAYMENTS_RETURN_URL ?? new URL(request.url).origin,
    // Custom metadata so we can stitch back on webhook
    metadata: {
      website_url: origin,
      ...(startupId ? { startup_id: startupId } : {}),
      ...(userId ? { user_id: userId } : {}),
      ...(description ? { description } : {}),
      ...(categorySlug ? { category_slug: categorySlug } : {}),
      is_top_up: isTopUp ? "true" : "false",
      source: "home_hero",
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode",
    },
  }

  // Call our adapter-backed /checkout route to create a Checkout Session
  const checkoutUrl = new URL("/checkout", request.url).toString()

  try {
    const resp = await fetch(checkoutUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(checkoutBody),
      // Cookies not needed; adapter uses server-side API key
    })

    const data = await resp.json().catch(() => null)

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: data ?? undefined,
        },
        { status: resp.status }
      )
    }

    // Adapter returns { checkout_url: "..." , session_id?: "..." }
    return NextResponse.json(data)
  } catch (e: any) {
    console.error("[/api/create-checkout] error", e)
    return NextResponse.json(
      {
        error: "Checkout session request failed",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    )
  }
}
