/**
 * Integration tests for POST /api/bids
 *
 * Run with:  pnpm test
 *
 * These tests hit the real database (DATABASE_URL from .env).
 * Each test cleans up after itself.
 */
import "dotenv/config"
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import { eq, inArray } from "drizzle-orm"
import { startups, bids, categories } from "../db/schema"
import { relations } from "../db/relations"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle({ client: pool, relations })

let categoryId: string
let activeStartupId: string
let pausedStartupId: string

beforeAll(async () => {
  const [cat] = await db.select({ id: categories.id }).from(categories).limit(1)

  if (!cat) throw new Error("No categories in DB — run pnpm db:seed first")
  categoryId = cat.id

  const [active] = await db
    .insert(startups)
    .values({
      ownerId: "test_owner",
      categoryId,
      name: "__test_active__",
      slug: `__test_active_${Date.now()}__`,
      appUrl: "https://test.example.com",
      currentBid: 10000,
      status: "active",
    })
    .returning()

  activeStartupId = active.id

  const [paused] = await db
    .insert(startups)
    .values({
      ownerId: "test_owner",
      categoryId,
      name: "__test_paused__",
      slug: `__test_paused_${Date.now()}__`,
      appUrl: "https://test-paused.example.com",
      currentBid: 5000,
      status: "paused",
    })
    .returning()

  pausedStartupId = paused.id
})

afterEach(async () => {
  await db.delete(bids).where(eq(bids.startupId, activeStartupId))
  await db
    .update(startups)
    .set({ currentBid: 10000 })
    .where(eq(startups.id, activeStartupId))
})

afterAll(async () => {
  await db
    .delete(bids)
    .where(inArray(bids.startupId, [activeStartupId, pausedStartupId]))
  await db
    .delete(startups)
    .where(inArray(startups.id, [activeStartupId, pausedStartupId]))
  await pool.end()
})

async function postBid(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/bids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const { POST } = await import("../app/api/bids/route")
  return POST(req)
}

describe("POST /api/bids", () => {
  it("returns 422 for missing fields", async () => {
    const res = await postBid({})
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.issues).toBeInstanceOf(Array)
    expect(body.issues.length).toBeGreaterThan(0)
  })

  it("returns 404 for an invalid startupId", async () => {
    const res = await postBid({
      startupId: "00000000-0000-0000-0000-000000000000",
      userId: "user_test",
      amount: 99999,
    })
    expect(res.status).toBe(404)
  })

  it("returns 409 when bid is below current bid", async () => {
    const res = await postBid({
      startupId: activeStartupId,
      userId: "user_test",
      amount: 5000,
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/greater than the current bid/i)
  })

  it("returns 409 when bid equals current bid", async () => {
    const res = await postBid({
      startupId: activeStartupId,
      userId: "user_test",
      amount: 10000,
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/greater than the current bid/i)
  })

  it("returns 201 and creates bid for a valid bid", async () => {
    const res = await postBid({
      startupId: activeStartupId,
      userId: "user_test",
      amount: 15000,
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.bid.id).toBeDefined()
    expect(body.bid.amount).toBe(15000)
    expect(body.bid.startupId).toBe(activeStartupId)
    expect(body.currentBid).toBe(15000)
  })

  it("updates startups.currentBid after a valid bid", async () => {
    await postBid({
      startupId: activeStartupId,
      userId: "user_test",
      amount: 20000,
    })

    const [row] = await db
      .select({ currentBid: startups.currentBid })
      .from(startups)
      .where(eq(startups.id, activeStartupId))

    expect(row.currentBid).toBe(20000)
  })

  it("preserves immutable bid history — old bids are never mutated", async () => {
    await postBid({
      startupId: activeStartupId,
      userId: "user_a",
      amount: 11000,
    })
    await postBid({
      startupId: activeStartupId,
      userId: "user_b",
      amount: 12000,
    })

    const allBids = await db
      .select({ amount: bids.amount, userId: bids.userId })
      .from(bids)
      .where(eq(bids.startupId, activeStartupId))

    expect(allBids.length).toBe(2)
    expect(allBids.map((b) => b.amount).sort()).toEqual([11000, 12000])
  })

  it("returns 409 for a paused startup", async () => {
    const res = await postBid({
      startupId: pausedStartupId,
      userId: "user_test",
      amount: 99999,
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/not accepting bids/i)
  })

  it("handles simultaneous bids — only the higher one wins", async () => {
    const [winner, loser] = await Promise.all([
      postBid({ startupId: activeStartupId, userId: "user_a", amount: 30000 }),
      postBid({ startupId: activeStartupId, userId: "user_b", amount: 20000 }),
    ])

    const statuses = [winner.status, loser.status].sort()
    expect(statuses).toEqual([201, 409])

    const [row] = await db
      .select({ currentBid: startups.currentBid })
      .from(startups)
      .where(eq(startups.id, activeStartupId))

    expect(row.currentBid).toBe(30000)
  })
})
