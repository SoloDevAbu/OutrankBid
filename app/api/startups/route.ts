import { db, startups, categories } from "@/db"
import { eq, or, like } from "drizzle-orm"

// ---------------------------------------------------------------------------
// POST /api/startups
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // -------------------------------------------------------------------------
  // 1. Parse body
  // -------------------------------------------------------------------------
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error(400, "Request body must be valid JSON.")
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return error(400, "Request body must be a JSON object.")
  }

  const raw = body as Record<string, unknown>

  // -------------------------------------------------------------------------
  // 2. Validate fields
  // -------------------------------------------------------------------------
  const issues: string[] = []

  // -- name ------------------------------------------------------------------
  const name = typeof raw.name === "string" ? raw.name.trim() : ""
  if (!name) issues.push("`name` is required and must be a non-empty string.")
  if (name.length > 80)
    issues.push("`name` must be 80 characters or fewer.")

  // -- appUrl ------------------------------------------------------------
  const rawUrl = typeof raw.appUrl === "string" ? raw.appUrl.trim() : ""
  if (!rawUrl)
    issues.push("`appUrl` is required and must be a non-empty string.")

  // -- categoryId ------------------------------------------------------------
  const categoryId =
    typeof raw.categoryId === "string" ? raw.categoryId.trim() : ""
  if (!categoryId)
    issues.push("`categoryId` is required and must be a non-empty string.")

  // -- ownerId (opaque auth-provider user ID, required until auth is wired) --
  const ownerId =
    typeof raw.ownerId === "string" ? raw.ownerId.trim() : ""
  if (!ownerId)
    issues.push("`ownerId` is required and must be a non-empty string.")

  // -- description (optional) ------------------------------------------------
  const description =
    typeof raw.description === "string" ? raw.description.trim() : null
  if (description !== null && description.length > 500)
    issues.push("`description` must be 500 characters or fewer.")

  // -- logoUrl (optional) ----------------------------------------------------
  const logoUrlRaw =
    typeof raw.logoUrl === "string" ? raw.logoUrl.trim() : null

  // Bail early if basic field validation failed
  if (issues.length > 0) {
    return error(422, "Validation failed.", issues)
  }

  // -------------------------------------------------------------------------
  // 3. Validate and normalise appUrl
  // -------------------------------------------------------------------------
  const { url: appUrl, parseError } = normaliseUrl(rawUrl)
  if (parseError) {
    return error(422, "Validation failed.", [parseError])
  }

  // -------------------------------------------------------------------------
  // 4. Validate logoUrl (if provided)
  // -------------------------------------------------------------------------
  let logoUrl: string | null = null
  if (logoUrlRaw) {
    const { url: parsedLogoUrl, parseError: logoErr } = normaliseUrl(logoUrlRaw)
    if (logoErr) {
      return error(422, "Validation failed.", [
        `\`logoUrl\`: ${logoErr}`,
      ])
    }
    logoUrl = parsedLogoUrl
  }

  // -------------------------------------------------------------------------
  // 5. Validate category exists
  // -------------------------------------------------------------------------
  const categoryRows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)

  if (categoryRows.length === 0) {
    return error(422, "Validation failed.", [
      `\`categoryId\` "${categoryId}" does not match any known category.`,
    ])
  }

  const category = categoryRows[0]

  // -------------------------------------------------------------------------
  // 6. Generate a unique slug
  // -------------------------------------------------------------------------
  const baseSlug = slugify(name)
  const slug = await resolveUniqueSlug(baseSlug)

  // -------------------------------------------------------------------------
  // 7. Insert startup
  // -------------------------------------------------------------------------
  const [created] = await db
    .insert(startups)
    .values({
      ownerId,
      categoryId: category.id,
      name,
      slug,
      appUrl: appUrl!,
      description: description ?? undefined,
      logoUrl: logoUrl ?? undefined,
      // currentBid defaults to 0 per schema; status defaults to "pending"
    })
    .returning()

  // -------------------------------------------------------------------------
  // 8. Return created startup
  // -------------------------------------------------------------------------
  return Response.json(
    {
      startup: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        currentBid: created.currentBid,
        currentBidFormatted: formatCents(created.currentBid),
        appUrl: created.appUrl,
        description: created.description,
        logoUrl: created.logoUrl,
        status: created.status,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    },
    { status: 201 }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Structured error response. */
function error(
  status: number,
  message: string,
  issues?: string[]
): Response {
  return Response.json(
    { error: message, ...(issues?.length ? { issues } : {}) },
    { status }
  )
}

/**
 * Parse and normalise a URL string.
 *  - Accepts bare domains: `example.com` → `https://example.com`
 *  - Requires http / https protocol
 *  - Strips trailing slash from the path root (keeps sub-paths intact)
 */
function normaliseUrl(raw: string): { url: string | null; parseError: string | null } {
  let input = raw.trim()

  // Prepend https if no protocol present
  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`
  }

  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    return { url: null, parseError: `\`appUrl\` "${raw}" is not a valid URL.` }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      url: null,
      parseError: `\`appUrl\` must use http or https (got "${parsed.protocol}").`,
    }
  }

  // Normalise: strip trailing slash at the path root level only
  const normalised = parsed.pathname === "/" ? parsed.origin : parsed.href

  return { url: normalised, parseError: null }
}

/**
 * Convert any string into a URL-safe slug.
 * Mirrors the helper in `db/seed.ts` so slugs stay consistent.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")                // decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) // keep slugs reasonable
}

/**
 * Find a slug that does not yet exist in the startups table.
 *
 * Strategy: if `base` is taken, try `base-2`, `base-3`, … using a single
 * DB round-trip to fetch all conflicting slugs, then pick the first gap.
 */
async function resolveUniqueSlug(base: string): Promise<string> {
  // Fetch all slugs that are either exactly `base` or start with `base-<digit>`
  const rows = await db
    .select({ slug: startups.slug })
    .from(startups)
    .where(
      or(
        eq(startups.slug, base),
        like(startups.slug, `${base}-%`)
      )
    )

  const taken = new Set(rows.map((r) => r.slug))

  if (!taken.has(base)) return base

  // Find the first unused numeric suffix
  for (let n = 2; n <= taken.size + 2; n++) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }

  // Fallback: append a short timestamp fragment (practically unreachable)
  return `${base}-${Date.now().toString(36)}`
}

/** Convert integer cents to a formatted USD string: 45000 → "$450.00" */
function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}
