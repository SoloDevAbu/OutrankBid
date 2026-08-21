import { NextResponse } from "next/server"
import { db, startups, categories } from "@/db"
import { eq } from "drizzle-orm"
import { scrapeAppInfo } from "@/lib/scrape-app"

type CreateCheckoutBody = {
  amountCents: number
  appUrl: string
  currency?: string // default: USD
  startupId?: string
  userId?: string
  description?: string
  categorySlug?: string
  isTopUp?: boolean // if true, amount is added on top of existing currentBid
}

function normalizeUrl(raw: string): string | null {
  let input = raw?.trim?.() ?? ""
  if (!input) return null
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`
  try {
    const u = new URL(input)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    
    const isAppStore = u.hostname === "apps.apple.com"
    const isPlayStore = u.hostname === "play.google.com" && u.pathname.startsWith("/store/apps/details")

    if (!isAppStore && !isPlayStore) return null

    return u.href
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
    appUrl,
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

  const normalizedHref = normalizeUrl(appUrl)
  if (!normalizedHref) {
    return NextResponse.json(
      {
        error:
          "`appUrl` must be a valid App Store or Google Play URL.",
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

  let finalStartupId = startupId

  // If this is a new listing, we create a pending startup
  if (!isTopUp && !startupId) {
    // We need category ID
    let catId: string | null = null
    if (categorySlug) {
      const catRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1)
      if (catRows.length > 0) {
        catId = catRows[0].id
      }
    }

    if (!catId) {
       // fallback to general if not found
       const genRows = await db
         .select({ id: categories.id })
         .from(categories)
         .where(eq(categories.slug, "general"))
         .limit(1)
       if (genRows.length > 0) catId = genRows[0].id
    }

    if (!catId) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }

    // Scrape app info
    const scraped = await scrapeAppInfo(normalizedHref)
    const appName = scraped.name || "Unknown App"
    const logoUrl = scraped.logoUrl

    // Base slug
    const baseSlug = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    // Check if a pending one already exists for this URL
    const existing = await db
      .select({ id: startups.id, status: startups.status })
      .from(startups)
      .where(eq(startups.appUrl, normalizedHref))
      .limit(1)

    if (existing.length > 0) {
      if (existing[0].status === "active") {
        return NextResponse.json({ error: "App already exists. Please top up instead." }, { status: 400 })
      }
      // Update pending
      await db.update(startups).set({
        name: appName,
        logoUrl: logoUrl,
        description: description || null,
        categoryId: catId,
      }).where(eq(startups.id, existing[0].id))
      finalStartupId = existing[0].id
    } else {
      // Insert new pending
      const [newStartup] = await db
        .insert(startups)
        .values({
          ownerId: userId || "anonymous",
          categoryId: catId,
          name: appName,
          slug,
          appUrl: normalizedHref,
          description: description || null,
          logoUrl,
          currentBid: 0,
          status: "pending",
        })
        .returning({ id: startups.id })
      finalStartupId = newStartup.id
    }
  }

  if (!finalStartupId) {
    return NextResponse.json({ error: "Missing startupId" }, { status: 400 })
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
      startup_id: finalStartupId,
      is_top_up: isTopUp ? "true" : "false",
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
