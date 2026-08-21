/**
 * Development seed script
 *
 * Run with:
 *   pnpm db:seed
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Seeding database…")

  // ------------------------------------------------------------------
  // Categories
  // ------------------------------------------------------------------
  const categoryNames = ["AI", "Developer Tools", "SaaS", "Startups", "Indie"]

  const categoryDescriptions: Record<string, string> = {
    AI: "Artificial intelligence and machine learning products",
    "Developer Tools": "Tools and utilities built for developers",
    SaaS: "Software-as-a-service products and platforms",
    Startups: "Early-stage companies and ventures",
    Indie: "Products built by independent makers",
  }

  console.log("  → inserting categories…")
  const insertedCategories = await db
    .insert(schema.categories)
    .values(
      categoryNames.map((name) => ({
        name,
        slug: slugify(name),
        description: categoryDescriptions[name],
      }))
    )
    .onConflictDoNothing()
    .returning()

  const categoryMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  )

  // Fallback: if rows already existed, re-fetch them.
  const existingCategories =
    insertedCategories.length === 0
      ? await db.select().from(schema.categories)
      : insertedCategories

  for (const c of existingCategories) {
    categoryMap[c.slug] = c.id
  }

  // ------------------------------------------------------------------
  // Startups
  //
  // ownerId is an opaque string — no users table. In production this
  // will be a real auth provider user ID (e.g. Clerk's `user_xxx`).
  // ------------------------------------------------------------------
  console.log("  → inserting demo startups…")

  // Demo owner IDs (placeholder strings — replace with real auth IDs later)
  const OWNER_ALICE = "demo_owner_alice"
  const OWNER_BOB = "demo_owner_bob"
  const OWNER_CAROL = "demo_owner_carol"

  const startupDefs = [
    {
      ownerId: OWNER_ALICE,
      categorySlug: "ai",
      name: "VectorMind",
      slug: "vectormind",
      websiteUrl: "https://vectormind.io",
      description:
        "The fastest vector search database built for production AI workloads.",
      currentBid: 100, // $450.00 in cents
    },
    {
      ownerId: OWNER_BOB,
      categorySlug: "developer-tools",
      name: "DeployKit",
      slug: "deploykit",
      websiteUrl: "https://deploykit.dev",
      description:
        "One-command deployments to any cloud, with zero config drift.",
      currentBid: 200, // $320.00
    },
    {
      ownerId: OWNER_CAROL,
      categorySlug: "saas",
      name: "FormForge",
      slug: "formforge",
      websiteUrl: "https://formforge.app",
      description:
        "Build beautiful, conversion-optimised forms in minutes without code.",
      currentBid: 300, // $210.00
    },
    {
      ownerId: OWNER_ALICE,
      categorySlug: "indie",
      name: "Snippetly",
      slug: "snippetly",
      websiteUrl: "https://snippetly.dev",
      description: "A private snippet manager for developers who hate clutter.",
      currentBid: 400, // $95.00
    },
    {
      ownerId: OWNER_BOB,
      categorySlug: "startups",
      name: "LaunchLane",
      slug: "launchlane",
      websiteUrl: "https://launchlane.co",
      description:
        "Curated early-access waitlist platform for pre-launch startups.",
      currentBid: 500, // $175.00
    },
  ]

  const insertedStartups = await db
    .insert(schema.startups)
    .values(
      startupDefs.map((s) => ({
        ownerId: s.ownerId,
        categoryId: categoryMap[s.categorySlug],
        name: s.name,
        slug: s.slug,
        websiteUrl: s.websiteUrl,
        description: s.description,
        currentBid: s.currentBid,
        status: "active" as const,
      }))
    )
    .onConflictDoNothing()
    .returning()

  const existingStartups =
    insertedStartups.length === 0
      ? await db.select().from(schema.startups)
      : insertedStartups

  // ------------------------------------------------------------------
  // Bids  (historic records that back the denormalised currentBid)
  //
  // userId is an opaque string — same auth-agnostic approach as ownerId.
  // ------------------------------------------------------------------
  console.log("  → inserting demo bids…")
  const bidDefs = [
    { startup: existingStartups[0], userId: OWNER_ALICE, amount: 45000 },
    { startup: existingStartups[0], userId: OWNER_BOB, amount: 30000 },
    { startup: existingStartups[1], userId: OWNER_BOB, amount: 32000 },
    { startup: existingStartups[2], userId: OWNER_CAROL, amount: 21000 },
    { startup: existingStartups[3], userId: OWNER_ALICE, amount: 9500 },
    { startup: existingStartups[4], userId: OWNER_BOB, amount: 17500 },
  ]

  await db
    .insert(schema.bids)
    .values(
      bidDefs.map((b) => ({
        startupId: b.startup.id,
        userId: b.userId,
        amount: b.amount,
        currency: "USD",
      }))
    )
    .onConflictDoNothing()

  console.log("✅  Seed complete.")
  console.log(`   Categories : ${existingCategories.length}`)
  console.log(`   Startups   : ${existingStartups.length}`)
  console.log(`   Bids       : ${bidDefs.length}`)
}

main().catch((err) => {
  console.error("❌  Seed failed:", err)
  process.exit(1)
})
